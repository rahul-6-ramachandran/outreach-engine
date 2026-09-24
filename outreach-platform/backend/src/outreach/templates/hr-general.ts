import { OutreachTemplate } from '../outreach-draft.js';

export const hrGeneralTemplate: OutreachTemplate = {
  strategy: 'HR_GENERAL',

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

I came across the ${roleTitle} opportunity at ${companyName} and wanted to express my interest.

I'm a ${candidate.headline} with ${candidate.experience} years of experience building production applications, primarily focused on ${candidate.expertise} development with ${skillText}.

I'd be happy to share any additional information needed for the application.

${jobUrl ? `Job posting: ${jobUrl}\n\n` : ''}
${candidate.resumeUrl ? `Resume: ${candidate.resumeUrl}\n` : ''}
${candidate.portfolioUrl ? `Portfolio: ${candidate.portfolioUrl}\n` : ''}Best regards,
${candidate.name}`;
  },
};