import { ClipboardCopy, Calendar } from 'lucide-react';
import ProgressBar from './ProgressBar';
import type { Project, Task } from '../types';
import { calcOverallProgress } from '../lib/firestore';

interface Props {
  project: Project;
  tasks: Task[];
  isAdmin?: boolean;
}

export default function Header({ project, tasks, isAdmin }: Props) {
  const progress = calcOverallProgress(tasks);
  const doneCount = tasks.filter((t) => t.status === 'done').length;
  const totalCount = tasks.length;

  // Figure out current day
  const days = [...new Set(tasks.map((t) => t.day))].sort();
  const dayDates = tasks.reduce<Record<number, string>>((acc, t) => {
    if (!acc[t.day]) acc[t.day] = t.dayLabel;
    return acc;
  }, {});
  const currentDayNum = days.find((d) => {
    const dayTasks = tasks.filter((t) => t.day === d);
    return dayTasks.some((t) => t.status === 'in_progress');
  }) ?? days[0] ?? 1;

  const currentDayLabel = dayDates[currentDayNum] ?? '';
  const inProgressTask = tasks.find((t) => t.status === 'in_progress');

  function copyLink() {
    navigator.clipboard.writeText(window.location.href);
    alert('링크가 복사되었습니다!');
  }

  return (
    <header className="bg-dark-card border-b border-dark-border">
      <div className="max-w-5xl mx-auto px-4 py-5">
        {/* Top row */}
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-gold font-bold text-sm tracking-wider">INTEROHRIGIN</span>
              <span className="text-dark-border-light">|</span>
              <span className="text-text-mid text-sm">프로젝트 트래커</span>
              {isAdmin && (
                <span className="text-xs bg-gold/20 text-gold px-2 py-0.5 rounded-full font-semibold">
                  Admin
                </span>
              )}
            </div>
            <h1 className="text-xl font-bold text-text-bright leading-tight">{project.title}</h1>
            <p className="text-sm text-text-mid mt-0.5">{project.subtitle}</p>
          </div>
          <button
            onClick={copyLink}
            className="shrink-0 p-2 text-text-dim hover:text-gold rounded-lg hover:bg-gold/10 transition-colors"
            title="링크 복사"
          >
            <ClipboardCopy className="w-5 h-5" />
          </button>
        </div>

        {/* Sprint range */}
        <div className="flex items-center gap-2 mt-3 text-sm text-text-dim">
          <Calendar className="w-4 h-4" />
          <span className="font-mono">
            {project.startDate} ~ {project.endDate}
          </span>
          <span className="text-dark-border-light">|</span>
          <span>{totalCount > 0 ? `${days.length}일 집중 스프린트` : ''}</span>
        </div>

        {/* Progress */}
        <div className="mt-4 bg-dark-bg/50 rounded-xl p-4 border border-dark-border">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-text-bright">전체 진행률</span>
            <span className="font-mono text-sm text-text-mid">
              {doneCount}/{totalCount} 완료
            </span>
          </div>
          <ProgressBar progress={progress} size="lg" />
          {inProgressTask && (
            <p className="text-xs text-text-dim mt-2">
              현재: {currentDayLabel} — {inProgressTask.title}
            </p>
          )}
          {!inProgressTask && project.currentPhase && (
            <p className="text-xs text-text-dim mt-2">
              상태: {project.currentPhase}
            </p>
          )}
        </div>
      </div>
    </header>
  );
}
