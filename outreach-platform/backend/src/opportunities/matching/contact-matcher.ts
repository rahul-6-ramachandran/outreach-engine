import {
  OpportunityRoleProfile,
} from './opportunity-role.js';

export interface MatchableContact {
  id: number;
  name: string | null;
  identityConfidence: string;
  email: string | null;
  emailType: string | null;
  title: string | null;
  roleFamily: string | null;
}



export interface ContactMatchResult {
  id: number;
  name: string | null;
  title: string | null;
  roleFamily: string | null;
  email: string | null;
  emailType: string | null;
  score: number;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  eligible: boolean;
  reasons: string[];
}

export class ContactMatcher {
  match(
    contact: MatchableContact,
    profile: OpportunityRoleProfile,
  ): ContactMatchResult {
    let score = 0;
    const reasons: string[] = [];

    /*
     * Hiring relevance
     *
     * This is the most important signal.
     */
    switch (contact.roleFamily) {
      case 'HIRING_MANAGER':
        score += 35;
        reasons.push('Hiring manager');
        break;

      case 'RECRUITER':
        score += 30;
        reasons.push('Recruiter');
        break;

      case 'ENGINEERING_LEADERSHIP':
        score += 28;
        reasons.push('Engineering leadership');
        break;

      case 'HR':
        score += 20;
        reasons.push('HR contact');
        break;

      case 'LEADERSHIP':
        score += 15;
        reasons.push('Leadership');
        break;

      case 'FOUNDER':
        score += 15;
        reasons.push('Founder');
        break;
    }

    /*
     * Title relevance
     */
    const title = contact.title?.toLowerCase() ?? '';

    if (profile.backendRole && this.isBackendRelevant(title)) {
      score += 20;
      reasons.push('Backend/technical relevance');
    } else if (
      profile.engineeringRole &&
      this.isEngineeringRelevant(title)
    ) {
      score += 15;
      reasons.push('Engineering/technical relevance');
    }

    /*
     * Email quality
     *
     * This is deliberately a small signal.
     * A good email does NOT make someone a hiring contact.
     */
   switch (contact.emailType) {
    case 'NAMED_WORK':
        score += 3;
        reasons.push('Named work email');
        break;

    case 'GENERIC_RECRUITMENT':
        score += 2;
        reasons.push('Recruitment email');
        break;

    case 'PERSONAL_PROVIDER':
        break;
    }

    /*
     * Identity confidence
     */
    if (contact.identityConfidence === 'HIGH') {
      score += 5;
      reasons.push('High identity confidence');
    }

    /*
     * Confidence tier
     */
    const confidence = this.getConfidence(
      contact,
      score,
      profile,
    );

const eligible =
  score >= 20 &&
  Boolean(contact.email?.trim());
  
    return {
      id: contact.id,
      name: contact.name,
      title: contact.title,
      roleFamily: contact.roleFamily,
      email: contact.email,
      emailType: contact.emailType,
      score,
      confidence,
      eligible,
      reasons,
    };
  }

  private getConfidence(
    contact: MatchableContact,
    score: number,
    profile: OpportunityRoleProfile,
  ): 'HIGH' | 'MEDIUM' | 'LOW' {
    if (
      contact.roleFamily === 'HIRING_MANAGER' ||
      contact.roleFamily === 'RECRUITER' ||
      contact.roleFamily === 'ENGINEERING_LEADERSHIP'
    ) {
      return 'HIGH';
    }

    if (
      profile.engineeringRole &&
      score >= 40
    ) {
      return 'MEDIUM';
    }

    if (
      contact.roleFamily === 'HR' ||
      contact.roleFamily === 'LEADERSHIP'
    ) {
      return 'MEDIUM';
    }

    return 'LOW';
  }

  private isBackendRelevant(title: string): boolean {
    const keywords = [
      'backend',
      'back-end',
      'software engineer',
      'software engineering',
      'platform',
      'api',
      'server',
      'technical',
      'engineering',
      'developer',
      'development',
    ];

    return keywords.some((keyword) =>
      title.includes(keyword),
    );
  }

  private isEngineeringRelevant(title: string): boolean {
    const keywords = [
      'engineer',
      'engineering',
      'developer',
      'development',
      'software',
      'technology',
      'technical',
      'platform',
      'devops',
    ];

    return keywords.some((keyword) =>
      title.includes(keyword),
    );
  }
}