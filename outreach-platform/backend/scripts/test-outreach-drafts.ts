import {
  determineOutreachStrategy,
} from '../src/outreach/outreach-strategy.js';

import {
  renderOutreachDraft,
} from '../src/outreach/outreach-template.js';

import {
  buildOpportunityRoleProfile,
} from '../src/opportunities/matching/opportunity-role.js';

const opportunity = {
  companyName: 'IBM',
  roleTitle: 'Backend Engineer',
  jobUrl: 'https://example.com/jobs/backend-engineer',
};

const contacts = [
  {
    firstName: 'Alex',
    roleFamily: 'RECRUITER',
  },
  {
    firstName: 'Sarah',
    roleFamily: 'HIRING_MANAGER',
  },
  {
    firstName: 'Michael',
    roleFamily: 'HR',
  },
  {
    firstName: 'David',
    roleFamily: 'ENGINEERING_LEADERSHIP',
  },
  {
    firstName: 'Unknown',
    roleFamily: 'UNKNOWN',
  },
];

const roleProfile = buildOpportunityRoleProfile(
  opportunity.roleTitle,
);

console.log('Role family:', roleProfile.roleFamily);
console.log('');

for (const contact of contacts) {
  const strategy = determineOutreachStrategy({
    roleFamily: roleProfile.roleFamily,
    contactRoleFamily: contact.roleFamily,
  });

  const draft = renderOutreachDraft({
  firstName: contact.firstName,
  companyName: opportunity.companyName,
  roleTitle: opportunity.roleTitle,
  jobUrl: opportunity.jobUrl,
  strategy,
  candidate: {
    name: 'Rahul',
    headline: 'backend-focused Software Engineer',
    experience: '2+',
    expertise : "Backend",
    skills: [
      'Node.js',
      'NestJS',
      'TypeScript',
      'PostgreSQL',
    ],
  },
});

  console.log('='.repeat(70));
  console.log('Contact:', contact.firstName);
  console.log('Contact role:', contact.roleFamily);
  console.log('Strategy:', strategy);
  console.log('Subject:', draft.subject);
  console.log('');
  console.log(draft.body);
  console.log('');
}