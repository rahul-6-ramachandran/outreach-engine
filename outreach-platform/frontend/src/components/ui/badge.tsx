import * as React from 'react';
import { cn } from '@/lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'outline' | 'success' | 'warning' | 'danger' | 'info' | 'purple';
}

export function Badge({ className, variant = 'default', children, ...props }: BadgeProps) {
  const variants = {
    default: 'bg-slate-100 text-slate-700 border-slate-200',
    outline: 'border border-slate-300 text-slate-700 bg-white',
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    warning: 'bg-amber-50 text-amber-700 border-amber-200',
    danger: 'bg-rose-50 text-rose-700 border-rose-200',
    info: 'bg-blue-50 text-blue-700 border-blue-200',
    purple: 'bg-purple-50 text-purple-700 border-purple-200',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium tracking-wide transition-colors',
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const upper = status.toUpperCase();

  switch (upper) {
    case 'SENT':
      return <Badge variant="success">Sent</Badge>;
    case 'APPROVED':
      return <Badge variant="info">Approved</Badge>;
    case 'DRAFT':
      return <Badge variant="default">Draft</Badge>;
    case 'SENDING':
      return (
        <Badge variant="purple" className="animate-pulse">
          <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-ping mr-0.5" />
          Sending…
        </Badge>
      );
    case 'FAILED':
      return <Badge variant="danger">Failed</Badge>;
    case 'UNKNOWN':
      return <Badge variant="warning">Unknown</Badge>;
    case 'CANCELLED':
      return <Badge variant="default" className="text-slate-500 line-through">Cancelled</Badge>;
    default:
      return <Badge variant="default">{status}</Badge>;
  }
}
