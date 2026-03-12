export interface Project {
  id: string;
  title: string;
  description: string;
  status: 'planning' | 'in-progress' | 'review' | 'completed';
  overallProgress: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Milestone {
  id: string;
  projectId: string;
  title: string;
  description: string;
  status: 'pending' | 'in-progress' | 'completed';
  progress: number;
  dueDate: Date;
  order: number;
}

export interface DailyLog {
  id: string;
  projectId: string;
  content: string;
  createdAt: Date;
  author: string;
}

export interface Comment {
  id: string;
  projectId: string;
  content: string;
  author: string;
  createdAt: Date;
}
