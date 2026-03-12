import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  FolderOpen,
  Github,
  LogOut,
  Trash2,
  ExternalLink,
} from 'lucide-react';
import { isAdminAuthenticated, logoutAdmin } from '../lib/auth';
import { subscribeAllProjects, createNewProject, deleteProject } from '../lib/firestore';
import { parseRepoSlug } from '../lib/github';
import ProgressBar from '../components/ProgressBar';
import type { Project } from '../types';

type CreateMode = null | 'manual' | 'github';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [createMode, setCreateMode] = useState<CreateMode>(null);
  const [creating, setCreating] = useState(false);

  // Form state
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
    if (!confirm(`"${projectTitle}" 프로젝트를 삭제하시겠습니까?\n(하위 작업/로그/의견은 유지됩니다)`)) return;
    await deleteProject(projectId);
  }

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

  return (
    <div className="min-h-screen bg-dark-bg">
      {/* Header */}
      <div className="bg-dark-card border-b border-dark-border">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-gold">INTEROHRIGIN</h1>
            <p className="text-xs text-text-dim">프로젝트 관리 대시보드</p>
          </div>
          <button
            onClick={handleLogout}
            className="inline-flex items-center gap-1.5 text-xs text-text-dim hover:text-status-blocked"
          >
            <LogOut className="w-3.5 h-3.5" /> 로그아웃
          </button>
        </div>
      </div>

      <main className="max-w-5xl mx-auto px-4 py-8">
        {/* Project list */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-text-bright font-bold text-lg">
            프로젝트 목록
            <span className="text-text-dim text-sm font-normal ml-2">({projects.length})</span>
          </h2>
          {createMode === null && (
            <button
              onClick={() => setCreateMode('manual')}
              className="inline-flex items-center gap-2 bg-gold text-dark-bg px-4 py-2 rounded-xl text-sm font-bold hover:bg-gold-dim transition-colors"
            >
              <Plus className="w-4 h-4" /> 새 프로젝트
            </button>
          )}
        </div>

        {/* Create form */}
        {createMode !== null && (
          <div className="bg-dark-card rounded-xl border border-dark-border p-6 mb-8">
            <h3 className="text-text-bright font-bold mb-4">새 프로젝트 만들기</h3>

            {/* Mode tabs */}
            <div className="flex gap-2 mb-6">
              <button
                onClick={() => setCreateMode('manual')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                  createMode === 'manual'
                    ? 'bg-gold text-dark-bg'
                    : 'bg-dark-border text-text-dim hover:text-text-mid'
                }`}
              >
                <FolderOpen className="w-4 h-4" /> 직접 입력하기
              </button>
              <button
                onClick={() => setCreateMode('github')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                  createMode === 'github'
                    ? 'bg-gold text-dark-bg'
                    : 'bg-dark-border text-text-dim hover:text-text-mid'
                }`}
              >
                <Github className="w-4 h-4" /> GitHub 레포지토리 연결
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              {createMode === 'github' && (
                <div>
                  <label className="text-xs text-text-dim block mb-1">GitHub 레포지토리 URL</label>
                  <input
                    type="text"
                    className="w-full bg-dark-border border border-dark-border-light rounded-lg px-3 py-2 text-sm text-text-bright"
                    placeholder="https://github.com/owner/repo 또는 owner/repo"
                    value={githubRepo}
                    onChange={(e) => setGithubRepo(e.target.value)}
                    required
                  />
                  <p className="text-[11px] text-text-dim mt-1">Private 레포인 경우 프로젝트 상세에서 GitHub 토큰을 설정하세요.</p>
                </div>
              )}

              <div>
                <label className="text-xs text-text-dim block mb-1">프로젝트 제목 *</label>
                <input
                  type="text"
                  className="w-full bg-dark-border border border-dark-border-light rounded-lg px-3 py-2 text-sm text-text-bright"
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
                  className="w-full bg-dark-border border border-dark-border-light rounded-lg px-3 py-2 text-sm text-text-bright"
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
                    className="w-full bg-dark-border border border-dark-border-light rounded-lg px-3 py-2 text-sm text-text-bright"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                <div className="flex-1">
                  <label className="text-xs text-text-dim block mb-1">종료일</label>
                  <input
                    type="date"
                    className="w-full bg-dark-border border border-dark-border-light rounded-lg px-3 py-2 text-sm text-text-bright"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={creating}
                  className="bg-gold text-dark-bg px-5 py-2 rounded-xl text-sm font-bold hover:bg-gold-dim disabled:opacity-50 transition-colors"
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
              className="inline-flex items-center gap-2 bg-gold text-dark-bg px-6 py-3 rounded-xl font-bold hover:bg-gold-dim transition-colors"
            >
              <Plus className="w-5 h-5" /> 첫 프로젝트 만들기
            </button>
          </div>
        )}

        <div className="grid gap-4">
          {projects.map((p) => (
            <div
              key={p.id}
              className="bg-dark-card border border-dark-border rounded-xl p-5 hover:border-gold/30 transition-colors cursor-pointer group"
              onClick={() => navigate(`/admin/project/${p.id}`)}
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
                <div className="flex items-center gap-2 flex-shrink-0">
                  <div className="w-24">
                    <ProgressBar progress={p.overallProgress} showLabel={false} size="sm" />
                    <p className="text-[10px] text-text-dim text-center mt-1 font-mono">{p.overallProgress}%</p>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        window.open(`/view/${p.id}`, '_blank');
                      }}
                      className="p-1.5 rounded-lg text-text-dim hover:text-gold hover:bg-dark-border transition-colors"
                      title="뷰어 페이지 열기"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(p.id, p.title);
                      }}
                      className="p-1.5 rounded-lg text-text-dim hover:text-status-blocked hover:bg-dark-border transition-colors"
                      title="프로젝트 삭제"
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

      <footer className="text-center py-8 text-xs text-text-dim border-t border-dark-border">
        <span className="text-gold">INTEROHRIGIN</span> — 관리자 대시보드
      </footer>
    </div>
  );
}
