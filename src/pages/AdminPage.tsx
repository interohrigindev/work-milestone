import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ClipboardList,
  FileText,
  MessageCircle,
  LogOut,
  Database,
  Github,
} from 'lucide-react';
import { isAdminAuthenticated, logoutAdmin } from '../lib/auth';
import Header from '../components/Header';
import SharePanel from '../components/SharePanel';
import GitHubPanel from '../components/GitHubPanel';
import DayGroup from '../components/DayGroup';
import DailyLogCard from '../components/DailyLogCard';
import CommentSection from '../components/CommentSection';
import {
  subscribeProject,
  subscribeTasks,
  subscribeDailyLogs,
  subscribeComments,
  updateTask,
  updateProject,
  createDailyLog,
  deleteDailyLog,
  createComment,
  deleteComment,
  calcOverallProgress,
} from '../lib/firestore';
import { seedProject, DEFAULT_PROJECT_ID } from '../lib/seed';
import type { Project, Task, DailyLog, Comment } from '../types';

type TabId = 'schedule' | 'logs' | 'comments' | 'github';

export default function AdminPage() {
  const navigate = useNavigate();
  const projectId = DEFAULT_PROJECT_ID;

  const [project, setProject] = useState<Project | null>(null);
  const [projectLoaded, setProjectLoaded] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [logs, setLogs] = useState<DailyLog[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [activeTab, setActiveTab] = useState<TabId>('schedule');
  const [seeding, setSeeding] = useState(false);
  const [showLogForm, setShowLogForm] = useState(false);

  // Comment read tracking
  const [lastReadCommentCount, setLastReadCommentCount] = useState(() => {
    const stored = localStorage.getItem('admin_read_comments');
    return stored ? Number(stored) : 0;
  });
  const unreadCommentCount = Math.max(0, comments.length - lastReadCommentCount);

  // Mark comments as read when switching to comments tab
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
  }, [navigate, projectId]);

  // Auto-update overall progress when tasks change
  useEffect(() => {
    if (!project || tasks.length === 0) return;
    const newProgress = calcOverallProgress(tasks);
    if (newProgress !== project.overallProgress) {
      updateProject(projectId, { overallProgress: newProgress });
    }
  }, [tasks, project, projectId]);

  async function handleSeed() {
    setSeeding(true);
    try {
      await seedProject();
      alert('초기 데이터가 생성되었습니다!');
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

  function handleLogout() {
    logoutAdmin();
    navigate('/admin/login');
  }

  function handleTabSwitch(tabId: TabId) {
    setActiveTab(tabId);
    if (tabId === 'comments') markCommentsRead();
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

  // Still loading from Firestore
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

  // Project not found — show seed button
  if (!project) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-dark-card border border-dark-border rounded-2xl flex items-center justify-center mx-auto mb-5">
            <Database className="w-8 h-8 text-gold" />
          </div>
          <h1 className="text-xl font-bold text-text-bright mb-2">프로젝트 초기 설정</h1>
          <p className="text-sm text-text-dim mb-8 leading-relaxed">
            Firestore에 아직 프로젝트 데이터가 없습니다.<br />
            아래 버튼을 눌러 15개 작업이 포함된 초기 데이터를 생성하세요.
          </p>
          <button
            onClick={handleSeed}
            disabled={seeding}
            className="inline-flex items-center gap-2 bg-gold text-dark-bg px-6 py-3 rounded-xl font-bold hover:bg-gold-dim disabled:opacity-50 transition-colors"
          >
            <Database className="w-5 h-5" />
            {seeding ? '생성 중...' : '초기 데이터 생성'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-bg">
      <Header project={project} tasks={tasks} isAdmin />

      {/* Admin toolbar */}
      <div className="bg-dark-card/80 border-b border-dark-border">
        <div className="max-w-5xl mx-auto px-4 py-2 flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <button
              onClick={handleSeed}
              disabled={seeding}
              className="inline-flex items-center gap-1.5 text-xs text-text-dim hover:text-text-mid"
            >
              <Database className="w-3.5 h-3.5" /> 초기 데이터 생성
            </button>
          </div>
          <button
            onClick={handleLogout}
            className="inline-flex items-center gap-1.5 text-xs text-text-dim hover:text-status-blocked"
          >
            <LogOut className="w-3.5 h-3.5" /> 로그아웃
          </button>
        </div>
      </div>

      {/* Share Panel */}
      <div className="max-w-5xl mx-auto px-4 pt-6">
        <SharePanel projectId={projectId} />
      </div>

      {/* Tabs */}
      <div className="sticky top-0 z-20 bg-dark-bg border-b border-dark-border mt-6">
        <div className="max-w-5xl mx-auto px-4">
          <div className="flex gap-1 overflow-x-auto no-scrollbar">
            {/* Schedule tab */}
            <button
              onClick={() => handleTabSwitch('schedule')}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold whitespace-nowrap border-b-2 transition-colors ${
                activeTab === 'schedule'
                  ? 'border-gold text-gold'
                  : 'border-transparent text-text-dim hover:text-text-mid'
              }`}
            >
              <ClipboardList className="w-4 h-4" />
              공정표
            </button>
            {/* Logs tab */}
            <button
              onClick={() => handleTabSwitch('logs')}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold whitespace-nowrap border-b-2 transition-colors ${
                activeTab === 'logs'
                  ? 'border-gold text-gold'
                  : 'border-transparent text-text-dim hover:text-text-mid'
              }`}
            >
              <FileText className="w-4 h-4" />
              데일리 로그
              {logs.length > 0 && (
                <span className="text-xs bg-gold/20 text-gold px-1.5 py-0.5 rounded-full font-mono">
                  {logs.length}
                </span>
              )}
            </button>
            {/* Comments tab */}
            <button
              onClick={() => handleTabSwitch('comments')}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold whitespace-nowrap border-b-2 transition-colors ${
                activeTab === 'comments'
                  ? 'border-gold text-gold'
                  : 'border-transparent text-text-dim hover:text-text-mid'
              }`}
            >
              <MessageCircle className="w-4 h-4" />
              의견
              {unreadCommentCount > 0 && (
                <span className="relative flex items-center">
                  <span className="text-xs bg-status-blocked text-white px-1.5 py-0.5 rounded-full font-mono font-bold animate-pulse">
                    {unreadCommentCount}
                  </span>
                </span>
              )}
              {unreadCommentCount === 0 && comments.length > 0 && (
                <span className="text-xs bg-gold/20 text-gold px-1.5 py-0.5 rounded-full font-mono">
                  {comments.length}
                </span>
              )}
            </button>
            {/* GitHub tab */}
            <button
              onClick={() => handleTabSwitch('github')}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold whitespace-nowrap border-b-2 transition-colors ${
                activeTab === 'github'
                  ? 'border-gold text-gold'
                  : 'border-transparent text-text-dim hover:text-text-mid'
              }`}
            >
              <Github className="w-4 h-4" />
              GitHub
              {project?.githubRepo && (
                <span className="w-2 h-2 bg-status-done rounded-full" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Tab content */}
      <main className="max-w-5xl mx-auto px-4 py-6">
        {/* Schedule tab */}
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
                isAdmin
                onUpdateTask={handleUpdateTask}
                onAddComment={handleAddTaskComment}
              />
            ))}
            {days.length === 0 && (
              <div className="text-center py-16">
                <p className="text-text-dim mb-4">작업이 없습니다.</p>
                <button
                  onClick={handleSeed}
                  disabled={seeding}
                  className="inline-flex items-center gap-2 bg-gold text-dark-bg px-5 py-2.5 rounded-xl font-semibold hover:bg-gold-dim disabled:opacity-50"
                >
                  <Database className="w-4 h-4" />
                  {seeding ? '생성 중...' : '초기 데이터 생성'}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Daily logs tab */}
        {activeTab === 'logs' && (
          <div>
            <div className="mb-4">
              <button
                onClick={() => setShowLogForm(!showLogForm)}
                className="bg-gold text-dark-bg px-4 py-2 rounded-xl text-sm font-bold hover:bg-gold-dim"
              >
                {showLogForm ? '취소' : '✏️ 오늘의 로그 작성'}
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
                      max={5}
                      className="w-20 bg-dark-border border border-dark-border-light rounded-lg px-3 py-2 text-sm text-text-bright font-mono"
                      value={logDay}
                      onChange={(e) => setLogDay(Number(e.target.value))}
                    />
                  </div>
                  <div className="flex-1">
                    <label className="text-xs text-text-dim block mb-1">날짜</label>
                    <input
                      type="date"
                      className="bg-dark-border border border-dark-border-light rounded-lg px-3 py-2 text-sm text-text-bright"
                      value={logDate}
                      onChange={(e) => setLogDate(e.target.value)}
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-text-dim block mb-1">📌 오늘 한 일</label>
                  <textarea
                    className="w-full bg-dark-border border border-dark-border-light rounded-lg px-3 py-2 text-sm text-text-bright resize-none"
                    rows={3}
                    value={logContent}
                    onChange={(e) => setLogContent(e.target.value)}
                    placeholder="오늘의 진행 상황..."
                  />
                </div>
                <div>
                  <label className="text-xs text-text-dim block mb-1">✅ 완료 항목 (줄바꿈으로 구분)</label>
                  <textarea
                    className="w-full bg-dark-border border border-dark-border-light rounded-lg px-3 py-2 text-sm text-text-bright resize-none"
                    rows={2}
                    value={logAchievements}
                    onChange={(e) => setLogAchievements(e.target.value)}
                    placeholder="P-01 완료&#10;DB 12개 테이블 생성"
                  />
                </div>
                <div>
                  <label className="text-xs text-text-dim block mb-1">🚧 이슈/차단 (줄바꿈으로 구분)</label>
                  <textarea
                    className="w-full bg-dark-border border border-dark-border-light rounded-lg px-3 py-2 text-sm text-text-bright resize-none"
                    rows={2}
                    value={logBlockers}
                    onChange={(e) => setLogBlockers(e.target.value)}
                    placeholder="Whisper API 키 발급 대기"
                  />
                </div>
                <div>
                  <label className="text-xs text-text-dim block mb-1">📋 내일 계획</label>
                  <textarea
                    className="w-full bg-dark-border border border-dark-border-light rounded-lg px-3 py-2 text-sm text-text-bright resize-none"
                    rows={2}
                    value={logTomorrowPlan}
                    onChange={(e) => setLogTomorrowPlan(e.target.value)}
                    placeholder="채용 대시보드 + 공고 CRUD"
                  />
                </div>
                <button
                  type="submit"
                  className="bg-gold text-dark-bg px-5 py-2 rounded-xl text-sm font-bold hover:bg-gold-dim"
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

        {/* Comments tab */}
        {activeTab === 'comments' && (
          <CommentSection
            comments={comments}
            tasks={tasks}
            isAdmin
            onAdd={(data) => createComment(projectId, data)}
            onDelete={(id) => deleteComment(projectId, id)}
          />
        )}

        {/* GitHub tab */}
        {activeTab === 'github' && (
          <GitHubPanel
            repoUrl={project?.githubRepo ?? ''}
            isAdmin
            onSaveRepo={(url) => updateProject(projectId, { githubRepo: url } as Partial<Project>)}
          />
        )}
      </main>

      <footer className="text-center py-8 text-xs text-text-dim border-t border-dark-border">
        <span className="text-gold">INTEROHRIGIN</span> — 관리자 모드
      </footer>
    </div>
  );
}
