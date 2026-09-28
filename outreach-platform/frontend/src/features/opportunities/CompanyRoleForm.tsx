import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import { ArrowRight, Building2 } from 'lucide-react';
import { opportunitiesApi } from './opportunities.api';
import { type Opportunity } from './opportunities.types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Alert } from '@/components/ui/alert';
import { getErrorMessage } from '@/types/api.types';

const opportunitySchema = z.object({
  companyName: z.string().min(1, 'Company name is required').max(100),
  roleTitle: z.string().min(1, 'Target role title is required').max(100),
  location: z.string().max(100).optional(),
  jobUrl: z.string().url('Must be a valid URL (e.g. https://...)').or(z.literal('')).optional(),
  jobDescription: z.string().max(2000, 'Maximum 2,000 characters').optional(),
});

type OpportunityFormValues = z.infer<typeof opportunitySchema>;

interface CompanyRoleFormProps {
  onSuccess: (opportunity: Opportunity) => void;
  onUseExisting: (opportunity: Opportunity) => void;
  initialValues?: Partial<OpportunityFormValues>;
}

export function CompanyRoleForm({ onSuccess, initialValues, onUseExisting}: CompanyRoleFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<OpportunityFormValues>({
    resolver: zodResolver(opportunitySchema),
    defaultValues: {
      companyName: initialValues?.companyName || '',
      roleTitle: initialValues?.roleTitle || '',
      location: initialValues?.location || '',
      jobUrl: initialValues?.jobUrl || '',
      jobDescription: initialValues?.jobDescription || '',
    },
  });


  const [pendingValues, setPendingValues] =
  useState<OpportunityFormValues | null>(null);

const [duplicate, setDuplicate] =
  useState<Opportunity | null>(null);

const {
  data: existingOpportunities,
  isLoading: isLoadingOpportunities,
  isError: isOpportunityQueryError,
} = useQuery({
  queryKey: ['opportunities'],
  queryFn: opportunitiesApi.getAll,
});

const normalize = (value: string) =>
  value.toLowerCase().trim().replace(/\s+/g, ' ');

  const createMutation = useMutation({
    mutationFn: (values: OpportunityFormValues) => {
      return opportunitiesApi.create({
        companyName: values.companyName.trim(),
        roleTitle: values.roleTitle.trim(),
        location: values.location?.trim() || undefined,
        jobUrl: values.jobUrl?.trim() || undefined,
        jobDescription: values.jobDescription?.trim() || undefined,
      });
    },
    onSuccess: (opportunity) => {
      onSuccess(opportunity);
    },
  });

 const onSubmit = (values: OpportunityFormValues) => {
  if (isLoadingOpportunities || isOpportunityQueryError) {
    return;
  }

  const companyName = normalize(values.companyName);
  const roleTitle = normalize(values.roleTitle);

  const existing = existingOpportunities?.find(
    (item) =>
      normalize(item.companyName) === companyName &&
      normalize(item.roleTitle) === roleTitle
  );

  if (existing) {
    setDuplicate(existing);
    setPendingValues(values);
    return;
  }

  setDuplicate(null);
  setPendingValues(null);
  createMutation.mutate(values);
};

  return (
    <Card className="max-w-2xl mx-auto shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="w-5 h-5 text-indigo-600" />
          <span>Target Company & Role</span>
        </CardTitle>
        <CardDescription>
          Specify the target company and position. The local matching engine will query relevant company contacts from your local database.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {createMutation.isError && (
            <Alert variant="danger">
              {getErrorMessage(createMutation.error, 'Failed to create opportunity. Ensure backend is running.')}
            </Alert>
          )}
          {duplicate && (
  <Alert variant="danger">
    <div className="space-y-3">
      <p className="font-semibold">
        This company and role already exist.
      </p>

      <p>
        Existing opportunity #{duplicate.id} —{' '}
        {Number(duplicate.matchCount) || 0} saved matches.
      </p>

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          onClick={() => onUseExisting(duplicate)}
        >
          Use Existing Opportunity
        </Button>

        <Button
          type="button"
          variant="outline"
          disabled={!pendingValues || createMutation.isPending}
          onClick={() => {
            if (!pendingValues) return;

            setDuplicate(null);

            createMutation.mutate(pendingValues);
            setPendingValues(null);
          }}
        >
          Create Separate Opportunity
        </Button>
      </div>
    </div>
  </Alert>
)}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <Input
                label="Company Name *"
                placeholder="e.g. Acme Corp"
                {...register('companyName')}
                error={errors.companyName?.message}
                disabled={createMutation.isPending}
              />
            </div>
            <div className="relative">
              <Input
                label="Target Role *"
                placeholder="e.g. Senior Backend Engineer"
                {...register('roleTitle')}
                error={errors.roleTitle?.message}
                disabled={createMutation.isPending}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Input
                label="Location (Optional)"
                placeholder="e.g. San Francisco, CA or Remote"
                {...register('location')}
                error={errors.location?.message}
                disabled={createMutation.isPending}
              />
            </div>
            <div>
              <Input
                label="Job Posting URL (Optional)"
                placeholder="https://company.com/careers/..."
                {...register('jobUrl')}
                error={errors.jobUrl?.message}
                disabled={createMutation.isPending}
              />
            </div>
          </div>

          <div>
            <Textarea
              label="Job Description / Context (Optional)"
              placeholder="Paste key responsibilities or context to help calibrate outreach draft..."
              rows={4}
              {...register('jobDescription')}
              error={errors.jobDescription?.message}
              disabled={createMutation.isPending}
              showCount
              maxLength={2000}
            />
          </div>

          <div className="flex justify-end pt-3 border-t border-slate-100">
            <Button
              type="submit"
              isLoading={createMutation.isPending}
              disabled={isLoadingOpportunities || isOpportunityQueryError}
              className="gap-2"
            >
              <span>Find Matching Contacts</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
