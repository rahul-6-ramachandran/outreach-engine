import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Users, FileEdit, FileCheck, Check } from 'lucide-react';
import { CompanyRoleForm } from './CompanyRoleForm';
import { ContactSelection } from './ContactSelection';
import { DraftComposer } from './DraftComposer';
import { OutreachReview } from './OutreachReview';
import {
  type Opportunity,
  type ContactMatch,
  type OutreachDraft,
} from './opportunities.types';
import { type OutreachRecord } from '../outreach/outreach.types';
import { cn } from '@/lib/utils';

export function NewOutreachPage({
  onAddSessionRecord,
}: {
  onAddSessionRecord?: (record: OutreachRecord) => void;
}) {
  const navigate = useNavigate();
  const [step, setStep] = React.useState<1 | 2 | 3 | 4>(1);
  const [opportunity, setOpportunity] = React.useState<Opportunity | null>(null);
  const [selectedMatch, setSelectedMatch] = React.useState<ContactMatch | null>(null);
  const [draft, setDraft] = React.useState<OutreachDraft | null>(null);

  const steps = [
    { number: 1, label: 'Company & Role', icon: Building2 },
    { number: 2, label: 'Select Contact', icon: Users },
    { number: 3, label: 'Draft Review', icon: FileEdit },
    { number: 4, label: 'Final Inspection', icon: FileCheck },
  ];

  return (
    <div className="space-y-6">
      {/* Stepper Progress Bar */}
      <div className="max-w-4xl mx-auto bg-white border border-slate-200 rounded-lg p-3 shadow-sm">
        <div className="flex items-center justify-between">
          {steps.map((s, idx) => {
            const isCompleted = step > s.number;
            const isCurrent = step === s.number;

            return (
              <React.Fragment key={s.number}>
                <div className="flex items-center gap-2">
                  <div
                    className={cn(
                      'w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold transition-colors',
                      isCompleted
                        ? 'bg-emerald-600 text-white'
                        : isCurrent
                        ? 'bg-indigo-600 text-white ring-2 ring-indigo-100'
                        : 'bg-slate-100 text-slate-400'
                    )}
                  >
                    {isCompleted ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : s.number}
                  </div>
                  <span
                    className={cn(
                      'text-xs hidden sm:inline font-medium',
                      isCurrent ? 'text-slate-900 font-semibold' : 'text-slate-500'
                    )}
                  >
                    {s.label}
                  </span>
                </div>
                {idx < steps.length - 1 && (
                  <div
                    className={cn(
                      'flex-1 h-0.5 mx-3',
                      step > idx + 1 ? 'bg-emerald-600' : 'bg-slate-200'
                    )}
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Wizard Steps */}
      {step === 1 && (
        <CompanyRoleForm
          initialValues={
            opportunity
              ? {
                  companyName: opportunity.companyName,
                  roleTitle: opportunity.roleTitle,
                  location: opportunity.location || undefined,
                  jobUrl: opportunity.jobUrl || undefined,
                  jobDescription: opportunity.jobDescription || undefined,
                }
              : undefined
          }
          onSuccess={(opp) => {
            setOpportunity(opp);
            setStep(2);
          }}
           onUseExisting={(existing) => {
            navigate(`/saved-opportunities/${existing.id}/matches`);
          }}
        />
      )}

      {step === 2 && opportunity && (
        <ContactSelection
          opportunity={opportunity}
          selectedMatch={selectedMatch}
          onSelectMatch={(match) => setSelectedMatch(match)}
          onBack={() => setStep(1)}
          onNext={() => {
            if (selectedMatch) setStep(3);
          }}
        />
      )}

      {step === 3 && opportunity && selectedMatch && (
        <DraftComposer
          opportunity={opportunity}
          match={selectedMatch}
          onBack={() => setStep(2)}
          onNext={(reviewedDraft) => {
            setDraft(reviewedDraft);
            setStep(4);
          }}
        />
      )}

      {step === 4 && opportunity && selectedMatch && draft && (
        <OutreachReview
          opportunity={opportunity}
          match={selectedMatch}
          draft={draft}
          onBack={() => setStep(3)}
          onSaveToSessionHistory={(record) => {
            if (onAddSessionRecord) onAddSessionRecord(record);
          }}
        />
      )}
    </div>
  );
}
