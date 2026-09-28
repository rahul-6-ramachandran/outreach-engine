import { cn } from '@/lib/utils';

export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('animate-pulse rounded-md bg-slate-200/70', className)}
      {...props}
    />
  );
}

export function LoadingCard({ rows = 3 }: { rows?: number }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5 space-y-3">
      <Skeleton className="h-5 w-1/3" />
      <Skeleton className="h-4 w-2/3" />
      <div className="space-y-2 pt-2">
        {Array.from({ length: rows }).map((_, i) => (
          <Skeleton key={i} className="h-4 w-full" />
        ))}
      </div>
    </div>
  );
}

export function LoadingTable({ rows = 4 }: { rows?: number }) {
  return (
    <div className="w-full rounded-lg border border-slate-200 bg-white overflow-hidden">
      <div className="border-b border-slate-200 bg-slate-50/50 p-4">
        <Skeleton className="h-4 w-1/4" />
      </div>
      <div className="divide-y divide-slate-100 p-4 space-y-4">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center justify-between pt-2">
            <div className="space-y-1.5 w-1/2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
            <Skeleton className="h-7 w-20 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
