// ─── GitHub Configuration ────────────────────────────────────────────────────

export interface GitHubConfig {
  /** Personal Access Token (fine-grained or classic with repo read scope) */
  pat: string;
  /** Repository owner (user or org) */
  owner: string;
  /** Repository name */
  repo: string;
  /** Root folder within the repo that contains category subfolders */
  rootPath: string;
}

// ─── Prompt Structure ─────────────────────────────────────────────────────────

export interface PromptFile {
  /** Display name (filename without .md extension) */
  name: string;
  /** Full path within the repository */
  path: string;
  /** Raw markdown content */
  content: string;
}

export interface PromptCategory {
  /** Folder name */
  name: string;
  /** Prompts within this category */
  prompts: PromptFile[];
}

export type PromptLibrary = PromptCategory[];

// ─── App State ────────────────────────────────────────────────────────────────

export type AppView = 'settings' | 'library' | 'variables';

export interface VariablesState {
  prompt: PromptFile;
  variables: string[];
}

// ─── Chrome Storage Schema ────────────────────────────────────────────────────

export interface StorageSchema {
  githubConfig?: GitHubConfig;
  cachedLibrary?: PromptLibrary;
  lastSynced?: number;
  lastBrowserTabId?: number;
}
