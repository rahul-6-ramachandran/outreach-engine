import * as React from 'react';
import { cn } from '@/lib/utils';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
  showCount?: boolean;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, helperText, showCount, maxLength, id, value, ...props }, ref) => {
    const textareaId = id || React.useId();
    const currentLength = typeof value === 'string' ? value.length : 0;

    return (
      <div className="w-full space-y-1">
        <div className="flex items-center justify-between">
          {label && (
            <label htmlFor={textareaId} className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
              {label}
            </label>
          )}
          {showCount && maxLength && (
            <span className="text-xs text-slate-400">
              {currentLength} / {maxLength}
            </span>
          )}
        </div>
        <textarea
          id={textareaId}
          ref={ref}
          value={value}
          maxLength={maxLength}
          className={cn(
            'flex min-h-[100px] w-full rounded-md border bg-white p-3 text-sm shadow-sm transition-colors',
            'placeholder:text-slate-400',
            'focus:outline-none focus:ring-2 focus:ring-offset-0',
            error
              ? 'border-red-400 text-red-900 focus:border-red-500 focus:ring-red-200'
              : 'border-slate-300 text-slate-900 focus:border-indigo-500 focus:ring-indigo-100',
            'disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500',
            className
          )}
          {...props}
        />
        {error ? (
          <p className="text-xs text-red-600 mt-1 font-medium">{error}</p>
        ) : helperText ? (
          <p className="text-xs text-slate-500 mt-1">{helperText}</p>
        ) : null}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';
