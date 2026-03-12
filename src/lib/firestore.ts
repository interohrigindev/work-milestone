import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import type { Project, Milestone, DailyLog, Comment } from '../types';

// ---- helpers ----
function tsToDate(ts: unknown): Date {
  if (ts instanceof Timestamp) return ts.toDate();
  if (ts instanceof Date) return ts;
  return new Date();
}

// ---- Projects ----
export function subscribeProjects(cb: (projects: Project[]) => void) {
  const q = query(collection(db, 'projects'), orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snap) => {
    cb(
      snap.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          title: data.title,
          description: data.description,
          status: data.status,
          overallProgress: data.overallProgress ?? 0,
          createdAt: tsToDate(data.createdAt),
          updatedAt: tsToDate(data.updatedAt),
        } as Project;
      })
    );
  });
}

export async function createProject(data: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) {
  return addDoc(collection(db, 'projects'), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function updateProject(id: string, data: Partial<Project>) {
  const { id: _id, createdAt: _ca, ...rest } = data as Record<string, unknown>;
  void _id;
  void _ca;
  return updateDoc(doc(db, 'projects', id), {
    ...rest,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteProject(id: string) {
  return deleteDoc(doc(db, 'projects', id));
}

// ---- Milestones ----
export function subscribeMilestones(projectId: string, cb: (milestones: Milestone[]) => void) {
  const q = query(
    collection(db, 'projects', projectId, 'milestones'),
    orderBy('order', 'asc')
  );
  return onSnapshot(q, (snap) => {
    cb(
      snap.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          projectId,
          title: data.title,
          description: data.description ?? '',
          status: data.status,
          progress: data.progress ?? 0,
          dueDate: tsToDate(data.dueDate),
          order: data.order ?? 0,
        } as Milestone;
      })
    );
  });
}

export async function createMilestone(
  projectId: string,
  data: Omit<Milestone, 'id' | 'projectId'>
) {
  return addDoc(collection(db, 'projects', projectId, 'milestones'), data);
}

export async function updateMilestone(
  projectId: string,
  milestoneId: string,
  data: Partial<Milestone>
) {
  const { id: _id, projectId: _pid, ...rest } = data as Record<string, unknown>;
  void _id;
  void _pid;
  return updateDoc(doc(db, 'projects', projectId, 'milestones', milestoneId), rest);
}

export async function deleteMilestone(projectId: string, milestoneId: string) {
  return deleteDoc(doc(db, 'projects', projectId, 'milestones', milestoneId));
}

// ---- Daily Logs ----
export function subscribeDailyLogs(projectId: string, cb: (logs: DailyLog[]) => void) {
  const q = query(
    collection(db, 'projects', projectId, 'dailyLogs'),
    orderBy('createdAt', 'desc')
  );
  return onSnapshot(q, (snap) => {
    cb(
      snap.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          projectId,
          content: data.content,
          author: data.author ?? 'JY',
          createdAt: tsToDate(data.createdAt),
        } as DailyLog;
      })
    );
  });
}

export async function createDailyLog(projectId: string, content: string, author = 'JY') {
  return addDoc(collection(db, 'projects', projectId, 'dailyLogs'), {
    content,
    author,
    createdAt: serverTimestamp(),
  });
}

export async function deleteDailyLog(projectId: string, logId: string) {
  return deleteDoc(doc(db, 'projects', projectId, 'dailyLogs', logId));
}

// ---- Comments (viewer) ----
export function subscribeComments(projectId: string, cb: (comments: Comment[]) => void) {
  const q = query(
    collection(db, 'projects', projectId, 'comments'),
    orderBy('createdAt', 'desc')
  );
  return onSnapshot(q, (snap) => {
    cb(
      snap.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          projectId,
          content: data.content,
          author: data.author,
          createdAt: tsToDate(data.createdAt),
        } as Comment;
      })
    );
  });
}

export async function createComment(projectId: string, content: string, author: string) {
  return addDoc(collection(db, 'projects', projectId, 'comments'), {
    content,
    author,
    createdAt: serverTimestamp(),
  });
}

export async function deleteComment(projectId: string, commentId: string) {
  return deleteDoc(doc(db, 'projects', projectId, 'comments', commentId));
}
