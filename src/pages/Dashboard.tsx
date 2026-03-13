import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  FolderOpen,
  Github,
  Trash2,
  ExternalLink,
  TrendingUp,
  CheckCircle2,
  Clock,
  BarChart3,
  Users,
  AlertCircle,
  PieChart,
  X,
  Settings,
} from 'lucide-react';
import { isAuthenticated, logout, onAuthChange, isAdminRole } from '../lib/auth';
import type { AuthUser } from '../lib/auth';
import { subscribeAllProjects, createNewProject, deleteProject } from '../lib/firestore';
import { fetchEmployees } from '../lib/employees';
import type { Employee } from '../lib/employees';
import { parseRepoSlug } from '../lib/github';
import Sidebar from '../components/Sidebar';
import ProgressBar from '../components/ProgressBar';
import type { Project } from '../types';

type CreateMode = null | 'manual' | 'github';

export default function Dashboard() {
  const navigate = useNavigate();
  const [allProjects, setAllProjects] = useState<Project[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [createMode, setCreateMode] = useState<CreateMode>(null);
  const [creating, setCreating] = useState(false);
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [githubRepo, setGithubRepo] = useState('');
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    const unsubAuth = onAuthChange((user) => {
      if (!user) {
        navigate('/', { replace: true });
        return;
      }
      setAuthUser(user);
      setIsAdmin(isAdminRole(user.employee));
    });

    if (!isAuthenticated()) {
      navigate('/', { replace: true });
      return;
    }

    const unsub = subscribeAllProjects((p) => {
      setAllProjects(p);
      setLoaded(true);
    });
    fetchEmployees().then(setEmployees);

    return () => {
      unsubAuth();
      unsub();
    };
  }, [navigate]);

  // Filter projects based on role
  const projects = useMemo(() => {
    if (isAdmin) return allProjects; // Admin/executives see all projects
    if (!authUser?.email) return [];
    const email = authUser.email;
    return allProjects.filter(
      (p) =>
        p.createdBy === email ||
        (p.collaborators && p.collaborators.includes(email))
    );
  }, [allProjects, authUser, isAdmin]);

  async function handleLogout() {
    await logout();
    navigate('/');
  }

  function resetForm() {
    setTitle('');
    setSubtitle('');
    setStartDate('');
    setEndDate('');
    setGithubRepo('');
    setCreateMode(null);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;

    if (createMode === 'github' && githubRepo) {
      const slug = parseRepoSlug(githubRepo);
      if (!slug) {
        alert('올바른 GitHub URL 또는 owner/repo 형식을 입력해 주세요.');
        return;
      }
    }

    setCreating(true);
    try {
      const id = await createNewProject({
        title: title.trim(),
        subtitle: subtitle.trim(),
        startDate,
        endDate,
        overallProgress: 0,
        currentPhase: '준비중',
        githubRepo: createMode === 'github' ? githubRepo.trim() : '',
        createdBy: authUser?.email ?? '',
        collaborators: [],
      });
      resetForm();
      const basePath = isAdmin ? `/admin/project/${id}` : `/view/${id}`;
      navigate(basePath);
    } catch (err) {
      alert(err instanceof Error ? err.message : '프로젝트 생성 실패');
    }
    setCreating(false);
  }

  async function handleDelete(projectId: string, projectTitle: string) {
    if (!confirm(`"${projectTitle}" 프로젝트를 삭제하시겠습니까?`)) return;
    await deleteProject(projectId);
  }

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

  return (
    <div className="min-h-screen bg-dark-bg flex">
      <Sidebar
        projects={projects}
        isAdmin={isAdmin}
        onLogout={handleLogout}
        currentUserName={authUser?.employee?.name ?? authUser?.email}
        currentUserEmail={authUser?.email}
        employees={employees}
        onShowSettings={() => setShowSettings(true)}
      />

      {/* Settings modal */}
      {showSettings && (
        <SettingsModal
          user={authUser}
          employees={employees}
          onClose={() => setShowSettings(false)}
        />
      )}

      <div className="flex-1 min-w-0 overflow-y-auto">
        {isAdmin ? (
          <ExecutiveDashboard
            projects={allProjects}
            employees={employees}
            createMode={createMode}
            setCreateMode={setCreateMode}
            creating={creating}
            title={title}
            setTitle={setTitle}
            subtitle={subtitle}
            setSubtitle={setSubtitle}
            startDate={startDate}
            setStartDate={setStartDate}
            endDate={endDate}
            setEndDate={setEndDate}
            githubRepo={githubRepo}
            setGithubRepo={setGithubRepo}
            handleCreate={handleCreate}
            resetForm={resetForm}
            handleDelete={handleDelete}
            navigate={navigate}
          />
        ) : (
          <MemberDashboard
            projects={projects}
            allProjectsCount={allProjects.length}
            createMode={createMode}
            setCreateMode={setCreateMode}
            creating={creating}
            title={title}
            setTitle={setTitle}
            subtitle={subtitle}
            setSubtitle={setSubtitle}
            startDate={startDate}
            setStartDate={setStartDate}
            endDate={endDate}
            setEndDate={setEndDate}
            githubRepo={githubRepo}
            setGithubRepo={setGithubRepo}
            handleCreate={handleCreate}
            resetForm={resetForm}
            navigate={navigate}
            userName={authUser?.employee?.name ?? '사용자'}
            userEmail={authUser?.email ?? ''}
          />
        )}
      </div>
    </div>
  );
}

