interface ProgressBarProps {
  progress: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export default function ProgressBar({ progress, size = 'md', showLabel = true }: ProgressBarProps) {
  const heights = { sm: 'h-2', md: 'h-3', lg: 'h-5' };
  const clamped = Math.min(100, Math.max(0, progress));
  const color =
    clamped >= 80 ? 'bg-emerald-500' : clamped >= 40 ? 'bg-blue-500' : 'bg-amber-500';

  return (
    <div className="flex items-center gap-3 w-full">
      <div className={`flex-1 bg-gray-200 rounded-full overflow-hidden ${heights[size]}`}>
        <div
          className={`${color} ${heights[size]} rounded-full transition-all duration-500`}
          style={{ width: `${clamped}%` }}
        />
      </div>
      {showLabel && (
        <span className="text-sm font-semibold text-gray-600 min-w-[3rem] text-right">
          {clamped}%
        </span>
      )}
    </div>
  );
}
