import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock } from 'lucide-react';
import { loginAdmin } from '../lib/auth';

export default function AdminLogin() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    const ok = await loginAdmin(password);
    setLoading(false);
    if (ok) {
      navigate('/admin');
    } else {
      setError('비밀번호가 올바르지 않습니다.');
    }
  }

  return (
    <div className="min-h-screen bg-dark-bg flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="bg-dark-card rounded-2xl border border-dark-border p-8 shadow-xl">
          <div className="flex flex-col items-center mb-6">
            <div className="w-14 h-14 bg-primary/10 border border-primary/20 rounded-2xl flex items-center justify-center mb-4">
              <Lock className="w-7 h-7 text-primary" />
            </div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 rounded-md bg-primary flex items-center justify-center">
                <span className="text-white font-bold text-[10px]">IO</span>
              </div>
              <span className="text-sm font-bold text-text-mid">INTEROHRIGIN</span>
            </div>
            <h1 className="text-xl font-bold text-text-bright">관리자 로그인</h1>
            <p className="text-sm text-text-dim mt-1">프로젝트를 관리하려면 비밀번호를 입력하세요</p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="password"
              className="w-full bg-dark-border border border-dark-border-light rounded-xl px-4 py-3 text-sm text-text-bright placeholder-text-dim focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20"
              placeholder="비밀번호"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoFocus
            />
            {error && <p className="text-status-blocked text-sm">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-white py-3 rounded-xl font-bold hover:bg-primary-hover transition-colors disabled:opacity-50"
            >
              {loading ? '확인 중...' : '로그인'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
