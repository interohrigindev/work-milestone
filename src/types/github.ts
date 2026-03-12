export interface GitHubRepo {
  name: string;
  full_name: string;
  description: string | null;
  html_url: string;
  language: string | null;
  stargazers_count: number;
  open_issues_count: number;
  default_branch: string;
  updated_at: string;
}

export interface GitHubCommit {
  sha: string;
  message: string;
  author: string;
  date: string;
  url: string;
}

export interface GitHubPR {
  number: number;
  title: string;
  state: 'open' | 'closed';
  merged: boolean;
  author: string;
  created_at: string;
  updated_at: string;
  url: string;
}

export interface GitHubIssue {
  number: number;
  title: string;
  state: 'open' | 'closed';
  labels: string[];
  created_at: string;
  url: string;
}

export interface GitHubBranch {
  name: string;
  isDefault: boolean;
  lastCommitDate: string;
}

export interface GitHubStats {
  repo: GitHubRepo;
  commits: GitHubCommit[];
  prs: GitHubPR[];
  issues: GitHubIssue[];
  branches: GitHubBranch[];
  commitsByDay: Record<string, number>;
  languages: Record<string, number>;
}
