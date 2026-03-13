import { Table2, Kanban, GanttChart, Search, Filter, UserPlus, SlidersHorizontal } from 'lucide-react';
import type { ViewMode } from '../types';

interface Props {
  activeView: ViewMode;
  onViewChange: (view: ViewMode) => void;
  projectTitle: string;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  filterStatus: string;
  onFilterStatusChange: (s: string) => void;
}

export default function ViewSwitcher({
  activeView,
  onViewChange,
  projectTitle,
  searchQuery,
  onSearchChange,
  filterStatus,
  onFilterStatusChange,
}: Props) {
  const views: { id: ViewMode; label: string; icon: typeof Table2 }[] = [
    { id: 'table', label: '테이블', icon: Table2 },
    { id: 'kanban', label: '칸반', icon: Kanban },
    { id: 'timeline', label: '타임라인', icon: GanttChart },
  ];

  return (
    <div className="bg-dark-surface border-b border-dark-border">
      {/* Project title row */}
      <div className="px-6 pt-4 pb-2 flex items-center justify-between">
        <h1 className="text-lg font-bold text-text-bright">{projectTitle}</h1>
        <div className="flex items-center gap-2">
          <button className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-primary text-white hover:bg-primary-hover transition-colors">
            <UserPlus className="w-3.5 h-3.5" />
            초대
          </button>
        </div>
      </div>

      {/* View tabs + filters */}
      <div className="px-6 flex items-center justify-between gap-4">
        {/* View tabs */}
        <div className="flex items-center gap-0.5">
          {views.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => onViewChange(id)}
              className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeView === id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-text-dim hover:text-text-mid'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>

        {/* Search + Filter */}
        <div className="flex items-center gap-2 pb-1">
          <div className="flex items-center gap-1.5 bg-dark-card rounded-lg px-2.5 py-1.5 border border-dark-border">
            <Search className="w-3.5 h-3.5 text-text-dim" />
            <input
              type="text"
              placeholder="검색..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="bg-transparent text-xs text-text-bright placeholder-text-dim outline-none w-32"
            />
          </div>
          <div className="flex items-center gap-1.5 bg-dark-card rounded-lg px-2.5 py-1.5 border border-dark-border">
            <SlidersHorizontal className="w-3.5 h-3.5 text-text-dim" />
            <select
              value={filterStatus}
              onChange={(e) => onFilterStatusChange(e.target.value)}
              className="bg-transparent text-xs text-text-mid outline-none cursor-pointer"
            >
              <option value="">전체 상태</option>
              <option value="pending">대기</option>
              <option value="in_progress">진행중</option>
              <option value="done">완료</option>
              <option value="blocked">막힘</option>
            </select>
          </div>
          <button className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs text-text-dim hover:text-text-mid hover:bg-dark-card border border-dark-border transition-colors">
            <Filter className="w-3.5 h-3.5" />
            필터
          </button>
        </div>
      </div>
    </div>
  );
}
