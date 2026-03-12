import { useState } from 'react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { Send, Trash2, FileText } from 'lucide-react';
import type { DailyLog } from '../types';

interface Props {
  logs: DailyLog[];
  isAdmin?: boolean;
  onAdd?: (content: string) => void;
  onDelete?: (id: string) => void;
}

export default function DailyLogSection({ logs, isAdmin, onAdd, onDelete }: Props) {
  const [content, setContent] = useState('');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;
    onAdd?.(content.trim());
    setContent('');
  }

  return (
    <div>
      <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2 mb-4">
        <FileText className="w-5 h-5 text-blue-600" />
        데일리 로그
      </h3>

      {isAdmin && (
        <form onSubmit={handleSubmit} className="mb-4">
          <div className="flex gap-2">
            <textarea
              className="flex-1 border border-gray-300 rounded-xl px-4 py-3 text-sm resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={2}
              placeholder="오늘의 진행 상황을 기록하세요..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
            <button
              type="submit"
              className="self-end bg-blue-600 text-white px-4 py-2.5 rounded-xl hover:bg-blue-700 transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </form>
      )}

      <div className="space-y-3">
        {logs.length === 0 && (
          <p className="text-sm text-gray-400 text-center py-6">아직 로그가 없습니다.</p>
        )}
        {logs.map((log) => (
          <div
            key={log.id}
            className="bg-gray-50 rounded-xl p-4 border border-gray-100"
          >
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm text-gray-700 whitespace-pre-wrap flex-1">{log.content}</p>
              {isAdmin && (
                <button
                  onClick={() => onDelete?.(log.id)}
                  className="p-1 text-gray-400 hover:text-red-500 shrink-0"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-xs font-medium text-blue-600">{log.author}</span>
              <span className="text-xs text-gray-400">
                {format(log.createdAt, 'MM.dd (EEE) HH:mm', { locale: ko })}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
