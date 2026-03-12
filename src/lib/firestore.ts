import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  setDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import type { Project, Task, DailyLog, Comment } from '../types';

function tsToDate(ts: unknown): Date {
  if (ts instanceof Timestamp) return ts.toDate();
  if (ts instanceof Date) return ts;
  return new Date();
}

// ---- Projects (list all) ----
export function subscribeAllProjects(cb: (projects: Project[]) => void) {
  const q = query(collection(db, 'projects'), orderBy('updatedAt', 'desc'));
  return onSnapshot(q, (snap) => {
    cb(snap.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        title: data.title ?? '',
        subtitle: data.subtitle ?? '',
        startDate: data.startDate ?? '',
        endDate: data.endDate ?? '',
        overallProgress: data.overallProgress ?? 0,
        currentPhase: data.currentPhase ?? '',
        githubRepo: data.githubRepo ?? '',
        updatedAt: tsToDate(data.updatedAt),
      } as Project;
    }));
  });
}

export async function createNewProject(data: Omit<Project, 'id' | 'updatedAt'>): Promise<string> {
  const ref = await addDoc(collection(db, 'projects'), {
    ...data,
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function deleteProject(projectId: string) {
  return deleteDoc(doc(db, 'projects', projectId));
}

// ---- Project ----
export function subscribeProject(projectId: string, cb: (project: Project | null) => void) {
  return onSnapshot(doc(db, 'projects', projectId), (snap) => {
    if (!snap.exists()) { cb(null); return; }
    const d = snap.data();
    cb({
      id: snap.id,
      title: d.title ?? '',
      subtitle: d.subtitle ?? '',
      startDate: d.startDate ?? '',
      endDate: d.endDate ?? '',
      overallProgress: d.overallProgress ?? 0,
      currentPhase: d.currentPhase ?? '',
      githubRepo: d.githubRepo ?? '',
      updatedAt: tsToDate(d.updatedAt),
    });
  });
}

export async function updateProject(projectId: string, data: Partial<Project>) {
  const { id: _, ...rest } = data as Record<string, unknown>;
  void _;
  return updateDoc(doc(db, 'projects', projectId), {
    ...rest,
    updatedAt: serverTimestamp(),
  });
}

export async function setProject(projectId: string, data: Omit<Project, 'id' | 'updatedAt'>) {
  return setDoc(doc(db, 'projects', projectId), {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

// ---- Tasks ----
export function subscribeTasks(projectId: string, cb: (tasks: Task[]) => void) {
  const q = query(
    collection(db, 'projects', projectId, 'tasks'),
    orderBy('order', 'asc')
  );
  return onSnapshot(q, (snap) => {
    cb(snap.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        order: data.order ?? 0,
        day: data.day ?? 1,
        dayLabel: data.dayLabel ?? '',
        title: data.title ?? '',
        prompt: data.prompt ?? '',
        detail: data.detail ?? '',
        timeSlot: data.timeSlot ?? '',
        difficulty: data.difficulty ?? '●○○',
        status: data.status ?? 'pending',
        progress: data.progress ?? 0,
        category: data.category ?? '',
        color: data.color ?? '#6B7280',
        completedAt: data.completedAt ? tsToDate(data.completedAt) : null,
        notes: data.notes ?? '',
      } as Task;
    }));
  });
}

export async function createTask(projectId: string, data: Omit<Task, 'id'>) {
  return addDoc(collection(db, 'projects', projectId, 'tasks'), data);
}

export async function updateTask(projectId: string, taskId: string, data: Partial<Task>) {
  const { id: _, ...rest } = data as Record<string, unknown>;
  void _;
  return updateDoc(doc(db, 'projects', projectId, 'tasks', taskId), rest);
}

export async function deleteTask(projectId: string, taskId: string) {
  return deleteDoc(doc(db, 'projects', projectId, 'tasks', taskId));
}

// ---- Daily Logs ----
export function subscribeDailyLogs(projectId: string, cb: (logs: DailyLog[]) => void) {
  const q = query(
    collection(db, 'projects', projectId, 'dailyLogs'),
    orderBy('day', 'desc')
  );
  return onSnapshot(q, (snap) => {
    cb(snap.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        date: data.date ?? '',
        day: data.day ?? 0,
        content: data.content ?? '',
        achievements: data.achievements ?? [],
        blockers: data.blockers ?? [],
        tomorrowPlan: data.tomorrowPlan ?? '',
        createdAt: tsToDate(data.createdAt),
      } as DailyLog;
    }));
  });
}

export async function createDailyLog(projectId: string, data: Omit<DailyLog, 'id' | 'createdAt'>) {
  return addDoc(collection(db, 'projects', projectId, 'dailyLogs'), {
    ...data,
    createdAt: serverTimestamp(),
  });
}

export async function updateDailyLog(projectId: string, logId: string, data: Partial<DailyLog>) {
  const { id: _, ...rest } = data as Record<string, unknown>;
  void _;
  return updateDoc(doc(db, 'projects', projectId, 'dailyLogs', logId), rest);
}

export async function deleteDailyLog(projectId: string, logId: string) {
  return deleteDoc(doc(db, 'projects', projectId, 'dailyLogs', logId));
}

// ---- Comments ----
export function subscribeComments(projectId: string, cb: (comments: Comment[]) => void) {
  const q = query(
    collection(db, 'projects', projectId, 'comments'),
    orderBy('createdAt', 'desc')
  );
  return onSnapshot(q, (snap) => {
    cb(snap.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        author: data.author ?? '',
        content: data.content ?? '',
        taskId: data.taskId ?? null,
        taskTitle: data.taskTitle ?? '',
        createdAt: tsToDate(data.createdAt),
      } as Comment;
    }));
  });
}

export async function createComment(projectId: string, data: Omit<Comment, 'id' | 'createdAt'>) {
  return addDoc(collection(db, 'projects', projectId, 'comments'), {
    ...data,
    createdAt: serverTimestamp(),
  });
}

export async function deleteComment(projectId: string, commentId: string) {
  return deleteDoc(doc(db, 'projects', projectId, 'comments', commentId));
}

// ---- Auto-calculate progress ----
export function calcOverallProgress(tasks: Task[]): number {
  if (tasks.length === 0) return 0;
  const done = tasks.filter((t) => t.status === 'done').length;
  return Math.round((done / tasks.length) * 100);
}

export function calcDayProgress(tasks: Task[]): number {
  if (tasks.length === 0) return 0;
  const done = tasks.filter((t) => t.status === 'done').length;
  return Math.round((done / tasks.length) * 100);
}
