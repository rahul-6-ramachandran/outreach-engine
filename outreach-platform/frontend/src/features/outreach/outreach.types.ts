export type OutreachStatus =
  | 'DRAFT'
  | 'APPROVED'
  | 'SENDING'
  | 'SENT'
  | 'FAILED'
  | 'UNKNOWN'
  | 'CANCELLED';

export interface OutreachRecord {
  id: number;
  opportunityId: number;
  contactId: number;
  email: string;
  subject: string;
  body: string;
  status: OutreachStatus;
  approvedAt?: string | null;
  sentAt?: string | null;
  failedAt?: string | null;
  errorMessage?: string | null;
  createdAt: string;
  updatedAt: string;

  // In-memory session metadata
  companyName?: string;
  roleTitle?: string;
  contactName?: string;
}

export interface SendOutreachResult {
  id: number;
  status: string;
  sentAt?: string;
  updatedAt: string;
  providerMessageId?: string | null;
}
