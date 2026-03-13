import { getAvatarColor } from '../lib/employees';
import type { Employee } from '../lib/employees';

interface Props {
  employee?: Employee | null;
  name?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  showTooltip?: boolean;
}

const SIZES = {
  xs: 'w-5 h-5 text-[8px]',
  sm: 'w-6 h-6 text-[9px]',
  md: 'w-7 h-7 text-[10px]',
  lg: 'w-9 h-9 text-xs',
};

export default function Avatar({ employee, name, size = 'md', showTooltip = true }: Props) {
  const displayName = employee?.name ?? name ?? '';
  const avatarUrl = employee?.avatar_url;
  const initial = displayName.charAt(0).toUpperCase();
  const color = getAvatarColor(displayName);
  const sizeClass = SIZES[size];

  if (!displayName) {
    return (
      <div className={`${sizeClass} rounded-full border border-dashed border-dark-border-light flex items-center justify-center text-text-dim`}>
        <span>+</span>
      </div>
    );
  }

  return (
    <div
      className={`${sizeClass} rounded-full flex items-center justify-center font-bold text-white shrink-0 cursor-default relative group`}
      style={{ backgroundColor: avatarUrl ? undefined : color }}
      title={showTooltip ? displayName : undefined}
    >
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt={displayName}
          className={`${sizeClass} rounded-full object-cover`}
        />
      ) : (
        initial
      )}
      {showTooltip && (
        <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-dark-bg border border-dark-border rounded-md px-2 py-0.5 text-[10px] text-text-bright whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
          {displayName}
        </div>
      )}
    </div>
  );
}
