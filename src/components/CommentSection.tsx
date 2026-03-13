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
      <form onSubmit={handleSubmit} className="bg-dark-card rounded-xl border border-dark-border p-4 mb-4 space-y-3">
        <div className="flex gap-2">
          <input
            className="w-32 bg-dark-border border border-dark-border-light rounded-lg px-3 py-2 text-sm text-text-bright placeholder-text-dim outline-none focus:border-primary"
            placeholder="이름"
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
          />
          <select
            className="bg-dark-border border border-dark-border-light rounded-lg px-3 py-2 text-sm text-text-mid outline-none focus:border-primary"
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
            className="flex-1 bg-dark-border border border-dark-border-light rounded-lg px-3 py-2 text-sm text-text-bright placeholder-text-dim resize-none outline-none focus:border-primary"
            rows={2}
            placeholder="의견을 남겨주세요..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
          <button
            type="submit"
            className="self-end bg-primary text-white px-4 py-2.5 rounded-lg hover:bg-primary-hover transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </form>

      <div className="space-y-2">
        {comments.length === 0 && (
          <p className="text-sm text-text-dim text-center py-8">아직 의견이 없습니다.</p>
        )}
        {comments.map((c) => (
          <div key={c.id} className="bg-dark-card rounded-xl border border-dark-border p-4 hover:border-dark-border-light transition-colors">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                  <div className="w-6 h-6 rounded-full bg-primary/30 flex items-center justify-center text-[10px] text-primary font-bold">
                    {c.author.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-sm font-semibold text-text-bright">{c.author}</span>
                  <span className="text-xs text-text-dim">
                    {c.createdAt.toLocaleDateString('ko-KR')}{' '}
                    {c.createdAt.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                {c.taskId && c.taskTitle && (
                  <p className="text-xs text-text-dim mb-1.5 ml-8">
                    작업: {c.taskTitle}
                  </p>
                )}
                <p className="text-sm text-text-mid whitespace-pre-wrap ml-8">{c.content}</p>
              </div>
              {isAdmin && onDelete && (
                <button
                  onClick={() => onDelete(c.id)}
                  className="p-1 text-text-dim hover:text-status-blocked shrink-0 transition-colors"
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
