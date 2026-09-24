import {
  Injectable,
  Inject,
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';
import { basename } from 'node:path';
import { existsSync } from 'node:fs';

import { DatabaseService } from '../database/database.service.js';
import { type EmailProvider } from './email-provider.js';
import { buildOpportunityRoleProfile } from '../opportunities/matching/opportunity-role.js';


import { determineOutreachStrategy } from './outreach-strategy.js';

import { renderOutreachDraft } from './outreach-template.js';

import { candidateProfile } from './candidate-profile.js';
import { ContactsService } from '../contacts/contacts.service.js';
import { PoolClient } from 'pg';
import { EMAIL_PROVIDER } from './email-provider.token.js';
import { getEmailProviderName } from './providers/email-provider-name.js';

@Injectable()
export class OutreachService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly contactsService: ContactsService,
    @Inject(EMAIL_PROVIDER)
    private readonly emailProvider: EmailProvider,
  ) {}

  private getResumeAttachment() {
    const resumePath = process.env['RESUME_PATH'];

    if (!resumePath || !existsSync(resumePath)) {
      throw new InternalServerErrorException(
        'Resume file not found. Check RESUME_PATH in .env',
      );
    }

    return {
      filename: basename(resumePath),
      path: resumePath,
    };
  }
  async generateMatchDraft(opportunityId: number, matchId: number) {
    const result = await this.databaseService.query<{
      opportunity_id: number;
      company_name: string;
      role_title: string;
      location: string | null;
      job_url: string | null;

      match_id: number;
      match_rank: number;
      match_score: number;
      match_reasons: string | null;

      contact_id: number;
      contact_name: string | null;
      identity_confidence: string;

      contact_role_family: string | null;
      contact_title: string | null;

      email: string | null;
      email_type: string | null;
    }>(
      `
      SELECT
        o.id AS opportunity_id,
        o."companyName" AS company_name,
        o."roleTitle" AS role_title,
        o.location,
        o."jobUrl" AS job_url,

        cm.id AS match_id,
        cm.rank AS match_rank,
        cm.score AS match_score,
        cm.reasons AS match_reasons,

        c.id AS contact_id,
        c.name AS contact_name,
        c."identityConfidence" AS identity_confidence,

        cr."roleFamily" AS contact_role_family,
        cr.title AS contact_title,

        ce.email,
        ce.type AS email_type

      FROM "contactMatch" cm

      INNER JOIN "opportunity" o
        ON o.id = cm."opportunityId"

      INNER JOIN "contact" c
        ON c.id = cm."contactId"

     LEFT JOIN LATERAL (
  SELECT
    cr.title,
    cr."roleFamily"
  FROM "contactRole" cr
  WHERE cr."contactId" = c.id
    AND cr."isCurrent" = true
  ORDER BY
    CASE cr."roleFamily"
      WHEN 'HIRING_MANAGER' THEN 1
      WHEN 'RECRUITER' THEN 2
      WHEN 'ENGINEERING_LEADERSHIP' THEN 3
      WHEN 'HR' THEN 4
      WHEN 'LEADERSHIP' THEN 5
      WHEN 'FOUNDER' THEN 6
      WHEN 'UNKNOWN' THEN 7
      ELSE 8
    END,
    cr.id DESC
  LIMIT 1
) cr ON true

      LEFT JOIN LATERAL (
        SELECT
          ce.email,
          ce.type
        FROM "contactEmail" ce
        WHERE ce."contactId" = c.id
          AND ce."doNotContact" = false
        ORDER BY
          ce."isPrimary" DESC,
          ce.id ASC
        LIMIT 1
      ) ce ON true

      WHERE cm.id = $1
        AND cm."opportunityId" = $2
        AND c."doNotContact" = false
      `,
      [matchId, opportunityId],
    );

    if (result.rows.length === 0) {
      throw new Error(
        `Match ${matchId} not found for opportunity ${opportunityId}`,
      );
    }

    const row = result.rows[0];

    const roleProfile = buildOpportunityRoleProfile(row.role_title);

    const strategy = determineOutreachStrategy({
      roleFamily: roleProfile.roleFamily,
      contactRoleFamily: row.contact_role_family,
    });

    const firstName = this.getFirstName(row.contact_name);

    const draft = renderOutreachDraft({
      firstName,
      companyName: row.company_name,
      roleTitle: row.role_title,
      location: row.location,
      jobUrl: row.job_url,
      strategy,
      candidate: candidateProfile,
    });

    return {
      opportunity: {
        id: row.opportunity_id,
        companyName: row.company_name,
        roleTitle: row.role_title,
        location: row.location,
        jobUrl: row.job_url,
        roleFamily: roleProfile.roleFamily,
      },

      match: {
        id: row.match_id,
        rank: row.match_rank,
        score: row.match_score,
        reasons: this.parseReasons(row.match_reasons),
      },

      contact: {
        id: row.contact_id,
        name: row.contact_name,
        firstName,
        title: row.contact_title,
        roleFamily: row.contact_role_family,
        email: row.email,
        emailType: row.email_type,
        identityConfidence: row.identity_confidence,
      },

      strategy,

      draft,
    };
  }

  private getFirstName(name: string | null): string {
    if (!name) {
      return '';
    }

    const trimmed = name.trim();

    if (!trimmed) {
      return '';
    }

    return trimmed.split(/\s+/)[0];
  }

  private parseReasons(reasons: string | null): string[] {
    if (!reasons) {
      return [];
    }

    try {
      const parsed = JSON.parse(reasons);

      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  buildDraftForMatch(input: {
    companyName: string;
    roleTitle: string;
    location?: string | null;
    jobUrl?: string | null;

    contactName: string | null;
    contactRoleFamily: string | null;
  }) {
    const roleProfile = buildOpportunityRoleProfile(input.roleTitle);

    const strategy = determineOutreachStrategy({
      roleFamily: roleProfile.roleFamily,
      contactRoleFamily: input.contactRoleFamily,
    });

    const firstName = this.getFirstName(input.contactName);

    const draft = renderOutreachDraft({
      firstName,
      companyName: input.companyName,
      roleTitle: input.roleTitle,
      location: input.location,
      jobUrl: input.jobUrl,
      strategy,
      candidate: candidateProfile,
    });

    return {
      strategy,
      draft,
    };
  }

  async createDraft(opportunityId: number, matchId: number) {
    const generated = await this.generateMatchDraft(opportunityId, matchId);

    const result = await this.databaseService.query(
      `
   INSERT INTO "outreach" (
  "opportunityId",
  "contactId",
  email,
  subject,
  body,
  status,
  "updatedAt"
)
VALUES ($1, $2, $3, $4, $5, 'DRAFT', NOW())
    RETURNING
      id,
      "opportunityId",
      "contactId",
      email,
      subject,
      body,
      status,
      "createdAt",
      "updatedAt";
    `,
      [
        opportunityId,
        generated.contact.id,
        generated.contact.email,
        generated.draft.subject,
        generated.draft.body,
      ],
    );

    return result.rows[0];
  }

  async approveOutreach(outreachId: number) {
    const result = await this.databaseService.query(
      `
    UPDATE "outreach"
    SET
      status = 'APPROVED',
      "approvedAt" = NOW()
    WHERE id = $1
      AND status = 'DRAFT'
    RETURNING
      id,
      "opportunityId",
      "contactId",
      email,
      subject,
      body,
      status,
      "approvedAt",
      "createdAt",
      "updatedAt";
    `,
      [outreachId],
    );

    if (result.rowCount === 0) {
      throw new Error('Outreach not found or is not currently a draft');
    }

    return result.rows[0];
  }

  async sendOutreach(outreachId: number) {
    let client: PoolClient | null = null;

    try {
      // 1. Atomically claim the outreach and create its attempt.
      client = await this.databaseService.getClient();

      await client.query('BEGIN');

     const claimResult = await client.query<{
        id: number;
        email: string;
        subject: string;
        body: string;
      }>(`
        UPDATE "outreach" o
        SET
          status = 'SENDING',
          "updatedAt" = NOW()
        WHERE o.id = $1
          AND o.status = 'APPROVED'

          AND EXISTS (
            SELECT 1
            FROM "contact" c
            WHERE c.id = o."contactId"
              AND c."doNotContact" = false
          )

          AND EXISTS (
            SELECT 1
            FROM "contactEmail" ce
            WHERE ce."contactId" = o."contactId"
              AND LOWER(TRIM(ce.email)) = LOWER(TRIM(o.email))
              AND ce."doNotContact" = false
          )

        RETURNING
          o.id,
          o.email,
          o.subject,
          o.body;
      `, [outreachId]);

      const outreach = claimResult.rows[0];

      if (!outreach) {
        throw new ConflictException('Outreach is not approved for sending');
      }

      const attemptNumberResult = await client.query<{
        attemptNumber: number;
      }>(
        `
      SELECT COALESCE(MAX("attemptNumber"), 0) + 1 AS "attemptNumber"
      FROM "outreachAttempt"
      WHERE "outreachId" = $1;
      `,
        [outreachId],
      );

      const attemptNumber = Number(attemptNumberResult.rows[0].attemptNumber);

      const attemptResult = await client.query<{
        id: number;
      }>(
        `
      INSERT INTO "outreachAttempt" (
        "outreachId",
        "attemptNumber",
        provider,
        status
      )
      VALUES ($1, $2, $3, 'STARTED')
      RETURNING id;
      `,
        [outreachId, attemptNumber, getEmailProviderName()],
      );

      const attemptId = attemptResult.rows[0].id;

      await client.query('COMMIT');
      client.release();
      client = null;

      // 2. Provider call happens OUTSIDE the DB transaction.
      const resumeAttachment = this.getResumeAttachment();

      const providerResult = await this.emailProvider.send({
        to: outreach.email,
        subject: outreach.subject,
        body: outreach.body,
        attachments: [resumeAttachment],
      });
      // 3. Provider confirmed success.
      await this.databaseService.query(
        `
      UPDATE "outreachAttempt"
      SET
        status = 'SENT',
        "providerMessageId" = $2,
        "completedAt" = NOW()
      WHERE id = $1
        AND status = 'STARTED';
      `,
        [attemptId, providerResult.providerMessageId ?? null],
      );

      // 4. Mark parent outreach as SENT.
      const sentResult = await this.databaseService.query(
        `
        UPDATE "outreach"
        SET
          status = 'SENT',
          "sentAt" = NOW(),
          "updatedAt" = NOW()
        WHERE id = $1
          AND status = 'SENDING'
        RETURNING
          id,
          status,
          "sentAt",
          "updatedAt";
        `,
        [outreachId],
      );

      // The provider succeeded, but our DB state transition
      // did not complete. Do NOT mark the email as FAILED.
      if (sentResult.rowCount !== 1) {
        throw new Error(
          'Email provider succeeded but outreach state could not be finalized',
        );
      }

      return {
        ...sentResult.rows[0],
        providerMessageId: providerResult.providerMessageId ?? null,
      };
    } catch (error) {
      // Roll back only the DB transaction if it is still open.
      if (client) {
        try {
          await client.query('ROLLBACK');
        } finally {
          client.release();
          client = null;
        }
      }

      const errorMessage =
        error instanceof Error ? error.message : 'Unknown email provider error';

      /*
       * Important:
       *
       * If the provider already succeeded and a later DB operation
       * failed, the attempt is no longer STARTED, so we must not
       * overwrite it with FAILED.
       */
      await this.databaseService.query(
        `
      UPDATE "outreachAttempt"
      SET
        status = 'FAILED',
        "errorMessage" = $2,
        "completedAt" = NOW()
      WHERE "outreachId" = $1
        AND status = 'STARTED';
      `,
        [outreachId, errorMessage],
      );

      /*
       * Only a still-SENDING outreach is transitioned here.
       * If it was already finalized, don't overwrite that state.
       */
      await this.databaseService.query(
        `
      UPDATE "outreach"
      SET
        status = 'FAILED',
        "failedAt" = NOW(),
        "errorMessage" = $2,
        "updatedAt" = NOW()
      WHERE id = $1
        AND status = 'SENDING';
      `,
        [outreachId, errorMessage],
      );

      throw error;
    }
  }
  async cancelOutreach(outreachId: number) {
    const result = await this.databaseService.query(
      `
    UPDATE "outreach"
    SET
      status = 'CANCELLED',
      "updatedAt" = NOW()
    WHERE id = $1
      AND status IN ('DRAFT', 'APPROVED')
    RETURNING
      id,
      status,
      "updatedAt";
    `,
      [outreachId],
    );

    if (result.rowCount !== 1) {
      throw new ConflictException(
        'Outreach cannot be cancelled from its current state',
      );
    }

    return result.rows[0];
  }

  async recoverStaleOutreachAttempts(timeoutMinutes = 10) {
    // 1. Reconcile attempts where the provider outcome
    // was already recorded but the parent outreach wasn't finalized.
    const sentReconciliation = await this.databaseService.query(
      `
      UPDATE "outreach" o
      SET
        status = 'SENT',
        "sentAt" = COALESCE(o."sentAt", oa."completedAt", NOW()),
        "updatedAt" = NOW(),
        "errorMessage" = NULL
      FROM "outreachAttempt" oa
      WHERE oa."outreachId" = o.id
        AND oa.status = 'SENT'
        AND o.status = 'SENDING'
      RETURNING
        o.id,
        o.status;
      `,
    );

    // 2. Reconcile explicitly failed attempts.
    const failedReconciliation = await this.databaseService.query(
      `
      UPDATE "outreach" o
      SET
        status = 'FAILED',
        "failedAt" = COALESCE(
          o."failedAt",
          oa."completedAt",
          NOW()
        ),
        "updatedAt" = NOW(),
        "errorMessage" = oa."errorMessage"
      FROM "outreachAttempt" oa
      WHERE oa."outreachId" = o.id
        AND oa.status = 'FAILED'
        AND o.status = 'SENDING'
      RETURNING
        o.id,
        o.status;
      `,
    );

    // 3. Find STARTED attempts that have become stale.
    const staleAttempts = await this.databaseService.query<{
      id: number;
      outreachId: number;
    }>(
      `
      SELECT
        oa.id,
        oa."outreachId"
      FROM "outreachAttempt" oa
      INNER JOIN "outreach" o
        ON o.id = oa."outreachId"
      WHERE oa.status = 'STARTED'
        AND oa."completedAt" IS NULL
        AND oa."startedAt" <
          NOW() - ($1 * INTERVAL '1 minute')
        AND o.status = 'SENDING';
      `,
      [timeoutMinutes],
    );

    if (staleAttempts.rowCount === 0) {
      return {
        reconciledSent: sentReconciliation.rowCount,
        reconciledFailed: failedReconciliation.rowCount,
        recovered: 0,
        attempts: [],
      };
    }

    // 4. Mark stale attempts as UNKNOWN.
    const staleAttemptIds = staleAttempts.rows.map((row) => row.id);

    const unknownAttempts = await this.databaseService.query(
      `
      UPDATE "outreachAttempt"
      SET
        status = 'UNKNOWN',
        "completedAt" = NOW(),
        "errorMessage" =
          'Send attempt timed out; provider outcome is unknown'
      WHERE id = ANY($1::int[])
        AND status = 'STARTED'
      RETURNING
        id,
        "outreachId",
        status;
      `,
      [staleAttemptIds],
    );

    // 5. Mark corresponding outreach records UNKNOWN.
    const outreachIds = unknownAttempts.rows.map((row) => row.outreachId);

    await this.databaseService.query(
      `
    UPDATE "outreach"
    SET
      status = 'UNKNOWN',
      "updatedAt" = NOW(),
      "errorMessage" =
        'Send attempt timed out; provider outcome is unknown'
    WHERE id = ANY($1::int[])
      AND status = 'SENDING';
    `,
      [outreachIds],
    );

    return {
      reconciledSent: sentReconciliation.rowCount,
      reconciledFailed: failedReconciliation.rowCount,
      recovered: unknownAttempts.rowCount,
      attempts: unknownAttempts.rows,
    };
  }
}
