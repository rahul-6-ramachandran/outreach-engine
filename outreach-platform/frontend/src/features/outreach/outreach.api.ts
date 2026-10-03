import { apiClient } from '@/lib/api-client';
import { type OutreachRecord, type SendOutreachResult } from './outreach.types';

export const outreachApi = {

  getHistory: async (): Promise<OutreachRecord[]> =>
  apiClient<OutreachRecord[]>('/outreach', {
    method: 'GET',
  }),

  createDraft: async (opportunityId: number, matchId: number): Promise<OutreachRecord> => {
  return apiClient<OutreachRecord>(
      `/opportunities/${opportunityId}/matches/${matchId}/outreach`,
      { method: 'POST' }
    );
  },

  approve: async (outreachId: number): Promise<OutreachRecord> => {
    return apiClient<OutreachRecord>(`/outreach/${outreachId}/approve`, {
      method: 'POST',
    });
  },

  send: async (outreachId: number): Promise<SendOutreachResult> => {
    // Note: Backend send takes only :outreachId in URL and validates status === 'APPROVED'.
    // Typed SEND confirmation is enforced strictly by frontend SendConfirmationDialog.
    return apiClient<SendOutreachResult>(`/outreach/${outreachId}/send`, {
      method: 'POST',
    });
  },

  cancel: async (outreachId: number): Promise<{ id: number; status: string; updatedAt: string }> => {
    return apiClient(`/outreach/${outreachId}/cancel`, {
      method: 'POST',
    });
  },

  recoverStale: async (): Promise<unknown> => {
    return apiClient('/outreach/recover-stale', {
      method: 'POST',
    });
  },
};
