import {
  OutreachDraft,
  OutreachDraftInput,
  OutreachTemplate,
} from './outreach-draft.js';

import { engineeringRecruiterTemplate } from './templates/engineering-recruiter.js';
import { technicalHiringManagerTemplate } from './templates/technical-hiring-manager.js';
import { engineeringLeadershipTemplate } from './templates/engineering-leadership.js';
import { hrGeneralTemplate } from './templates/hr-general.js';
import { generalRecruiterTemplate } from './templates/general-recruiter.js';
import { founderGeneralTemplate } from './templates/founder-general.js';
import { generalProfessionalTemplate } from './templates/general-professional.js';

const templates: Record<string, OutreachTemplate> = {
  ENGINEERING_RECRUITER: engineeringRecruiterTemplate,
  TECHNICAL_HIRING_MANAGER: technicalHiringManagerTemplate,
  ENGINEERING_LEADERSHIP: engineeringLeadershipTemplate,
  HR_GENERAL: hrGeneralTemplate,
  GENERAL_RECRUITER: generalRecruiterTemplate,
  FOUNDER_GENERAL: founderGeneralTemplate,
  GENERAL_PROFESSIONAL: generalProfessionalTemplate,
};

export function renderOutreachDraft(
  input: OutreachDraftInput,
): OutreachDraft {
  const template = templates[input.strategy];

  if (!template) {
    throw new Error(
      `No outreach template registered for strategy: ${input.strategy}`,
    );
  }

  return {
    strategy: template.strategy,
    subject: template.buildSubject(input),
    body: template.buildBody(input),
  };
}