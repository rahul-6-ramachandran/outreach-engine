import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service.js';
import { CreateOpportunityDto } from './dto/create-opportunity.dto.js';

import { ContactMatcher } from './matching/contact-matcher.js';
import { buildOpportunityRoleProfile } from './matching/opportunity-role.js';

import { OutreachService } from '../outreach/outreach.service.js';
@Injectable()
export class OpportunitiesService {
  constructor(private readonly db: DatabaseService  ,   private readonly outreachService: OutreachService,) {}

  async create(dto: CreateOpportunityDto) {
    const companyName = dto.companyName.trim();
    const roleTitle = dto.roleTitle.trim();

    const normalizedName = companyName
      .toLowerCase()
      .replace(/\s+/g, ' ')
      .trim();

    const companyResult = await this.db.query<{
      id: number;
      canonicalName: string;
    }>(
      `
      INSERT INTO "company"
        (
          "canonicalName",
          "normalizedName",
          "createdAt",
          "updatedAt"
        )
      VALUES ($1, $2, NOW(), NOW())
      ON CONFLICT ("normalizedName")
      DO UPDATE SET
        "updatedAt" = NOW()
      RETURNING
        "id",
        "canonicalName"
      `,
      [companyName, normalizedName],
    );

    const company = companyResult.rows[0];

    const opportunityResult = await this.db.query(
      `
      INSERT INTO "opportunity"
        (
          "companyName",
          "roleTitle",
          "location",
          "jobUrl",
          "jobDescription",
          "status",
          "companyId",
          "createdAt",
          "updatedAt"
        )
      VALUES
        ($1, $2, $3, $4, $5, 'DRAFT', $6, NOW(), NOW())
      RETURNING *
      `,
      [
        companyName,
        roleTitle,
        dto.location?.trim() || null,
        dto.jobUrl?.trim() || null,
        dto.jobDescription?.trim() || null,
        company.id,
      ],
    );

    return opportunityResult.rows[0];
  }

  async getContacts(opportunityId: number) {
    const opportunityResult = await this.db.query<{
      id: number;
      companyId: number | null;
      companyName: string;
      roleTitle: string;
    }>(
      `
    SELECT
      o.id,
      o."companyId",
      o."companyName",
      o."roleTitle"
    FROM "opportunity" o
    WHERE o.id = $1
    `,
      [opportunityId],
    );

    const opportunity = opportunityResult.rows[0];

    if (!opportunity) {
      throw new Error('Opportunity not found');
    }

    if (!opportunity.companyId) {
      return {
        opportunity,
        contacts: [],
      };
    }

    const contactsResult = await this.db.query(
      `
    SELECT
      c.id,
      c.name,
      c."identityConfidence",
      c."doNotContact",

      COALESCE(
        json_agg(
          DISTINCT jsonb_build_object(
            'email', ce.email,
            'type', ce.type,
            'isPrimary', ce."isPrimary",
            'confidence', ce.confidence
          )
        ) FILTER (WHERE ce.id IS NOT NULL),
        '[]'
      ) AS emails,

      COALESCE(
        json_agg(
          DISTINCT jsonb_build_object(
            'title', cr.title,
            'roleFamily', cr."roleFamily",
            'isCurrent', cr."isCurrent"
          )
        ) FILTER (WHERE cr.id IS NOT NULL),
        '[]'
      ) AS roles

    FROM "contact" c

    LEFT JOIN "contactEmail" ce
      ON ce."contactId" = c.id

    LEFT JOIN "contactRole" cr
      ON cr."contactId" = c.id

    WHERE c."companyId" = $1

    GROUP BY
      c.id,
      c.name,
      c."identityConfidence",
      c."doNotContact"

    ORDER BY c.id;
    `,
      [opportunity.companyId],
    );

    return {
      opportunity,
      contacts: contactsResult.rows,
    };
  }

