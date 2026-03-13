import { useState } from 'react';
import { Link2, Copy, Check, MessageSquare, Mail, QrCode, X, UserPlus, Trash2 } from 'lucide-react';

interface Props {
  projectId: string;
  collaborators?: string[];
  onUpdateCollaborators?: (collaborators: string[]) => void;
  isAdmin?: boolean;
}

export default function SharePanel({ projectId, collaborators = [], onUpdateCollaborators, isAdmin }: Props) {
  const [copied, setCopied] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteError, setInviteError] = useState('');

  const viewerUrl = `${window.location.origin}/view/${projectId}`;

  function handleCopy() {
    navigator.clipboard.writeText(viewerUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleKakao() {
    window.open(`https://story.kakao.com/s/share?url=${encodeURIComponent(viewerUrl)}`, '_blank', 'width=600,height=400');
  }

  function handleEmail() {
    const subject = encodeURIComponent('프로젝트 진행 현황 공유');
    const body = encodeURIComponent(`안녕하세요,\n\n프로젝트 진행 현황을 아래 링크에서 확인해 주세요.\n로그인 없이 바로 열람 가능하며, 의견도 남길 수 있습니다.\n\n${viewerUrl}\n\n감사합니다.`);
    window.open(`mailto:?subject=${subject}&body=${body}`);
  }

  function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    setInviteError('');
    const email = inviteEmail.trim().toLowerCase();
    if (!email) return;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setInviteError('올바른 이메일 형식이 아닙니다.');
      return;
    }
    if (collaborators.includes(email)) {
      setInviteError('이미 추가된 멤버입니다.');
      return;
    }
    onUpdateCollaborators?.([...collaborators, email]);
    setInviteEmail('');
  }

  function handleRemoveCollaborator(email: string) {
    onUpdateCollaborators?.(collaborators.filter(c => c !== email));
  }

  const qrUrl = `https://chart.googleapis.com/chart?cht=qr&chs=200x200&chl=${encodeURIComponent(viewerUrl)}&choe=UTF-8`;

  return (
    <div className="space-y-6">
      {/* Collaborator invite section */}
      {isAdmin && onUpdateCollaborators && (
        <div className="bg-dark-card rounded-xl border border-dark-border p-5">
          <div className="flex items-center gap-2 mb-3">
            <UserPlus className="w-5 h-5 text-primary" />
            <h3 className="text-sm font-bold text-text-bright">팀원 초대</h3>
          </div>
          <p className="text-xs text-text-dim mb-4">
            이메일로 팀원을 초대하면, 해당 팀원의 대시보드에 이 프로젝트가 표시됩니다.
          </p>

          <form onSubmit={handleInvite} className="flex gap-2 mb-4">
            <input
              type="email"
              placeholder="이메일 주소 입력"
              value={inviteEmail}
              onChange={(e) => { setInviteEmail(e.target.value); setInviteError(''); }}
              className="flex-1 bg-dark-border border border-dark-border-light rounded-lg px-3 py-2 text-sm text-text-bright placeholder-text-dim outline-none focus:border-primary"
            />
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 bg-primary text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-primary-hover transition-colors"
            >
              <UserPlus className="w-3.5 h-3.5" />
              초대
            </button>
          </form>
          {inviteError && (
            <p className="text-xs text-status-blocked mb-3">{inviteError}</p>
          )}

          {collaborators.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-[10px] text-text-dim uppercase tracking-wider font-bold mb-2">초대된 멤버 ({collaborators.length})</p>
              {collaborators.map((email) => (
                <div key={email} className="flex items-center justify-between bg-dark-border rounded-lg px-3 py-2">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
                      <span className="text-primary text-[10px] font-bold">{email.charAt(0).toUpperCase()}</span>
                    </div>
                    <span className="text-xs text-text-bright">{email}</span>
                  </div>
                  <button
                    onClick={() => handleRemoveCollaborator(email)}
                    className="p-1 rounded text-text-dim hover:text-status-blocked transition-colors"
                    title="제거"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
          {collaborators.length === 0 && (
            <p className="text-xs text-text-dim text-center py-2">아직 초대된 멤버가 없습니다</p>
          )}
        </div>
      )}

      {/* Link sharing section */}
      <div className="bg-dark-card rounded-xl border border-dark-border p-5">
        <div className="flex items-center gap-2 mb-3">
          <Link2 className="w-5 h-5 text-primary" />
          <h3 className="text-sm font-bold text-text-bright">프로젝트 공유</h3>
        </div>

        <div className="flex items-center gap-2 bg-dark-surface rounded-lg px-3 py-2.5 border border-dark-border mb-3">
          <span className="flex-1 text-xs text-text-mid font-mono truncate select-all">
            {viewerUrl}
          </span>
        </div>

        <div className="flex items-center gap-2 flex-wrap mb-3">
          <button
            onClick={handleCopy}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
              copied
                ? 'bg-status-done/20 text-status-done'
                : 'bg-primary text-white hover:bg-primary-hover'
            }`}
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? '복사됨!' : '링크 복사'}
          </button>
          <button
            onClick={handleKakao}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-[#FEE500] text-[#191919] hover:bg-[#FDD835]"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            카카오톡
          </button>
          <button
            onClick={handleEmail}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-dark-border text-text-mid hover:bg-dark-border-light"
          >
            <Mail className="w-3.5 h-3.5" />
            이메일
          </button>
          <button
            onClick={() => setShowQR(!showQR)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-dark-border text-text-mid hover:bg-dark-border-light"
          >
            <QrCode className="w-3.5 h-3.5" />
            QR 코드
          </button>
        </div>

        {showQR && (
          <div className="relative bg-white rounded-xl p-4 inline-block">
            <button
              onClick={() => setShowQR(false)}
              className="absolute -top-2 -right-2 bg-dark-card border border-dark-border rounded-full p-1"
            >
              <X className="w-3 h-3 text-text-dim" />
            </button>
            <img src={qrUrl} alt="QR Code" className="w-[160px] h-[160px]" />
            <p className="text-xs text-gray-500 text-center mt-2">모바일로 스캔하세요</p>
          </div>
        )}

        <p className="text-xs text-text-dim leading-relaxed">
          이 링크를 관계자에게 보내면 로그인 없이 현황을 확인하고 의견을 남길 수 있습니다.
        </p>
      </div>
    </div>
  );
}
