import { useState } from 'react';
import { Plus, MessageCircle, Clock, MoreHorizontal } from 'lucide-react';
import type { Task, TaskStatus, Comment } from '../types';
import { PRIORITY_CONFIG } from '../types';

interface Props {
  tasks: Task[];
  comments: Comment[];
  isAdmin?: boolean;
  onUpdateTask?: (taskId: string, data: Partial<Task>) => void;
  onAddComment?: (taskId: string, taskTitle: string, content: string, author: string) => void;
}

const COLUMNS: { status: TaskStatus; label: string; color: string }[] = [
  { status: 'pending',     label: '대기',   color: '#C4C4C4' },
  { status: 'in_progress', label: '진행중', color: '#FDAB3D' },
  { status: 'done',        label: '완료',   color: '#00C875' },
  { status: 'blocked',     label: '막힘',   color: '#E2445C' },
];

export default function KanbanView({ tasks, comments, isAdmin, onUpdateTask }: Props) {
  const [draggedTask, setDraggedTask] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<TaskStatus | null>(null);

  function handleDragStart(taskId: string) {
    setDraggedTask(taskId);
  }

  function handleDragOver(e: React.DragEvent, status: TaskStatus) {
    e.preventDefault();
    setDragOverColumn(status);
  }

  function handleDrop(status: TaskStatus) {
    if (draggedTask && isAdmin) {
      onUpdateTask?.(draggedTask, {
        status,
        completedAt: status === 'done' ? new Date() : null,
        progress: status === 'done' ? 100 : status === 'in_progress' ? 50 : 0,
      });
    }
    setDraggedTask(null);
    setDragOverColumn(null);
  }

  function handleDragEnd() {
    setDraggedTask(null);
    setDragOverColumn(null);
  }

  return (
    <div className="flex-1 p-4 overflow-x-auto">
      <div className="flex gap-4 min-w-[800px] h-[calc(100vh-180px)]">
        {COLUMNS.map(({ status, label, color }) => {
          const columnTasks = tasks.filter(t => t.status === status);
          const isDragOver = dragOverColumn === status;

          return (
            <div
              key={status}
              className={`flex-1 flex flex-col min-w-[240px] rounded-xl transition-colors ${
                isDragOver ? 'bg-primary/5' : ''
              }`}
              onDragOver={(e) => handleDragOver(e, status)}
              onDrop={() => handleDrop(status)}
            >
              {/* Column header */}
              <div className="flex items-center justify-between px-3 py-3 mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded" style={{ backgroundColor: color }} />
                  <span className="text-sm font-bold text-text-bright">{label}</span>
                  <span className="text-xs font-mono text-text-dim bg-dark-card px-1.5 py-0.5 rounded">
                    {columnTasks.length}
                  </span>
                </div>
                {isAdmin && (
                  <button className="p-1 rounded hover:bg-dark-card text-text-dim hover:text-text-mid transition-colors">
                    <MoreHorizontal className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Cards */}
              <div className="flex-1 overflow-y-auto space-y-2 px-1">
                {columnTasks.map((task) => {
                  const taskComments = comments.filter(c => c.taskId === task.id);
                  const priorityConf = PRIORITY_CONFIG[task.priority || 'medium'];
                  const isDragging = draggedTask === task.id;

                  return (
                    <div
                      key={task.id}
                      draggable={isAdmin}
                      onDragStart={() => handleDragStart(task.id)}
                      onDragEnd={handleDragEnd}
                      className={`kanban-card bg-dark-card border border-dark-border rounded-xl p-3.5 cursor-pointer group transition-all ${
                        isDragging ? 'opacity-40 scale-95' : ''
                      }`}
                    >
                      {/* Top: category tag */}
                      <div className="flex items-center justify-between mb-2">
                        <span
                          className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded"
                          style={{ backgroundColor: task.color + '25', color: task.color }}
                        >
                          {task.category}
                        </span>
                        <span className="text-[10px]" style={{ color: priorityConf.color }}>
                          {priorityConf.icon}
                        </span>
                      </div>

                      {/* Title */}
                      <h4 className={`text-sm font-semibold mb-2 leading-snug ${
                        task.status === 'done' ? 'text-text-dim line-through' : 'text-text-bright'
                      }`}>
                        {task.title}
                      </h4>

                      {/* Detail */}
                      {task.detail && (
                        <p className="text-xs text-text-dim mb-3 line-clamp-2 leading-relaxed">{task.detail}</p>
                      )}

                      {/* Progress bar */}
                      <div className="mb-3">
                        <div className="h-1 bg-dark-border rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{
                              width: `${task.progress}%`,
                              backgroundColor: color,
                            }}
                          />
                        </div>
                        <div className="flex justify-between mt-1">
                          <span className="text-[9px] text-text-dim font-mono">{task.progress}%</span>
                          <span className="text-[9px] text-text-dim">{task.difficulty}</span>
                        </div>
                      </div>

                      {/* Footer */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          {task.assignee ? (
                            <div
                              className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-[9px] font-bold text-white"
                              title={task.assignee}
                            >
                              {task.assignee.charAt(0).toUpperCase()}
                            </div>
                          ) : (
                            <div className="w-6 h-6 rounded-full border border-dashed border-dark-border-light flex items-center justify-center">
                              <Plus className="w-2.5 h-2.5 text-text-dim" />
                            </div>
                          )}
                          {task.dueDate && (
                            <span className="flex items-center gap-0.5 text-[9px] text-text-dim">
                              <Clock className="w-2.5 h-2.5" />
                              {task.dueDate.slice(5)}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5">
                          {taskComments.length > 0 && (
                            <span className="flex items-center gap-0.5 text-[9px] text-text-dim">
                              <MessageCircle className="w-2.5 h-2.5" />
                              {taskComments.length}
                            </span>
                          )}
                          <span className="font-mono text-[9px] text-text-dim">{task.prompt}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {columnTasks.length === 0 && (
                  <div className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors ${
                    isDragOver ? 'border-primary/50 bg-primary/5' : 'border-dark-border'
                  }`}>
                    <p className="text-xs text-text-dim">
                      {isDragOver ? '여기에 놓기' : '작업 없음'}
                    </p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
