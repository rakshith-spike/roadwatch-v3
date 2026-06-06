import { ReactNode } from 'react';
import { cn } from '../../utils/cn';

interface BadgeProps {
  children: ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'outline';
  size?: 'sm' | 'md';
  dot?: boolean;
  pulse?: boolean;
}

export function Badge({
  children,
  variant = 'default',
  size = 'sm',
  dot = false,
  pulse = false
}: BadgeProps) {
  const variants = {
    default: 'bg-surface-700 text-surface-200',
    success: 'bg-accent-500/20 text-accent-400 border border-accent-500/30',
    warning: 'bg-warning-500/20 text-warning-400 border border-warning-500/30',
    danger: 'bg-danger-500/20 text-danger-400 border border-danger-500/30',
    info: 'bg-primary-500/20 text-primary-400 border border-primary-500/30',
    outline: 'border border-surface-600 text-surface-300'
  };

  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm'
  };

  const dotColors = {
    default: 'bg-surface-400',
    success: 'bg-accent-400',
    warning: 'bg-warning-400',
    danger: 'bg-danger-400',
    info: 'bg-primary-400',
    outline: 'bg-surface-400'
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 font-medium rounded-full',
        variants[variant],
        sizes[size]
      )}
    >
      {dot && (
        <span className={cn(
          'w-1.5 h-1.5 rounded-full',
          dotColors[variant],
          pulse && 'animate-pulse'
        )} />
      )}
      {children}
    </span>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const statusConfig: Record<string, { variant: BadgeProps['variant']; label: string }> = {
    pending: { variant: 'warning', label: 'Pending' },
    verified: { variant: 'info', label: 'Verified' },
    assigned: { variant: 'info', label: 'Assigned' },
    in_progress: { variant: 'warning', label: 'In Progress' },
    resolved: { variant: 'success', label: 'Resolved' },
    validation_pending: { variant: 'info', label: 'Verification Requested' },
    closed: { variant: 'success', label: 'Closed' },
    rejected: { variant: 'danger', label: 'Rejected' },
    completed: { variant: 'success', label: 'Completed' },
    delayed: { variant: 'danger', label: 'Delayed' },
    planned: { variant: 'outline', label: 'Planned' },
    on_hold: { variant: 'warning', label: 'On Hold' }
  };

  const config = statusConfig[status] || { variant: 'default', label: status };

  return (
    <Badge variant={config.variant} dot pulse={status === 'in_progress'}>
      {config.label}
    </Badge>
  );
}

export function SeverityBadge({ severity }: { severity: string }) {
  const severityConfig: Record<string, { variant: BadgeProps['variant']; label: string }> = {
    low: { variant: 'success', label: 'Low' },
    medium: { variant: 'warning', label: 'Medium' },
    high: { variant: 'danger', label: 'High' },
    critical: { variant: 'danger', label: 'Critical' }
  };

  const config = severityConfig[severity] || { variant: 'default', label: severity };

  return <Badge variant={config.variant}>{config.label}</Badge>;
}