/* ────────────────────────────────────
   Executive / Admin Dashboard
   ──────────────────────────────────── */
function ExecutiveDashboard({
  projects, employees, createMode, setCreateMode, creating,
  title, setTitle, subtitle, setSubtitle, startDate, setStartDate, endDate, setEndDate,
  githubRepo, setGithubRepo, handleCreate, resetForm, handleDelete, navigate,
}: {
  projects: Project[];
  employees: Employee[];
  createMode: CreateMode;
  setCreateMode: (m: CreateMode) => void;
  creating: boolean;
  title: string; setTitle: (v: string) => void;
  subtitle: string; setSubtitle: (v: string) => void;
  startDate: string; setStartDate: (v: string) => void;
  endDate: string; setEndDate: (v: string) => void;
  githubRepo: string; setGithubRepo: (v: string) => void;
  handleCreate: (e: React.FormEvent) => void;
  resetForm: () => void;
  handleDelete: (id: string, title: string) => void;
  navigate: (path: string) => void;
}) {
  const totalProgress = projects.length > 0
    ? Math.round(projects.reduce((sum, p) => sum + p.overallProgress, 0) / projects.length)
    : 0;

  const completedCount = projects.filter(p => p.overallProgress >= 100).length;
  const inProgressCount = projects.filter(p => p.overallProgress > 0 && p.overallProgress < 100).length;
  const pendingCount = projects.filter(p => p.overallProgress === 0).length;

  // Progress distribution for chart
  const progressBuckets = [
    { label: '0%', count: projects.filter(p => p.overallProgress === 0).length, color: '#C4C4C4' },
    { label: '1-25%', count: projects.filter(p => p.overallProgress > 0 && p.overallProgress <= 25).length, color: '#E2445C' },
    { label: '26-50%', count: projects.filter(p => p.overallProgress > 25 && p.overallProgress <= 50).length, color: '#FDAB3D' },
    { label: '51-75%', count: projects.filter(p => p.overallProgress > 50 && p.overallProgress <= 75).length, color: '#579BFC' },
    { label: '76-99%', count: projects.filter(p => p.overallProgress > 75 && p.overallProgress < 100).length, color: '#A25DDC' },
    { label: '100%', count: projects.filter(p => p.overallProgress >= 100).length, color: '#00C875' },
  ];
  const maxBucket = Math.max(...progressBuckets.map(b => b.count), 1);

  // Phase distribution
  const phases = projects.reduce((acc, p) => {
    const phase = p.currentPhase || '미정';
    acc[phase] = (acc[phase] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  const phaseEntries = Object.entries(phases).sort((a, b) => b[1] - a[1]);
  const phaseColors = ['#579BFC', '#00C875', '#FDAB3D', '#E2445C', '#A25DDC', '#FF642E', '#00D2D2'];

  return (
    <>
      {/* Header */}
      <div className="bg-dark-surface border-b border-dark-border">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-xl font-bold text-text-bright">회사 전체 대시보드</h1>
              <p className="text-xs text-text-dim mt-1">전체 프로젝트 현황을 한눈에 확인하세요</p>
            </div>
            {createMode === null && (
              <button
                onClick={() => setCreateMode('manual')}
                className="inline-flex items-center gap-2 bg-primary text-white px-4 py-2.5 rounded-lg text-sm font-bold hover:bg-primary-hover transition-colors"
              >
                <Plus className="w-4 h-4" /> 새 프로젝트
              </button>
            )}
          </div>

          {/* Overview stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard icon={<FolderOpen className="w-4 h-4 text-group-blue" />} label="전체 프로젝트" value={projects.length} />
            <StatCard icon={<TrendingUp className="w-4 h-4 text-status-done" />} label="평균 진행률" value={`${totalProgress}%`} />
            <StatCard icon={<CheckCircle2 className="w-4 h-4 text-status-done" />} label="완료" value={completedCount} />
            <StatCard icon={<Clock className="w-4 h-4 text-status-progress" />} label="진행 중" value={inProgressCount} />
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-6 py-6 space-y-6">
        {/* Visualization section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Progress distribution chart */}
          <div className="bg-dark-card rounded-xl border border-dark-border p-5">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-bold text-text-bright">진행률 분포</h3>
            </div>
            <div className="space-y-2">
              {progressBuckets.map((bucket) => (
                <div key={bucket.label} className="flex items-center gap-3">
                  <span className="text-[11px] text-text-dim w-12 text-right font-mono">{bucket.label}</span>
                  <div className="flex-1 h-6 bg-dark-border rounded overflow-hidden">
                    <div
                      className="h-full rounded transition-all duration-700 flex items-center px-2"
                      style={{
                        width: `${Math.max((bucket.count / maxBucket) * 100, bucket.count > 0 ? 8 : 0)}%`,
                        backgroundColor: bucket.color,
                      }}
                    >
                      {bucket.count > 0 && (
                        <span className="text-[10px] font-bold text-white">{bucket.count}</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Project status donut */}
          <div className="bg-dark-card rounded-xl border border-dark-border p-5">
            <div className="flex items-center gap-2 mb-4">
              <PieChart className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-bold text-text-bright">프로젝트 상태</h3>
            </div>
            <div className="flex items-center gap-6">
              {/* CSS Donut */}
              <div className="relative w-32 h-32 shrink-0">
                <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                  {projects.length > 0 ? (
                    <>
                      <DonutSegment value={completedCount} total={projects.length} color="#00C875" offset={0} />
                      <DonutSegment value={inProgressCount} total={projects.length} color="#FDAB3D" offset={(completedCount / projects.length) * 100} />
                      <DonutSegment value={pendingCount} total={projects.length} color="#C4C4C4" offset={((completedCount + inProgressCount) / projects.length) * 100} />
                    </>
                  ) : (
                    <circle cx="18" cy="18" r="15.915" fill="none" stroke="#333" strokeWidth="3" />
                  )}
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <span className="text-lg font-bold font-mono text-text-bright">{projects.length}</span>
                    <span className="block text-[9px] text-text-dim">프로젝트</span>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <StatusLegend color="#00C875" label="완료" count={completedCount} />
                <StatusLegend color="#FDAB3D" label="진행 중" count={inProgressCount} />
                <StatusLegend color="#C4C4C4" label="대기" count={pendingCount} />
              </div>
            </div>

            {/* Phase distribution */}
            {phaseEntries.length > 0 && (
              <div className="mt-4 pt-4 border-t border-dark-border">
                <p className="text-[10px] text-text-dim uppercase tracking-wider mb-2 font-bold">단계별 분포</p>
                <div className="flex flex-wrap gap-2">
                  {phaseEntries.map(([phase, count], i) => (
                    <span
                      key={phase}
                      className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-medium"
                      style={{ backgroundColor: `${phaseColors[i % phaseColors.length]}20`, color: phaseColors[i % phaseColors.length] }}
                    >
                      {phase}
                      <span className="font-bold font-mono">{count}</span>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Team overview */}
          <div className="bg-dark-card rounded-xl border border-dark-border p-5">
            <div className="flex items-center gap-2 mb-4">
              <Users className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-bold text-text-bright">팀 현황</h3>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-dark-border rounded-lg p-3 text-center">
                <span className="text-2xl font-bold font-mono text-text-bright">{employees.filter(e => e.is_active).length}</span>
                <p className="text-[10px] text-text-dim mt-1">활성 멤버</p>
              </div>
              <div className="bg-dark-border rounded-lg p-3 text-center">
                <span className="text-2xl font-bold font-mono text-text-bright">{employees.length}</span>
                <p className="text-[10px] text-text-dim mt-1">전체 멤버</p>
              </div>
            </div>
            {employees.length > 0 && (
              <div className="mt-3 flex -space-x-2 overflow-hidden">
                {employees.slice(0, 12).map((emp) => (
                  <div
                    key={emp.id}
                    className="w-8 h-8 rounded-full bg-primary/20 border-2 border-dark-card flex items-center justify-center shrink-0"
                    title={`${emp.name} (${emp.department_name ?? ''})`}
                  >
                    {emp.avatar_url ? (
                      <img src={emp.avatar_url} alt={emp.name} className="w-full h-full rounded-full object-cover" />
                    ) : (
                      <span className="text-primary text-[10px] font-bold">{emp.name.charAt(0)}</span>
                    )}
                  </div>
                ))}
                {employees.length > 12 && (
                  <div className="w-8 h-8 rounded-full bg-dark-border border-2 border-dark-card flex items-center justify-center shrink-0">
                    <span className="text-text-dim text-[9px] font-bold">+{employees.length - 12}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Recent activity / deadlines */}
          <div className="bg-dark-card rounded-xl border border-dark-border p-5">
            <div className="flex items-center gap-2 mb-4">
              <AlertCircle className="w-4 h-4 text-status-blocked" />
              <h3 className="text-sm font-bold text-text-bright">주의 필요 프로젝트</h3>
            </div>
            {projects.filter(p => p.overallProgress < 30 && p.overallProgress > 0).length === 0 ? (
              <p className="text-xs text-text-dim py-4 text-center">주의가 필요한 프로젝트가 없습니다</p>
            ) : (
              <div className="space-y-2">
                {projects
                  .filter(p => p.overallProgress < 30 && p.overallProgress > 0)
                  .slice(0, 5)
                  .map((p) => (
                    <div
                      key={p.id}
                      className="flex items-center gap-3 px-3 py-2 rounded-lg bg-dark-border hover:bg-dark-border-light cursor-pointer transition-colors"
                      onClick={() => navigate(`/admin/project/${p.id}`)}
                    >
                      <div className="w-2 h-2 rounded-full bg-status-blocked shrink-0" />
                      <span className="text-xs text-text-bright truncate flex-1">{p.title}</span>
                      <span className="text-[10px] font-mono text-status-blocked font-bold">{p.overallProgress}%</span>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>

        {/* Create form */}
        {createMode !== null && (
          <ProjectCreateForm
            createMode={createMode}
            setCreateMode={setCreateMode}
            creating={creating}
            title={title}
            setTitle={setTitle}
            subtitle={subtitle}
            setSubtitle={setSubtitle}
            startDate={startDate}
            setStartDate={setStartDate}
            endDate={endDate}
            setEndDate={setEndDate}
            githubRepo={githubRepo}
            setGithubRepo={setGithubRepo}
            handleCreate={handleCreate}
            resetForm={resetForm}
          />
        )}

        {/* All project cards */}
        <div>
          <h2 className="text-text-bright font-bold text-sm mb-4 flex items-center gap-2">
            <FolderOpen className="w-4 h-4" />
            전체 프로젝트
            <span className="text-text-dim font-normal">({projects.length})</span>
          </h2>
          {projects.length === 0 && createMode === null && (
            <div className="text-center py-20">
              <FolderOpen className="w-12 h-12 text-dark-border mx-auto mb-4" />
              <p className="text-text-dim mb-6">아직 프로젝트가 없습니다.</p>
              <button
                onClick={() => setCreateMode('manual')}
                className="inline-flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-xl font-bold hover:bg-primary-hover transition-colors"
              >
                <Plus className="w-5 h-5" /> 첫 프로젝트 만들기
              </button>
            </div>
          )}
          <div className="grid gap-3">
            {projects.map((p) => (
              <ProjectCard
                key={p.id}
                project={p}
                isAdmin
                onNavigate={() => navigate(`/admin/project/${p.id}`)}
                onView={() => window.open(`/view/${p.id}`, '_blank')}
                onDelete={() => handleDelete(p.id, p.title)}
              />
            ))}
          </div>
        </div>
      </main>
    </>
  );
}

/* ────────────────────────────────────
   Member Dashboard
   ──────────────────────────────────── */
function MemberDashboard({
  projects, allProjectsCount, createMode, setCreateMode, creating,
  title, setTitle, subtitle, setSubtitle, startDate, setStartDate, endDate, setEndDate,
  githubRepo, setGithubRepo, handleCreate, resetForm, navigate, userName, userEmail,
}: {
  projects: Project[];
  allProjectsCount: number;
  createMode: CreateMode;
  setCreateMode: (m: CreateMode) => void;
  creating: boolean;
  title: string; setTitle: (v: string) => void;
  subtitle: string; setSubtitle: (v: string) => void;
  startDate: string; setStartDate: (v: string) => void;
  endDate: string; setEndDate: (v: string) => void;
  githubRepo: string; setGithubRepo: (v: string) => void;
  handleCreate: (e: React.FormEvent) => void;
  resetForm: () => void;
  navigate: (path: string) => void;
  userName: string;
  userEmail: string;
}) {
  const myProjects = projects.filter(p => p.createdBy === userEmail);
  const collabProjects = projects.filter(p => p.createdBy !== userEmail && p.collaborators?.includes(userEmail));

  const totalProgress = projects.length > 0
    ? Math.round(projects.reduce((sum, p) => sum + p.overallProgress, 0) / projects.length)
    : 0;

  return (
    <>
      {/* Header */}
      <div className="bg-dark-surface border-b border-dark-border">
        <div className="max-w-5xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-xl font-bold text-text-bright">
                안녕하세요, {userName}님
              </h1>
              <p className="text-xs text-text-dim mt-1">내 프로젝트와 협업 현황을 확인하세요</p>
            </div>
            {createMode === null && (
              <button
                onClick={() => setCreateMode('manual')}
                className="inline-flex items-center gap-2 bg-primary text-white px-4 py-2.5 rounded-lg text-sm font-bold hover:bg-primary-hover transition-colors"
              >
                <Plus className="w-4 h-4" /> 새 프로젝트
              </button>
            )}
          </div>

          {/* Quick stats */}
          <div className="grid grid-cols-3 gap-4">
            <StatCard icon={<FolderOpen className="w-4 h-4 text-group-blue" />} label="내 프로젝트" value={projects.length} />
            <StatCard icon={<TrendingUp className="w-4 h-4 text-status-done" />} label="평균 진행률" value={`${totalProgress}%`} />
            <StatCard icon={<CheckCircle2 className="w-4 h-4 text-status-done" />} label="완료" value={projects.filter(p => p.overallProgress >= 100).length} />
          </div>
        </div>
      </div>

      <main className="max-w-5xl mx-auto px-6 py-6 space-y-6">
        {/* Create form */}
        {createMode !== null && (
          <ProjectCreateForm
            createMode={createMode}
            setCreateMode={setCreateMode}
            creating={creating}
            title={title}
            setTitle={setTitle}
            subtitle={subtitle}
            setSubtitle={setSubtitle}
            startDate={startDate}
            setStartDate={setStartDate}
            endDate={endDate}
            setEndDate={setEndDate}
            githubRepo={githubRepo}
            setGithubRepo={setGithubRepo}
            handleCreate={handleCreate}
            resetForm={resetForm}
          />
        )}

        {projects.length === 0 && createMode === null && (
          <div className="text-center py-20">
            <FolderOpen className="w-12 h-12 text-dark-border mx-auto mb-4" />
            <p className="text-text-dim mb-2">아직 참여 중인 프로젝트가 없습니다.</p>
            <p className="text-xs text-text-dim mb-6">직접 프로젝트를 만들거나, 관리자가 초대하면 여기에 표시됩니다.</p>
            <button
              onClick={() => setCreateMode('manual')}
              className="inline-flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-xl font-bold hover:bg-primary-hover transition-colors"
            >
              <Plus className="w-5 h-5" /> 첫 프로젝트 만들기
            </button>
          </div>
        )}

        {/* My projects */}
        {myProjects.length > 0 && (
          <div>
            <h2 className="text-text-bright font-bold text-sm mb-3 flex items-center gap-2">
              <FolderOpen className="w-4 h-4" />
              내가 만든 프로젝트
              <span className="text-text-dim font-normal">({myProjects.length})</span>
            </h2>
            <div className="grid gap-3">
              {myProjects.map((p) => (
                <ProjectCard
                  key={p.id}
                  project={p}
                  isAdmin={false}
                  onNavigate={() => navigate(`/view/${p.id}`)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Collaborative projects */}
        {collabProjects.length > 0 && (
          <div>
            <h2 className="text-text-bright font-bold text-sm mb-3 flex items-center gap-2">
              <Users className="w-4 h-4" />
              협업 프로젝트
              <span className="text-text-dim font-normal">({collabProjects.length})</span>
            </h2>
            <div className="grid gap-3">
              {collabProjects.map((p) => (
                <ProjectCard
                  key={p.id}
                  project={p}
                  isAdmin={false}
                  onNavigate={() => navigate(`/view/${p.id}`)}
                />
              ))}
            </div>
          </div>
        )}
      </main>
    </>
  );
}

/* ────────────────────────────────────
   Shared Components
   ──────────────────────────────────── */

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: number | string }) {
  return (
    <div className="bg-dark-card rounded-xl border border-dark-border p-4">
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <span className="text-xs text-text-dim">{label}</span>
      </div>
      <span className="text-2xl font-bold font-mono text-text-bright">{value}</span>
    </div>
  );
}

function ProjectCard({
  project: p, isAdmin, onNavigate, onView, onDelete,
}: {
  project: Project;
  isAdmin: boolean;
  onNavigate: () => void;
  onView?: () => void;
  onDelete?: () => void;
}) {
  return (
    <div
      className="bg-dark-card border border-dark-border rounded-xl p-5 hover:border-primary/30 transition-all cursor-pointer group"
      onClick={onNavigate}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-3 h-3 rounded" style={{
              backgroundColor: p.overallProgress >= 100 ? '#00C875' : p.overallProgress > 0 ? '#FDAB3D' : '#C4C4C4'
            }} />
            <h3 className="text-text-bright font-bold truncate group-hover:text-primary transition-colors">
              {p.title}
            </h3>
            {p.githubRepo && <Github className="w-4 h-4 text-text-dim flex-shrink-0" />}
          </div>
          {p.subtitle && (
            <p className="text-sm text-text-dim truncate mb-2 ml-5">{p.subtitle}</p>
          )}
          <div className="flex items-center gap-4 text-xs text-text-dim ml-5">
            {p.startDate && p.endDate && (
              <span className="font-mono">{p.startDate} ~ {p.endDate}</span>
            )}
            <span className="bg-dark-border px-2 py-0.5 rounded-full">{p.currentPhase}</span>
          </div>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <div className="w-28">
            <ProgressBar progress={p.overallProgress} showLabel={false} size="sm" />
            <p className="text-[10px] text-text-dim text-center mt-1 font-mono">{p.overallProgress}%</p>
          </div>
          {isAdmin && (
            <div className="flex gap-1">
              {onView && (
                <button
                  onClick={(e) => { e.stopPropagation(); onView(); }}
                  className="p-1.5 rounded-lg text-text-dim hover:text-primary hover:bg-dark-border transition-colors"
                  title="뷰어 페이지"
                >
                  <ExternalLink className="w-4 h-4" />
                </button>
              )}
              {onDelete && (
                <button
                  onClick={(e) => { e.stopPropagation(); onDelete(); }}
                  className="p-1.5 rounded-lg text-text-dim hover:text-status-blocked hover:bg-dark-border transition-colors"
                  title="삭제"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ProjectCreateForm({
  createMode, setCreateMode, creating, title, setTitle, subtitle, setSubtitle,
  startDate, setStartDate, endDate, setEndDate, githubRepo, setGithubRepo,
  handleCreate, resetForm,
}: {
  createMode: 'manual' | 'github';
  setCreateMode: (m: CreateMode) => void;
  creating: boolean;
  title: string; setTitle: (v: string) => void;
  subtitle: string; setSubtitle: (v: string) => void;
  startDate: string; setStartDate: (v: string) => void;
  endDate: string; setEndDate: (v: string) => void;
  githubRepo: string; setGithubRepo: (v: string) => void;
  handleCreate: (e: React.FormEvent) => void;
  resetForm: () => void;
}) {
  return (
    <div className="bg-dark-card rounded-xl border border-dark-border p-6">
      <h3 className="text-text-bright font-bold mb-4">새 프로젝트 만들기</h3>
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setCreateMode('manual')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
            createMode === 'manual' ? 'bg-primary text-white' : 'bg-dark-border text-text-dim hover:text-text-mid'
          }`}
        >
          <FolderOpen className="w-4 h-4" /> 직접 입력
        </button>
        <button
          onClick={() => setCreateMode('github')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
            createMode === 'github' ? 'bg-primary text-white' : 'bg-dark-border text-text-dim hover:text-text-mid'
          }`}
        >
          <Github className="w-4 h-4" /> GitHub 연결
        </button>
      </div>
      <form onSubmit={handleCreate} className="space-y-4">
        {createMode === 'github' && (
          <div>
            <label className="text-xs text-text-dim block mb-1">GitHub 레포지토리 URL</label>
            <input
              type="text"
              className="w-full bg-dark-border border border-dark-border-light rounded-lg px-3 py-2 text-sm text-text-bright outline-none focus:border-primary"
              placeholder="https://github.com/owner/repo"
              value={githubRepo}
              onChange={(e) => setGithubRepo(e.target.value)}
              required
            />
          </div>
        )}
        <div>
          <label className="text-xs text-text-dim block mb-1">프로젝트 제목 *</label>
          <input
            type="text"
            className="w-full bg-dark-border border border-dark-border-light rounded-lg px-3 py-2 text-sm text-text-bright outline-none focus:border-primary"
            placeholder="프로젝트 이름"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="text-xs text-text-dim block mb-1">부제목</label>
          <input
            type="text"
            className="w-full bg-dark-border border border-dark-border-light rounded-lg px-3 py-2 text-sm text-text-bright outline-none focus:border-primary"
            placeholder="프로젝트 설명"
            value={subtitle}
            onChange={(e) => setSubtitle(e.target.value)}
          />
        </div>
        <div className="flex gap-3">
          <div className="flex-1">
            <label className="text-xs text-text-dim block mb-1">시작일</label>
            <input
              type="date"
              className="w-full bg-dark-border border border-dark-border-light rounded-lg px-3 py-2 text-sm text-text-bright outline-none focus:border-primary"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div className="flex-1">
            <label className="text-xs text-text-dim block mb-1">종료일</label>
            <input
              type="date"
              className="w-full bg-dark-border border border-dark-border-light rounded-lg px-3 py-2 text-sm text-text-bright outline-none focus:border-primary"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
        </div>
        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={creating}
            className="bg-primary text-white px-5 py-2 rounded-lg text-sm font-bold hover:bg-primary-hover disabled:opacity-50 transition-colors"
          >
            {creating ? '생성 중...' : '프로젝트 생성'}
          </button>
          <button
            type="button"
            onClick={resetForm}
            className="text-text-dim text-sm hover:text-text-mid"
          >
            취소
          </button>
        </div>
      </form>
    </div>
  );
}

function DonutSegment({ value, total, color, offset }: { value: number; total: number; color: string; offset: number }) {
  if (value === 0) return null;
  const pct = (value / total) * 100;
  return (
    <circle
      cx="18"
      cy="18"
      r="15.915"
      fill="none"
      stroke={color}
      strokeWidth="3"
      strokeDasharray={`${pct} ${100 - pct}`}
      strokeDashoffset={`${-offset}`}
    />
  );
}

function StatusLegend({ color, label, count }: { color: string; label: string; count: number }) {
  return (
    <div className="flex items-center gap-2">
      <div className="w-3 h-3 rounded" style={{ backgroundColor: color }} />
      <span className="text-xs text-text-mid">{label}</span>
      <span className="text-xs font-bold font-mono text-text-bright">{count}</span>
    </div>
  );
}

function SettingsModal({ user, employees, onClose }: { user: AuthUser | null; employees: Employee[]; onClose: () => void }) {
  const currentEmployee = user?.employee;
  const roleLabels: Record<string, string> = {
    employee: '사원', leader: '팀장', director: '이사',
    division_head: '본부장', ceo: '대표', admin: '관리자',
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-dark-card rounded-2xl border border-dark-border w-full max-w-lg max-h-[80vh] overflow-y-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-dark-border">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-bold text-text-bright">설정</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-text-dim hover:text-text-bright hover:bg-dark-border transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Profile */}
          <div>
            <h3 className="text-sm font-bold text-text-bright mb-3">내 프로필</h3>
            <div className="bg-dark-border rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                  {currentEmployee?.avatar_url ? (
                    <img src={currentEmployee.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
                  ) : (
                    <span className="text-primary text-lg font-bold">
                      {currentEmployee?.name?.charAt(0) ?? user?.email?.charAt(0) ?? '?'}
                    </span>
                  )}
                </div>
                <div>
                  <p className="text-sm font-bold text-text-bright">{currentEmployee?.name ?? '이름 없음'}</p>
                  <p className="text-xs text-text-dim">{user?.email}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-text-dim">직급</span>
                  <p className="text-text-bright font-medium mt-0.5">{roleLabels[currentEmployee?.role ?? ''] ?? '미정'}</p>
                </div>
                <div>
                  <span className="text-text-dim">부서</span>
                  <p className="text-text-bright font-medium mt-0.5">{currentEmployee?.department_name ?? '미배정'}</p>
                </div>
                <div>
                  <span className="text-text-dim">연락처</span>
                  <p className="text-text-bright font-medium mt-0.5">{currentEmployee?.phone ?? '-'}</p>
                </div>
                <div>
                  <span className="text-text-dim">상태</span>
                  <p className="text-text-bright font-medium mt-0.5">{currentEmployee?.is_active ? '활성' : '비활성'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Team overview */}
          <div>
            <h3 className="text-sm font-bold text-text-bright mb-3">팀 멤버 ({employees.length}명)</h3>
            <div className="bg-dark-border rounded-xl divide-y divide-dark-border-light max-h-[200px] overflow-y-auto">
              {employees.map((emp) => (
                <div key={emp.id} className="flex items-center gap-3 px-4 py-2.5">
                  <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                    {emp.avatar_url ? (
                      <img src={emp.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
                    ) : (
                      <span className="text-primary text-[10px] font-bold">{emp.name.charAt(0)}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-text-bright truncate">{emp.name}</p>
                    <p className="text-[10px] text-text-dim truncate">{emp.email}</p>
                  </div>
                  <span className="text-[10px] text-text-dim bg-dark-card px-2 py-0.5 rounded-full shrink-0">
                    {roleLabels[emp.role] ?? emp.role}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* App info */}
          <div>
            <h3 className="text-sm font-bold text-text-bright mb-3">앱 정보</h3>
            <div className="bg-dark-border rounded-xl p-4 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-text-dim">버전</span>
                <span className="text-text-bright font-mono">1.0.0</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-dim">플랫폼</span>
                <span className="text-text-bright">INTEROHRIGIN</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
