import { useEffect, useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { ClipboardList, FileText, MessageCircle, Github } from 'lucide-react';
import Header from '../components/Header';
import DayGroup from '../components/DayGroup';
import DailyLogCard from '../components/DailyLogCard';
import CommentSection from '../components/CommentSection';
import GitHubPanel from '../components/GitHubPanel';
import {
  subscribeProject,
  subscribeTasks,
  subscribeDailyLogs,
  subscribeComments,
  createComment,
} from '../lib/firestore';
import { DEFAULT_PROJECT_ID } from '../lib/seed';
import type { Project, Task, DailyLog, Comment } from '../types';

type TabId = 'schedule' | 'logs' | 'comments' | 'github';

export default function ViewerPage() {
  const { projectId: paramId } = useParams<{ projectId: string }>();
  const projectId = paramId || DEFAULT_PROJECT_ID;

  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [logs, setLogs] = useState<DailyLog[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [activeTab, setActiveTab] = useState<TabId>('schedule');

  useEffect(() => {
    const unsubs = [
      subscribeProject(projectId, setProject),
      subscribeTasks(projectId, setTasks),
      subscribeDailyLogs(projectId, setLogs),
      subscribeComments(projectId, setComments),
    ];
    return () => unsubs.forEach((u) => u());
  }, [projectId]);

  // Check if any daily log was created in the last 24 hours
  const hasNewLog = useMemo(() => {
    const dayAgo = Date.now() - 24 * 60 * 60 * 1000;
    return logs.some((l) => l.createdAt.getTime() > dayAgo);
  }, [logs]);

  // Count recently changed tasks (completed within 24 hours)
  const recentTaskCount = useMemo(() => {
    const dayAgo = Date.now() - 24 * 60 * 60 * 1000;
    return tasks.filter(
      (t) => t.completedAt && new Date(t.completedAt).getTime() > dayAgo
    ).length;
  }, [tasks]);

  if (!project) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-text-dim text-sm">로딩 중...</p>
        </div>
      </div>
    );
  }

  // Group tasks by day
  const dayGroups = tasks.reduce<Record<number, Task[]>>((acc, t) => {
    (acc[t.day] ??= []).push(t);
    return acc;
  }, {});
  const days = Object.keys(dayGroups).map(Number).sort();

  const dayCategories: Record<number, string> = {
    1: '기반 설정 + DB',
    2: '채용 CRUD',
    3: '면접 + 분석 엔진',
    4: '핵심 엔진 + 리포트',
    5: '완성 + 배포',
  };

  function handleAddComment(data: { content: string; author: string; taskId: string | null; taskTitle: string }) {
    createComment(projectId, data);
  }

  function handleAddTaskComment(taskId: string, taskTitle: string, content: string, author: string) {
    createComment(projectId, { author, content, taskId, taskTitle });
  }

  return (
    <div className="min-h-screen bg-dark-bg">
      <Header project={project} tasks={tasks} />

      {/* Tabs */}
      <div className="sticky top-0 z-20 bg-dark-bg border-b border-dark-border">
        <div className="max-w-5xl mx-auto px-4">
          <div className="flex gap-1 overflow-x-auto no-scrollbar">
            {/* Schedule tab */}
            <button
              onClick={() => setActiveTab('schedule')}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold whitespace-nowrap border-b-2 transition-colors ${
                activeTab === 'schedule'
                  ? 'border-gold text-gold'
                  : 'border-transparent text-text-dim hover:text-text-mid'
              }`}
            >
              <ClipboardList className="w-4 h-4" />
              공정표
              {recentTaskCount > 0 && (
                <span className="text-[10px] bg-status-blocked text-white px-1.5 py-0.5 rounded-full font-bold animate-pulse">
                  {recentTaskCount} NEW
                </span>
              )}
            </button>
            {/* Logs tab */}
            <button
              onClick={() => setActiveTab('logs')}
              className={`relative flex items-center gap-2 px-4 py-3 text-sm font-semibold whitespace-nowrap border-b-2 transition-colors ${
                activeTab === 'logs'
                  ? 'border-gold text-gold'
                  : 'border-transparent text-text-dim hover:text-text-mid'
              }`}
            >
              <FileText className="w-4 h-4" />
              데일리 로그
              {hasNewLog && activeTab !== 'logs' && (
                <span className="w-2 h-2 bg-status-blocked rounded-full animate-pulse" />
              )}
              {logs.length > 0 && (
                <span className="text-xs bg-gold/20 text-gold px-1.5 py-0.5 rounded-full font-mono">
                  {logs.length}
                </span>
              )}
            </button>
            {/* Comments tab */}
            <button
              onClick={() => setActiveTab('comments')}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold whitespace-nowrap border-b-2 transition-colors ${
                activeTab === 'comments'
                  ? 'border-gold text-gold'
                  : 'border-transparent text-text-dim hover:text-text-mid'
              }`}
            >
              <MessageCircle className="w-4 h-4" />
              의견
              {comments.length > 0 && (
                <span className="text-xs bg-gold/20 text-gold px-1.5 py-0.5 rounded-full font-mono">
                  {comments.length}
                </span>
              )}
            </button>
            {/* GitHub tab - only show if repo is connected */}
            {project?.githubRepo && (
              <button
                onClick={() => setActiveTab('github')}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold whitespace-nowrap border-b-2 transition-colors ${
                  activeTab === 'github'
                    ? 'border-gold text-gold'
                    : 'border-transparent text-text-dim hover:text-text-mid'
                }`}
              >
                <Github className="w-4 h-4" />
                개발 현황
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Tab content */}
      <main className="max-w-5xl mx-auto px-4 py-6">
        {activeTab === 'schedule' && (
          <div>
            {days.map((day) => (
              <DayGroup
                key={day}
                day={day}
                dayLabel={dayGroups[day][0]?.dayLabel ?? `Day ${day}`}
                category={dayCategories[day] ?? ''}
                tasks={dayGroups[day]}
                comments={comments}
                onAddComment={handleAddTaskComment}
              />
            ))}
            {days.length === 0 && (
              <p className="text-center text-text-dim py-16">작업이 없습니다.</p>
            )}
          </div>
        )}

        {activeTab === 'logs' && (
          <div className="space-y-4">
            {logs.length === 0 && (
              <p className="text-center text-text-dim py-16">아직 로그가 없습니다.</p>
            )}
            {logs.map((log) => (
              <DailyLogCard key={log.id} log={log} />
            ))}
          </div>
        )}

        {activeTab === 'comments' && (
          <CommentSection
            comments={comments}
            tasks={tasks}
            onAdd={handleAddComment}
          />
        )}

        {activeTab === 'github' && project?.githubRepo && (
          <GitHubPanel repoUrl={project.githubRepo} />
        )}
      </main>

      <footer className="text-center py-8 text-xs text-text-dim border-t border-dark-border">
        <span className="text-gold">INTEROHRIGIN</span> — 프로젝트 트래커
      </footer>
    </div>
  );
}
