import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FolderKanban, Eye, Lock } from 'lucide-react';
import { subscribeProjects } from '../lib/firestore';
import ProgressBar from '../components/ProgressBar';
import StatusBadge from '../components/StatusBadge';
import type { Project } from '../types';

export default function Home() {
  const [projects, setProjects] = useState<Project[]>([]);

  useEffect(() => {
    return subscribeProjects(setProjects);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-4 py-6 text-center">
          <FolderKanban className="w-10 h-10 text-blue-600 mx-auto mb-3" />
          <h1 className="text-2xl font-bold text-gray-900">Work Milestone</h1>
          <p className="text-sm text-gray-500 mt-1">
            프로젝트 공정표를 실시간으로 확인하세요
          </p>
          <Link
            to="/admin/login"
            className="inline-flex items-center gap-1.5 mt-4 text-xs text-gray-400 hover:text-gray-600"
          >
            <Lock className="w-3.5 h-3.5" /> 관리자
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        {projects.length === 0 && (
          <div className="text-center py-20 text-gray-400">
            <p>공개된 프로젝트가 없습니다.</p>
          </div>
        )}

        <div className="grid gap-4">
          {projects.map((p) => (
            <Link
              key={p.id}
              to={`/view/${p.id}`}
              className="block bg-white rounded-2xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-gray-900">{p.title}</h3>
                    <StatusBadge status={p.status} />
                  </div>
                  {p.description && (
                    <p className="text-sm text-gray-500 mb-3">{p.description}</p>
                  )}
                  <ProgressBar progress={p.overallProgress} size="sm" />
                </div>
                <Eye className="w-5 h-5 text-gray-300 shrink-0 mt-1" />
              </div>
            </Link>
          ))}
        </div>
      </main>

      <footer className="text-center py-6 text-xs text-gray-400">
        Work Milestone &mdash; 프로젝트 트래커
      </footer>
    </div>
  );
}
