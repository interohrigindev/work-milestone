import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { Trash2 } from 'lucide-react';
import type { DailyLog } from '../types';

interface Props {
  log: DailyLog;
  isAdmin?: boolean;
  onDelete?: (id: string) => void;
}

export default function DailyLogCard({ log, isAdmin, onDelete }: Props) {
  const dateObj = new Date(log.date + 'T00:00:00');
  const formatted = format(dateObj, 'yyyy.MM.dd (EEE)', { locale: ko });

  return (
    <div className="bg-dark-card rounded-xl border border-dark-border p-5 hover:border-dark-border-light transition-colors">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-primary">Day {log.day}</span>
          <span className="text-text-dim text-sm">— {formatted}</span>
        </div>
        {isAdmin && onDelete && (
          <button
            onClick={() => onDelete(log.id)}
            className="p-1 text-text-dim hover:text-status-blocked rounded transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      {log.content && (
        <div className="mb-3">
          <p className="text-sm text-text-mid whitespace-pre-wrap leading-relaxed">{log.content}</p>
        </div>
      )}

      {log.achievements.length > 0 && (
        <div className="mb-3">
          <h4 className="text-xs font-semibold text-status-done mb-1.5">완료 항목</h4>
          <ul className="space-y-1">
            {log.achievements.map((a, i) => (
              <li key={i} className="text-sm text-text-mid flex items-start gap-2">
                <span className="text-status-done mt-0.5">•</span>
                {a}
              </li>
            ))}
          </ul>
        </div>
      )}

      {log.blockers.length > 0 && (
        <div className="mb-3">
          <h4 className="text-xs font-semibold text-status-blocked mb-1.5">이슈</h4>
          <ul className="space-y-1">
            {log.blockers.map((b, i) => (
              <li key={i} className="text-sm text-text-mid flex items-start gap-2">
                <span className="text-status-blocked mt-0.5">•</span>
                {b}
              </li>
            ))}
          </ul>
        </div>
      )}

      {log.tomorrowPlan && (
        <div>
          <h4 className="text-xs font-semibold text-primary mb-1.5">다음 계획</h4>
          <p className="text-sm text-text-mid">{log.tomorrowPlan}</p>
        </div>
      )}
    </div>
  );
}
