import { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  FileText,
  MessageCircle,
  Github,
  FolderOpen,
  Activity,
} from 'lucide-react';
import Sidebar from '../components/Sidebar';
import ViewSwitcher from '../components/ViewSwitcher';
import BoardTableView from '../components/BoardTableView';
import KanbanView from '../components/KanbanView';
import TimelineView from '../components/TimelineView';
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
import type { Project, Task, DailyLog, Comment, ViewMode } from '../types';

type PanelTab = 'board' | 'logs' | 'comments' | 'github';

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

  useEffect(() => {
    if (loaded && projects.length === 1) {
      navigate(`/view/${projects[0].id}`, { replace: true });
    }
  }, [loaded, projects, navigate]);

  if (!loaded) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
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
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-white font-bold text-sm">IO</span>
            </div>
          </div>
          <h1 className="text-2xl font-bold text-text-bright mb-2">INTEROHRIGIN</h1>
          <p className="text-text-mid mb-1">프로젝트 관리 플랫폼</p>
          <p className="text-sm text-text-dim mb-8">
            아직 등록된 프로젝트가 없습니다.<br />
            관리자가 프로젝트를 생성하면 이 화면에 목록이 표시됩니다.
          </p>
          <a
            href="/admin/login"
            className="inline-flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-xl font-bold hover:bg-primary-hover transition-colors"
          >
            관리자로 시작하기
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-bg">
      <div className="bg-dark-surface border-b border-dark-border">
        <div className="max-w-5xl mx-auto px-4 py-5">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-white font-bold text-xs">IO</span>
            </div>
            <h1 className="text-lg font-bold text-text-bright">INTEROHRIGIN</h1>
          </div>
          <p className="text-xs text-text-dim mt-1">프로젝트 관리 플랫폼</p>
        </div>
      </div>

      <main className="max-w-5xl mx-auto px-4 py-8">
        <h2 className="text-text-bright font-bold text-lg mb-6">
          프로젝트 목록
          <span className="text-text-dim text-sm font-normal ml-2">({projects.length})</span>
        </h2>
        <div className="grid gap-3">
          {projects.map((p) => (
            <div
              key={p.id}
              className="bg-dark-card border border-dark-border rounded-xl p-5 hover:border-primary/30 transition-all cursor-pointer group"
              onClick={() => navigate(`/view/${p.id}`)}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-text-bright font-bold truncate group-hover:text-primary transition-colors">
                      {p.title}
                    </h3>
                    {p.githubRepo && <Github className="w-4 h-4 text-text-dim flex-shrink-0" />}
                  </div>
                  {p.subtitle && (
                    <p className="text-sm text-text-dim truncate mb-2">{p.subtitle}</p>
                  )}
                  <div className="flex items-center gap-4 text-xs text-text-dim">
                    {p.startDate && p.endDate && (
                      <span className="font-mono">{p.startDate} ~ {p.endDate}</span>
                    )}
                    <span className="bg-dark-border px-2 py-0.5 rounded-full">{p.currentPhase}</span>
                  </div>
                </div>
                <div className="w-28 flex-shrink-0">
                  <ProgressBar progress={p.overallProgress} showLabel={false} size="sm" />
                  <p className="text-[10px] text-text-dim text-center mt-1 font-mono">{p.overallProgress}%</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

/** Single project detail view with Monday.com layout */
function ProjectDetailView({ projectId }: { projectId: string }) {
  const [allProjects, setAllProjects] = useState<Project[]>([]);
  const [project, setProject] = useState<Project | null>(null);
  const [projectLoaded, setProjectLoaded] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [logs, setLogs] = useState<DailyLog[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [activePanel, setActivePanel] = useState<PanelTab>('board');
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  useEffect(() => {
    setProjectLoaded(false);
    const unsubs = [
      subscribeAllProjects(setAllProjects),
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

  // Filter tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter(t => {
      if (searchQuery && !t.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      if (filterStatus && t.status !== filterStatus) return false;
      return true;
    });
  }, [tasks, searchQuery, filterStatus]);

  if (!projectLoaded) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
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
          <p className="text-sm text-text-dim mb-8">링크가 올바른지 확인해 주세요.</p>
          <a
            href="/"
            className="inline-flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-xl font-bold hover:bg-primary-hover transition-colors"
          >
            홈으로 돌아가기
          </a>
        </div>
      </div>
    );
  }

  function handleAddComment(data: { content: string; author: string; taskId: string | null; taskTitle: string }) {
    createComment(projectId, data);
  }

  function handleAddTaskComment(taskId: string, taskTitle: string, content: string, author: string) {
    createComment(projectId, { author, content, taskId, taskTitle });
  }

  const doneCount = tasks.filter(t => t.status === 'done').length;
  const inProgressCount = tasks.filter(t => t.status === 'in_progress').length;
  const blockedCount = tasks.filter(t => t.status === 'blocked').length;

  return (
    <div className="min-h-screen bg-dark-bg flex">
      {/* Sidebar */}
      <Sidebar
        projects={allProjects}
        currentProjectId={projectId}
      />

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* View Switcher */}
        {activePanel === 'board' && (
          <ViewSwitcher
            activeView={viewMode}
            onViewChange={setViewMode}
            projectTitle={project.title}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            filterStatus={filterStatus}
            onFilterStatusChange={setFilterStatus}
          />
        )}

        {/* Panel tabs */}
        <div className="bg-dark-surface border-b border-dark-border">
          {activePanel !== 'board' && (
            <div className="px-6 pt-4 pb-2">
              <h1 className="text-lg font-bold text-text-bright">{project.title}</h1>
              <p className="text-xs text-text-dim mt-0.5">{project.subtitle}</p>
            </div>
          )}
          <div className="px-6 flex items-center gap-0.5 overflow-x-auto no-scrollbar">
            <TabBtn active={activePanel === 'board'} onClick={() => setActivePanel('board')} icon={<Activity className="w-4 h-4" />} label="보드" />
            <TabBtn active={activePanel === 'logs'} onClick={() => setActivePanel('logs')} icon={<FileText className="w-4 h-4" />} label="데일리 로그" badge={logs.length} />
            <TabBtn active={activePanel === 'comments'} onClick={() => setActivePanel('comments')} icon={<MessageCircle className="w-4 h-4" />} label="의견" badge={comments.length} />
            {project.githubRepo && (
              <TabBtn active={activePanel === 'github'} onClick={() => setActivePanel('github')} icon={<Github className="w-4 h-4" />} label="개발 현황" />
            )}
          </div>
        </div>

        {/* Stats bar */}
        <div className="bg-dark-surface/50 border-b border-dark-border px-6 py-2 flex items-center gap-6">
          <StatPill label="전체" value={tasks.length} color="#579BFC" />
          <StatPill label="완료" value={doneCount} color="#00C875" />
          <StatPill label="진행중" value={inProgressCount} color="#FDAB3D" />
          <StatPill label="막힘" value={blockedCount} color="#E2445C" />
          <div className="flex-1" />
          <div className="flex items-center gap-2">
            <span className="text-xs text-text-dim">진행률</span>
            <div className="w-32 h-2 bg-dark-border rounded-full overflow-hidden">
              <div
                className="h-full bg-status-done rounded-full transition-all duration-500"
                style={{ width: `${project.overallProgress}%` }}
              />
            </div>
            <span className="font-mono text-xs font-bold text-text-bright">{project.overallProgress}%</span>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {activePanel === 'board' && viewMode === 'table' && (
            <BoardTableView
              tasks={filteredTasks}
              comments={comments}
              onAddComment={handleAddTaskComment}
            />
          )}
          {activePanel === 'board' && viewMode === 'kanban' && (
            <KanbanView
              tasks={filteredTasks}
              comments={comments}
              onAddComment={handleAddTaskComment}
            />
          )}
          {activePanel === 'board' && viewMode === 'timeline' && (
            <TimelineView
              tasks={filteredTasks}
              projectStartDate={project.startDate}
              projectEndDate={project.endDate}
            />
          )}

          {activePanel === 'logs' && (
            <div className="max-w-4xl mx-auto px-6 py-6 space-y-4">
              {logs.length === 0 && (
                <p className="text-center text-text-dim py-16">아직 로그가 없습니다.</p>
              )}
              {logs.map((log) => (
                <DailyLogCard key={log.id} log={log} />
              ))}
            </div>
          )}

          {activePanel === 'comments' && (
            <div className="max-w-4xl mx-auto px-6 py-6">
              <CommentSection
                comments={comments}
                tasks={tasks}
                onAdd={handleAddComment}
              />
            </div>
          )}

          {activePanel === 'github' && project.githubRepo && (
            <div className="max-w-4xl mx-auto px-6 py-6">
              <GitHubPanel repoUrl={project.githubRepo} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Helper
function TabBtn({ active, onClick, icon, label, badge }: {
  active: boolean; onClick: () => void; icon: React.ReactNode; label: string; badge?: number;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
        active ? 'border-primary text-primary' : 'border-transparent text-text-dim hover:text-text-mid'
      }`}
    >
      {icon}
      {label}
      {badge !== undefined && badge > 0 && (
        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-primary/20 text-primary">
          {badge}
        </span>
      )}
    </button>
  );
}

function StatPill({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className="w-2 h-2 rounded" style={{ backgroundColor: color }} />
      <span className="text-[11px] text-text-dim">{label}</span>
      <span className="text-[11px] font-bold font-mono text-text-bright">{value}</span>
    </div>
  );
}

export default function ViewerPage() {
  const { projectId: paramId } = useParams<{ projectId: string }>();

  if (!paramId) {
    return <ProjectListView />;
  }

  return <ProjectDetailView projectId={paramId} />;
}
