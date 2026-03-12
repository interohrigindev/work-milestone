import TaskCard from './TaskCard';
import { calcDayProgress } from '../lib/firestore';
import type { Task, Comment } from '../types';

interface Props {
  day: number;
  dayLabel: string;
  category: string;
  tasks: Task[];
  comments: Comment[];
  isAdmin?: boolean;
  onUpdateTask?: (taskId: string, data: Partial<Task>) => void;
  onAddComment?: (taskId: string, taskTitle: string, content: string, author: string) => void;
}

export default function DayGroup({
  day: _day,
  dayLabel,
  category,
  tasks,
  comments,
  isAdmin,
  onUpdateTask,
  onAddComment,
}: Props) {
  const progress = calcDayProgress(tasks);
  const allDone = tasks.every((t) => t.status === 'done');
  const hasInProgress = tasks.some((t) => t.status === 'in_progress');

  const statusIcon = allDone ? '✅' : hasInProgress ? '🔄' : '⏳';
  const borderColor = allDone
    ? 'border-l-status-done'
    : hasInProgress
      ? 'border-l-status-progress'
      : 'border-l-dark-border-light';

  return (
    <div className={`border-l-2 ${borderColor} pl-4 mb-6`}>
      {/* Day header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-bold text-text-bright">{dayLabel}</h3>
          <span className="text-xs text-text-dim">— {category}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm">{statusIcon}</span>
          <span className="font-mono text-xs text-text-mid">{progress}%</span>
        </div>
      </div>

      {/* Task cards */}
      <div className="space-y-2">
        {tasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            comments={comments}
            isAdmin={isAdmin}
            onUpdate={onUpdateTask}
            onAddComment={onAddComment}
          />
        ))}
      </div>
    </div>
  );
}
