import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  LogOut,
  FolderKanban,
  Link as LinkIcon,
  Trash2,
  Eye,
} from 'lucide-react';
import { isAdminAuthenticated, logoutAdmin } from '../lib/auth';
import {
  subscribeProjects,
  createProject,
  deleteProject,
} from '../lib/firestore';
import ProgressBar from '../components/ProgressBar';
import StatusBadge from '../components/StatusBadge';
import type { Project } from '../types';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (!isAdminAuthenticated()) {
      navigate('/admin/login');
      return;
    }
    return subscribeProjects(setProjects);
  }, [navigate]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    await createProject({
      title: title.trim(),
      description: description.trim(),
      status: 'planning',
      overallProgress: 0,
    });
    setTitle('');
    setDescription('');
    setShowForm(false);
  }

  async function handleDelete(id: string) {
    if (!confirm('정말 삭제하시겠습니까?')) return;
    await deleteProject(id);
  }

  function handleLogout() {
    logoutAdmin();
    navigate('/admin/login');
  }

  function copyViewerLink(projectId: string) {
    const url = `${window.location.origin}/view/${projectId}`;
    navigator.clipboard.writeText(url);
    alert('뷰어 링크가 복사되었습니다!');
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FolderKanban className="w-6 h-6 text-blue-600" />
            <h1 className="text-lg font-bold text-gray-900">Work Milestone</h1>
            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
              Admin
            </span>
          </div>
          <button
            onClick={handleLogout}
            className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-red-600"
          >
            <LogOut className="w-4 h-4" /> 로그아웃
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">프로젝트 목록</h2>
          <button
            onClick={() => setShowForm(!showForm)}
            className="inline-flex items-center gap-1.5 bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" /> 새 프로젝트
          </button>
        </div>

        {showForm && (
          <form
            onSubmit={handleCreate}
            className="bg-white rounded-2xl border border-gray-200 p-6 mb-6 shadow-sm"
          >
            <div className="space-y-3">
              <input
                className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="프로젝트 이름"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
              <textarea
                className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={2}
                placeholder="설명 (선택)"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-5 py-2 rounded-xl text-sm font-semibold hover:bg-blue-700"
                >
                  만들기
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="bg-gray-200 text-gray-700 px-5 py-2 rounded-xl text-sm font-semibold hover:bg-gray-300"
                >
                  취소
                </button>
              </div>
            </div>
          </form>
        )}

        {projects.length === 0 && (
          <div className="text-center py-20 text-gray-400">
            <FolderKanban className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>프로젝트가 없습니다. 새 프로젝트를 만들어 보세요.</p>
          </div>
        )}

        <div className="grid gap-4">
          {projects.map((p) => (
            <div
              key={p.id}
              className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-gray-900 text-lg">{p.title}</h3>
                    <StatusBadge status={p.status} />
                  </div>
                  {p.description && (
                    <p className="text-sm text-gray-500 mb-3">{p.description}</p>
                  )}
                  <ProgressBar progress={p.overallProgress} />
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => navigate(`/admin/project/${p.id}`)}
                    className="p-2 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-blue-50"
                    title="관리"
                  >
                    <Eye className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => copyViewerLink(p.id)}
                    className="p-2 text-gray-400 hover:text-violet-600 rounded-lg hover:bg-violet-50"
                    title="뷰어 링크 복사"
                  >
                    <LinkIcon className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleDelete(p.id)}
                    className="p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50"
                    title="삭제"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