 async matchContacts(opportunityId: number) {
  const opportunityResult = await this.db.query<{
    id: number;
    companyId: number | null;
    companyName: string;
    roleTitle: string;
    location: string | null;
    jobUrl: string | null;
    status: string;
  }>(
    `
    SELECT
      id,
      "companyId",
      "companyName",
      "roleTitle",
      "location",
      "jobUrl",
      "status"
    FROM "opportunity"
    WHERE id = $1
    `,
    [opportunityId],
  );

  const opportunity = opportunityResult.rows[0];

  if (!opportunity) {
    throw new Error('Opportunity not found');
  }

  const matchesResult = await this.db.query<{
    id: number;
    rank: number;
    score: number;
    reasons: string | null;

    contactId: number;
    name: string | null;
    identityConfidence: string;
    roleFamily: string | null;
    title: string | null;

    email: string | null;
    emailType: string | null;
  }>(
    `
    SELECT
      cm.id,
      cm.rank,
      cm.score,
      cm.reasons,

      c.id AS "contactId",
      c.name,
      c."identityConfidence",

      cr."roleFamily",
      cr.title,

      ce.email,
      ce.type AS "emailType"

    FROM "contactMatch" cm

    JOIN "contact" c
      ON c.id = cm."contactId"

    LEFT JOIN LATERAL (
  SELECT
  cr_inner.title,
  cr_inner."roleFamily"
FROM "contactRole" cr_inner
WHERE cr_inner."contactId" = c.id
  AND cr_inner."isCurrent" = true
ORDER BY
  CASE cr_inner."roleFamily"
    WHEN 'HIRING_MANAGER' THEN 1
    WHEN 'RECRUITER' THEN 2
    WHEN 'ENGINEERING_LEADERSHIP' THEN 3
    WHEN 'HR' THEN 4
    WHEN 'LEADERSHIP' THEN 5
    WHEN 'FOUNDER' THEN 6
    WHEN 'UNKNOWN' THEN 7
    ELSE 8
  END,
  cr_inner.id DESC
LIMIT 1
) cr ON true

    LEFT JOIN LATERAL (
      SELECT
        email,
        type
      FROM "contactEmail"
      WHERE "contactId" = c.id
        AND "doNotContact" = false
      ORDER BY
        "isPrimary" DESC,
        confidence DESC NULLS LAST,
        id
      LIMIT 1
    ) ce ON true

    WHERE cm."opportunityId" = $1
      AND c."doNotContact" = false

    ORDER BY cm.rank ASC;
    `,
    [opportunityId],
  );

  return {
  opportunity,

  matches: matchesResult.rows.map((match) => {
    const outreach = this.outreachService.buildDraftForMatch({
      companyName: opportunity.companyName,
      roleTitle: opportunity.roleTitle,
      location: opportunity.location,
      jobUrl: opportunity?.jobUrl,

      contactName: match.name,
      contactRoleFamily: match.roleFamily,
    });

    return {
      id: match.id,
      rank: match.rank,
      contactId: match.contactId,

      name: match.name,
      title: match.title,
      roleFamily: match.roleFamily,

      email: match.email,
      emailType: match.emailType,

      score: match.score,
      reasons: match.reasons
        ? JSON.parse(match.reasons)
        : [],

      identityConfidence: match.identityConfidence,

      outreach,
    };
  }),
};
}

async getMatch(opportunityId: number, matchId: number) {
  const result = await this.db.query<{
    matchId: number;
    rank: number;
    score: number;
    reasons: string | null;

    opportunityId: number;
    companyName: string;
    roleTitle: string;
    location: string | null;

    contactId: number;
    name: string | null;
    identityConfidence: string;
    doNotContact: boolean;

    title: string | null;
    roleFamily: string | null;

    email: string | null;
    emailType: string | null;
    emailConfidence: number | null;
  }>(
    `
    SELECT
      cm.id AS "matchId",
      cm.rank,
      cm.score,
      cm.reasons,

      o.id AS "opportunityId",
      o."companyName",
      o."roleTitle",
      o.location,

      c.id AS "contactId",
      c.name,
      c."identityConfidence",
      c."doNotContact",

      cr.title,
      cr."roleFamily",

      ce.email,
      ce.type AS "emailType",
      ce.confidence AS "emailConfidence"

    FROM "contactMatch" cm

    JOIN "opportunity" o
      ON o.id = cm."opportunityId"

    JOIN "contact" c
      ON c.id = cm."contactId"

    LEFT JOIN LATERAL (
  SELECT
    cr_inner.title,
    cr_inner."roleFamily"
  FROM "contactRole" cr_inner
  WHERE cr_inner."contactId" = c.id
    AND cr_inner."isCurrent" = true
  ORDER BY
    CASE cr_inner."roleFamily"
      WHEN 'HIRING_MANAGER' THEN 1
      WHEN 'RECRUITER' THEN 2
      WHEN 'ENGINEERING_LEADERSHIP' THEN 3
      WHEN 'HR' THEN 4
      WHEN 'LEADERSHIP' THEN 5
      WHEN 'FOUNDER' THEN 6
      WHEN 'UNKNOWN' THEN 7
      ELSE 8
    END,
    cr_inner.id DESC
  LIMIT 1
) cr ON true

    LEFT JOIN LATERAL (
      SELECT
        email,
        type,
        confidence
      FROM "contactEmail"
      WHERE "contactId" = c.id
        AND "doNotContact" = false
      ORDER BY
        "isPrimary" DESC,
        confidence DESC NULLS LAST,
        id
      LIMIT 1
    ) ce ON true

    WHERE cm.id = $1
      AND cm."opportunityId" = $2
      AND c."doNotContact" = false;
    `,
    [matchId, opportunityId],
  );

  const match = result.rows[0];

  if (!match) {
    throw new Error('Match not found');
  }

  return {
    opportunity: {
      id: match.opportunityId,
      companyName: match.companyName,
      roleTitle: match.roleTitle,
      location: match.location,
    },

    match: {
      id: match.matchId,
      rank: match.rank,
      score: match.score,
      reasons: match.reasons
        ? JSON.parse(match.reasons)
        : [],
    },

    contact: {
      id: match.contactId,
      name: match.name,
      title: match.title,
      roleFamily: match.roleFamily,
      email: match.email,
      emailType: match.emailType,
      emailConfidence: match.emailConfidence,
      identityConfidence: match.identityConfidence,
    },
  };
}

