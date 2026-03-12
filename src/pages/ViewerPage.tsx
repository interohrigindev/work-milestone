import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { FolderKanban, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import {
  subscribeProjects,
  subscribeMilestones,
  subscribeDailyLogs,
  subscribeComments,
  createComment,
} from '../lib/firestore';
import ProgressBar from '../components/ProgressBar';
import StatusBadge from '../components/StatusBadge';
import MilestoneCard from '../components/MilestoneCard';
import DailyLogSection from '../components/DailyLogSection';
import CommentSection from '../components/CommentSection';
import type { Project, Milestone, DailyLog, Comment } from '../types';

export default function ViewerPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const [project, setProject] = useState<Project | null>(null);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [logs, setLogs] = useState<DailyLog[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!projectId) return;
    const unsubs = [
      subscribeProjects((projects) => {
        const found = projects.find((p) => p.id === projectId);
        if (found) {
          setProject(found);
          setNotFound(false);
        } else {
          setNotFound(true);
        }
      }),
      subscribeMilestones(projectId, setMilestones),
      subscribeDailyLogs(projectId, setLogs),
      subscribeComments(projectId, setComments),
    ];
    return () => unsubs.forEach((u) => u());
  }, [projectId]);

  if (notFound) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <FolderKanban className="w-12 h-12 mx-auto text-gray-300 mb-3" />
          <h2 className="text-lg font-bold text-gray-600">프로젝트를 찾을 수 없습니다</h2>
          <p className="text-sm text-gray-400 mt-1">링크를 다시 확인해 주세요.</p>
        </div>
      </div>
    );
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
        <div className="max-w-3xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <FolderKanban className="w-6 h-6 text-blue-600" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-gray-900 truncate">{project.title}</h1>
                <StatusBadge status={project.status} />
              </div>
              {project.description && (
                <p className="text-sm text-gray-500 mt-0.5">{project.description}</p>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8 space-y-8">
        {/* Overall progress */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-gray-900">전체 진행률</h3>
            <span className="text-xs text-gray-400">
              업데이트: {format(project.updatedAt, 'yyyy.MM.dd HH:mm', { locale: ko })}
            </span>
          </div>
          <ProgressBar progress={project.overallProgress} size="lg" />
        </div>

        {/* Milestones */}
        {milestones.length > 0 && (
          <div>
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2 mb-4">
              <ExternalLink className="w-5 h-5 text-blue-600" />
              마일스톤
            </h3>
            <div className="space-y-3">
              {milestones.map((ms) => (
                <MilestoneCard key={ms.id} milestone={ms} />
              ))}
            </div>
          </div>
        )}

        {/* Daily Logs */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <DailyLogSection logs={logs} />
        </div>

        {/* Comments */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <CommentSection
            comments={comments}
            onAdd={(content, author) =>
              projectId && createComment(projectId, content, author)
            }
          />
        </div>
      </main>

      <footer className="text-center py-6 text-xs text-gray-400">
        Work Milestone &mdash; 프로젝트 트래커
      </footer>
    </div>
  );
}
