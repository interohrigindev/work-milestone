import { useState, useEffect, useMemo } from 'react';
import {
  Github,
  GitCommit,
  GitPullRequest,
  CircleDot,
  GitBranch,
  RefreshCw,
  ExternalLink,
  TrendingUp,
  CheckCircle2,
  Clock,
  AlertCircle,
  Code2,
  Activity,
  Save,
} from 'lucide-react';
import { fetchGitHubStats, parseRepoSlug } from '../lib/github';
import type { GitHubStats } from '../types/github';

interface Props {
  repoUrl: string;
  isAdmin?: boolean;
  onSaveRepo?: (url: string) => void;
}

export default function GitHubPanel({ repoUrl, isAdmin, onSaveRepo }: Props) {
  const [stats, setStats] = useState<GitHubStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [inputUrl, setInputUrl] = useState(repoUrl);

  async function loadStats(url: string) {
    if (!url) return;
    setLoading(true);
    setError('');
    try {
      const data = await fetchGitHubStats(url);
      setStats(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '데이터를 가져올 수 없습니다.');
    }
    setLoading(false);
  }

  useEffect(() => {
    if (repoUrl) loadStats(repoUrl);
  }, [repoUrl]);

  function handleSave() {
    const slug = parseRepoSlug(inputUrl);
    if (!slug) { setError('올바른 GitHub URL을 입력하세요.'); return; }
    onSaveRepo?.(inputUrl.trim());
    loadStats(inputUrl.trim());
  }

  // Derived stats for non-developer-friendly display
  const summary = useMemo(() => {
    if (!stats) return null;

    const totalCommits = stats.commits.length;
    const totalPRs = stats.prs.length;
    const mergedPRs = stats.prs.filter((p) => p.merged).length;
    const openPRs = stats.prs.filter((p) => p.state === 'open').length;
    const totalIssues = stats.issues.length;
    const closedIssues = stats.issues.filter((i) => i.state === 'closed').length;
    const openIssues = stats.issues.filter((i) => i.state === 'open').length;
    const issueCompletionRate = totalIssues > 0 ? Math.round((closedIssues / totalIssues) * 100) : 0;

    // Activity score (simple heuristic)
    const recentCommits = stats.commits.filter(
      (c) => Date.now() - new Date(c.date).getTime() < 7 * 24 * 60 * 60 * 1000
    ).length;

    // Languages
    const totalBytes = Object.values(stats.languages).reduce((a, b) => a + b, 0);
    const langPercents = Object.entries(stats.languages)
      .map(([name, bytes]) => ({ name, percent: Math.round((bytes / totalBytes) * 100) }))
      .sort((a, b) => b.percent - a.percent)
      .slice(0, 5);

    // Commit timeline (last 14 days)
    const days: { date: string; count: number; label: string }[] = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      const key = d.toISOString().slice(0, 10);
      const weekday = d.toLocaleDateString('ko-KR', { weekday: 'short' });
      const dayNum = d.getDate();
      days.push({
        date: key,
        count: stats.commitsByDay[key] ?? 0,
        label: `${dayNum}일(${weekday})`,
      });
    }
    const maxCommitsPerDay = Math.max(...days.map((d) => d.count), 1);

    return {
      totalCommits,
      totalPRs,
      mergedPRs,
      openPRs,
      totalIssues,
      closedIssues,
      openIssues,
      issueCompletionRate,
      recentCommits,
      langPercents,
      days,
      maxCommitsPerDay,
    };
  }, [stats]);

  // Color for language pills
  const langColors: Record<string, string> = {
    TypeScript: '#3178C6',
    JavaScript: '#F7DF1E',
    Python: '#3776AB',
    Java: '#ED8B00',
    Go: '#00ADD8',
    Rust: '#DEA584',
    HTML: '#E34C26',
    CSS: '#1572B6',
    SCSS: '#CF649A',
    Vue: '#41B883',
    Swift: '#FA7343',
    Kotlin: '#7F52FF',
    Ruby: '#CC342D',
    PHP: '#777BB4',
  };

  return (
    <div className="space-y-4">
      {/* Admin: repo URL input */}
      {isAdmin && (
        <div className="bg-dark-card rounded-2xl border border-dark-border p-5">
          <div className="flex items-center gap-2 mb-3">
            <Github className="w-5 h-5 text-text-bright" />
            <h3 className="text-sm font-bold text-text-bright">GitHub 레포지토리 연결</h3>
          </div>
          <div className="flex gap-2">
            <input
              className="flex-1 bg-dark-border border border-dark-border-light rounded-xl px-4 py-2.5 text-sm text-text-bright placeholder-text-dim font-mono focus:outline-none focus:border-gold/40"
              placeholder="https://github.com/owner/repo"
              value={inputUrl}
              onChange={(e) => setInputUrl(e.target.value)}
            />
            <button
              onClick={handleSave}
              className="inline-flex items-center gap-1.5 bg-gold text-dark-bg px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-gold-dim shrink-0"
            >
              <Save className="w-4 h-4" /> 연결
            </button>
          </div>
          {error && <p className="text-status-blocked text-xs mt-2">{error}</p>}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="bg-dark-card rounded-2xl border border-dark-border p-8 flex items-center justify-center gap-3">
          <RefreshCw className="w-5 h-5 text-gold animate-spin" />
          <span className="text-text-mid text-sm">GitHub 데이터 분석 중...</span>
        </div>
      )}

      {/* Error (non-admin) */}
      {!isAdmin && error && (
        <div className="bg-dark-card rounded-2xl border border-dark-border p-6 text-center">
          <p className="text-text-dim text-sm">{error}</p>
        </div>
      )}

      {/* Stats Display */}
      {stats && summary && !loading && (
        <>
          {/* Repo header */}
          <div className="bg-dark-card rounded-2xl border border-dark-border p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-dark-border rounded-xl flex items-center justify-center">
                  <Github className="w-6 h-6 text-text-bright" />
                </div>
                <div>
                  <h3 className="font-bold text-text-bright">{stats.repo.full_name}</h3>
                  {stats.repo.description && (
                    <p className="text-xs text-text-dim mt-0.5">{stats.repo.description}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => loadStats(repoUrl)}
                  className="p-2 text-text-dim hover:text-gold rounded-lg hover:bg-gold/10 transition-colors"
                  title="새로고침"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
                <a
                  href={stats.repo.html_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 text-text-dim hover:text-text-bright rounded-lg hover:bg-dark-border transition-colors"
                  title="GitHub에서 보기"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            </div>
          </div>

          {/* 한눈에 보는 개발 현황 - Key Metrics */}
          <div className="bg-dark-card rounded-2xl border border-dark-border p-5">
            <h3 className="text-sm font-bold text-text-bright mb-4 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-gold" />
              개발 현황 요약
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {/* Code Changes */}
              <div className="bg-dark-bg rounded-xl p-4 text-center">
                <GitCommit className="w-5 h-5 text-blue-400 mx-auto mb-2" />
                <div className="font-mono text-2xl font-bold text-text-bright">{summary.totalCommits}</div>
                <div className="text-xs text-text-dim mt-1">코드 변경</div>
                <div className="text-[10px] text-blue-400 mt-0.5">최근 7일: {summary.recentCommits}건</div>
              </div>
              {/* PRs */}
              <div className="bg-dark-bg rounded-xl p-4 text-center">
                <GitPullRequest className="w-5 h-5 text-purple-400 mx-auto mb-2" />
                <div className="font-mono text-2xl font-bold text-text-bright">{summary.mergedPRs}<span className="text-sm text-text-dim">/{summary.totalPRs}</span></div>
                <div className="text-xs text-text-dim mt-1">코드 리뷰 완료</div>
                {summary.openPRs > 0 && (
                  <div className="text-[10px] text-status-progress mt-0.5">{summary.openPRs}건 리뷰 대기</div>
                )}
              </div>
              {/* Issues */}
              <div className="bg-dark-bg rounded-xl p-4 text-center">
                <CircleDot className="w-5 h-5 text-green-400 mx-auto mb-2" />
                <div className="font-mono text-2xl font-bold text-text-bright">{summary.issueCompletionRate}<span className="text-sm text-text-dim">%</span></div>
                <div className="text-xs text-text-dim mt-1">할 일 완료율</div>
                <div className="text-[10px] text-text-dim mt-0.5">{summary.closedIssues}완료 / {summary.openIssues}남음</div>
              </div>
              {/* Branches */}
              <div className="bg-dark-bg rounded-xl p-4 text-center">
                <GitBranch className="w-5 h-5 text-orange-400 mx-auto mb-2" />
                <div className="font-mono text-2xl font-bold text-text-bright">{stats.branches.length}</div>
                <div className="text-xs text-text-dim mt-1">작업 브랜치</div>
                <div className="text-[10px] text-text-dim mt-0.5">기본: {stats.repo.default_branch}</div>
              </div>
            </div>
          </div>

          {/* 코드 작업 활동 타임라인 - commit heatmap */}
          <div className="bg-dark-card rounded-2xl border border-dark-border p-5">
            <h3 className="text-sm font-bold text-text-bright mb-4 flex items-center gap-2">
              <Activity className="w-4 h-4 text-gold" />
              최근 2주 개발 활동
            </h3>
            <div className="flex items-end gap-1 h-24">
              {summary.days.map((day) => {
                const height = day.count > 0 ? Math.max(12, (day.count / summary.maxCommitsPerDay) * 100) : 4;
                const isToday = day.date === new Date().toISOString().slice(0, 10);
                return (
                  <div key={day.date} className="flex-1 flex flex-col items-center gap-1 group relative">
                    {/* Tooltip */}
                    <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-dark-bg border border-dark-border rounded-lg px-2 py-1 text-[10px] text-text-mid whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                      {day.label}: {day.count}건
                    </div>
                    {/* Bar */}
                    <div
                      className={`w-full rounded-t-sm transition-all ${
                        day.count === 0
                          ? 'bg-dark-border'
                          : isToday
                            ? 'bg-gold'
                            : 'bg-blue-500/70'
                      }`}
                      style={{ height: `${height}%`, minHeight: '3px' }}
                    />
                    {/* Day label */}
                    <span className={`text-[9px] ${isToday ? 'text-gold font-bold' : 'text-text-dim'}`}>
                      {new Date(day.date).getDate()}
                    </span>
                  </div>
                );
              })}
            </div>
            <div className="flex items-center justify-between mt-2">
              <span className="text-[10px] text-text-dim">2주 전</span>
              <span className="text-[10px] text-text-dim">오늘</span>
            </div>
          </div>

          {/* Issue 완료 진행률 바 */}
          {summary.totalIssues > 0 && (
            <div className="bg-dark-card rounded-2xl border border-dark-border p-5">
              <h3 className="text-sm font-bold text-text-bright mb-4 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-status-done" />
                할 일 (이슈) 진행 상황
              </h3>
              {/* Progress bar */}
              <div className="mb-3">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs text-text-mid">전체 진행률</span>
                  <span className="font-mono text-sm font-bold text-text-bright">{summary.issueCompletionRate}%</span>
                </div>
                <div className="h-3 bg-dark-border rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-status-done/80 to-status-done rounded-full transition-all duration-700"
                    style={{ width: `${summary.issueCompletionRate}%` }}
                  />
                </div>
              </div>
              {/* Issue breakdown */}
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-dark-bg rounded-lg p-2.5 text-center">
                  <div className="text-xs text-text-dim mb-0.5">전체</div>
                  <div className="font-mono text-lg font-bold text-text-bright">{summary.totalIssues}</div>
                </div>
                <div className="bg-status-done/10 rounded-lg p-2.5 text-center">
                  <div className="text-xs text-status-done mb-0.5">완료</div>
                  <div className="font-mono text-lg font-bold text-status-done">{summary.closedIssues}</div>
                </div>
                <div className="bg-status-progress/10 rounded-lg p-2.5 text-center">
                  <div className="text-xs text-status-progress mb-0.5">진행중</div>
                  <div className="font-mono text-lg font-bold text-status-progress">{summary.openIssues}</div>
                </div>
              </div>
            </div>
          )}

          {/* 최근 코드 리뷰(PR) */}
          {stats.prs.length > 0 && (
            <div className="bg-dark-card rounded-2xl border border-dark-border p-5">
              <h3 className="text-sm font-bold text-text-bright mb-3 flex items-center gap-2">
                <GitPullRequest className="w-4 h-4 text-purple-400" />
                최근 코드 리뷰 (Pull Request)
              </h3>
              <div className="space-y-2">
                {stats.prs.slice(0, 8).map((pr) => (
                  <a
                    key={pr.number}
                    href={pr.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 bg-dark-bg rounded-lg p-3 hover:bg-dark-border/50 transition-colors"
                  >
                    {pr.merged ? (
                      <CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0" />
                    ) : pr.state === 'open' ? (
                      <Clock className="w-4 h-4 text-status-done shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-status-blocked shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-text-bright truncate">{pr.title}</p>
                      <p className="text-[10px] text-text-dim mt-0.5">
                        #{pr.number} · {pr.author} · {new Date(pr.updated_at).toLocaleDateString('ko-KR')}
                      </p>
                    </div>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${
                      pr.merged
                        ? 'bg-purple-500/20 text-purple-400'
                        : pr.state === 'open'
                          ? 'bg-status-done/20 text-status-done'
                          : 'bg-status-blocked/20 text-status-blocked'
                    }`}>
                      {pr.merged ? '병합됨' : pr.state === 'open' ? '리뷰 중' : '닫힘'}
                    </span>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* 최근 코드 변경 기록 */}
          <div className="bg-dark-card rounded-2xl border border-dark-border p-5">
            <h3 className="text-sm font-bold text-text-bright mb-3 flex items-center gap-2">
              <GitCommit className="w-4 h-4 text-blue-400" />
              최근 코드 변경 기록
            </h3>
            <div className="space-y-1.5">
              {stats.commits.slice(0, 10).map((c) => {
                const dateStr = new Date(c.date).toLocaleDateString('ko-KR', {
                  month: 'numeric',
                  day: 'numeric',
                  weekday: 'short',
                });
                const timeStr = new Date(c.date).toLocaleTimeString('ko-KR', {
                  hour: '2-digit',
                  minute: '2-digit',
                });
                return (
                  <div key={c.sha} className="flex items-start gap-3 py-2 border-b border-dark-border/50 last:border-0">
                    <span className="font-mono text-[10px] text-text-dim bg-dark-border rounded px-1.5 py-0.5 mt-0.5 shrink-0">
                      {c.sha}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-text-mid truncate">{c.message}</p>
                      <p className="text-[10px] text-text-dim mt-0.5">
                        {c.author} · {dateStr} {timeStr}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 사용 기술 */}
          {summary.langPercents.length > 0 && (
            <div className="bg-dark-card rounded-2xl border border-dark-border p-5">
              <h3 className="text-sm font-bold text-text-bright mb-3 flex items-center gap-2">
                <Code2 className="w-4 h-4 text-gold" />
                사용 기술
              </h3>
              {/* Stacked bar */}
              <div className="h-4 flex rounded-full overflow-hidden mb-3">
                {summary.langPercents.map((l) => (
                  <div
                    key={l.name}
                    className="h-full transition-all"
                    style={{
                      width: `${l.percent}%`,
                      backgroundColor: langColors[l.name] ?? '#6B7280',
                    }}
                    title={`${l.name}: ${l.percent}%`}
                  />
                ))}
              </div>
              <div className="flex flex-wrap gap-2">
                {summary.langPercents.map((l) => (
                  <div key={l.name} className="flex items-center gap-1.5">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: langColors[l.name] ?? '#6B7280' }}
                    />
                    <span className="text-xs text-text-mid">{l.name}</span>
                    <span className="font-mono text-[10px] text-text-dim">{l.percent}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Empty state */}
      {!stats && !loading && !error && !repoUrl && (
        <div className="bg-dark-card rounded-2xl border border-dark-border p-8 text-center">
          <Github className="w-10 h-10 text-text-dim mx-auto mb-3" />
          <p className="text-text-dim text-sm">GitHub 레포지토리를 연결하면</p>
          <p className="text-text-dim text-sm">개발 진행 상황을 한눈에 확인할 수 있습니다.</p>
        </div>
      )}
    </div>
  );
}
