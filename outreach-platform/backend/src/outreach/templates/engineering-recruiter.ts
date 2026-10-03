import { OutreachTemplate } from '../outreach-draft.js';

export const engineeringRecruiterTemplate: OutreachTemplate = {
  strategy: 'ENGINEERING_RECRUITER',

  buildSubject: ({ roleTitle, companyName }) =>
    `Application for ${roleTitle} at ${companyName}`,

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

I came across the ${roleTitle} opportunity at ${companyName} and wanted to reach out directly.

I'm a ${candidate.headline} with ${candidate.experience} years of experience building production applications using ${skillText}.

I'd be interested in exploring whether my background could be a fit for the role.


Linkedin : https://www.linkedin.com/in/rahul6r432/

Github Portfolio: https://github.com/rahul-ramachandran-432

Github : https://github.com/rahul-6-ramachandran

Project (Hirescope) : https://switch-sync.vercel.app/

${jobUrl ? `Job posting: ${jobUrl}\n\n` : ''}I've attached my resume for reference.
${candidate.resumeUrl ? `Resume: ${candidate.resumeUrl}\n` : ''}
${candidate.portfolioUrl ? `Portfolio: ${candidate.portfolioUrl}\n` : ''}Best regards,
${candidate.name}`;
  },
};