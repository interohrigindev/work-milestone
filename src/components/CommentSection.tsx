import { useState } from 'react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { MessageCircle, Send, Trash2 } from 'lucide-react';
import type { Comment } from '../types';

interface Props {
  comments: Comment[];
  isAdmin?: boolean;
  onAdd: (content: string, author: string) => void;
  onDelete?: (id: string) => void;
}

export default function CommentSection({ comments, isAdmin, onAdd, onDelete }: Props) {
  const [content, setContent] = useState('');
  const [author, setAuthor] = useState('');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim() || !author.trim()) return;
    onAdd(content.trim(), author.trim());
    setContent('');
  }

  return (
    <div>
      <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2 mb-4">
        <MessageCircle className="w-5 h-5 text-violet-600" />
        의견 / 피드백
      </h3>

      <form onSubmit={handleSubmit} className="mb-4 space-y-2">
        <input
          className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-violet-500 focus:border-transparent"
          placeholder="이름"
          value={author}
          onChange={(e) => setAuthor(e.target.value)}
        />
        <div className="flex gap-2">
          <textarea
            className="flex-1 border border-gray-300 rounded-xl px-4 py-3 text-sm resize-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
            rows={2}
            placeholder="의견을 남겨주세요..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
          <button
            type="submit"
            className="self-end bg-violet-600 text-white px-4 py-2.5 rounded-xl hover:bg-violet-700 transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </form>

      <div className="space-y-3">
        {comments.length === 0 && (
          <p className="text-sm text-gray-400 text-center py-6">아직 의견이 없습니다.</p>
        )}
        {comments.map((c) => (
          <div
            key={c.id}
            className="bg-violet-50 rounded-xl p-4 border border-violet-100"
          >
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm text-gray-700 whitespace-pre-wrap flex-1">{c.content}</p>
              {isAdmin && (
                <button
                  onClick={() => onDelete?.(c.id)}
                  className="p-1 text-gray-400 hover:text-red-500 shrink-0"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-xs font-medium text-violet-600">{c.author}</span>
              <span className="text-xs text-gray-400">
                {format(c.createdAt, 'MM.dd (EEE) HH:mm', { locale: ko })}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
