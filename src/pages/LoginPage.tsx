import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Mail, UserPlus, LogIn, KeyRound } from 'lucide-react';
import { loginWithEmail, signUpWithEmail, isAdminRole, onAuthChange, checkEmployeeExists } from '../lib/auth';
import type { AuthUser } from '../lib/auth';

type Mode = 'login' | 'first-login';

export default function LoginPage() {
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [setupSuccess, setSetupSuccess] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const navigate = useNavigate();

  // If already logged in, redirect to dashboard
  useEffect(() => {
    const unsub = onAuthChange((user) => {
      if (user) {
        if (isAdminRole(user.employee)) {
          sessionStorage.setItem('isAdmin', 'true');
        }
        navigate('/dashboard', { replace: true });
      } else {
        setCheckingAuth(false);
      }
    });
    return unsub;
  }, [navigate]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const user: AuthUser = await loginWithEmail(email, password);
      if (!user.employee) {
        setError('등록된 직원 정보가 없습니다. 관리자에게 문의하세요.');
        setLoading(false);
        return;
      }
      if (isAdminRole(user.employee)) {
        sessionStorage.setItem('isAdmin', 'true');
      }
      navigate('/dashboard');
    } catch (err) {
      const msg = err instanceof Error ? err.message : '로그인에 실패했습니다.';
      if (msg.includes('Invalid login credentials')) {
        // Check if this employee exists but hasn't set up their password yet
        const exists = await checkEmployeeExists(email);
        if (exists) {
          setError('비밀번호가 설정되지 않았거나 올바르지 않습니다. 처음 로그인이라면 아래 "비밀번호 설정"을 클릭하세요.');
        } else {
          setError('이메일 또는 비밀번호가 올바르지 않습니다.');
        }
      } else if (msg.includes('too-many-requests') || msg.includes('rate limit')) {
        setError('로그인 시도가 너무 많습니다. 잠시 후 다시 시도하세요.');
      } else if (msg.includes('Email not confirmed')) {
        setError('이메일 인증이 필요합니다. 이메일을 확인해 주세요.');
      } else {
        setError(msg);
      }
    }
    setLoading(false);
  }

  async function handleFirstLogin(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    // Check employee exists
    const exists = await checkEmployeeExists(email);
    if (!exists) {
      setError('등록된 직원 이메일이 아닙니다. 관리자에게 문의하세요.');
      return;
    }

    if (password !== confirmPassword) {
      setError('비밀번호가 일치하지 않습니다.');
      return;
    }
    if (password.length < 6) {
      setError('비밀번호는 6자 이상이어야 합니다.');
      return;
    }

    setLoading(true);
    try {
      await signUpWithEmail(email, password);
      setSetupSuccess(true);
    } catch (err) {
      const msg = err instanceof Error ? err.message : '비밀번호 설정에 실패했습니다.';
      if (msg.includes('already registered') || msg.includes('already been registered')) {
        setError('이미 비밀번호가 설정된 계정입니다. 로그인을 시도해주세요.');
      } else {
        setError(msg);
      }
    }
    setLoading(false);
  }

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-text-dim text-sm">로딩 중...</p>
        </div>
      </div>
    );
  }

  if (setupSuccess) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center p-4">
        <div className="w-full max-w-sm">
          <div className="bg-dark-card rounded-2xl border border-dark-border p-8 shadow-xl text-center">
            <div className="w-14 h-14 bg-status-done/10 border border-status-done/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <KeyRound className="w-7 h-7 text-status-done" />
            </div>
            <h1 className="text-xl font-bold text-text-bright mb-2">비밀번호 설정 완료</h1>
            <p className="text-sm text-text-dim mb-6 leading-relaxed">
              비밀번호가 설정되었습니다.<br />
              이제 로그인할 수 있습니다.
            </p>
            <button
              onClick={() => { setMode('login'); setSetupSuccess(false); setError(''); setConfirmPassword(''); }}
              className="w-full bg-primary text-white py-3 rounded-xl font-bold hover:bg-primary-hover transition-colors"
            >
              로그인하기
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-bg flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="bg-dark-card rounded-2xl border border-dark-border p-8 shadow-xl">
          {/* Header */}
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
            <h1 className="text-xl font-bold text-text-bright">
              {mode === 'login' ? '로그인' : '비밀번호 설정'}
            </h1>
            <p className="text-sm text-text-dim mt-1">
              {mode === 'login'
                ? '이메일과 비밀번호를 입력하세요'
                : '처음 로그인하시는 분은 비밀번호를 설정하세요'
              }
            </p>
          </div>

          {/* Mode toggle */}
          <div className="flex rounded-xl bg-dark-border p-1 mb-6">
            <button
              type="button"
              onClick={() => { setMode('login'); setError(''); }}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-semibold transition-colors ${
                mode === 'login' ? 'bg-primary text-white' : 'text-text-dim hover:text-text-mid'
              }`}
            >
              <LogIn className="w-3.5 h-3.5" /> 로그인
            </button>
            <button
              type="button"
              onClick={() => { setMode('first-login'); setError(''); }}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-semibold transition-colors ${
                mode === 'first-login' ? 'bg-primary text-white' : 'text-text-dim hover:text-text-mid'
              }`}
            >
              <KeyRound className="w-3.5 h-3.5" /> 비밀번호 설정
            </button>
          </div>

          {/* Form */}
          <form onSubmit={mode === 'login' ? handleLogin : handleFirstLogin} className="space-y-3">
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-dim" />
              <input
                type="email"
                className="w-full bg-dark-border border border-dark-border-light rounded-xl pl-10 pr-4 py-3 text-sm text-text-bright placeholder-text-dim focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20"
                placeholder="회사 이메일"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-dim" />
              <input
                type="password"
                className="w-full bg-dark-border border border-dark-border-light rounded-xl pl-10 pr-4 py-3 text-sm text-text-bright placeholder-text-dim focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20"
                placeholder="비밀번호"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {mode === 'first-login' && (
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-dim" />
                <input
                  type="password"
                  className="w-full bg-dark-border border border-dark-border-light rounded-xl pl-10 pr-4 py-3 text-sm text-text-bright placeholder-text-dim focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20"
                  placeholder="비밀번호 확인"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
            )}

            {error && (
              <p className="text-status-blocked text-sm px-1">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-white py-3 rounded-xl font-bold hover:bg-primary-hover transition-colors disabled:opacity-50"
            >
              {loading
                ? (mode === 'login' ? '로그인 중...' : '설정 중...')
                : (mode === 'login' ? '로그인' : '비밀번호 설정')
              }
            </button>
          </form>

          <p className="text-xs text-text-dim text-center mt-4">
            {mode === 'login'
              ? '처음 로그인하시나요? "비밀번호 설정" 탭에서 비밀번호를 설정하세요'
              : '등록된 회사 이메일로만 비밀번호를 설정할 수 있습니다'
            }
          </p>
        </div>
      </div>
    </div>
  );
}
