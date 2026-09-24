import { OutreachTemplate } from '../outreach-draft.js';

export const engineeringLeadershipTemplate: OutreachTemplate = {
  strategy: 'ENGINEERING_LEADERSHIP',

  buildSubject: ({ roleTitle, companyName }) =>
    `Interested in ${roleTitle} at ${companyName}`,

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

    return ` ${greeting}

I'm reaching out regarding the ${roleTitle} opportunity at ${companyName}.

I'm a ${candidate.headline} with ${candidate.experience} years of production experience working with ${skillText}. The role caught my attention because of its engineering focus.

I'd appreciate any guidance on the team or the appropriate person to speak with about the opportunity.

${jobUrl ? `Job posting: ${jobUrl}\n\n` : ''}
${candidate.resumeUrl ? `Resume: ${candidate.resumeUrl}\n` : ''}
${candidate.portfolioUrl ? `Portfolio: ${candidate.portfolioUrl}\n` : ''}Best regards,
${candidate.name}`;
  },
};