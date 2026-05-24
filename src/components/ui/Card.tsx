import { ReactNode } from 'react';
import { cn } from '../../utils/cn';

interface CardProps {
  children: ReactNode;
  className?: string;
  variant?: 'default' | 'glass' | 'gradient' | 'bordered';
  hover?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  onClick?: () => void;
}

export function Card({
  children,
  className,
  variant = 'default',
  hover = false,
  padding = 'md',
  onClick
}: CardProps) {
  const variants = {
    default: 'bg-surface-800/50 border border-surface-700/50',
    glass: 'glass',
    gradient: 'bg-gradient-to-br from-surface-800/80 to-surface-900/80 border border-surface-700/30',
    bordered: 'bg-surface-900/50 border-2 border-primary-500/20'
  };

  const paddings = {
    none: '',
    sm: 'p-3',
    md: 'p-5',
    lg: 'p-6'
  };

  return (
    <div
      onClick={onClick}
      className={cn(
        'rounded-xl backdrop-blur-sm',
        variants[variant],
        paddings[padding],
        hover && 'hover:border-primary-500/30 hover:shadow-lg hover:shadow-primary-500/5 transition-all duration-300',
        onClick && 'cursor-pointer',
        className
      )}
    >
      {children}
    </div>
  );
}

interface StatCardProps {
  title: string;
  value: string | number;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  icon: ReactNode;
  iconBg?: string;
}

export function StatCard({
  title,
  value,
  change,
  changeType = 'neutral',
  icon,
  iconBg = 'from-primary-500 to-primary-600'
}: StatCardProps) {
  const changeColors = {
    positive: 'text-accent-400',
    negative: 'text-danger-400',
    neutral: 'text-surface-400'
  };

  return (
    <Card variant="gradient" hover className="relative overflow-hidden">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-sm text-surface-400">{title}</p>
          <p className="text-2xl font-bold text-white">{value}</p>
          {change && (
            <p className={cn('text-xs font-medium', changeColors[changeType])}>
              {change}
            </p>
          )}
        </div>
        <div className={cn(
          'p-3 rounded-xl bg-gradient-to-br shadow-lg',
          iconBg
        )}>
          {icon}
        </div>
      </div>
      <div className="absolute -bottom-4 -right-4 w-24 h-24 rounded-full bg-gradient-to-br from-primary-500/10 to-transparent" />
    </Card>
  );
}
