const styles: Record<string, string> = {
  planning: 'bg-purple-100 text-purple-700',
  'in-progress': 'bg-blue-100 text-blue-700',
  review: 'bg-amber-100 text-amber-700',
  completed: 'bg-emerald-100 text-emerald-700',
  pending: 'bg-gray-100 text-gray-600',
};

const labels: Record<string, string> = {
  planning: '기획 중',
  'in-progress': '진행 중',
  review: '리뷰',
  completed: '완료',
  pending: '대기',
};

export default function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-block px-2.5 py-0.5 text-xs font-semibold rounded-full ${styles[status] ?? 'bg-gray-100 text-gray-600'}`}
    >
      {labels[status] ?? status}
    </span>
  );
}
