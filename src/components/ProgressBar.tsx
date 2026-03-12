interface Props {
  progress: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  color?: string;
}

export default function ProgressBar({ progress, size = 'md', showLabel = true, color }: Props) {
  const heights = { sm: 'h-1.5', md: 'h-2.5', lg: 'h-4' };
  const clamped = Math.min(100, Math.max(0, progress));

  const barColor = color
    ? undefined
    : clamped >= 80
      ? 'bg-status-done'
      : clamped >= 40
        ? 'bg-status-progress'
        : clamped > 0
          ? 'bg-gold'
          : 'bg-dark-border-light';

  return (
    <div className="flex items-center gap-3 w-full">
      <div className={`flex-1 bg-dark-border rounded-full overflow-hidden ${heights[size]}`}>
        <div
          className={`${barColor ?? ''} ${heights[size]} rounded-full transition-all duration-700 ease-out`}
          style={{
            width: `${clamped}%`,
            ...(color ? { backgroundColor: color } : {}),
          }}
        />
      </div>
      {showLabel && (
        <span className="font-mono text-sm font-semibold text-text-mid min-w-[3.5rem] text-right">
          {clamped}%
        </span>
      )}
    </div>
  );
}
