import { OpportunityRoleFamily } from '../opportunities/matching/opportunity-role.js';

export type OutreachStrategy =
  | 'ENGINEERING_RECRUITER'
  | 'GENERAL_RECRUITER'
  | 'TECHNICAL_HIRING_MANAGER'
  | 'ENGINEERING_LEADERSHIP'
  | 'HR_GENERAL'
  | 'FOUNDER_GENERAL'
  | 'GENERAL_PROFESSIONAL';

interface StrategyInput {
  roleFamily: OpportunityRoleFamily;
  contactRoleFamily: string | null;
}

export function determineOutreachStrategy(
  input: StrategyInput,
): OutreachStrategy {
  const { roleFamily, contactRoleFamily } = input;

  const engineeringRoleFamilies: OpportunityRoleFamily[] = [
    'BACKEND',
    'FRONTEND',
    'FULLSTACK',
    'DEVOPS',
    'DATA',
    'MOBILE',
    'QA',
    'SECURITY',
  ];

  const isEngineeringRole =
    engineeringRoleFamilies.includes(roleFamily);

  switch (contactRoleFamily) {
    case 'HIRING_MANAGER':
      return isEngineeringRole
        ? 'TECHNICAL_HIRING_MANAGER'
        : 'GENERAL_PROFESSIONAL';

    case 'RECRUITER':
      return isEngineeringRole
        ? 'ENGINEERING_RECRUITER'
        : 'GENERAL_RECRUITER';

    case 'ENGINEERING_LEADERSHIP':
      return 'ENGINEERING_LEADERSHIP';

    case 'HR':
      return 'HR_GENERAL';

    case 'FOUNDER':
    case 'LEADERSHIP':
      return 'FOUNDER_GENERAL';

    default:
      return 'GENERAL_PROFESSIONAL';
  }
}