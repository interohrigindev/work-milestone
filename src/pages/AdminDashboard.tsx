import { useEffect, useState } from 'react';
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
} from 'lucide-react';
import { isAdminAuthenticated, logoutAdmin } from '../lib/auth';
import { subscribeAllProjects, createNewProject, deleteProject } from '../lib/firestore';
import { parseRepoSlug } from '../lib/github';
import Sidebar from '../components/Sidebar';
import ProgressBar from '../components/ProgressBar';
import type { Project } from '../types';

type CreateMode = null | 'manual' | 'github';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [createMode, setCreateMode] = useState<CreateMode>(null);
  const [creating, setCreating] = useState(false);

  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [githubRepo, setGithubRepo] = useState('');

  useEffect(() => {
    if (!isAdminAuthenticated()) {
      navigate('/admin/login');
      return;
    }
    const unsub = subscribeAllProjects((p) => {
      setProjects(p);
      setLoaded(true);
    });
    return unsub;
  }, [navigate]);

  function handleLogout() {
    logoutAdmin();
    navigate('/admin/login');
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
      });
      resetForm();
      navigate(`/admin/project/${id}`);
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

  // Quick stats
  const totalProgress = projects.length > 0
    ? Math.round(projects.reduce((sum, p) => sum + p.overallProgress, 0) / projects.length)
    : 0;

  return (
    <div className="min-h-screen bg-dark-bg flex">
      <Sidebar
        projects={projects}
        isAdmin
        onLogout={handleLogout}
      />

      <div className="flex-1 min-w-0">
        {/* Dashboard Header */}
        <div className="bg-dark-surface border-b border-dark-border">
          <div className="max-w-6xl mx-auto px-6 py-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-xl font-bold text-text-bright">대시보드</h1>
                <p className="text-xs text-text-dim mt-1">프로젝트 전체 현황</p>
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
            <div className="grid grid-cols-4 gap-4">
              <div className="bg-dark-card rounded-xl border border-dark-border p-4">
                <div className="flex items-center gap-2 mb-2">
                  <FolderOpen className="w-4 h-4 text-group-blue" />
                  <span className="text-xs text-text-dim">전체 프로젝트</span>
                </div>
                <span className="text-2xl font-bold font-mono text-text-bright">{projects.length}</span>
              </div>
              <div className="bg-dark-card rounded-xl border border-dark-border p-4">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-4 h-4 text-status-done" />
                  <span className="text-xs text-text-dim">평균 진행률</span>
                </div>
                <span className="text-2xl font-bold font-mono text-text-bright">{totalProgress}%</span>
              </div>
              <div className="bg-dark-card rounded-xl border border-dark-border p-4">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2 className="w-4 h-4 text-status-done" />
                  <span className="text-xs text-text-dim">완료된 프로젝트</span>
                </div>
                <span className="text-2xl font-bold font-mono text-text-bright">
                  {projects.filter(p => p.overallProgress >= 100).length}
                </span>
              </div>
              <div className="bg-dark-card rounded-xl border border-dark-border p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-4 h-4 text-status-progress" />
                  <span className="text-xs text-text-dim">진행 중</span>
                </div>
                <span className="text-2xl font-bold font-mono text-text-bright">
                  {projects.filter(p => p.overallProgress > 0 && p.overallProgress < 100).length}
                </span>
              </div>
            </div>
          </div>
        </div>

        <main className="max-w-6xl mx-auto px-6 py-6">
          {/* Create form */}
          {createMode !== null && (
            <div className="bg-dark-card rounded-xl border border-dark-border p-6 mb-6">
              <h3 className="text-text-bright font-bold mb-4">새 프로젝트 만들기</h3>

              <div className="flex gap-2 mb-6">
                <button
                  onClick={() => setCreateMode('manual')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                    createMode === 'manual'
                      ? 'bg-primary text-white'
                      : 'bg-dark-border text-text-dim hover:text-text-mid'
                  }`}
                >
                  <FolderOpen className="w-4 h-4" /> 직접 입력
                </button>
                <button
                  onClick={() => setCreateMode('github')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                    createMode === 'github'
                      ? 'bg-primary text-white'
                      : 'bg-dark-border text-text-dim hover:text-text-mid'
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
          )}

          {/* Project cards */}
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
              <div
                key={p.id}
                className="bg-dark-card border border-dark-border rounded-xl p-5 hover:border-primary/30 transition-all cursor-pointer group"
                onClick={() => navigate(`/admin/project/${p.id}`)}
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
                    <div className="flex gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open(`/view/${p.id}`, '_blank');
                        }}
                        className="p-1.5 rounded-lg text-text-dim hover:text-primary hover:bg-dark-border transition-colors"
                        title="뷰어 페이지"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(p.id, p.title);
                        }}
                        className="p-1.5 rounded-lg text-text-dim hover:text-status-blocked hover:bg-dark-border transition-colors"
                        title="삭제"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}
