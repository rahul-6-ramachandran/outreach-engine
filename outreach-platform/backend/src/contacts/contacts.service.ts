import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service.js';

@Injectable()
export class ContactsService {
  constructor(
    private readonly databaseService: DatabaseService,
  ) {}

  async getEffectiveRole(contactId: number) {
    const result = await this.databaseService.query<{
      title: string;
      roleFamily: string;
    }>(
      `
      SELECT
        cr.title,
        cr."roleFamily"
      FROM "contactRole" cr
      WHERE cr."contactId" = $1
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
      `,
      [contactId],
    );

    return result.rows[0] ?? null;
  }
}