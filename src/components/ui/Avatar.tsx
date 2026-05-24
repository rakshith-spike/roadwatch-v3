import { cn } from '../../utils/cn';

interface AvatarProps {
  src?: string;
  name: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  status?: 'online' | 'offline' | 'busy';
  className?: string;
}

export function Avatar({
  src,
  name,
  size = 'md',
  status,
  className
}: AvatarProps) {
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const sizes = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
    xl: 'w-16 h-16 text-lg'
  };

  const statusSizes = {
    sm: 'w-2 h-2',
    md: 'w-2.5 h-2.5',
    lg: 'w-3 h-3',
    xl: 'w-4 h-4'
  };

  const statusColors = {
    online: 'bg-accent-400',
    offline: 'bg-surface-500',
    busy: 'bg-danger-400'
  };

  return (
    <div className={cn('relative inline-flex', className)}>
      {src ? (
        <img
          src={src}
          alt={name}
          className={cn(
            'rounded-full object-cover ring-2 ring-surface-700',
            sizes[size]
          )}
        />
      ) : (
        <div
          className={cn(
            'rounded-full bg-gradient-to-br from-primary-500 to-primary-600',
            'flex items-center justify-center font-semibold text-white',
            'ring-2 ring-surface-700',
            sizes[size]
          )}
        >
          {initials}
        </div>
      )}
      {status && (
        <span
          className={cn(
            'absolute bottom-0 right-0 rounded-full ring-2 ring-surface-900',
            statusSizes[size],
            statusColors[status]
          )}
        />
      )}
    </div>
  );
}

interface AvatarGroupProps {
  avatars: { name: string; src?: string }[];
  max?: number;
  size?: 'sm' | 'md' | 'lg';
}

export function AvatarGroup({ avatars, max = 4, size = 'md' }: AvatarGroupProps) {
  const visibleAvatars = avatars.slice(0, max);
  const remainingCount = avatars.length - max;

  const overlapSizes = {
    sm: '-ml-2',
    md: '-ml-3',
    lg: '-ml-4'
  };

  return (
    <div className="flex items-center">
      {visibleAvatars.map((avatar, index) => (
        <div
          key={index}
          className={cn(index > 0 && overlapSizes[size])}
          style={{ zIndex: visibleAvatars.length - index }}
        >
          <Avatar {...avatar} size={size} />
        </div>
      ))}
      {remainingCount > 0 && (
        <div
          className={cn(
            'rounded-full bg-surface-700 flex items-center justify-center',
            'text-surface-300 font-medium ring-2 ring-surface-900',
            overlapSizes[size],
            size === 'sm' ? 'w-8 h-8 text-xs' : size === 'md' ? 'w-10 h-10 text-sm' : 'w-12 h-12 text-base'
          )}
        >
          +{remainingCount}
        </div>
      )}
    </div>
  );
}
