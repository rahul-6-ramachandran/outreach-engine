import { Test, TestingModule } from '@nestjs/testing';
import { vi } from 'vitest';
import { ContactsService } from './contacts.service.js';
import { DatabaseService } from '../database/database.service.js';

describe('ContactsService', () => {
  let service: ContactsService;

  const databaseMock = {
    query: vi.fn(),
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ContactsService,
        {
          provide: DatabaseService,
          useValue: databaseMock,
        },
      ],
    }).compile();

    service = module.get<ContactsService>(ContactsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
