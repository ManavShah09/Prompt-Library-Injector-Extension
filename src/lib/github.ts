import { Octokit } from 'octokit';
import type { GitHubConfig, PromptFile, PromptLibrary } from './types';

/**
 * Fetches the complete prompt library from a GitHub repository.
 *
 * Strategy:
 * 1. GET /repos/{owner}/{repo} → resolve default branch
 * 2. GET /git/trees/{branch}?recursive=1 → entire repo tree in 1 API call
 * 3. Filter tree items matching {rootPath}/{category}/*.md
 * 4. Batch-fetch raw content for every .md file via Promise.all per category
 *
 * Returns the library sorted alphabetically by category and prompt name.
 */
export async function fetchLibrary(config: GitHubConfig): Promise<PromptLibrary> {
  const octokit = new Octokit({ auth: config.pat });

  // ── Step 1: Resolve default branch ──────────────────────────────────────
  const { data: repoData } = await octokit.rest.repos.get({
    owner: config.owner,
    repo:  config.repo,
  });
  const defaultBranch = repoData.default_branch;

  // ── Step 2: Recursive tree fetch ─────────────────────────────────────────
  const { data: treeData } = await octokit.rest.git.getTree({
    owner:    config.owner,
    repo:     config.repo,
    tree_sha: defaultBranch,
    recursive: '1',
  });

  if (treeData.truncated) {
    console.warn(
      '[PromptInjector] Repository tree was truncated by GitHub API. ' +
      'Some prompts in large repositories may be missing.'
    );
  }

  // ── Step 3: Filter .md files inside {rootPath}/{category}/ ───────────────
  const rootPath = config.rootPath.replace(/^\/+|\/+$/g, ''); // trim slashes
  const rootDepth = rootPath.split('/').length;                 // depth of root

  const mdFiles = (treeData.tree ?? []).filter((item) => {
    if (item.type !== 'blob' || !item.path) return false;
    if (!item.path.startsWith(rootPath + '/')) return false;
    if (!item.path.endsWith('.md')) return false;
    // Must be exactly one level below root (i.e. in a category subfolder)
    const parts = item.path.split('/');
    return parts.length === rootDepth + 2;
  });

  // ── Step 4: Group by category ────────────────────────────────────────────
  const categoryMap = new Map<string, string[]>();
  for (const file of mdFiles) {
    if (!file.path) continue;
    const relativePath = file.path.slice(rootPath.length + 1); // e.g. "Research/my-prompt.md"
    const parts        = relativePath.split('/');
    const category     = parts[0];
    if (!categoryMap.has(category)) categoryMap.set(category, []);
    categoryMap.get(category)!.push(file.path);
  }

  // ── Step 5: Fetch file contents per category ─────────────────────────────
  const library: PromptLibrary = [];

  for (const [categoryName, paths] of categoryMap.entries()) {
    const prompts: PromptFile[] = await Promise.all(
      paths.map(async (filePath): Promise<PromptFile> => {
        const { data } = await octokit.rest.repos.getContent({
          owner: config.owner,
          repo:  config.repo,
          path:  filePath,
        });

        let content = '';
        if (
          !Array.isArray(data) &&
          'content'  in data &&
          'encoding' in data &&
          data.encoding === 'base64'
        ) {
          // atob works in both browser and MV3 service workers
          content = atob(data.content.replace(/\s/g, ''));
        }

        const name = filePath.split('/').pop()!.replace(/\.md$/i, '');
        return { name, path: filePath, content };
      })
    );

    library.push({
      name:    categoryName,
      prompts: prompts.sort((a, b) => a.name.localeCompare(b.name)),
    });
  }

  return library.sort((a, b) => a.name.localeCompare(b.name));
}
