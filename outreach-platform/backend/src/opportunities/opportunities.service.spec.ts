import { Test, TestingModule } from '@nestjs/testing';
import { vi } from 'vitest';
import { OpportunitiesService } from './opportunities.service.js';
import { DatabaseService } from '../database/database.service.js';
import { OutreachService } from '../outreach/outreach.service.js';

describe('OpportunitiesService', () => {
  let service: OpportunitiesService;

  const databaseMock = {
    query: vi.fn(),
    getClient: vi.fn(),
  };

  const outreachMock = {
    buildDraftForMatch: vi.fn(),
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OpportunitiesService,
        {
          provide: DatabaseService,
          useValue: databaseMock,
        },
        {
          provide: OutreachService,
          useValue: outreachMock,
        },
      ],
    }).compile();

    service = module.get<OpportunitiesService>(OpportunitiesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
