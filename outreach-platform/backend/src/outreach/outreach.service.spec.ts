import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException } from '@nestjs/common';
import { vi, afterAll, beforeEach, describe, expect, it } from 'vitest';
import {
  mkdtempSync,
  writeFileSync,
  rmSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { OutreachService } from './outreach.service.js';
import { DatabaseService } from '../database/database.service.js';
import { ContactsService } from '../contacts/contacts.service.js';
import { EMAIL_PROVIDER } from './email-provider.token.js';
import type { EmailProvider } from './email-provider.js';

const tempDir = mkdtempSync(join(tmpdir(), 'outreach-test-'));
const dummyResumePath = join(tempDir, 'dummy-resume.pdf');
writeFileSync(dummyResumePath, 'test resume attachment');

const originalResumePath = process.env['RESUME_PATH'];

afterAll(() => {
  if (originalResumePath === undefined) {
    delete process.env['RESUME_PATH'];
  } else {
    process.env['RESUME_PATH'] = originalResumePath;
  }

  rmSync(tempDir, { recursive: true, force: true });
});

describe('OutreachService.sendOutreach', () => {
  let service: OutreachService;

  const databaseClientMock = {
    query: vi.fn(),
    release: vi.fn(),
  };

  const databaseMock = {
    query: vi.fn(),
    getClient: vi.fn(),
  };

  const contactsMock = {};

  const emailProviderMock: EmailProvider = {
    send: vi.fn(),
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    process.env['RESUME_PATH'] = dummyResumePath;
    process.env['EMAIL_PROVIDER'] = 'smtp';

    databaseMock.getClient.mockResolvedValue(databaseClientMock);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OutreachService,
        {
          provide: DatabaseService,
          useValue: databaseMock,
        },
        {
          provide: ContactsService,
          useValue: contactsMock,
        },
        {
          provide: EMAIL_PROVIDER,
          useValue: emailProviderMock,
        },
      ],
    }).compile();

    service = module.get<OutreachService>(OutreachService);
  });

  it('sends an approved outreach and records success', async () => {
    databaseClientMock.query.mockImplementation(
      async (sql: string) => {
        if (sql.includes('UPDATE "outreach" o')) {
          return {
            rows: [
              {
                id: 10,
                email: 'test@example.com',
                subject: 'Backend Engineer opportunity',
                body: 'Hello, this is a test draft.',
              },
            ],
            rowCount: 1,
          };
        }

        if (sql.includes('COALESCE(MAX("attemptNumber")')) {
          return {
            rows: [{ attemptNumber: 1 }],
            rowCount: 1,
          };
        }

        if (sql.includes('INSERT INTO "outreachAttempt"')) {
          return {
            rows: [{ id: 100 }],
            rowCount: 1,
          };
        }

        return { rows: [], rowCount: 1 };
      },
    );

    databaseMock.query
      .mockResolvedValueOnce({ rows: [], rowCount: 1 })
      .mockResolvedValueOnce({
        rows: [
          {
            id: 10,
            status: 'SENT',
            sentAt: new Date(),
            updatedAt: new Date(),
          },
        ],
        rowCount: 1,
      });

    vi.mocked(emailProviderMock.send).mockResolvedValue({
      providerMessageId: 'mock-message-123',
    });

    const result = await service.sendOutreach(10);

    expect(emailProviderMock.send).toHaveBeenCalledOnce();
    expect(emailProviderMock.send).toHaveBeenCalledWith({
      to: 'test@example.com',
      subject: 'Backend Engineer opportunity',
      body: 'Hello, this is a test draft.',
      attachments: [
        {
          filename: 'dummy-resume.pdf',
          path: dummyResumePath,
        },
      ],
    });

    expect(databaseMock.query).toHaveBeenCalledTimes(2);
    expect(databaseMock.query.mock.calls[0][0]).toContain(
      'UPDATE "outreachAttempt"',
    );
    expect(databaseMock.query.mock.calls[1][0]).toContain(
      'UPDATE "outreach"',
    );

    expect(result.status).toBe('SENT');
    expect(result.providerMessageId).toBe('mock-message-123');
    expect(databaseClientMock.release).toHaveBeenCalledOnce();
  });

  it('rejects an outreach that cannot be claimed and does not send', async () => {
    databaseClientMock.query.mockImplementation(
      async (sql: string) => {
        if (sql.includes('UPDATE "outreach" o')) {
          return { rows: [], rowCount: 0 };
        }

        return { rows: [], rowCount: 1 };
      },
    );

    await expect(service.sendOutreach(11)).rejects.toThrow(
      ConflictException,
    );

    expect(emailProviderMock.send).not.toHaveBeenCalled();
    expect(databaseClientMock.query).toHaveBeenCalledWith('ROLLBACK');
    expect(databaseClientMock.release).toHaveBeenCalledOnce();
  });

  it('records a provider failure and marks the outreach failed', async () => {
    databaseClientMock.query.mockImplementation(
      async (sql: string) => {
        if (sql.includes('UPDATE "outreach" o')) {
          return {
            rows: [
              {
                id: 12,
                email: 'test@example.com',
                subject: 'Test subject',
                body: 'Test body',
              },
            ],
            rowCount: 1,
          };
        }

        if (sql.includes('COALESCE(MAX("attemptNumber")')) {
          return {
            rows: [{ attemptNumber: 1 }],
            rowCount: 1,
          };
        }

        if (sql.includes('INSERT INTO "outreachAttempt"')) {
          return { rows: [{ id: 102 }], rowCount: 1 };
        }

        return { rows: [], rowCount: 1 };
      },
    );

    databaseMock.query
      .mockResolvedValueOnce({ rows: [], rowCount: 1 })
      .mockResolvedValueOnce({ rows: [], rowCount: 1 });

    vi.mocked(emailProviderMock.send).mockRejectedValue(
      new Error('Mock SMTP failure'),
    );

    await expect(service.sendOutreach(12)).rejects.toThrow(
      'Mock SMTP failure',
    );

    expect(emailProviderMock.send).toHaveBeenCalledOnce();

    expect(databaseMock.query).toHaveBeenCalledTimes(2);

    expect(databaseMock.query.mock.calls[0][0]).toContain(
      'UPDATE "outreachAttempt"',
    );
    expect(databaseMock.query.mock.calls[0][1]).toEqual([
      12,
      'Mock SMTP failure',
    ]);

    expect(databaseMock.query.mock.calls[1][0]).toContain(
      'UPDATE "outreach"',
    );
    expect(databaseMock.query.mock.calls[1][1]).toEqual([
      12,
      'Mock SMTP failure',
    ]);
  });
});
