import { OutreachTemplate } from '../outreach-draft.js';

export const technicalHiringManagerTemplate: OutreachTemplate = {
  strategy: 'TECHNICAL_HIRING_MANAGER',

  buildSubject: ({ roleTitle, companyName }) =>
    `${roleTitle} at ${companyName}`,

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

I came across the ${roleTitle} opening at ${companyName} and wanted to reach out directly.

I have ${candidate.experience} years of experience building production ${candidate.expertise} systems with ${skillText}, and I'm particularly interested in the engineering work behind this role.

If you're the right person to speak with regarding the position, I'd be glad to share more about my experience.

${jobUrl ? `Job posting: ${jobUrl}\n\n` : ''}
${candidate.resumeUrl ? `Resume: ${candidate.resumeUrl}\n` : ''}


Linkedin : https://www.linkedin.com/in/rahul6r432/

Github Portfolio: https://github.com/rahul-ramachandran-432

Github : https://github.com/rahul-6-ramachandran

Project (Hirescope) : https://switch-sync.vercel.app/

${candidate.portfolioUrl ? `Portfolio: ${candidate.portfolioUrl}\n` : ''}
Best regards,
${candidate.name}`;
  },
};