import { apiClient } from '@/lib/api-client';
import {
  type CreateOpportunityDto,
  type Opportunity,
  type MatchingHealth,
  type OpportunityMatchesResponse,
  type OpportunityContactsResponse,
  type MatchDiagnosticsResponse,
    type GeneratedMatchDraftResponse,
} from './opportunities.types';

export const opportunitiesApi = {
  create: async (dto: CreateOpportunityDto): Promise<Opportunity> => {
    return apiClient<Opportunity>('/opportunities', {
      method: 'POST',
      body: dto,
    });
  },

  getMatchingHealth: async (): Promise<MatchingHealth> => {
    return apiClient<MatchingHealth>('/opportunities/matches/health', {
      method: 'GET',
    });
  },

  getContacts: async (opportunityId: number): Promise<OpportunityContactsResponse> => {
    return apiClient<OpportunityContactsResponse>(`/opportunities/${opportunityId}/contacts`, {
      method: 'GET',
    });
  },

  getMatches: async (opportunityId: number): Promise<OpportunityMatchesResponse> => {
    return apiClient<OpportunityMatchesResponse>(`/opportunities/${opportunityId}/matches`, {
      method: 'GET',
    });
  },

  generateMatches: async (opportunityId: number): Promise<{
    opportunity: Opportunity;
    matchesGenerated: number;
    matches: unknown[];
  }> => {
    return apiClient(`/opportunities/${opportunityId}/matches/generate`, {
      method: 'POST',
    });
  },

  generateMatchDraft: async (
  opportunityId: number,
  matchId: number
): Promise<GeneratedMatchDraftResponse> => {
  return apiClient<GeneratedMatchDraftResponse>(
    `/opportunities/${opportunityId}/matches/${matchId}/draft`,
    {
      method: 'GET',
    }
  );
},

  getDiagnostics: async (opportunityId: number): Promise<MatchDiagnosticsResponse> => {
    return apiClient<MatchDiagnosticsResponse>(`/opportunities/${opportunityId}/matches/diagnostics`, {
      method: 'GET',
    });
  },

  getAll: async (): Promise<Opportunity[]> => {
  return apiClient<Opportunity[]>('/opportunities', {
    method: 'GET',
  });
},

getSavedMatches: async (
  opportunityId: number
): Promise<OpportunityMatchesResponse> => {
  return apiClient<OpportunityMatchesResponse>(
    `/opportunities/${opportunityId}/matches/saved`,
    {
      method: 'GET',
    }
  );
},
};
