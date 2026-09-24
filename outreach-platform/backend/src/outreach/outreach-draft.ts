
export interface CandidateProfile {
  name: string;
  headline: string;
  experience: string;
  skills: string[];
  expertise: string
  resumeUrl?: string | null;
  portfolioUrl?: string | null;
}

export interface OutreachDraftInput {
  firstName: string;
  companyName: string;
  roleTitle: string;
  location?: string | null;
  jobUrl?: string | null;
  strategy: string;

  candidate: CandidateProfile;
}

export interface OutreachTemplate {
  strategy: string;

  buildSubject(input: OutreachDraftInput): string;

  buildBody(input: OutreachDraftInput): string;
}

export interface OutreachDraft {
  strategy: string;
  subject: string;
  body: string;
}