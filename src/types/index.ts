export interface Project {
  id: string;
  title: string;
  subtitle: string;
  startDate: string;
  endDate: string;
  overallProgress: number;
  currentPhase: string;
  updatedAt: Date;
}

export type TaskStatus = 'pending' | 'in_progress' | 'done' | 'blocked';

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
