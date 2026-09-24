import {
  buildOpportunityRoleProfile,
} from '../src/opportunities/matching/opportunity-role.js';

const roles = [
  'Backend Engineer',
  'Senior Back-End Developer',
  'Frontend Engineer',
  'React Frontend Developer',
  'Full Stack Engineer',
  'DevOps Engineer',
  'Site Reliability Engineer',
  'Data Engineer',
  'Machine Learning Engineer',
  'Android Developer',
  'QA Automation Engineer',
  'Application Security Engineer',
  'Product Manager',
  'Technical Writer',
];

for (const role of roles) {
  const profile = buildOpportunityRoleProfile(role);

  console.log(
    `${role.padEnd(35)} → ${profile.roleFamily}`,
  );
}