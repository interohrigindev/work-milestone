import { useState } from 'react';
import {
  ChevronDown,
  ChevronRight,
  Plus,
  GripVertical,
  MessageCircle,
  MoreHorizontal,
  Trash2,
} from 'lucide-react';
import type { Task, TaskStatus, TaskPriority, Comment } from '../types';
import { STATUS_CONFIG, PRIORITY_CONFIG } from '../types';
import ProgressBar from './ProgressBar';

interface Props {
  tasks: Task[];
  comments: Comment[];
  isAdmin?: boolean;
  onUpdateTask?: (taskId: string, data: Partial<Task>) => void;
  onAddComment?: (taskId: string, taskTitle: string, content: string, author: string) => void;
  onDeleteTask?: (taskId: string) => void;
  onAddTask?: (groupDay: number) => void;
}

interface GroupData {
  day: number;
  dayLabel: string;
  category: string;
  color: string;
  tasks: Task[];
}

// Monday.com group colors
const GROUP_COLORS: Record<number, string> = {
  1: '#579BFC',
  2: '#00C875',
  3: '#FDAB3D',
  4: '#A25DDC',
  5: '#E2445C',
};

const DAY_CATEGORIES: Record<number, string> = {
  1: '기반 설정 + DB',
  2: '채용 CRUD',
  3: '면접 + 분석 엔진',
  4: '핵심 엔진 + 리포트',
  5: '완성 + 배포',
};

