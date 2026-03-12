import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Settings } from 'lucide-react';
import { isAdminAuthenticated } from '../lib/auth';
import {
  subscribeProjects,
  updateProject,
  subscribeMilestones,
  createMilestone,
  updateMilestone,
  deleteMilestone,
  subscribeDailyLogs,
  createDailyLog,
  deleteDailyLog,
  subscribeComments,
  deleteComment,
} from '../lib/firestore';
import ProgressBar from '../components/ProgressBar';
import StatusBadge from '../components/StatusBadge';
import MilestoneCard from '../components/MilestoneCard';
import DailyLogSection from '../components/DailyLogSection';
import CommentSection from '../components/CommentSection';
import type { Project, Milestone, DailyLog, Comment } from '../types';

export default function AdminProjectDetail() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [logs, setLogs] = useState<DailyLog[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [showMilestoneForm, setShowMilestoneForm] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [newMs, setNewMs] = useState({ title: '', description: '', dueDate: '' });
  const [editStatus, setEditStatus] = useState<Project['status']>('planning');
  const [editProgress, setEditProgress] = useState(0);

  useEffect(() => {
    if (!isAdminAuthenticated()) {
      navigate('/admin/login');
      return;
    }
    if (!projectId) return;

    const unsubs = [
      subscribeProjects((projects) => {
        const found = projects.find((p) => p.id === projectId);
        if (found) {
          setProject(found);
          setEditStatus(found.status);
          setEditProgress(found.overallProgress);
        }
      }),
      subscribeMilestones(projectId, setMilestones),
      subscribeDailyLogs(projectId, setLogs),
      subscribeComments(projectId, setComments),
    ];
    return () => unsubs.forEach((u) => u());
  }, [projectId, navigate]);

  async function handleAddMilestone(e: React.FormEvent) {
    e.preventDefault();
    if (!projectId || !newMs.title.trim()) return;
    await createMilestone(projectId, {
      title: newMs.title.trim(),
      description: newMs.description.trim(),
      status: 'pending',
      progress: 0,
      dueDate: newMs.dueDate ? new Date(newMs.dueDate) : new Date(),
      order: milestones.length,
    });
    setNewMs({ title: '', description: '', dueDate: '' });
    setShowMilestoneForm(false);
  }

  async function handleUpdateMilestone(id: string, data: Partial<Milestone>) {
    if (!projectId) return;
    await updateMilestone(projectId, id, data);
  }

  async function handleDeleteMilestone(id: string) {
    if (!projectId || !confirm('마일스톤을 삭제하시겠습니까?')) return;
    await deleteMilestone(projectId, id);
  }

  async function handleSaveSettings() {
    if (!projectId) return;
    await updateProject(projectId, {
      status: editStatus,
      overallProgress: editProgress,
    });
    setShowSettings(false);
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-400">로딩 중...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center gap-3">
          <button
            onClick={() => navigate('/admin')}
            className="p-1.5 text-gray-500 hover:text-gray-900 rounded-lg hover:bg-gray-100"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-gray-900 truncate">{project.title}</h1>
              <StatusBadge status={project.status} />
            </div>
          </div>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-2 text-gray-400 hover:text-gray-900 rounded-lg hover:bg-gray-100"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-8">
        {/* Project settings */}
        {showSettings && (
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <h3 className="font-bold text-gray-900 mb-4">프로젝트 설정</h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-500 block mb-1">상태</label>
                <select
                  className="border rounded-xl px-4 py-2 text-sm w-full"
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value as Project['status'])}
                >
                  <option value="planning">기획 중</option>
                  <option value="in-progress">진행 중</option>
                  <option value="review">리뷰</option>
                  <option value="completed">완료</option>
                </select>
              </div>
              <div>
                <label className="text-sm text-gray-500 block mb-1">전체 진행률: {editProgress}%</label>
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={5}
                  value={editProgress}
                  onChange={(e) => setEditProgress(Number(e.target.value))}
                  className="w-full"
                />
              </div>
              <button
                onClick={handleSaveSettings}
                className="bg-blue-600 text-white px-5 py-2 rounded-xl text-sm font-semibold hover:bg-blue-700"
              >
                저장
              </button>
            </div>
          </div>
        )}

        {/* Overall progress */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <h3 className="font-bold text-gray-900 mb-3">전체 진행률</h3>
          <ProgressBar progress={project.overallProgress} size="lg" />
        </div>

        {/* Milestones */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900">마일스톤</h3>
            <button
              onClick={() => setShowMilestoneForm(!showMilestoneForm)}
              className="inline-flex items-center gap-1 text-sm bg-blue-600 text-white px-3 py-1.5 rounded-xl hover:bg-blue-700"
            >
              <Plus className="w-4 h-4" /> 추가
            </button>
          </div>

          {showMilestoneForm && (
            <form
              onSubmit={handleAddMilestone}
              className="bg-white rounded-xl border border-gray-200 p-5 mb-4 shadow-sm space-y-3"
            >
              <input
                className="w-full border rounded-lg px-3 py-2 text-sm"
                placeholder="마일스톤 제목"
                value={newMs.title}
                onChange={(e) => setNewMs({ ...newMs, title: e.target.value })}
              />
              <textarea
                className="w-full border rounded-lg px-3 py-2 text-sm resize-none"
                rows={2}
                placeholder="설명 (선택)"
                value={newMs.description}
                onChange={(e) => setNewMs({ ...newMs, description: e.target.value })}
              />
              <input
                type="date"
                className="border rounded-lg px-3 py-2 text-sm"
                value={newMs.dueDate}
                onChange={(e) => setNewMs({ ...newMs, dueDate: e.target.value })}
              />
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-4 py-1.5 rounded-lg text-sm font-semibold hover:bg-blue-700"
                >
                  추가
                </button>
                <button
                  type="button"
                  onClick={() => setShowMilestoneForm(false)}
                  className="bg-gray-200 text-gray-700 px-4 py-1.5 rounded-lg text-sm hover:bg-gray-300"
                >
                  취소
                </button>
              </div>
            </form>
          )}

          <div className="space-y-3">
            {milestones.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-8">마일스톤을 추가해 보세요.</p>
            )}
            {milestones.map((ms) => (
              <MilestoneCard
                key={ms.id}
                milestone={ms}
                isAdmin
                onUpdate={handleUpdateMilestone}
                onDelete={handleDeleteMilestone}
              />
            ))}
          </div>
        </div>

        {/* Daily Logs */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <DailyLogSection
            logs={logs}
            isAdmin
            onAdd={(content) => projectId && createDailyLog(projectId, content)}
            onDelete={(id) => projectId && deleteDailyLog(projectId, id)}
          />
        </div>

        {/* Comments */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <CommentSection
            comments={comments}
            isAdmin
            onAdd={() => {}}
            onDelete={(id) => projectId && deleteComment(projectId, id)}
          />
        </div>
      </main>
    </div>
  );
}