  async getMatchDiagnostics(opportunityId: number) {
    const opportunityResult = await this.db.query<{
      id: number;
      companyId: number | null;
      companyName: string;
      roleTitle: string;
    }>(
      `
    SELECT
      id,
      "companyId",
      "companyName",
      "roleTitle"
    FROM "opportunity"
    WHERE id = $1
    `,
      [opportunityId],
    );

    const opportunity = opportunityResult.rows[0];

    if (!opportunity) {
      throw new Error('Opportunity not found');
    }

    if (!opportunity.companyId) {
      return {
        opportunity: {
          id: opportunity.id,
          companyName: opportunity.companyName,
          roleTitle: opportunity.roleTitle,
        },
        totalContacts: 0,
        eligibleContacts: 0,
        excludedContacts: 0,
        roleFamilies: {},
        emailTypes: {},
      };
    }

    const result = await this.db.query<{
      totalContacts: string;
      eligibleContacts: string;
      excludedContacts: string;
    }>(
      `
    SELECT
      COUNT(*)::text AS "totalContacts",

      COUNT(*) FILTER (
        WHERE c."doNotContact" = false
          AND EXISTS (
            SELECT 1
            FROM "contactEmail" ce
            WHERE ce."contactId" = c.id
              AND ce."doNotContact" = false
          )
      )::text AS "eligibleContacts",

      COUNT(*) FILTER (
        WHERE c."doNotContact" = true
          OR NOT EXISTS (
            SELECT 1
            FROM "contactEmail" ce
            WHERE ce."contactId" = c.id
              AND ce."doNotContact" = false
          )
      )::text AS "excludedContacts"

    FROM "contact" c
    WHERE c."companyId" = $1;
    `,
      [opportunity.companyId],
    );

    const roleFamilyResult = await this.db.query<{
      roleFamily: string;
      count: string;
    }>(
      `
    SELECT
      COALESCE(cr."roleFamily", 'UNKNOWN') AS "roleFamily",
      COUNT(DISTINCT c.id)::text AS count
    FROM "contact" c

    LEFT JOIN "contactRole" cr
      ON cr."contactId" = c.id
      AND cr."isCurrent" = true

    WHERE c."companyId" = $1

    GROUP BY COALESCE(cr."roleFamily", 'UNKNOWN')
    ORDER BY count DESC;
    `,
      [opportunity.companyId],
    );

    const emailTypeResult = await this.db.query<{
      emailType: string;
      count: string;
    }>(
      `
    SELECT
      ce.type AS "emailType",
      COUNT(DISTINCT c.id)::text AS count
    FROM "contact" c

    JOIN "contactEmail" ce
      ON ce."contactId" = c.id
      AND ce."doNotContact" = false

    WHERE c."companyId" = $1

    GROUP BY ce.type
    ORDER BY count DESC;
    `,
      [opportunity.companyId],
    );

    const roleFamilies: Record<string, number> = {};

    for (const row of roleFamilyResult.rows) {
      roleFamilies[row.roleFamily] = Number(row.count);
    }

    const emailTypes: Record<string, number> = {};

    for (const row of emailTypeResult.rows) {
      emailTypes[row.emailType] = Number(row.count);
    }

    const counts = result.rows[0];

    return {
      opportunity: {
        id: opportunity.id,
        companyName: opportunity.companyName,
        roleTitle: opportunity.roleTitle,
      },
      totalContacts: Number(counts.totalContacts),
      eligibleContacts: Number(counts.eligibleContacts),
      excludedContacts: Number(counts.excludedContacts),
      roleFamilies,
      emailTypes,
    };
  }

