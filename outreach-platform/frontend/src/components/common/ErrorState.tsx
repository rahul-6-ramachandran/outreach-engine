import { AlertCircle, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface ErrorStateProps {
  title?: string;
  message?: string;
  statusCode?: number;
  onRetry?: () => void;
}

export function ErrorState({
  title = 'Something went wrong',
  message = 'An unexpected error occurred while loading data.',
  statusCode,
  onRetry,
}: ErrorStateProps) {
  return (
    <div className="flex min-h-[240px] flex-col items-center justify-center rounded-xl border border-red-200 bg-red-50/30 p-8 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600 mb-3">
        <AlertCircle className="h-6 w-6 stroke-[1.75]" />
      </div>
      <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
      <p className="mt-1 max-w-md text-xs text-slate-600">
        {message}
        {statusCode && <span className="block mt-0.5 text-slate-400 font-mono">Status code: {statusCode}</span>}
      </p>
      {onRetry && (
        <Button size="sm" variant="outline" className="mt-4 gap-1.5" onClick={onRetry}>
          <RotateCcw className="w-3.5 h-3.5" />
          Try Again
        </Button>
      )}
    </div>
  );
}
