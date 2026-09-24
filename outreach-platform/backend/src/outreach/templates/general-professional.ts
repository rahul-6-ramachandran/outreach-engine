import { OutreachTemplate } from '../outreach-draft.js';

export const generalProfessionalTemplate: OutreachTemplate = {
  strategy: 'GENERAL_PROFESSIONAL',

  buildSubject: ({ roleTitle, companyName }) =>
    `Interest in ${roleTitle} at ${companyName}`,

 buildBody: ({
  firstName,
  companyName,
  roleTitle,
  jobUrl,
  candidate,
}) => {
  const skillText =
    candidate.skills.length > 0
      ? candidate.skills.slice(0, 4).join(', ')
      : 'software engineering';

    const greeting = firstName
  ? `Hi ${firstName},`
  : 'Hello,';

    return `${greeting}

I came across the ${roleTitle} opportunity at ${companyName} and wanted to reach out.

I'm a ${candidate.headline} with ${candidate.experience} years of production experience in ${skillText}.

I'd be glad to share more about my background if relevant.

${jobUrl ? `Job posting: ${jobUrl}\n\n` : ''}
${candidate.resumeUrl ? `Resume: ${candidate.resumeUrl}\n` : ''}
${candidate.portfolioUrl ? `Portfolio: ${candidate.portfolioUrl}\n` : ''}
Best regards,
${candidate.name}`;
  },
};