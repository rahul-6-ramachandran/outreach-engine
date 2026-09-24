import { Injectable, OnModuleDestroy } from '@nestjs/common';
import {
  Pool,
  PoolClient,
  QueryResult,
  QueryResultRow,
} from 'pg';
@Injectable()
export class DatabaseService implements OnModuleDestroy {
  private readonly pool: Pool;

  constructor() {
    const connectionString = process.env['DATABASE_URL'];

    if (!connectionString) {
      throw new Error('DATABASE_URL is not configured');
    }

    this.pool = new Pool({
      connectionString,
    });
  }

 query<T extends QueryResultRow = any>(
  text: string,
  values?: unknown[],
): Promise<QueryResult<T>> {
    return this.pool.query<T>(text, values);
  }

  async getClient(): Promise<PoolClient> {
    return this.pool.connect();
  }

  async onModuleDestroy(): Promise<void> {
    await this.pool.end();
  }
}