export interface ContactRoleRecord {
  title: string;
  roleFamily: string;
}

const ROLE_PRIORITY: Record<string, number> = {
  HIRING_MANAGER: 1,
  RECRUITER: 2,
  ENGINEERING_LEADERSHIP: 3,
  HR: 4,
  LEADERSHIP: 5,
  FOUNDER: 6,
  UNKNOWN: 7,
};

export function resolveEffectiveContactRole(
  roles: ContactRoleRecord[],
): ContactRoleRecord | null {
  if (roles.length === 0) {
    return null;
  }

  return [...roles].sort((a, b) => {
    const priorityA = ROLE_PRIORITY[a.roleFamily] ?? 99;
    const priorityB = ROLE_PRIORITY[b.roleFamily] ?? 99;

    if (priorityA !== priorityB) {
      return priorityA - priorityB;
    }

    return a.title.localeCompare(b.title);
  })[0];
}