export default function BoardTableView({ tasks, comments, isAdmin, onUpdateTask, onAddComment, onDeleteTask, onAddTask }: Props) {
  const [collapsedGroups, setCollapsedGroups] = useState<Set<number>>(new Set());
  const [editingCell, setEditingCell] = useState<{ taskId: string; field: string } | null>(null);
  const [editValue, setEditValue] = useState('');
  const [expandedTask, setExpandedTask] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');
  const [commentAuthor, setCommentAuthor] = useState('');

  // Group tasks by day
  const groups: GroupData[] = [];
  const dayMap = tasks.reduce<Record<number, Task[]>>((acc, t) => {
    (acc[t.day] ??= []).push(t);
    return acc;
  }, {});

  for (const day of Object.keys(dayMap).map(Number).sort()) {
    const dayTasks = dayMap[day];
    groups.push({
      day,
      dayLabel: dayTasks[0]?.dayLabel ?? `Day ${day}`,
      category: DAY_CATEGORIES[day] ?? '',
      color: GROUP_COLORS[day] ?? '#579BFC',
      tasks: dayTasks,
    });
  }

  function toggleGroup(day: number) {
    setCollapsedGroups(prev => {
      const next = new Set(prev);
      if (next.has(day)) next.delete(day);
      else next.add(day);
      return next;
    });
  }

  function startEdit(taskId: string, field: string, currentValue: string) {
    if (!isAdmin) return;
    setEditingCell({ taskId, field });
    setEditValue(currentValue);
  }

  function commitEdit(taskId: string, field: string) {
    if (!isAdmin || !editingCell) return;
    const update: Partial<Task> = {};
    if (field === 'title') update.title = editValue;
    if (field === 'notes') update.notes = editValue;
    if (field === 'assignee') update.assignee = editValue;
    if (field === 'dueDate') update.dueDate = editValue;
    onUpdateTask?.(taskId, update);
    setEditingCell(null);
  }

  function handleStatusChange(taskId: string, status: TaskStatus) {
    onUpdateTask?.(taskId, {
      status,
      completedAt: status === 'done' ? new Date() : null,
      progress: status === 'done' ? 100 : status === 'in_progress' ? 50 : 0,
    });
  }

  function handlePriorityChange(taskId: string, priority: TaskPriority) {
    onUpdateTask?.(taskId, { priority });
  }

  function handleProgressChange(taskId: string, progress: number) {
    onUpdateTask?.(taskId, { progress });
  }

  function handleSubmitComment(taskId: string, taskTitle: string) {
    if (!commentText.trim() || !commentAuthor.trim()) return;
    onAddComment?.(taskId, taskTitle, commentText.trim(), commentAuthor.trim());
    setCommentText('');
  }

  function getGroupProgress(groupTasks: Task[]) {
    if (groupTasks.length === 0) return 0;
    const done = groupTasks.filter(t => t.status === 'done').length;
    return Math.round((done / groupTasks.length) * 100);
  }

  return (
    <div className="flex-1 overflow-x-auto p-4">
      {groups.map((group) => {
        const isCollapsed = collapsedGroups.has(group.day);
        const groupProgress = getGroupProgress(group.tasks);
        const doneCount = group.tasks.filter(t => t.status === 'done').length;

        return (
          <div key={group.day} className="mb-6">
            {/* Group header */}
            <div className="flex items-center gap-2 mb-1 group/header">
              <button
                onClick={() => toggleGroup(group.day)}
                className="p-0.5 rounded hover:bg-dark-card transition-colors"
              >
                {isCollapsed
                  ? <ChevronRight className="w-4 h-4" style={{ color: group.color }} />
                  : <ChevronDown className="w-4 h-4" style={{ color: group.color }} />
                }
              </button>
              <div
                className="flex items-center gap-2 px-2 py-1 rounded cursor-pointer hover:bg-dark-card/50 transition-colors"
                onClick={() => toggleGroup(group.day)}
              >
                <span className="font-bold text-sm" style={{ color: group.color }}>
                  {group.dayLabel}
                </span>
                <span className="text-xs text-text-dim">— {group.category}</span>
                <span className="text-xs font-mono text-text-dim ml-2">
                  {doneCount}/{group.tasks.length}
                </span>
              </div>
              <div className="w-20 ml-2">
                <div className="h-1.5 bg-dark-border rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${groupProgress}%`, backgroundColor: group.color }}
                  />
                </div>
              </div>
            </div>

            {/* Table */}
            {!isCollapsed && (
              <div className="rounded-lg overflow-hidden border border-dark-border">
                {/* Column headers */}
                <div
                  className="grid items-center text-[11px] font-semibold text-text-dim uppercase tracking-wider border-b border-dark-border"
                  style={{
                    gridTemplateColumns: '40px 1fr 120px 100px 100px 100px 120px 50px',
                    backgroundColor: `${group.color}15`,
                  }}
                >
                  <div className="px-2 py-2.5" />
                  <div className="px-3 py-2.5" style={{ borderLeft: `3px solid ${group.color}` }}>작업</div>
                  <div className="px-3 py-2.5 text-center">상태</div>
                  <div className="px-3 py-2.5 text-center">담당자</div>
                  <div className="px-3 py-2.5 text-center">우선순위</div>
                  <div className="px-3 py-2.5 text-center">진행률</div>
                  <div className="px-3 py-2.5 text-center">마감일</div>
                  <div className="px-2 py-2.5" />
                </div>

                {/* Rows */}
                {group.tasks.map((task) => {
                  const taskComments = comments.filter(c => c.taskId === task.id);
                  const statusConf = STATUS_CONFIG[task.status];
                  const priorityConf = PRIORITY_CONFIG[task.priority || 'medium'];
                  const isExpanded = expandedTask === task.id;

                  return (
                    <div key={task.id}>
                      <div
                        className="board-row grid items-center border-b border-dark-border/50 bg-dark-card hover:bg-dark-card-hover transition-colors"
                        style={{
                          gridTemplateColumns: '40px 1fr 120px 100px 100px 100px 120px 50px',
                        }}
                      >
                        {/* Grip */}
                        <div className="px-2 py-2.5 flex justify-center">
                          <GripVertical className="w-3.5 h-3.5 text-dark-border-light opacity-0 group-hover:opacity-100 cursor-grab" />
                        </div>

                        {/* Task name */}
                        <div
                          className="px-3 py-2.5 flex items-center gap-2 min-w-0 cursor-pointer"
                          style={{ borderLeft: `3px solid ${group.color}` }}
                          onClick={() => setExpandedTask(isExpanded ? null : task.id)}
                        >
                          {editingCell?.taskId === task.id && editingCell.field === 'title' ? (
                            <input
                              autoFocus
                              className="inline-edit bg-transparent text-sm text-text-bright w-full px-1"
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              onBlur={() => commitEdit(task.id, 'title')}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') commitEdit(task.id, 'title');
                                if (e.key === 'Escape') setEditingCell(null);
                              }}
                              onClick={(e) => e.stopPropagation()}
                            />
                          ) : (
                            <>
                              <span className="font-mono text-[10px] text-text-dim">
                                {task.prompt || String(task.order).padStart(2, '0')}
                              </span>
                              <span
                                className={`text-sm truncate ${task.status === 'done' ? 'text-text-dim line-through' : 'text-text-bright'}`}
                                onDoubleClick={(e) => { e.stopPropagation(); startEdit(task.id, 'title', task.title); }}
                              >
                                {task.title}
                              </span>
                              {taskComments.length > 0 && (
                                <span className="flex items-center gap-0.5 text-[10px] text-primary shrink-0">
                                  <MessageCircle className="w-3 h-3" />
                                  {taskComments.length}
                                </span>
                              )}
                            </>
                          )}
                        </div>

                        {/* Status */}
                        <div className="px-2 py-2.5 flex justify-center">
                          {isAdmin ? (
                            <select
                              value={task.status}
                              onChange={(e) => handleStatusChange(task.id, e.target.value as TaskStatus)}
                              className="status-pill text-[11px] font-bold px-3 py-1 rounded-full cursor-pointer border-0 outline-none text-center"
                              style={{
                                backgroundColor: statusConf.color,
                                color: '#fff',
                              }}
                            >
                              <option value="pending">대기</option>
                              <option value="in_progress">진행중</option>
                              <option value="done">완료</option>
                              <option value="blocked">막힘</option>
                            </select>
                          ) : (
                            <span
                              className="status-pill text-[11px] font-bold px-3 py-1 rounded-full"
                              style={{ backgroundColor: statusConf.color, color: '#fff' }}
                            >
                              {statusConf.label}
                            </span>
                          )}
                        </div>

                        {/* Assignee */}
                        <div className="px-2 py-2.5 flex justify-center">
                          {editingCell?.taskId === task.id && editingCell.field === 'assignee' ? (
                            <input
                              autoFocus
                              className="inline-edit bg-transparent text-xs text-text-bright w-16 text-center px-1"
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              onBlur={() => commitEdit(task.id, 'assignee')}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') commitEdit(task.id, 'assignee');
                                if (e.key === 'Escape') setEditingCell(null);
                              }}
                            />
                          ) : (
                            <div
                              className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold cursor-pointer ${
                                task.assignee
                                  ? 'bg-primary text-white'
                                  : 'bg-dark-border text-text-dim border border-dashed border-dark-border-light hover:border-primary hover:text-primary'
                              }`}
                              onClick={() => isAdmin && startEdit(task.id, 'assignee', task.assignee || '')}
                              title={task.assignee || '담당자 지정'}
                            >
                              {task.assignee
                                ? task.assignee.charAt(0).toUpperCase()
                                : <Plus className="w-3 h-3" />
                              }
                            </div>
                          )}
                        </div>

                        {/* Priority */}
                        <div className="px-2 py-2.5 flex justify-center">
                          {isAdmin ? (
                            <select
                              value={task.priority || 'medium'}
                              onChange={(e) => handlePriorityChange(task.id, e.target.value as TaskPriority)}
                              className="text-[11px] font-semibold px-2 py-1 rounded cursor-pointer border-0 outline-none bg-transparent"
                              style={{ color: priorityConf.color }}
                            >
                              <option value="critical">🔥 긴급</option>
                              <option value="high">🔴 높음</option>
                              <option value="medium">🟡 보통</option>
                              <option value="low">🔵 낮음</option>
                            </select>
                          ) : (
                            <span className="text-[11px] font-semibold" style={{ color: priorityConf.color }}>
                              {priorityConf.icon} {priorityConf.label}
                            </span>
                          )}
                        </div>

                        {/* Progress */}
                        <div className="px-2 py-2.5">
                          {isAdmin ? (
                            <div className="flex items-center gap-1.5">
                              <div className="flex-1">
                                <div className="h-1.5 bg-dark-border rounded-full overflow-hidden cursor-pointer">
                                  <input
                                    type="range"
                                    min={0}
                                    max={100}
                                    step={5}
                                    value={task.progress}
                                    onChange={(e) => handleProgressChange(task.id, Number(e.target.value))}
                                    className="w-full h-full opacity-0 absolute cursor-pointer"
                                    style={{ marginTop: '-3px' }}
                                  />
                                  <div
                                    className="h-full rounded-full transition-all"
                                    style={{
                                      width: `${task.progress}%`,
                                      backgroundColor: task.progress >= 80 ? '#00C875' : task.progress >= 40 ? '#FDAB3D' : '#579BFC',
                                    }}
                                  />
                                </div>
                              </div>
                              <span className="font-mono text-[10px] text-text-dim w-8 text-right">{task.progress}%</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5">
                              <ProgressBar progress={task.progress} size="sm" showLabel={false} />
                              <span className="font-mono text-[10px] text-text-dim">{task.progress}%</span>
                            </div>
                          )}
                        </div>

                        {/* Due date */}
                        <div className="px-2 py-2.5 flex justify-center">
                          {isAdmin ? (
                            <input
                              type="date"
                              value={task.dueDate || ''}
                              onChange={(e) => onUpdateTask?.(task.id, { dueDate: e.target.value })}
                              className="bg-transparent text-[11px] text-text-mid outline-none cursor-pointer"
                            />
                          ) : (
                            <span className="text-[11px] text-text-dim">
                              {task.dueDate || '—'}
                            </span>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="px-2 py-2.5 flex justify-center">
                          {isAdmin && (
                            <button
                              onClick={() => setExpandedTask(isExpanded ? null : task.id)}
                              className="p-1 rounded hover:bg-dark-border text-text-dim hover:text-text-mid transition-colors"
                            >
                              <MoreHorizontal className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Expanded detail panel */}
                      {isExpanded && (
                        <div className="bg-dark-surface border-b border-dark-border px-6 py-4 space-y-3">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="text-[10px] text-text-dim uppercase font-semibold">설명</label>
                              <p className="text-sm text-text-mid mt-1">{task.detail || '설명 없음'}</p>
                            </div>
                            <div>
                              <label className="text-[10px] text-text-dim uppercase font-semibold">메모</label>
                              {isAdmin && editingCell?.taskId === task.id && editingCell.field === 'notes' ? (
                                <textarea
                                  autoFocus
                                  className="w-full mt-1 bg-dark-card border border-dark-border rounded-lg px-3 py-2 text-sm text-text-bright resize-none outline-none focus:border-primary"
                                  rows={2}
                                  value={editValue}
                                  onChange={(e) => setEditValue(e.target.value)}
                                  onBlur={() => commitEdit(task.id, 'notes')}
                                />
                              ) : (
                                <p
                                  className="text-sm text-text-mid mt-1 cursor-pointer hover:text-text-bright"
                                  onClick={() => isAdmin && startEdit(task.id, 'notes', task.notes || '')}
                                >
                                  {task.notes || (isAdmin ? '클릭하여 메모 추가...' : '메모 없음')}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-4 text-xs text-text-dim">
                            <span>난이도: {task.difficulty}</span>
                            <span>시간: {task.timeSlot}</span>
                            <span>카테고리: {task.category}</span>
                            {task.completedAt && (
                              <span className="text-status-done">
                                완료: {new Date(task.completedAt).toLocaleDateString('ko-KR')}
                              </span>
                            )}
                          </div>

                          {/* Comments */}
                          <div>
                            <label className="text-[10px] text-text-dim uppercase font-semibold mb-2 block">
                              댓글 ({taskComments.length})
                            </label>
                            {taskComments.map(c => (
                              <div key={c.id} className="bg-dark-card rounded-lg p-3 mb-2">
                                <div className="flex items-center gap-2 mb-1">
                                  <div className="w-5 h-5 rounded-full bg-primary/30 flex items-center justify-center text-[9px] text-primary font-bold">
                                    {c.author.charAt(0).toUpperCase()}
                                  </div>
                                  <span className="text-xs font-semibold text-text-bright">{c.author}</span>
                                  <span className="text-[10px] text-text-dim">
                                    {c.createdAt.toLocaleDateString('ko-KR')}
                                  </span>
                                </div>
                                <p className="text-sm text-text-mid pl-7">{c.content}</p>
                              </div>
                            ))}
                            <div className="flex gap-2 mt-2">
                              <input
                                className="w-20 bg-dark-card border border-dark-border rounded-lg px-2 py-1.5 text-xs text-text-bright placeholder-text-dim outline-none focus:border-primary"
                                placeholder="이름"
                                value={commentAuthor}
                                onChange={(e) => setCommentAuthor(e.target.value)}
                              />
                              <input
                                className="flex-1 bg-dark-card border border-dark-border rounded-lg px-3 py-1.5 text-xs text-text-bright placeholder-text-dim outline-none focus:border-primary"
                                placeholder="댓글 입력..."
                                value={commentText}
                                onChange={(e) => setCommentText(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') handleSubmitComment(task.id, task.title);
                                }}
                              />
                              <button
                                onClick={() => handleSubmitComment(task.id, task.title)}
                                className="px-3 py-1.5 bg-primary text-white text-xs rounded-lg font-semibold hover:bg-primary-hover transition-colors"
                              >
                                등록
                              </button>
                            </div>
                          </div>

                          {/* Delete */}
                          {isAdmin && onDeleteTask && (
                            <div className="pt-2 border-t border-dark-border">
                              <button
                                onClick={() => { if (confirm('이 작업을 삭제하시겠습니까?')) onDeleteTask(task.id); }}
                                className="flex items-center gap-1.5 text-xs text-status-blocked hover:text-status-blocked/80 transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                작업 삭제
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Add task row */}
                {isAdmin && onAddTask && (
                  <button
                    onClick={() => onAddTask(group.day)}
                    className="w-full flex items-center gap-2 px-6 py-2.5 text-xs text-text-dim hover:text-primary hover:bg-dark-card/50 transition-colors border-t border-dark-border/30"
                    style={{ borderLeft: `3px solid transparent` }}
                  >
                    <Plus className="w-3.5 h-3.5" />
                    새 작업 추가
                  </button>
                )}
              </div>
            )}
          </div>
        );
      })}

      {groups.length === 0 && (
        <div className="text-center py-20">
          <p className="text-text-dim mb-4">아직 작업이 없습니다.</p>
        </div>
      )}
    </div>
  );
}
