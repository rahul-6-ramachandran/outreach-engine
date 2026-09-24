export type OpportunityRoleFamily =
  | 'BACKEND'
  | 'FRONTEND'
  | 'FULLSTACK'
  | 'DEVOPS'
  | 'DATA'
  | 'MOBILE'
  | 'QA'
  | 'SECURITY'
  | 'PRODUCT'
  | 'OTHER';

export interface OpportunityRoleProfile {
  normalizedTitle: string;
  keywords: string[];

  roleFamily: OpportunityRoleFamily;

  engineeringRole: boolean;
  backendRole: boolean;
  hiringRelevant: boolean;
}

function normalizeRoleTitle(roleTitle: string): string {
  return roleTitle
    .toLowerCase()
    .replace(/[-_/]+/g, ' ')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function containsAny(
  title: string,
  keywords: string[],
): boolean {
  return keywords.some((keyword) => title.includes(keyword));
}

function classifyRoleFamily(
  normalizedTitle: string,
): OpportunityRoleFamily {
  /*
   * Order matters.
   *
   * More specific families must be checked before
   * broader families such as DATA or ENGINEERING.
   */

  if (
    containsAny(normalizedTitle, [
      'backend',
      'back end',
      'server side',
      'api engineer',
    ])
  ) {
    return 'BACKEND';
  }

  if (
    containsAny(normalizedTitle, [
      'frontend',
      'front end',
      'ui engineer',
      'web frontend',
    ])
  ) {
    return 'FRONTEND';
  }

  if (
    containsAny(normalizedTitle, [
      'full stack',
      'fullstack',
      'full-stack',
    ])
  ) {
    return 'FULLSTACK';
  }

  if (
    containsAny(normalizedTitle, [
      'devops',
      'site reliability',
      'sre',
      'platform engineer',
      'infrastructure engineer',
      'cloud engineer',
      'release engineer',
    ])
  ) {
    return 'DEVOPS';
  }

  if (
    containsAny(normalizedTitle, [
      'machine learning',
      'ml engineer',
      'data engineer',
      'data scientist',
      'analytics engineer',
      'ai engineer',
      'artificial intelligence',
    ])
  ) {
    return 'DATA';
  }

  if (
    containsAny(normalizedTitle, [
      'mobile',
      'ios',
      'android',
      'react native',
      'flutter',
    ])
  ) {
    return 'MOBILE';
  }

  if (
    containsAny(normalizedTitle, [
      'qa',
      'quality assurance',
      'test engineer',
      'automation engineer',
      'software tester',
    ])
  ) {
    return 'QA';
  }

  if (
    containsAny(normalizedTitle, [
      'security engineer',
      'application security',
      'cybersecurity',
      'cyber security',
      'security analyst',
      'information security',
    ])
  ) {
    return 'SECURITY';
  }

  if (
    containsAny(normalizedTitle, [
      'product manager',
      'product owner',
      'product analyst',
      'product designer',
    ])
  ) {
    return 'PRODUCT';
  }

  return 'OTHER';
}

export function buildOpportunityRoleProfile(
  roleTitle: string,
): OpportunityRoleProfile {
  const normalizedTitle = normalizeRoleTitle(roleTitle);

  const keywords = normalizedTitle.split(' ');

  const backendKeywords = [
    'backend',
    'back end',
    'server',
    'api',
  ];

  const engineeringKeywords = [
    'engineer',
    'engineering',
    'developer',
    'development',
    'software',
    'technology',
    'technical',
    'platform',
  ];

  const hiringKeywords = [
    'engineer',
    'engineering',
    'developer',
    'development',
    'software',
    'backend',
    'frontend',
    'fullstack',
    'devops',
    'data',
    'mobile',
    'qa',
    'security',
    'product',
  ];

  return {
    normalizedTitle,
    keywords,

    roleFamily: classifyRoleFamily(normalizedTitle),

    backendRole: containsAny(
      normalizedTitle,
      backendKeywords,
    ),

    engineeringRole: containsAny(
      normalizedTitle,
      engineeringKeywords,
    ),

    hiringRelevant: containsAny(
      normalizedTitle,
      hiringKeywords,
    ),
  };
}