import { Test, TestingModule } from '@nestjs/testing';
import { AuthGuard } from '../auth/auth.guard.js';
import { vi } from 'vitest';
import { OpportunitiesController } from './opportunities.controller.js';
import { OpportunitiesService } from './opportunities.service.js';

describe('OpportunitiesController', () => {
  let controller: OpportunitiesController;

  const opportunitiesServiceMock = {
    create: vi.fn(),
    getMatchingHealth: vi.fn(),
    getContacts: vi.fn(),
    getMatch: vi.fn(),
    matchContacts: vi.fn(),
    getSavedMatches: vi.fn(),
    generateMatches: vi.fn(),
    getMatchDiagnostics: vi.fn(),
  };

  beforeEach(async () => {
    vi.clearAllMocks();
const module: TestingModule = await Test.createTestingModule({
  controllers: [OpportunitiesController],
  providers: [
    {
      provide: OpportunitiesService,
      useValue: opportunitiesServiceMock,
    },
  ],
})
  .overrideGuard(AuthGuard)
  .useValue({ canActivate: () => true })
  .compile();

    controller = module.get<OpportunitiesController>(
      OpportunitiesController,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
