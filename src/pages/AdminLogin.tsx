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
            <div className="w-14 h-14 bg-gold/10 border border-gold/20 rounded-2xl flex items-center justify-center mb-4">
              <Lock className="w-7 h-7 text-gold" />
            </div>
            <h1 className="text-xl font-bold text-text-bright">관리자 로그인</h1>
            <p className="text-sm text-text-dim mt-1">프로젝트를 관리하려면 비밀번호를 입력하세요</p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="password"
              className="w-full bg-dark-border border border-dark-border-light rounded-xl px-4 py-3 text-sm text-text-bright placeholder-text-dim focus:outline-none focus:border-gold/50 focus:ring-1 focus:ring-gold/20"
              placeholder="비밀번호"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoFocus
            />
            {error && <p className="text-status-blocked text-sm">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gold text-dark-bg py-3 rounded-xl font-bold hover:bg-gold-dim transition-colors disabled:opacity-50"
            >
              {loading ? '확인 중...' : '로그인'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
