import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ClipboardList,
  FileText,
  MessageCircle,
  LogOut,
  Database,
  Link as LinkIcon,
} from 'lucide-react';
import { isAdminAuthenticated, logoutAdmin } from '../lib/auth';
import Header from '../components/Header';
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

type TabId = 'schedule' | 'logs' | 'comments';

const TABS: { id: TabId; label: string; icon: React.ReactNode }[] = [
  { id: 'schedule', label: '공정표', icon: <ClipboardList className="w-4 h-4" /> },
  { id: 'logs', label: '데일리 로그', icon: <FileText className="w-4 h-4" /> },
  { id: 'comments', label: '의견', icon: <MessageCircle className="w-4 h-4" /> },
];

export default function AdminPage() {
  const navigate = useNavigate();
  const projectId = DEFAULT_PROJECT_ID;

  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [logs, setLogs] = useState<DailyLog[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [activeTab, setActiveTab] = useState<TabId>('schedule');
  const [seeding, setSeeding] = useState(false);
  const [showLogForm, setShowLogForm] = useState(false);

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
      subscribeProject(projectId, setProject),
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

  function copyViewerLink() {
    const url = `${window.location.origin}/view/${projectId}`;
    navigator.clipboard.writeText(url);
    alert('뷰어 링크가 복사되었습니다!');
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

  if (!project) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-text-dim text-sm">로딩 중...</p>
          <button
            onClick={handleSeed}
            disabled={seeding}
            className="inline-flex items-center gap-2 bg-gold text-dark-bg px-5 py-2.5 rounded-xl font-semibold hover:bg-gold-dim disabled:opacity-50"
          >
            <Database className="w-4 h-4" />
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
              onClick={copyViewerLink}
              className="inline-flex items-center gap-1.5 text-xs text-gold hover:text-gold-dim font-semibold"
            >
              <LinkIcon className="w-3.5 h-3.5" /> 공유 링크 복사
            </button>
            <span className="text-dark-border-light">|</span>
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

      {/* Tabs */}
      <div className="sticky top-0 z-20 bg-dark-bg border-b border-dark-border">
        <div className="max-w-5xl mx-auto px-4">
          <div className="flex gap-1 overflow-x-auto no-scrollbar">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold whitespace-nowrap border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-gold text-gold'
                    : 'border-transparent text-text-dim hover:text-text-mid'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
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
            {/* Add log button */}
            <div className="mb-4">
              <button
                onClick={() => setShowLogForm(!showLogForm)}
                className="bg-gold text-dark-bg px-4 py-2 rounded-xl text-sm font-bold hover:bg-gold-dim"
              >
                {showLogForm ? '취소' : '✏️ 오늘의 로그 작성'}
              </button>
            </div>

            {/* Log form */}
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
      </main>

      <footer className="text-center py-8 text-xs text-text-dim border-t border-dark-border">
        <span className="text-gold">INTEROHRIGIN</span> — 관리자 모드
      </footer>
    </div>
  );
}