  async getMatchingHealth() {
    const contactStats = await this.db.query<{
      total: string;
      withCompany: string;
      withEmail: string;
      withRole: string;
      doNotContact: string;
    }>(
      `
    SELECT
      COUNT(*)::text AS total,

      COUNT(*) FILTER (
        WHERE "companyId" IS NOT NULL
      )::text AS "withCompany",

      COUNT(*) FILTER (
        WHERE EXISTS (
          SELECT 1
          FROM "contactEmail" ce
          WHERE ce."contactId" = c.id
        )
      )::text AS "withEmail",

      COUNT(*) FILTER (
        WHERE EXISTS (
          SELECT 1
          FROM "contactRole" cr
          WHERE cr."contactId" = c.id
            AND cr."isCurrent" = true
        )
      )::text AS "withRole",

      COUNT(*) FILTER (
        WHERE "doNotContact" = true
      )::text AS "doNotContact"

    FROM "contact" c;
    `,
    );

    const roleFamiliesResult = await this.db.query<{
      roleFamily: string;
      count: string;
    }>(
      `
    SELECT
      COALESCE(cr."roleFamily", 'UNKNOWN') AS "roleFamily",
      COUNT(DISTINCT c.id)::text AS count
    FROM "contact" c

    LEFT JOIN "contactRole" cr
      ON cr."contactId" = c.id
      AND cr."isCurrent" = true

    GROUP BY COALESCE(cr."roleFamily", 'UNKNOWN')
    ORDER BY count DESC;
    `,
    );

    const emailTypesResult = await this.db.query<{
      emailType: string;
      count: string;
    }>(
      `
    SELECT
      ce.type AS "emailType",
      COUNT(DISTINCT ce."contactId")::text AS count
    FROM "contactEmail" ce
    GROUP BY ce.type
    ORDER BY count DESC;
    `,
    );

    const identityResult = await this.db.query<{
      identityConfidence: string;
      count: string;
    }>(
      `
    SELECT
      "identityConfidence",
      COUNT(*)::text AS count
    FROM "contact"
    GROUP BY "identityConfidence"
    ORDER BY count DESC;
    `,
    );

    const stats = contactStats.rows[0];

    const roleFamilies: Record<string, number> = {};
    for (const row of roleFamiliesResult.rows) {
      roleFamilies[row.roleFamily] = Number(row.count);
    }

    const emailTypes: Record<string, number> = {};
    for (const row of emailTypesResult.rows) {
      emailTypes[row.emailType] = Number(row.count);
    }

    const identityConfidence: Record<string, number> = {};
    for (const row of identityResult.rows) {
      identityConfidence[row.identityConfidence] = Number(row.count);
    }

    return {
      contacts: {
        total: Number(stats.total),
        withCompany: Number(stats.withCompany),
        withEmail: Number(stats.withEmail),
        withRole: Number(stats.withRole),
        doNotContact: Number(stats.doNotContact),
      },
      roleFamilies,
      emailTypes,
      identityConfidence,
    };
  }

