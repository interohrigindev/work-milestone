export interface Project {
  id: string;
  title: string;
  subtitle: string;
  startDate: string;
  endDate: string;
  overallProgress: number;
  currentPhase: string;
  githubRepo: string;
  updatedAt: Date;
}

export type TaskStatus = 'pending' | 'in_progress' | 'done' | 'blocked';
export type TaskPriority = 'critical' | 'high' | 'medium' | 'low';
export type ViewMode = 'table' | 'kanban' | 'timeline';

export interface Task {
  id: string;
  order: number;
  day: number;
  dayLabel: string;
  title: string;
  prompt: string;
  detail: string;
  timeSlot: string;
  difficulty: string;
  status: TaskStatus;
  progress: number;
  category: string;
  color: string;
  completedAt: Date | null;
  notes: string;
  // Monday.com enhanced fields
  assignee: string;
  priority: TaskPriority;
  dueDate: string;
  groupId: string;
  tags: string[];
}

export interface BoardGroup {
  id: string;
  title: string;
  color: string;
  collapsed: boolean;
  order: number;
}

export interface DailyLog {
  id: string;
  date: string;
  day: number;
  content: string;
  achievements: string[];
  blockers: string[];
  tomorrowPlan: string;
  createdAt: Date;
}

export interface Comment {
  id: string;
  author: string;
  content: string;
  taskId: string | null;
  taskTitle?: string;
  createdAt: Date;
}

export interface Activity {
  id: string;
  type: 'task_update' | 'comment' | 'log' | 'status_change';
  message: string;
  author: string;
  timestamp: Date;
  taskId?: string;
}

// Status configuration
export const STATUS_CONFIG: Record<TaskStatus, { label: string; color: string; bg: string; icon: string }> = {
  done:        { label: '완료', color: '#00C875', bg: '#00C87520', icon: '✓' },
  in_progress: { label: '진행중', color: '#FDAB3D', bg: '#FDAB3D20', icon: '◉' },
  pending:     { label: '대기', color: '#C4C4C4', bg: '#C4C4C420', icon: '○' },
  blocked:     { label: '막힘', color: '#E2445C', bg: '#E2445C20', icon: '✕' },
};

export const PRIORITY_CONFIG: Record<TaskPriority, { label: string; color: string; icon: string }> = {
  critical: { label: '긴급', color: '#333333', icon: '🔥' },
  high:     { label: '높음', color: '#E2445C', icon: '🔴' },
  medium:   { label: '보통', color: '#FDAB3D', icon: '🟡' },
  low:      { label: '낮음', color: '#579BFC', icon: '🔵' },
};

// Monday.com style group colors
export const GROUP_COLORS = [
  '#579BFC', '#00C875', '#FDAB3D', '#E2445C', '#A25DDC',
  '#FF642E', '#CAB641', '#00D2D2', '#FF158A', '#037F4C',
];
