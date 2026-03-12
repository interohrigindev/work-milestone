import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { CheckCircle, Circle, Clock, Trash2, Edit3, Save, X } from 'lucide-react';
import { useState } from 'react';
import ProgressBar from './ProgressBar';
import StatusBadge from './StatusBadge';
import type { Milestone } from '../types';

interface Props {
  milestone: Milestone;
  isAdmin?: boolean;
  onUpdate?: (id: string, data: Partial<Milestone>) => void;
  onDelete?: (id: string) => void;
}

const statusIcon = {
  pending: <Circle className="w-5 h-5 text-gray-400" />,
  'in-progress': <Clock className="w-5 h-5 text-blue-500" />,
  completed: <CheckCircle className="w-5 h-5 text-emerald-500" />,
};

export default function MilestoneCard({ milestone, isAdmin, onUpdate, onDelete }: Props) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(milestone.title);
  const [description, setDescription] = useState(milestone.description);
  const [progress, setProgress] = useState(milestone.progress);
  const [status, setStatus] = useState(milestone.status);

  function handleSave() {
    onUpdate?.(milestone.id, { title, description, progress, status });
    setEditing(false);
  }

  function handleCancel() {
    setTitle(milestone.title);
    setDescription(milestone.description);
    setProgress(milestone.progress);
    setStatus(milestone.status);
    setEditing(false);
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1">
          {statusIcon[milestone.status]}
          <div className="flex-1 min-w-0">
            {editing ? (
              <div className="space-y-3">
                <input
                  className="w-full border rounded-lg px-3 py-1.5 text-sm font-semibold"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
                <textarea
                  className="w-full border rounded-lg px-3 py-1.5 text-sm resize-none"
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
                <div className="flex items-center gap-3">
                  <label className="text-xs text-gray-500">진행률</label>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    step={5}
                    value={progress}
                    onChange={(e) => setProgress(Number(e.target.value))}
                    className="flex-1"
                  />
                  <span className="text-xs font-bold w-10 text-right">{progress}%</span>
                </div>
                <select
                  className="border rounded-lg px-3 py-1.5 text-sm"
                  value={status}
                  onChange={(e) => setStatus(e.target.value as Milestone['status'])}
                >
                  <option value="pending">대기</option>
                  <option value="in-progress">진행 중</option>
                  <option value="completed">완료</option>
                </select>
                <div className="flex gap-2">
                  <button
                    onClick={handleSave}
                    className="inline-flex items-center gap-1 text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700"
                  >
                    <Save className="w-3.5 h-3.5" /> 저장
                  </button>
                  <button
                    onClick={handleCancel}
                    className="inline-flex items-center gap-1 text-xs bg-gray-200 text-gray-700 px-3 py-1.5 rounded-lg hover:bg-gray-300"
                  >
                    <X className="w-3.5 h-3.5" /> 취소
                  </button>
                </div>
              </div>
            ) : (
              <>
                <h4 className="font-semibold text-gray-900">{milestone.title}</h4>
                {milestone.description && (
                  <p className="text-sm text-gray-500 mt-1">{milestone.description}</p>
                )}
                <div className="mt-3">
                  <ProgressBar progress={milestone.progress} size="sm" />
                </div>
                <div className="flex items-center gap-3 mt-2">
                  <StatusBadge status={milestone.status} />
                  <span className="text-xs text-gray-400">
                    마감: {format(milestone.dueDate, 'yyyy.MM.dd', { locale: ko })}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>
        {isAdmin && !editing && (
          <div className="flex gap-1">
            <button
              onClick={() => setEditing(true)}
              className="p-1.5 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-blue-50"
            >
              <Edit3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => onDelete?.(milestone.id)}
              className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