  async generateMatches(opportunityId: number) {
  const result = await this.db.query<{
    id: number;
    companyId: number | null;
    companyName: string;
    roleTitle: string;
  }>(
    `
    SELECT
      id,
      "companyId",
      "companyName",
      "roleTitle"
    FROM "opportunity"
    WHERE id = $1
    `,
    [opportunityId],
  );

  const opportunity = result.rows[0];

  if (!opportunity) {
    throw new Error('Opportunity not found');
  }

  if (!opportunity.companyId) {
    return {
      opportunity,
      matchesGenerated: 0,
      matches: [],
    };
  }

  const contactsResult = await this.db.query<{
    id: number;
    name: string | null;
    identityConfidence: string;
    doNotContact: boolean;
    email: string | null;
    emailType: string | null;
    emailConfidence: number | null;
    title: string | null;
    roleFamily: string | null;
  }>(
    `
    SELECT
      c.id,
      c.name,
      c."identityConfidence",
      c."doNotContact",

      ce.email,
      ce.type AS "emailType",
      ce.confidence AS "emailConfidence",

      cr.title,
      cr."roleFamily"

    FROM "contact" c

    LEFT JOIN LATERAL (
      SELECT
        email,
        type,
        confidence
      FROM "contactEmail"
      WHERE "contactId" = c.id
        AND "doNotContact" = false
      ORDER BY
        "isPrimary" DESC,
        confidence DESC NULLS LAST,
        id
      LIMIT 1
    ) ce ON true

    LEFT JOIN LATERAL (
      SELECT
  cr_inner.title,
  cr_inner."roleFamily"
FROM "contactRole" cr_inner
WHERE cr_inner."contactId" = c.id
  AND cr_inner."isCurrent" = true
ORDER BY
  CASE cr_inner."roleFamily"
    WHEN 'HIRING_MANAGER' THEN 1
    WHEN 'RECRUITER' THEN 2
    WHEN 'ENGINEERING_LEADERSHIP' THEN 3
    WHEN 'HR' THEN 4
    WHEN 'LEADERSHIP' THEN 5
    WHEN 'FOUNDER' THEN 6
    WHEN 'UNKNOWN' THEN 7
    ELSE 8
  END,
  cr_inner.id DESC
LIMIT 1
    ) cr ON true

    WHERE c."companyId" = $1
      AND c."doNotContact" = false;
    `,
    [opportunity.companyId],
  );

  const profile = buildOpportunityRoleProfile(
    opportunity.roleTitle,
  );

  const matcher = new ContactMatcher();

  const matches = contactsResult.rows
  .map((contact) =>
    matcher.match(
      {
        id: contact.id,
        name: contact.name,
        identityConfidence: contact.identityConfidence,
        email: contact.email,
        emailType: contact.emailType,
        title: contact.title,
        roleFamily: contact.roleFamily,
      },
      profile,
    ),
  )
  .filter((match) => match.eligible)
  .sort((a, b) => b.score - a.score);

  const client = await this.db.getClient();

  try {
    await client.query('BEGIN');

    await client.query(
      `
      DELETE FROM "contactMatch"
      WHERE "opportunityId" = $1
      `,
      [opportunityId],
    );

    for (let index = 0; index < matches.length; index++) {
      const match = matches[index];

      await client.query(
        `
        INSERT INTO "contactMatch"
          (
            "opportunityId",
            "contactId",
            "score",
            "rank",
            "reasons",
            "createdAt"
          )
        VALUES
          ($1, $2, $3, $4, $5, NOW())
        `,
        [
          opportunityId,
          match.id,
          match.score,
          index + 1,
          JSON.stringify(match.reasons),
        ],
      );
    }

    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }

  return {
    opportunity,
    roleProfile: profile,
    matchesGenerated: matches.length,
    matches,
  };
}

async getSavedMatches(opportunityId: number) {
  const opportunityResult = await this.db.query<{
    id: number;
    companyId: number | null;
    companyName: string;
    roleTitle: string;
    location: string | null;
    status: string;
  }>(
    `
    SELECT
      id,
      "companyId",
      "companyName",
      "roleTitle",
      location,
      status
    FROM "opportunity"
    WHERE id = $1
    `,
    [opportunityId],
  );

  const opportunity = opportunityResult.rows[0];

  if (!opportunity) {
    throw new Error('Opportunity not found');
  }

  const matchesResult = await this.db.query<{
    matchId: number;
    contactId: number;
    score: number;
    rank: number;
    reasons: string | null;

    name: string | null;
    identityConfidence: string;
    doNotContact: boolean;

    email: string | null;
    emailType: string | null;
    emailConfidence: number | null;

    title: string | null;
    roleFamily: string | null;
  }>(
    `
    SELECT
      cm.id AS "matchId",
      cm."contactId",
      cm.score,
      cm.rank,
      cm.reasons,

      c.name,
      c."identityConfidence",
      c."doNotContact",

      ce.email,
      ce.type AS "emailType",
      ce.confidence AS "emailConfidence",

      cr.title,
      cr."roleFamily"

    FROM "contactMatch" cm

    INNER JOIN "contact" c
      ON c.id = cm."contactId"

    LEFT JOIN LATERAL (
      SELECT
        email,
        type,
        confidence
      FROM "contactEmail"
      WHERE "contactId" = c.id
        AND "doNotContact" = false
      ORDER BY
        "isPrimary" DESC,
        confidence DESC NULLS LAST,
        id
      LIMIT 1
    ) ce ON true

    LEFT JOIN LATERAL (
      SELECT
  cr_inner.title,
  cr_inner."roleFamily"
FROM "contactRole" cr_inner
WHERE cr_inner."contactId" = c.id
  AND cr_inner."isCurrent" = true
ORDER BY
  CASE cr_inner."roleFamily"
    WHEN 'HIRING_MANAGER' THEN 1
    WHEN 'RECRUITER' THEN 2
    WHEN 'ENGINEERING_LEADERSHIP' THEN 3
    WHEN 'HR' THEN 4
    WHEN 'LEADERSHIP' THEN 5
    WHEN 'FOUNDER' THEN 6
    WHEN 'UNKNOWN' THEN 7
    ELSE 8
  END,
  cr_inner.id DESC
LIMIT 1
    ) cr ON true

    WHERE cm."opportunityId" = $1
      AND c."doNotContact" = false

    ORDER BY cm.rank ASC;
    `,
    [opportunityId],
  );

  return {
    opportunity,
    matches: matchesResult.rows,
  };
}

async getAll() {
  const result = await this.db.query(
    `
    SELECT
      o.id,
      o."companyName",
      o."roleTitle",
      o.location,
      o.status,
      o."createdAt",
      o."updatedAt",
      (
        SELECT COUNT(*)
        FROM "contactMatch" cm
        WHERE cm."opportunityId" = o.id
      ) AS "matchCount"
    FROM "opportunity" o
    ORDER BY o."createdAt" DESC, o.id DESC
    `
  );

  return result.rows;
}
}
