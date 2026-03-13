import type { Task } from '../types';
import { STATUS_CONFIG } from '../types';

interface Props {
  tasks: Task[];
  projectStartDate: string;
  projectEndDate: string;
}

export default function TimelineView({ tasks, projectStartDate, projectEndDate }: Props) {
  const start = new Date(projectStartDate || '2026-03-13');
  const end = new Date(projectEndDate || '2026-03-19');
  const totalDays = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1);

  // Generate day labels
  const dayLabels: { date: Date; label: string; isWeekend: boolean }[] = [];
  for (let i = 0; i < totalDays; i++) {
    const d = new Date(start.getTime() + i * 24 * 60 * 60 * 1000);
    dayLabels.push({
      date: d,
      label: `${d.getMonth() + 1}/${d.getDate()}`,
      isWeekend: d.getDay() === 0 || d.getDay() === 6,
    });
  }

  // Group tasks by day
  const dayGroups = tasks.reduce<Record<number, Task[]>>((acc, t) => {
    (acc[t.day] ??= []).push(t);
    return acc;
  }, {});
  const days = Object.keys(dayGroups).map(Number).sort();

  const DAY_COLORS: Record<number, string> = {
    1: '#579BFC', 2: '#00C875', 3: '#FDAB3D', 4: '#A25DDC', 5: '#E2445C',
  };

  return (
    <div className="flex-1 p-4 overflow-x-auto">
      <div className="min-w-[700px]">
        {/* Header with day columns */}
        <div className="flex border-b border-dark-border mb-4">
          <div className="w-[200px] shrink-0 px-3 py-2">
            <span className="text-[10px] font-bold text-text-dim uppercase">작업</span>
          </div>
          <div className="flex-1 flex">
            {dayLabels.map((day, i) => (
              <div
                key={i}
                className={`flex-1 text-center py-2 text-[10px] font-semibold border-l border-dark-border/50 ${
                  day.isWeekend ? 'text-text-dim bg-dark-card/30' : 'text-text-mid'
                }`}
              >
                {day.label}
                <div className="text-[8px] text-text-dim">
                  {day.date.toLocaleDateString('ko-KR', { weekday: 'short' })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Rows by group */}
        {days.map((day) => {
          const groupTasks = dayGroups[day];
          const color = DAY_COLORS[day] ?? '#579BFC';

          return (
            <div key={day} className="mb-4">
              {/* Group header */}
              <div className="flex items-center gap-2 px-3 py-1.5 mb-1">
                <div className="w-2.5 h-2.5 rounded" style={{ backgroundColor: color }} />
                <span className="text-xs font-bold" style={{ color }}>
                  {groupTasks[0]?.dayLabel ?? `Day ${day}`}
                </span>
              </div>

              {/* Task bars */}
              {groupTasks.map((task) => {
                const statusConf = STATUS_CONFIG[task.status];
                // Each task spans 1 day column based on its day number
                const startCol = day - 1;
                const barWidth = 100 / totalDays;
                const barLeft = (startCol / totalDays) * 100;

                return (
                  <div key={task.id} className="flex items-center h-10 group hover:bg-dark-card/30 rounded transition-colors">
                    {/* Task name */}
                    <div className="w-[200px] shrink-0 px-3 flex items-center gap-2 min-w-0">
                      <span className="font-mono text-[9px] text-text-dim">{task.prompt}</span>
                      <span className={`text-xs truncate ${task.status === 'done' ? 'text-text-dim line-through' : 'text-text-mid'}`}>
                        {task.title}
                      </span>
                    </div>

                    {/* Gantt bar area */}
                    <div className="flex-1 relative h-full">
                      {/* Background grid */}
                      <div className="absolute inset-0 flex">
                        {dayLabels.map((_, i) => (
                          <div key={i} className="flex-1 border-l border-dark-border/20" />
                        ))}
                      </div>

                      {/* Task bar */}
                      <div
                        className="absolute top-1.5 h-7 rounded-md flex items-center px-2 transition-all cursor-pointer group-hover:brightness-110"
                        style={{
                          left: `${barLeft}%`,
                          width: `${barWidth}%`,
                          backgroundColor: statusConf.color,
                          minWidth: '60px',
                        }}
                      >
                        <span className="text-[9px] font-bold text-white truncate">
                          {task.progress}%
                        </span>
                        {/* Progress overlay */}
                        <div
                          className="absolute inset-0 rounded-md opacity-30"
                          style={{
                            background: `linear-gradient(to right, transparent ${task.progress}%, rgba(0,0,0,0.3) ${task.progress}%)`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}
