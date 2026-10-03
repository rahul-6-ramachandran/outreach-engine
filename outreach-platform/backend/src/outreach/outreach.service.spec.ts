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

    it('does not mark outreach failed when provider succeeds but DB finalization fails', async () => {
    databaseClientMock.query
      // BEGIN
      .mockResolvedValueOnce({ rows: [], rowCount: 0 })
      // Claim outreach
      .mockResolvedValueOnce({
        rows: [
          {
            id: 13,
            email: 'test@example.com',
            subject: 'Test subject',
            body: 'Test body',
          },
        ],
        rowCount: 1,
      })
      // Attempt number
      .mockResolvedValueOnce({
        rows: [{ attemptNumber: 1 }],
        rowCount: 1,
      })
      // Create attempt
      .mockResolvedValueOnce({
        rows: [{ id: 103 }],
        rowCount: 1,
      })
      // COMMIT
      .mockResolvedValueOnce({ rows: [], rowCount: 0 });

    databaseMock.query
      // Attempt → SENT fails
      .mockRejectedValueOnce(
        new Error('Database finalization failure'),
      );

    vi.mocked(emailProviderMock.send).mockResolvedValue({
      providerMessageId: 'mock-message-456',
    });

    await expect(
      service.sendOutreach(13),
    ).rejects.toThrow('Database finalization failure');

    expect(emailProviderMock.send).toHaveBeenCalledOnce();

    // Because the provider succeeded, the catch block must NOT
    // execute the FAILED updates.
    expect(databaseMock.query).not.toHaveBeenCalledWith(
      expect.stringContaining(`SET
        status = 'FAILED'`),
      expect.anything(),
    );
  });


});

 describe('OutreachService.recoverStaleOutreachAttempts', () => {
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

  it('reconciles a SENT attempt to a SENT outreach', async () => {
    databaseMock.query
      // SENT attempt reconciliation
      .mockResolvedValueOnce({
        rows: [{ id: 20, status: 'SENT' }],
        rowCount: 1,
      })
      // FAILED attempt reconciliation
      .mockResolvedValueOnce({
        rows: [],
        rowCount: 0,
      })
      // No stale STARTED attempts
      .mockResolvedValueOnce({
        rows: [],
        rowCount: 0,
      });

    const result =
      await service.recoverStaleOutreachAttempts();

    expect(result.reconciledSent).toBe(1);
    expect(result.reconciledFailed).toBe(0);
    expect(result.recovered).toBe(0);
    expect(result.attempts).toEqual([]);

    expect(databaseMock.query).toHaveBeenCalledTimes(3);

    expect(databaseMock.query.mock.calls[0][0]).toContain(
      `status = 'SENT'`,
    );

    expect(databaseMock.query.mock.calls[0][0]).toContain(
      `o.status = 'SENDING'`,
    );
  });

  it('marks stale STARTED attempts and their outreach as UNKNOWN', async () => {
    databaseMock.query
      // SENT reconciliation
      .mockResolvedValueOnce({
        rows: [],
        rowCount: 0,
      })
      // FAILED reconciliation
      .mockResolvedValueOnce({
        rows: [],
        rowCount: 0,
      })
      // Find stale attempts
      .mockResolvedValueOnce({
        rows: [
          {
            id: 21,
            outreachId: 30,
          },
        ],
        rowCount: 1,
      })
      // Mark attempts UNKNOWN
      .mockResolvedValueOnce({
        rows: [
          {
            id: 21,
            outreachId: 30,
            status: 'UNKNOWN',
          },
        ],
        rowCount: 1,
      })
      // Mark outreach UNKNOWN
      .mockResolvedValueOnce({
        rows: [],
        rowCount: 1,
      });

    const result =
      await service.recoverStaleOutreachAttempts();

    expect(result.reconciledSent).toBe(0);
    expect(result.reconciledFailed).toBe(0);
    expect(result.recovered).toBe(1);
    expect(result.attempts).toEqual([
      {
        id: 21,
        outreachId: 30,
        status: 'UNKNOWN',
      },
    ]);

    expect(databaseMock.query).toHaveBeenCalledTimes(5);

    expect(databaseMock.query.mock.calls[3][0]).toContain(
      `status = 'UNKNOWN'`,
    );

    expect(databaseMock.query.mock.calls[4][0]).toContain(
      `status = 'UNKNOWN'`,
    );
  });

    it('reconciles a FAILED attempt to a FAILED outreach', async () => {
    databaseMock.query
      // SENT reconciliation
      .mockResolvedValueOnce({
        rows: [],
        rowCount: 0,
      })
      // FAILED reconciliation
      .mockResolvedValueOnce({
        rows: [{ id: 31, status: 'FAILED' }],
        rowCount: 1,
      })
      // No stale STARTED attempts
      .mockResolvedValueOnce({
        rows: [],
        rowCount: 0,
      });

    const result =
      await service.recoverStaleOutreachAttempts();

    expect(result.reconciledSent).toBe(0);
    expect(result.reconciledFailed).toBe(1);
    expect(result.recovered).toBe(0);
    expect(result.attempts).toEqual([]);

    expect(databaseMock.query).toHaveBeenCalledTimes(3);

    expect(databaseMock.query.mock.calls[1][0]).toContain(
      `status = 'FAILED'`,
    );

    expect(databaseMock.query.mock.calls[1][0]).toContain(
      `o.status = 'SENDING'`,
    );
  });
});

