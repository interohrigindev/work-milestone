import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  FileText,
  MessageCircle,
  Github,
  Database,
  Plus,
  Activity,
} from 'lucide-react';
import { isAdminAuthenticated, logoutAdmin } from '../lib/auth';
import { fetchEmployees } from '../lib/employees';
import type { Employee } from '../lib/employees';
import Sidebar from '../components/Sidebar';
import ViewSwitcher from '../components/ViewSwitcher';
import BoardTableView from '../components/BoardTableView';
import KanbanView from '../components/KanbanView';
import TimelineView from '../components/TimelineView';
import SharePanel from '../components/SharePanel';
import GitHubPanel from '../components/GitHubPanel';
import DailyLogCard from '../components/DailyLogCard';
import CommentSection from '../components/CommentSection';
import {
  subscribeProject,
  subscribeAllProjects,
  subscribeTasks,
  subscribeDailyLogs,
  subscribeComments,
  updateTask,
  updateProject,
  createDailyLog,
  deleteDailyLog,
  createComment,
  deleteComment,
  deleteTask,
  createTask,
  calcOverallProgress,
} from '../lib/firestore';
import { seedProject, DEFAULT_PROJECT_ID } from '../lib/seed';
import type { Project, Task, DailyLog, Comment, ViewMode } from '../types';

type PanelTab = 'board' | 'logs' | 'comments' | 'github' | 'share' | 'activity';

