export interface CreateOpportunityDto {
  companyName: string;
  roleTitle: string;
  location?: string;
  jobUrl?: string;
  jobDescription?: string;
}

export interface Opportunity {
  id: number;
  companyName: string;
  roleTitle: string;
  location: string | null;
  jobUrl: string | null;
  jobDescription: string | null;
  status: string;
  companyId: number | null;
  createdAt: string;
  updatedAt: string;
  matchCount: number | string;
}

export interface MatchingHealth {
  contacts: {
    total: number;
    withCompany: number;
    withEmail: number;
    withRole: number;
    doNotContact: number;
  };
  roleFamilies: Record<string, number>;
  emailTypes: Record<string, number>;
  identityConfidence: Record<string, number>;
}

export interface OutreachDraft {
  subject: string;
  body: string;
  variables?: Record<string, string>;
}

export interface OutreachStrategy {
  roleFamily?: string;
  contactRoleFamily?: string | null;
  angle?: string;
  tone?: string;
  emphasis?: string[];
  templateKey?: string;
  reason?: string;
}

export interface ContactMatch {
  id: number;
  rank: number;
  contactId: number;
  name: string | null;
  title: string | null;
  roleFamily: string | null;
  email: string | null;
  emailType: string | null;
  score: number;
  reasons: string[];
  identityConfidence: string;
  outreach?: {
    strategy: OutreachStrategy;
    draft: OutreachDraft;
  };
}

export interface OpportunityMatchesResponse {
  opportunity: Opportunity;
  matches: ContactMatch[];
}

export interface OpportunityContactsResponse {
  opportunity: {
    id: number;
    companyId: number | null;
    companyName: string;
    roleTitle: string;
  };
  contacts: Array<{
    id: number;
    name: string | null;
    identityConfidence: string;
    doNotContact: boolean;
    emails: Array<{
      email: string;
      type: string;
      isPrimary: boolean;
      confidence: number | null;
    }>;
    roles: Array<{
      title: string;
      roleFamily: string;
      isCurrent: boolean;
    }>;
  }>;
}

export interface MatchDiagnosticsResponse {
  opportunity: {
    id: number;
    companyName: string;
    roleTitle: string;
  };
  totalContacts: number;
  eligibleContacts: number;
  excludedContacts: number;
  roleFamilies: Record<string, number>;
  emailTypes: Record<string, number>;
}
