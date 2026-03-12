import { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ClipboardList, FileText, MessageCircle, Github, FolderOpen } from 'lucide-react';
import Header from '../components/Header';
import DayGroup from '../components/DayGroup';
import DailyLogCard from '../components/DailyLogCard';
import CommentSection from '../components/CommentSection';
import GitHubPanel from '../components/GitHubPanel';
import ProgressBar from '../components/ProgressBar';
import {
  subscribeProject,
  subscribeAllProjects,
  subscribeTasks,
  subscribeDailyLogs,
  subscribeComments,
  createComment,
} from '../lib/firestore';
import type { Project, Task, DailyLog, Comment } from '../types';

type TabId = 'schedule' | 'logs' | 'comments' | 'github';

/** Project list view when no projectId is specified */
function ProjectListView() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const unsub = subscribeAllProjects((p) => {
      setProjects(p);
      setLoaded(true);
    });
    return unsub;
  }, []);

  // If only one project exists, redirect directly to it
  useEffect(() => {
    if (loaded && projects.length === 1) {
      navigate(`/view/${projects[0].id}`, { replace: true });
    }
  }, [loaded, projects, navigate]);

  if (!loaded) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-text-dim text-sm">로딩 중...</p>
        </div>
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-dark-card border border-dark-border rounded-2xl flex items-center justify-center mx-auto mb-5">
            <ClipboardList className="w-8 h-8 text-gold" />
          </div>
          <h1 className="text-2xl font-bold text-text-bright mb-2">INTEROHRIGIN</h1>
          <p className="text-text-mid mb-1">프로젝트 트래커</p>
          <p className="text-sm text-text-dim mb-8">
            아직 등록된 프로젝트가 없습니다.<br />
            관리자가 프로젝트를 생성하면 이 화면에 목록이 표시됩니다.
          </p>
          <a
            href="/admin/login"
            className="inline-flex items-center gap-2 bg-gold text-dark-bg px-6 py-3 rounded-xl font-bold hover:bg-gold-dim transition-colors"
          >
            관리자로 시작하기
          </a>
        </div>
      </div>
    );
  }

  // Multiple projects — show list (single project auto-redirects above)
  return (
    <div className="min-h-screen bg-dark-bg">
      <div className="bg-dark-card border-b border-dark-border">
        <div className="max-w-5xl mx-auto px-4 py-5">
          <h1 className="text-lg font-bold text-gold">INTEROHRIGIN</h1>
          <p className="text-xs text-text-dim">프로젝트 트래커</p>
        </div>
      </div>

      <main className="max-w-5xl mx-auto px-4 py-8">
        <h2 className="text-text-bright font-bold text-lg mb-6">
          프로젝트 목록
          <span className="text-text-dim text-sm font-normal ml-2">({projects.length})</span>
        </h2>
        <div className="grid gap-4">
          {projects.map((p) => (
            <div
              key={p.id}
              className="bg-dark-card border border-dark-border rounded-xl p-5 hover:border-gold/30 transition-colors cursor-pointer group"
              onClick={() => navigate(`/view/${p.id}`)}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-text-bright font-bold truncate group-hover:text-gold transition-colors">
                      {p.title}
                    </h3>
                    {p.githubRepo && <Github className="w-4 h-4 text-text-dim flex-shrink-0" />}
                  </div>
                  {p.subtitle && (
                    <p className="text-sm text-text-dim truncate mb-2">{p.subtitle}</p>
                  )}
                  <div className="flex items-center gap-4 text-xs text-text-dim">
                    {p.startDate && p.endDate && (
                      <span>{p.startDate} ~ {p.endDate}</span>
                    )}
                    <span className="bg-dark-border px-2 py-0.5 rounded-full">{p.currentPhase}</span>
                  </div>
                </div>
                <div className="w-24 flex-shrink-0">
                  <ProgressBar progress={p.overallProgress} showLabel={false} size="sm" />
                  <p className="text-[10px] text-text-dim text-center mt-1 font-mono">{p.overallProgress}%</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>

      <footer className="text-center py-8 text-xs text-text-dim border-t border-dark-border">
        <span className="text-gold">INTEROHRIGIN</span> — 프로젝트 트래커
      </footer>
    </div>
  );
}

/** Single project detail view */
function ProjectDetailView({ projectId }: { projectId: string }) {
  const [project, setProject] = useState<Project | null>(null);
  const [projectLoaded, setProjectLoaded] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [logs, setLogs] = useState<DailyLog[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [activeTab, setActiveTab] = useState<TabId>('schedule');

  useEffect(() => {
    setProjectLoaded(false);
    const unsubs = [
      subscribeProject(projectId, (p) => {
        setProject(p);
        setProjectLoaded(true);
      }),
      subscribeTasks(projectId, setTasks),
      subscribeDailyLogs(projectId, setLogs),
      subscribeComments(projectId, setComments),
    ];
    return () => unsubs.forEach((u) => u());
  }, [projectId]);

  const hasNewLog = useMemo(() => {
    const dayAgo = Date.now() - 24 * 60 * 60 * 1000;
    return logs.some((l) => l.createdAt.getTime() > dayAgo);
  }, [logs]);

  const recentTaskCount = useMemo(() => {
    const dayAgo = Date.now() - 24 * 60 * 60 * 1000;
    return tasks.filter(
      (t) => t.completedAt && new Date(t.completedAt).getTime() > dayAgo
    ).length;
  }, [tasks]);

  if (!projectLoaded) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-text-dim text-sm">로딩 중...</p>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-dark-card border border-dark-border rounded-2xl flex items-center justify-center mx-auto mb-5">
            <FolderOpen className="w-8 h-8 text-text-dim" />
          </div>
          <h1 className="text-xl font-bold text-text-bright mb-2">프로젝트를 찾을 수 없습니다</h1>
          <p className="text-sm text-text-dim mb-8">
            링크가 올바른지 확인해 주세요.
          </p>
          <a
            href="/"
            className="inline-flex items-center gap-2 bg-gold text-dark-bg px-6 py-3 rounded-xl font-bold hover:bg-gold-dim transition-colors"
          >
            홈으로 돌아가기
          </a>
        </div>
      </div>
    );
  }

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

export default function ViewerPage() {
  const { projectId: paramId } = useParams<{ projectId: string }>();

  // If no projectId in URL, show project list (or auto-redirect if only one)
  if (!paramId) {
    return <ProjectListView />;
  }

  return <ProjectDetailView projectId={paramId} />;
}