export default function AdminPage() {
  const navigate = useNavigate();
  const { projectId: paramId } = useParams<{ projectId: string }>();
  const projectId = paramId || DEFAULT_PROJECT_ID;

  const [allProjects, setAllProjects] = useState<Project[]>([]);
  const [project, setProject] = useState<Project | null>(null);
  const [projectLoaded, setProjectLoaded] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [logs, setLogs] = useState<DailyLog[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [activePanel, setActivePanel] = useState<PanelTab>('board');
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [seeding, setSeeding] = useState(false);
  const [showLogForm, setShowLogForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  // Comment read tracking
  const [lastReadCommentCount, setLastReadCommentCount] = useState(() => {
    const stored = localStorage.getItem('admin_read_comments');
    return stored ? Number(stored) : 0;
  });
  const unreadCommentCount = Math.max(0, comments.length - lastReadCommentCount);

  const markCommentsRead = useCallback(() => {
    setLastReadCommentCount(comments.length);
    localStorage.setItem('admin_read_comments', String(comments.length));
  }, [comments.length]);

  // Log form state
  const [logDay, setLogDay] = useState(1);
  const [logDate, setLogDate] = useState('');
  const [logContent, setLogContent] = useState('');
  const [logAchievements, setLogAchievements] = useState('');
  const [logBlockers, setLogBlockers] = useState('');
  const [logTomorrowPlan, setLogTomorrowPlan] = useState('');

  useEffect(() => {
    if (!isAdminAuthenticated()) {
      navigate('/admin/login');
      return;
    }
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
    fetchEmployees().then(setEmployees);
    return () => unsubs.forEach((u) => u());
  }, [navigate, projectId]);

  // Auto-update overall progress
  useEffect(() => {
    if (!project || tasks.length === 0) return;
    const newProgress = calcOverallProgress(tasks);
    if (newProgress !== project.overallProgress) {
      updateProject(projectId, { overallProgress: newProgress });
    }
  }, [tasks, project, projectId]);

  function handleLogout() {
    logoutAdmin();
    navigate('/admin/login');
  }

  async function handleSeed() {
    setSeeding(true);
    try {
      await seedProject();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : '시드 실패');
    }
    setSeeding(false);
  }

  async function handleUpdateTask(taskId: string, data: Partial<Task>) {
    await updateTask(projectId, taskId, data);
  }

  function handleAddTaskComment(taskId: string, taskTitle: string, content: string, author: string) {
    createComment(projectId, { author, content, taskId, taskTitle });
  }

  async function handleAddTask(groupDay: number) {
    const dayTasks = tasks.filter(t => t.day === groupDay);
    const maxOrder = Math.max(...tasks.map(t => t.order), 0);
    const dayLabel = dayTasks[0]?.dayLabel ?? `Day ${groupDay}`;
    await createTask(projectId, {
      order: maxOrder + 1,
      day: groupDay,
      dayLabel,
      title: '새 작업',
      prompt: '',
      detail: '',
      timeSlot: '',
      difficulty: '●○○',
      status: 'pending',
      progress: 0,
      category: dayTasks[0]?.category ?? '',
      color: dayTasks[0]?.color ?? '#579BFC',
      completedAt: null,
      notes: '',
      assignee: '',
      priority: 'medium',
      dueDate: '',
      groupId: '',
      tags: [],
    });
  }

  async function handleDeleteTask(taskId: string) {
    await deleteTask(projectId, taskId);
  }

  async function handleAddLog(e: React.FormEvent) {
    e.preventDefault();
    await createDailyLog(projectId, {
      day: logDay,
      date: logDate,
      content: logContent,
      achievements: logAchievements.split('\n').filter(Boolean),
      blockers: logBlockers.split('\n').filter(Boolean),
      tomorrowPlan: logTomorrowPlan,
    });
    setLogContent('');
    setLogAchievements('');
    setLogBlockers('');
    setLogTomorrowPlan('');
    setShowLogForm(false);
  }

  function handlePanelSwitch(tab: PanelTab) {
    setActivePanel(tab);
    if (tab === 'comments') markCommentsRead();
  }

  // Filter tasks
  const filteredTasks = tasks.filter(t => {
    if (searchQuery && !t.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (filterStatus && t.status !== filterStatus) return false;
    return true;
  });

  // Loading
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

  // Project not found
  if (!project) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-dark-card border border-dark-border rounded-2xl flex items-center justify-center mx-auto mb-5">
            <Database className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-xl font-bold text-text-bright mb-2">프로젝트 초기 설정</h1>
          <p className="text-sm text-text-dim mb-8 leading-relaxed">
            Firestore에 아직 프로젝트 데이터가 없습니다.<br />
            아래 버튼을 눌러 초기 데이터를 생성하세요.
          </p>
          <button
            onClick={handleSeed}
            disabled={seeding}
            className="inline-flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-xl font-bold hover:bg-primary-hover disabled:opacity-50 transition-colors"
          >
            <Database className="w-5 h-5" />
            {seeding ? '생성 중...' : '초기 데이터 생성'}
          </button>
        </div>
      </div>
    );
  }

  // Stats
  const doneCount = tasks.filter(t => t.status === 'done').length;
  const inProgressCount = tasks.filter(t => t.status === 'in_progress').length;
  const blockedCount = tasks.filter(t => t.status === 'blocked').length;

  return (
    <div className="min-h-screen bg-dark-bg flex">
      {/* Sidebar */}
      <Sidebar
        projects={allProjects}
        currentProjectId={projectId}
        isAdmin
        onLogout={handleLogout}
        unreadCount={unreadCommentCount}
        employees={employees}
      />

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* View Switcher / Header */}
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

        {/* Panel tabs (non-board views) */}
        <div className="bg-dark-surface border-b border-dark-border">
          {activePanel !== 'board' && (
            <div className="px-6 pt-4 pb-2">
              <h1 className="text-lg font-bold text-text-bright">{project.title}</h1>
              <p className="text-xs text-text-dim mt-0.5">{project.subtitle}</p>
            </div>
          )}
          <div className="px-6 flex items-center gap-0.5 overflow-x-auto no-scrollbar">
            <PanelTabBtn
              active={activePanel === 'board'}
              onClick={() => handlePanelSwitch('board')}
              icon={<Activity className="w-4 h-4" />}
              label="보드"
            />
            <PanelTabBtn
              active={activePanel === 'logs'}
              onClick={() => handlePanelSwitch('logs')}
              icon={<FileText className="w-4 h-4" />}
              label="데일리 로그"
              badge={logs.length}
            />
            <PanelTabBtn
              active={activePanel === 'comments'}
              onClick={() => handlePanelSwitch('comments')}
              icon={<MessageCircle className="w-4 h-4" />}
              label="의견"
              badge={unreadCommentCount > 0 ? unreadCommentCount : comments.length}
              badgeType={unreadCommentCount > 0 ? 'alert' : 'info'}
            />
            <PanelTabBtn
              active={activePanel === 'github'}
              onClick={() => handlePanelSwitch('github')}
              icon={<Github className="w-4 h-4" />}
              label="GitHub"
              dot={!!project.githubRepo}
            />
            <PanelTabBtn
              active={activePanel === 'share'}
              onClick={() => handlePanelSwitch('share')}
              icon={<Activity className="w-4 h-4" />}
              label="공유"
            />
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

        {/* Content area */}
        <div className="flex-1 overflow-y-auto">
          {/* Board views */}
          {activePanel === 'board' && viewMode === 'table' && (
            <BoardTableView
              tasks={filteredTasks}
              comments={comments}
              employees={employees}
              isAdmin
              onUpdateTask={handleUpdateTask}
              onAddComment={handleAddTaskComment}
              onDeleteTask={handleDeleteTask}
              onAddTask={handleAddTask}
            />
          )}
          {activePanel === 'board' && viewMode === 'kanban' && (
            <KanbanView
              tasks={filteredTasks}
              comments={comments}
              employees={employees}
              isAdmin
              onUpdateTask={handleUpdateTask}
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

          {/* Daily logs */}
          {activePanel === 'logs' && (
            <div className="max-w-4xl mx-auto px-6 py-6">
              <div className="mb-4 flex items-center gap-3">
                <button
                  onClick={() => setShowLogForm(!showLogForm)}
                  className="inline-flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-primary-hover transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  {showLogForm ? '취소' : '오늘의 로그 작성'}
                </button>
              </div>

              {showLogForm && (
                <form onSubmit={handleAddLog} className="bg-dark-card rounded-xl border border-dark-border p-5 mb-6 space-y-4">
                  <div className="flex gap-3">
                    <div>
                      <label className="text-xs text-text-dim block mb-1">Day</label>
                      <input
                        type="number"
                        min={1}
                        max={99}
                        className="w-20 bg-dark-border border border-dark-border-light rounded-lg px-3 py-2 text-sm text-text-bright font-mono outline-none focus:border-primary"
                        value={logDay}
                        onChange={(e) => setLogDay(Number(e.target.value))}
                      />
                    </div>
                    <div className="flex-1">
                      <label className="text-xs text-text-dim block mb-1">날짜</label>
                      <input
                        type="date"
                        className="bg-dark-border border border-dark-border-light rounded-lg px-3 py-2 text-sm text-text-bright outline-none focus:border-primary"
                        value={logDate}
                        onChange={(e) => setLogDate(e.target.value)}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-text-dim block mb-1">오늘 한 일</label>
                    <textarea
                      className="w-full bg-dark-border border border-dark-border-light rounded-lg px-3 py-2 text-sm text-text-bright resize-none outline-none focus:border-primary"
                      rows={3}
                      value={logContent}
                      onChange={(e) => setLogContent(e.target.value)}
                      placeholder="오늘의 진행 상황..."
                    />
                  </div>
                  <div>
                    <label className="text-xs text-text-dim block mb-1">완료 항목 (줄바꿈 구분)</label>
                    <textarea
                      className="w-full bg-dark-border border border-dark-border-light rounded-lg px-3 py-2 text-sm text-text-bright resize-none outline-none focus:border-primary"
                      rows={2}
                      value={logAchievements}
                      onChange={(e) => setLogAchievements(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-text-dim block mb-1">이슈/차단 (줄바꿈 구분)</label>
                    <textarea
                      className="w-full bg-dark-border border border-dark-border-light rounded-lg px-3 py-2 text-sm text-text-bright resize-none outline-none focus:border-primary"
                      rows={2}
                      value={logBlockers}
                      onChange={(e) => setLogBlockers(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-text-dim block mb-1">내일 계획</label>
                    <textarea
                      className="w-full bg-dark-border border border-dark-border-light rounded-lg px-3 py-2 text-sm text-text-bright resize-none outline-none focus:border-primary"
                      rows={2}
                      value={logTomorrowPlan}
                      onChange={(e) => setLogTomorrowPlan(e.target.value)}
                    />
                  </div>
                  <button
                    type="submit"
                    className="bg-primary text-white px-5 py-2 rounded-lg text-sm font-bold hover:bg-primary-hover transition-colors"
                  >
                    저장
                  </button>
                </form>
              )}

              <div className="space-y-4">
                {logs.length === 0 && (
                  <p className="text-center text-text-dim py-16">아직 로그가 없습니다.</p>
                )}
                {logs.map((log) => (
                  <DailyLogCard
                    key={log.id}
                    log={log}
                    isAdmin
                    onDelete={(id) => deleteDailyLog(projectId, id)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Comments */}
          {activePanel === 'comments' && (
            <div className="max-w-4xl mx-auto px-6 py-6">
              <CommentSection
                comments={comments}
                tasks={tasks}
                isAdmin
                onAdd={(data) => createComment(projectId, data)}
                onDelete={(id) => deleteComment(projectId, id)}
              />
            </div>
          )}

          {/* GitHub */}
          {activePanel === 'github' && (
            <div className="max-w-4xl mx-auto px-6 py-6">
              <GitHubPanel
                repoUrl={project.githubRepo ?? ''}
                isAdmin
                onSaveRepo={(url) => updateProject(projectId, { githubRepo: url } as Partial<Project>)}
              />
            </div>
          )}

          {/* Share */}
          {activePanel === 'share' && (
            <div className="max-w-4xl mx-auto px-6 py-6">
              <SharePanel projectId={projectId} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Helper components
function PanelTabBtn({
  active,
  onClick,
  icon,
  label,
  badge,
  badgeType = 'info',
  dot,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  badge?: number;
  badgeType?: 'info' | 'alert';
  dot?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
        active
          ? 'border-primary text-primary'
          : 'border-transparent text-text-dim hover:text-text-mid'
      }`}
    >
      {icon}
      {label}
      {badge !== undefined && badge > 0 && (
        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
          badgeType === 'alert'
            ? 'bg-status-blocked text-white animate-pulse'
            : 'bg-primary/20 text-primary'
        }`}>
          {badge}
        </span>
      )}
      {dot && <span className="w-2 h-2 bg-status-done rounded-full" />}
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
