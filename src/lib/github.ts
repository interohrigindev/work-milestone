import type {
  GitHubRepo,
  GitHubCommit,
  GitHubPR,
  GitHubIssue,
  GitHubBranch,
  GitHubStats,
} from '../types/github';

const API = 'https://api.github.com';

// Token is stored in localStorage for persistence across sessions
const TOKEN_KEY = 'github_pat';

export function getGitHubToken(): string {
  return localStorage.getItem(TOKEN_KEY) ?? '';
}

export function setGitHubToken(token: string) {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
}

function headers(): HeadersInit {
  const h: Record<string, string> = { Accept: 'application/vnd.github+json' };
  const token = getGitHubToken();
  if (token) h['Authorization'] = `Bearer ${token}`;
  return h;
}

/** Parse "owner/repo" from a GitHub URL or "owner/repo" string */
export function parseRepoSlug(input: string): string | null {
  const urlMatch = input.match(/github\.com\/([^/]+\/[^/.\s]+)/);
  if (urlMatch) return urlMatch[1];
  const slugMatch = input.match(/^([^/\s]+\/[^/\s]+)$/);
  if (slugMatch) return slugMatch[1];
  return null;
}

async function fetchJSON<T>(url: string): Promise<T> {
  const res = await fetch(url, { headers: headers() });
  if (res.status === 401 || res.status === 403) {
    throw new Error('GitHub 인증 실패. 토큰을 확인해 주세요.');
  }
  if (res.status === 404) {
    const token = getGitHubToken();
    if (!token) {
      throw new Error('레포지토리를 찾을 수 없습니다. Private 레포인 경우 GitHub 토큰을 입력해 주세요.');
    }
    throw new Error('레포지토리를 찾을 수 없습니다. URL과 토큰 권한을 확인해 주세요.');
  }
  if (!res.ok) throw new Error(`GitHub API ${res.status}: ${res.statusText}`);
  return res.json();
}

async function fetchRepo(slug: string): Promise<GitHubRepo> {
  const data = await fetchJSON<Record<string, unknown>>(`${API}/repos/${slug}`);
  return {
    name: data.name as string,
    full_name: data.full_name as string,
    description: (data.description as string) ?? null,
    html_url: data.html_url as string,
    language: (data.language as string) ?? null,
    stargazers_count: data.stargazers_count as number,
    open_issues_count: data.open_issues_count as number,
    default_branch: data.default_branch as string,
    updated_at: data.updated_at as string,
  };
}

async function fetchCommits(slug: string, perPage = 30): Promise<GitHubCommit[]> {
  const data = await fetchJSON<Record<string, unknown>[]>(
    `${API}/repos/${slug}/commits?per_page=${perPage}`
  );
  return data.map((c) => {
    const commit = c.commit as Record<string, unknown>;
    const author = commit.author as Record<string, unknown>;
    return {
      sha: (c.sha as string).slice(0, 7),
      message: ((commit.message as string) ?? '').split('\n')[0],
      author: (author?.name as string) ?? 'unknown',
      date: author?.date as string,
      url: c.html_url as string,
    };
  });
}

async function fetchPRs(slug: string): Promise<GitHubPR[]> {
  const [openData, closedData] = await Promise.all([
    fetchJSON<Record<string, unknown>[]>(`${API}/repos/${slug}/pulls?state=open&per_page=20`),
    fetchJSON<Record<string, unknown>[]>(`${API}/repos/${slug}/pulls?state=closed&per_page=10&sort=updated&direction=desc`),
  ]);
  const all = [...openData, ...closedData];
  return all.map((pr) => ({
    number: pr.number as number,
    title: pr.title as string,
    state: pr.state as 'open' | 'closed',
    merged: !!(pr.merged_at),
    author: ((pr.user as Record<string, unknown>)?.login as string) ?? '',
    created_at: pr.created_at as string,
    updated_at: pr.updated_at as string,
    url: pr.html_url as string,
  }));
}

async function fetchIssues(slug: string): Promise<GitHubIssue[]> {
  const [openData, closedData] = await Promise.all([
    fetchJSON<Record<string, unknown>[]>(`${API}/repos/${slug}/issues?state=open&per_page=30`),
    fetchJSON<Record<string, unknown>[]>(`${API}/repos/${slug}/issues?state=closed&per_page=20&sort=updated&direction=desc`),
  ]);
  const all = [...openData, ...closedData];
  return all
    .filter((i) => !i.pull_request)
    .map((i) => ({
      number: i.number as number,
      title: i.title as string,
      state: i.state as 'open' | 'closed',
      labels: ((i.labels as Record<string, unknown>[]) ?? []).map(
        (l) => (l.name as string) ?? ''
      ),
      created_at: i.created_at as string,
      url: i.html_url as string,
    }));
}

async function fetchBranches(slug: string, defaultBranch: string): Promise<GitHubBranch[]> {
  const data = await fetchJSON<Record<string, unknown>[]>(
    `${API}/repos/${slug}/branches?per_page=20`
  );
  return data.map((b) => ({
    name: b.name as string,
    isDefault: b.name === defaultBranch,
    lastCommitDate: '',
  }));
}

async function fetchLanguages(slug: string): Promise<Record<string, number>> {
  return fetchJSON<Record<string, number>>(`${API}/repos/${slug}/languages`);
}

/** Fetch all GitHub stats for a repository */
export async function fetchGitHubStats(repoInput: string): Promise<GitHubStats> {
  const slug = parseRepoSlug(repoInput);
  if (!slug) throw new Error('잘못된 GitHub 레포 URL입니다.');

  const repo = await fetchRepo(slug);
  const [commits, prs, issues, branches, languages] = await Promise.all([
    fetchCommits(slug),
    fetchPRs(slug),
    fetchIssues(slug),
    fetchBranches(slug, repo.default_branch),
    fetchLanguages(slug),
  ]);

  const commitsByDay: Record<string, number> = {};
  for (const c of commits) {
    const day = c.date.slice(0, 10);
    commitsByDay[day] = (commitsByDay[day] ?? 0) + 1;
  }

  return { repo, commits, prs, issues, branches, commitsByDay, languages };
}