describe('OutreachService.approveOutreach', () => {
  let service: OutreachService;

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

  it('approves a valid draft outreach', async () => {
    databaseMock.query.mockResolvedValueOnce({
      rows: [
        {
          id: 20,
          opportunityId: 5,
          contactId: 31,
          email: 'recruiter@example.com',
          subject: 'Backend Engineer opportunity',
          body: 'Hello, this is a test draft.',
          status: 'APPROVED',
          approvedAt: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
      rowCount: 1,
    });

    const result = await service.approveOutreach(20);

    expect(result.id).toBe(20);
    expect(result.status).toBe('APPROVED');

    expect(databaseMock.query).toHaveBeenCalledOnce();
    expect(databaseMock.query.mock.calls[0][0]).toContain(
      `status = 'DRAFT'`,
    );
    expect(databaseMock.query.mock.calls[0][0]).toContain(
      `c."doNotContact" = false`,
    );
    expect(databaseMock.query.mock.calls[0][0]).toContain(
      `ce."doNotContact" = false`,
    );
  });

  it('rejects an outreach that is not currently a valid draft', async () => {
    databaseMock.query.mockResolvedValueOnce({
      rows: [],
      rowCount: 0,
    });

    await expect(service.approveOutreach(20)).rejects.toThrow(
      'Outreach not found, is not currently a draft, or contact/email is no longer eligible',
    );

    expect(databaseMock.query).toHaveBeenCalledOnce();
  });
});
describe('OutreachService.createDraft', () => {
  let service: OutreachService;

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

  it('persists the generated draft as DRAFT and returns the outreach record', async () => {
    const generated = {
      contact: {
        id: 42,
        email: 'rahul@example.com',
      },
      draft: {
        subject: 'Backend Engineer opportunity',
        body: 'Hi Rahul, I came across your profile...',
      },
      strategy: {
        primaryReason: 'Engineering leadership',
      },
    };

    vi.spyOn(service, 'generateMatchDraft').mockResolvedValue(generated as any);

    databaseMock.query.mockResolvedValueOnce({
      rowCount: 1,
      rows: [
        {
          id: 101,
          opportunityId: 7,
          contactId: 42,
          email: 'rahul@example.com',
          subject: 'Backend Engineer opportunity',
          body: 'Hi Rahul, I came across your profile...',
          status: 'DRAFT',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
    });

    const result = await service.createDraft(7, 55);

    expect(service.generateMatchDraft).toHaveBeenCalledWith(7, 55);

    expect(databaseMock.query).toHaveBeenCalledTimes(1);

    const [sql, params] = databaseMock.query.mock.calls[0];

    expect(sql).toContain(`INSERT INTO "outreach"`);
    expect(sql).toContain(`'DRAFT'`);

    expect(params).toEqual([
      7,
      42,
      'rahul@example.com',
      'Backend Engineer opportunity',
      'Hi Rahul, I came across your profile...',
    ]);

    expect(result.id).toBe(101);
    expect(result.status).toBe('DRAFT');
  });

  it('does not persist anything when draft generation fails', async () => {
    vi.spyOn(service, 'generateMatchDraft').mockRejectedValue(
      new Error('Match is no longer eligible'),
    );

    await expect(service.createDraft(7, 55)).rejects.toThrow(
      'Match is no longer eligible',
    );

    expect(databaseMock.query).not.toHaveBeenCalled();
  });
});