import type { TaskStatus } from '../types';

const config: Record<TaskStatus, { bg: string; text: string; label: string; icon: string }> = {
  done:        { bg: 'bg-status-done/15', text: 'text-status-done', label: '완료', icon: '✅' },
  in_progress: { bg: 'bg-status-progress/15', text: 'text-status-progress', label: '진행중', icon: '🔄' },
  pending:     { bg: 'bg-status-pending/15', text: 'text-status-pending', label: '대기', icon: '⏳' },
  blocked:     { bg: 'bg-status-blocked/15', text: 'text-status-blocked', label: '차단', icon: '🚫' },
};

interface Props {
  status: TaskStatus;
  showIcon?: boolean;
  size?: 'sm' | 'md';
}

export default function StatusBadge({ status, showIcon = false, size = 'sm' }: Props) {
  const c = config[status] ?? config.pending;
  const sizeClass = size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-sm px-3 py-1';

  return (
    <span className={`inline-flex items-center gap-1 font-semibold rounded-full ${c.bg} ${c.text} ${sizeClass}`}>
      {showIcon && <span>{c.icon}</span>}
      {c.label}
    </span>
  );
}

export function StatusIcon({ status }: { status: TaskStatus }) {
  return <span className="text-base">{config[status]?.icon ?? '⏳'}</span>;
}
