import { useState } from 'react';
import { Send, Trash2 } from 'lucide-react';
import type { Comment, Task } from '../types';

interface Props {
  comments: Comment[];
  tasks: Task[];
  isAdmin?: boolean;
  onAdd: (data: { content: string; author: string; taskId: string | null; taskTitle: string }) => void;
  onDelete?: (id: string) => void;
}

export default function CommentSection({ comments, tasks, isAdmin, onAdd, onDelete }: Props) {
  const [content, setContent] = useState('');
  const [author, setAuthor] = useState('');
  const [selectedTaskId, setSelectedTaskId] = useState<string>('');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim() || !author.trim()) return;
    const task = tasks.find((t) => t.id === selectedTaskId);
    onAdd({
      content: content.trim(),
      author: author.trim(),
      taskId: selectedTaskId || null,
      taskTitle: task?.title ?? '',
    });
    setContent('');
  }

  return (
    <div>
      {/* Input form */}
      <form onSubmit={handleSubmit} className="bg-dark-card rounded-xl border border-dark-border p-4 mb-4 space-y-3">
        <div className="flex gap-2">
          <input
            className="w-32 bg-dark-border border border-dark-border-light rounded-lg px-3 py-2 text-sm text-text-bright placeholder-text-dim focus:outline-none focus:border-gold/40"
            placeholder="이름"
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
          />
          <select
            className="bg-dark-border border border-dark-border-light rounded-lg px-3 py-2 text-sm text-text-mid focus:outline-none focus:border-gold/40"
            value={selectedTaskId}
            onChange={(e) => setSelectedTaskId(e.target.value)}
          >
            <option value="">전체 의견</option>
            {tasks.map((t) => (
              <option key={t.id} value={t.id}>
                {String(t.order).padStart(2, '0')}. {t.title}
              </option>
            ))}
          </select>
        </div>
        <div className="flex gap-2">
          <textarea
            className="flex-1 bg-dark-border border border-dark-border-light rounded-lg px-3 py-2 text-sm text-text-bright placeholder-text-dim resize-none focus:outline-none focus:border-gold/40"
            rows={2}
            placeholder="의견을 남겨주세요..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
          <button
            type="submit"
            className="self-end bg-gold text-dark-bg px-4 py-2.5 rounded-lg hover:bg-gold-dim transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </form>

      {/* Comment list */}
      <div className="space-y-2">
        {comments.length === 0 && (
          <p className="text-sm text-text-dim text-center py-8">아직 의견이 없습니다.</p>
        )}
        {comments.map((c) => (
          <div key={c.id} className="bg-dark-card rounded-xl border border-dark-border p-4">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                  <span className="text-sm font-semibold text-gold">👤 {c.author}</span>
                  <span className="text-xs text-text-dim">
                    {c.createdAt.toLocaleDateString('ko-KR')}{' '}
                    {c.createdAt.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                {c.taskId && c.taskTitle && (
                  <p className="text-xs text-text-dim mb-1.5">
                    📎 작업: {c.taskTitle}
                  </p>
                )}
                <p className="text-sm text-text-mid whitespace-pre-wrap">{c.content}</p>
              </div>
              {isAdmin && onDelete && (
                <button
                  onClick={() => onDelete(c.id)}
                  className="p-1 text-text-dim hover:text-status-blocked shrink-0"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
