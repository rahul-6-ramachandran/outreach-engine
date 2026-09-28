import * as React from 'react';
import { AlertCircle, AlertTriangle, CheckCircle2, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'info' | 'warning' | 'danger' | 'success';
  title?: string;
}

export function Alert({
  variant = 'info',
  title,
  children,
  className,
  ...props
}: AlertProps) {
  const icons = {
    info: <Info className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />,
    warning: <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />,
    danger: <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 shrink-0" />,
    success: <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />,
  };

  const variants = {
    info: 'bg-blue-50/70 border-blue-200 text-blue-900',
    warning: 'bg-amber-50/70 border-amber-200 text-amber-900',
    danger: 'bg-red-50/70 border-red-200 text-red-900',
    success: 'bg-emerald-50/70 border-emerald-200 text-emerald-900',
  };

  return (
    <div
      role="alert"
      className={cn(
        'flex gap-3 rounded-lg border p-3.5 text-xs leading-relaxed',
        variants[variant],
        className
      )}
      {...props}
    >
      {icons[variant]}
      <div className="space-y-0.5">
        {title && <h5 className="font-semibold">{title}</h5>}
        <div className="text-slate-700">{children}</div>
      </div>
    </div>
  );
}
