import { InputHTMLAttributes, TextareaHTMLAttributes, ReactNode, forwardRef } from 'react';
import { cn } from '../../utils/cn';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: ReactNode;
  rightIcon?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, icon, rightIcon, className, ...props }, ref) => {
    return (
      <div className="space-y-1.5">
        {label && (
          <label className="block text-sm font-medium text-surface-300">
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            className={cn(
              'w-full bg-surface-800/50 border border-surface-700 rounded-lg',
              'text-white placeholder-surface-500',
              'focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500',
              'transition-colors duration-200',
              icon ? 'pl-10' : 'pl-4',
              rightIcon ? 'pr-10' : 'pr-4',
              'py-2.5',
              error && 'border-danger-500 focus:border-danger-500 focus:ring-danger-500',
              className
            )}
            {...props}
          />
          {rightIcon && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400">
              {rightIcon}
            </div>
          )}
        </div>
        {error && (
          <p className="text-sm text-danger-400">{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, className, ...props }, ref) => {
    return (
      <div className="space-y-1.5">
        {label && (
          <label className="block text-sm font-medium text-surface-300">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          className={cn(
            'w-full bg-surface-800/50 border border-surface-700 rounded-lg',
            'text-white placeholder-surface-500',
            'focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500',
            'transition-colors duration-200',
            'px-4 py-2.5 min-h-[100px] resize-none',
            error && 'border-danger-500 focus:border-danger-500 focus:ring-danger-500',
            className
          )}
          {...props}
        />
        {error && (
          <p className="text-sm text-danger-400">{error}</p>
        )}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';

interface SelectProps extends InputHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, options, className, ...props }, ref) => {
    return (
      <div className="space-y-1.5">
        {label && (
          <label className="block text-sm font-medium text-surface-300">
            {label}
          </label>
        )}
        <select
          ref={ref}
          className={cn(
            'w-full bg-surface-800/50 border border-surface-700 rounded-lg',
            'text-white',
            'focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500',
            'transition-colors duration-200',
            'px-4 py-2.5',
            error && 'border-danger-500 focus:border-danger-500 focus:ring-danger-500',
            className
          )}
          {...props}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value} className="bg-surface-800">
              {option.label}
            </option>
          ))}
        </select>
        {error && (
          <p className="text-sm text-danger-400">{error}</p>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';
