import { useState } from 'react';
import { ChevronDown, ChevronUp, MessageCircle, Save, X } from 'lucide-react';
import { StatusIcon } from './StatusBadge';
import ProgressBar from './ProgressBar';
import type { Task, TaskStatus, Comment } from '../types';

interface Props {
  task: Task;
  comments: Comment[];
  isAdmin?: boolean;
  onUpdate?: (taskId: string, data: Partial<Task>) => void;
  onAddComment?: (taskId: string, taskTitle: string, content: string, author: string) => void;
}

export default function TaskCard({ task, comments, isAdmin, onUpdate, onAddComment }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editStatus, setEditStatus] = useState(task.status);
  const [editProgress, setEditProgress] = useState(task.progress);
  const [editNotes, setEditNotes] = useState(task.notes);
  const [commentText, setCommentText] = useState('');
  const [commentAuthor, setCommentAuthor] = useState('');

  const taskComments = comments.filter((c) => c.taskId === task.id);

  function handleSave() {
    onUpdate?.(task.id, {
      status: editStatus,
      progress: editProgress,
      notes: editNotes,
      completedAt: editStatus === 'done' ? new Date() : null,
    });
    setEditing(false);
  }

  function handleCancel() {
    setEditStatus(task.status);
    setEditProgress(task.progress);
    setEditNotes(task.notes);
    setEditing(false);
  }

  function handleSubmitComment(e: React.FormEvent) {
    e.preventDefault();
    if (!commentText.trim() || !commentAuthor.trim()) return;
    onAddComment?.(task.id, task.title, commentText.trim(), commentAuthor.trim());
    setCommentText('');
  }

  const isDone = task.status === 'done';

  // "NEW" badge: completed within the last 24 hours
  const isRecent = task.completedAt
    ? Date.now() - new Date(task.completedAt).getTime() < 24 * 60 * 60 * 1000
    : false;

  return (
    <div
      className={`bg-dark-card rounded-xl border transition-all duration-200 ${
        isDone
          ? 'border-dark-border/60 opacity-80'
          : task.status === 'in_progress'
            ? 'border-status-progress/30 shadow-[0_0_15px_rgba(245,158,11,0.08)]'
            : 'border-dark-border hover:border-dark-border-light'
      }`}
    >
      {/* Main row */}
      <div
        className="flex items-start gap-3 p-4 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        {/* Status icon */}
        <div className="mt-0.5 shrink-0">
          <StatusIcon status={task.status} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono text-xs text-text-dim">
              {String(task.order).padStart(2, '0')}.
            </span>
            <span className={`font-semibold text-sm ${isDone ? 'text-text-dim line-through' : 'text-text-bright'}`}>
              {task.title}
            </span>
            {isRecent && (
              <span className="text-[10px] font-bold bg-status-blocked text-white px-1.5 py-0.5 rounded-full leading-none animate-pulse">
                NEW
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span className="font-mono text-xs px-1.5 py-0.5 rounded bg-dark-border/50 text-text-dim">
              {task.prompt}
            </span>
            <span className="text-xs text-text-dim">{task.timeSlot}</span>
            <span className="text-xs tracking-wider" title="난이도">{task.difficulty}</span>
          </div>
          {task.detail && (
            <p className="text-xs text-text-dim mt-1.5 leading-relaxed">{task.detail}</p>
          )}
          {/* Admin memo */}
          {task.notes && isDone && (
            <p className="text-xs text-status-done/70 mt-1.5 italic">
              → {task.notes}
            </p>
          )}
        </div>

        {/* Right side: progress + expand */}
        <div className="shrink-0 flex flex-col items-end gap-2">
          <div className="w-20">
            <ProgressBar progress={task.progress} size="sm" showLabel={false} color={task.color} />
          </div>
          <div className="flex items-center gap-1.5">
            <span className="font-mono text-xs text-text-dim">{task.progress}%</span>
            {taskComments.length > 0 && (
              <span className="inline-flex items-center gap-0.5 text-xs text-gold">
                <MessageCircle className="w-3 h-3" />
                {taskComments.length}
              </span>
            )}
            {expanded ? (
              <ChevronUp className="w-4 h-4 text-text-dim" />
            ) : (
              <ChevronDown className="w-4 h-4 text-text-dim" />
            )}
          </div>
        </div>
      </div>

      {/* Expanded section */}
      {expanded && (
        <div className="border-t border-dark-border px-4 py-3 space-y-3">
          {/* Admin editing */}
          {isAdmin && (
            <div>
              {editing ? (
                <div className="space-y-3 bg-dark-bg/30 rounded-lg p-3">
                  <div className="flex items-center gap-3">
                    <label className="text-xs text-text-dim w-14">상태</label>
                    <select
                      className="bg-dark-border border border-dark-border-light rounded-lg px-3 py-1.5 text-sm text-text-bright"
                      value={editStatus}
                      onChange={(e) => setEditStatus(e.target.value as TaskStatus)}
                    >
                      <option value="pending">⏳ 대기</option>
                      <option value="in_progress">🔄 진행중</option>
                      <option value="done">✅ 완료</option>
                      <option value="blocked">🚫 차단</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-3">
                    <label className="text-xs text-text-dim w-14">진행률</label>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      step={5}
                      value={editProgress}
                      onChange={(e) => setEditProgress(Number(e.target.value))}
                      className="flex-1 accent-gold"
                    />
                    <span className="font-mono text-xs text-text-mid w-10 text-right">{editProgress}%</span>
                  </div>
                  <div>
                    <label className="text-xs text-text-dim block mb-1">메모</label>
                    <textarea
                      className="w-full bg-dark-border border border-dark-border-light rounded-lg px-3 py-2 text-sm text-text-bright resize-none"
                      rows={2}
                      value={editNotes}
                      onChange={(e) => setEditNotes(e.target.value)}
                      placeholder="완료 메모 또는 참고사항..."
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleSave}
                      className="inline-flex items-center gap-1 text-xs bg-gold text-dark-bg px-3 py-1.5 rounded-lg font-semibold hover:bg-gold-dim"
                    >
                      <Save className="w-3.5 h-3.5" /> 저장
                    </button>
                    <button
                      onClick={handleCancel}
                      className="inline-flex items-center gap-1 text-xs bg-dark-border text-text-mid px-3 py-1.5 rounded-lg hover:bg-dark-border-light"
                    >
                      <X className="w-3.5 h-3.5" /> 취소
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={(e) => { e.stopPropagation(); setEditing(true); }}
                  className="text-xs text-gold hover:text-gold-dim font-semibold"
                >
                  ✏️ 편집
                </button>
              )}
            </div>
          )}

          {/* Task comments */}
          {taskComments.length > 0 && (
            <div className="space-y-2">
              {taskComments.map((c) => (
                <div key={c.id} className="bg-dark-bg/30 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-semibold text-gold">{c.author}</span>
                    <span className="text-xs text-text-dim">
                      {c.createdAt.toLocaleDateString('ko-KR')} {c.createdAt.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-sm text-text-mid">{c.content}</p>
                </div>
              ))}
            </div>
          )}

          {/* Comment input */}
          <form onSubmit={handleSubmitComment} className="flex flex-col gap-2">
            <div className="flex gap-2">
              <input
                className="w-24 bg-dark-border border border-dark-border-light rounded-lg px-2 py-1.5 text-xs text-text-bright placeholder-text-dim"
                placeholder="이름"
                value={commentAuthor}
                onChange={(e) => setCommentAuthor(e.target.value)}
                onClick={(e) => e.stopPropagation()}
              />
              <input
                className="flex-1 bg-dark-border border border-dark-border-light rounded-lg px-3 py-1.5 text-xs text-text-bright placeholder-text-dim"
                placeholder="이 작업에 대한 의견..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                onClick={(e) => e.stopPropagation()}
              />
              <button
                type="submit"
                className="px-3 py-1.5 bg-gold/20 text-gold text-xs rounded-lg font-semibold hover:bg-gold/30"
                onClick={(e) => e.stopPropagation()}
              >
                등록
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
