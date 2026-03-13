import { useState } from 'react';
import { Link2, Copy, Check, MessageSquare, Mail, QrCode, X } from 'lucide-react';

interface Props {
  projectId: string;
}

export default function SharePanel({ projectId }: Props) {
  const [copied, setCopied] = useState(false);
  const [showQR, setShowQR] = useState(false);

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

  const qrUrl = `https://chart.googleapis.com/chart?cht=qr&chs=200x200&chl=${encodeURIComponent(viewerUrl)}&choe=UTF-8`;

  return (
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
  );
}
