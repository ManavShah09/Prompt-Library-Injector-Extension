import { fetchLibrary } from '../lib/github';
import type { GitHubConfig, PromptLibrary } from '../lib/types';
import type { InjectResponse, LibraryResponse } from '../lib/messages';

// ─── Track Last Active Browser Tab ───────────────────────────────────────────
// When the popup is open, chrome.tabs.query({ active, currentWindow }) returns
// the popup window itself (no browser tabs). We solve this by tracking the
// most recently activated tab in a normal browser window.

let lastBrowserTabId: number | null = null;

/**
 * Returns true only for URLs that Chrome allows content scripts to run on.
 * Filters out chrome://, chrome-extension://, about:, edge://, devtools://, etc.
 */
function isInjectableUrl(url: string | undefined): boolean {
  if (!url) return false;
  const blocked = ['chrome://', 'chrome-extension://', 'about:', 'edge://', 'devtools://', 'data:', 'file://'];
  return !blocked.some((prefix) => url.startsWith(prefix));
}

chrome.tabs.onActivated.addListener(({ tabId, windowId }) => {
  chrome.windows.get(windowId, (win) => {
    if (chrome.runtime.lastError) return;
    if (win.type !== 'normal') return;
    // Verify the tab has an injectable URL before tracking it
    chrome.tabs.get(tabId, (tab) => {
      if (chrome.runtime.lastError) return;
      if (isInjectableUrl(tab.url)) {
        lastBrowserTabId = tabId;
      }
    });
  });
});

// Also capture tab on startup / install (skip restricted URLs)
chrome.runtime.onStartup.addListener(async () => {
  const tabs = await chrome.tabs.query({ active: true, windowType: 'normal' });
  const tab  = tabs.find((t) => isInjectableUrl(t.url));
  if (tab?.id) lastBrowserTabId = tab.id;
});

chrome.runtime.onInstalled.addListener(async () => {
  const tabs = await chrome.tabs.query({ active: true, windowType: 'normal' });
  const tab  = tabs.find((t) => isInjectableUrl(t.url));
  if (tab?.id) lastBrowserTabId = tab.id;
});

// ─── Message Listener ─────────────────────────────────────────────────────────

chrome.runtime.onMessage.addListener(
  (
    message: { type: string; forceRefresh?: boolean; text?: string },
    _sender,
    sendResponse
  ) => {
    (async () => {
      try {
        if (message.type === 'FETCH_LIBRARY') {
          const result = await handleFetchLibrary(message.forceRefresh ?? false);
          sendResponse(result);
        } else if (message.type === 'INJECT_TEXT' && message.text !== undefined) {
          const result = await handleInjectText(message.text);
          sendResponse(result);
        } else {
          sendResponse({ success: false, error: 'Unknown message type.' });
        }
      } catch (err) {
        sendResponse({ success: false, error: String(err) });
      }
    })();

    // Return true to keep the message channel open for async sendResponse
    return true;
  }
);

// ─── Handlers ─────────────────────────────────────────────────────────────────

async function handleFetchLibrary(forceRefresh: boolean): Promise<LibraryResponse> {
  try {
    // Serve from cache unless a forced refresh is requested
    if (!forceRefresh) {
      const { cachedLibrary } = await chrome.storage.local.get('cachedLibrary');
      if (cachedLibrary) {
        return { success: true, library: cachedLibrary as PromptLibrary };
      }
    }

    const { githubConfig } = await chrome.storage.local.get('githubConfig');
    const config = githubConfig as GitHubConfig | undefined;

    if (!config?.pat || !config.owner || !config.repo) {
      return {
        success: false,
        error: 'GitHub credentials not configured. Please open Settings.',
      };
    }

    const library = await fetchLibrary(config);
    await chrome.storage.local.set({ cachedLibrary: library, lastSynced: Date.now() });

    return { success: true, library };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: `GitHub API Error: ${msg}` };
  }
}

async function handleInjectText(text: string): Promise<InjectResponse> {
  // Resolve the tab to inject into
  const tabId = await resolveTargetTabId();
  if (tabId === null) {
    return {
      success: false,
      error:
        'Could not find a browser tab to inject into. ' +
        'Make sure a web page is open and focused before using the popup.',
    };
  }

  // ── Attempt 1: send to the already-loaded content script ─────────────
  try {
    const result = await chrome.tabs.sendMessage(tabId, { type: 'INJECT_TEXT', text });
    if (result) return result as InjectResponse;
  } catch {
    // Content script not loaded on this tab yet — fall through to inject it
  }

  // ── Attempt 2: programmatically inject text via chrome.scripting ──────
  try {
    const results = await chrome.scripting.executeScript({
      target: { tabId },
      args: [text],
      func: (textToInject: string) => {
        /**
         * Self-contained injection function — runs directly in the page context.
         * No dependency on the content script being loaded.
         */
        const el = document.activeElement as HTMLElement | null;

        // ── Find the best target element ─────────────────────────────
        const target: HTMLElement | null = (() => {
          if (!el || el === document.body || el === document.documentElement) {
            // Try common AI chat selectors as fallback
            return (
              document.querySelector<HTMLElement>('[contenteditable="true"]') ??
              document.querySelector<HTMLTextAreaElement>('textarea') ??
              null
            );
          }

          // If the active element isn't directly editable, search children
          if (
            el instanceof HTMLTextAreaElement ||
            el instanceof HTMLInputElement ||
            el.isContentEditable
          ) {
            return el;
          }

          return (
            el.querySelector<HTMLTextAreaElement>('textarea') ??
            el.querySelector<HTMLElement>('[contenteditable="true"]') ??
            document.querySelector<HTMLElement>('[contenteditable="true"]') ??
            document.querySelector<HTMLTextAreaElement>('textarea') ??
            null
          );
        })();

        if (!target) {
          return { success: false, error: 'No text field found. Click inside a text input on the page first.' };
        }

        target.focus();

        // ── Inject into <textarea> / <input> ─────────────────────────
        if (target instanceof HTMLTextAreaElement || target instanceof HTMLInputElement) {
          const start = target.selectionStart ?? target.value.length;
          const end   = target.selectionEnd   ?? target.value.length;

          // Try execCommand first
          try {
            target.setSelectionRange(start, end);
            const ok = document.execCommand('insertText', false, textToInject);
            if (ok && target.value.includes(textToInject)) return { success: true };
          } catch { /* fall through */ }

          // React native setter trick
          const proto = target instanceof HTMLTextAreaElement
            ? window.HTMLTextAreaElement.prototype
            : window.HTMLInputElement.prototype;
          const nativeSetter = Object.getOwnPropertyDescriptor(proto, 'value')?.set;
          const newValue = target.value.slice(0, start) + textToInject + target.value.slice(end);

          if (nativeSetter) nativeSetter.call(target, newValue);
          else target.value = newValue;

          target.selectionStart = target.selectionEnd = start + textToInject.length;
          target.dispatchEvent(new Event('input',  { bubbles: true }));
          target.dispatchEvent(new Event('change', { bubbles: true }));
          return { success: true };
        }

        // ── Inject into contenteditable ──────────────────────────────
        if (target.isContentEditable || target.getAttribute('contenteditable') === 'true') {
          const selection = window.getSelection();

          if (selection && selection.rangeCount > 0) {
            const range = selection.getRangeAt(0);
            range.deleteContents();

            const lines    = textToInject.split('\n');
            const fragment = document.createDocumentFragment();
            lines.forEach((line, i) => {
              if (i > 0) fragment.appendChild(document.createElement('br'));
              if (line)  fragment.appendChild(document.createTextNode(line));
            });

            range.insertNode(fragment);
            range.collapse(false);
            selection.removeAllRanges();
            selection.addRange(range);
          } else {
            // Create a new paragraph when no selection exists
            const p = document.createElement('p');
            p.textContent = textToInject;
            target.appendChild(p);
          }

          target.dispatchEvent(new InputEvent('input', {
            bubbles:    true,
            cancelable: true,
            inputType:  'insertText',
            data:       textToInject,
          }));

          return { success: true };
        }

        return { success: false, error: 'Could not inject into the focused element.' };
      },
    });

    // executeScript returns an array of results per frame
    const result = results?.[0]?.result as InjectResponse | undefined;
    return result ?? { success: false, error: 'No result from injection script.' };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);

    // chrome.scripting.executeScript fails on truly restricted pages
    if (
      msg.includes('Cannot access') ||
      msg.includes('chrome://') ||
      msg.includes('Cannot script')
    ) {
      return {
        success: false,
        error:
          'Cannot inject on this page (chrome:// or restricted URLs). ' +
          'Navigate to a regular web page first.',
      };
    }

    return { success: false, error: `Injection failed: ${msg}` };
  }
}

async function resolveTargetTabId(): Promise<number | null> {
  // Verify the stored tab is still valid and points to an injectable URL
  if (lastBrowserTabId !== null) {
    try {
      const tab = await chrome.tabs.get(lastBrowserTabId);
      if (isInjectableUrl(tab.url)) {
        return lastBrowserTabId;
      }
      // Stored tab is now a restricted page — clear it and fall through
      lastBrowserTabId = null;
    } catch {
      // Tab no longer exists
      lastBrowserTabId = null;
    }
  }

  // Fallback: find the most recent active tab with an injectable URL
  const tabs = await chrome.tabs.query({ active: true, windowType: 'normal' });
  const tab  = tabs.find((t) => isInjectableUrl(t.url));
  if (tab?.id) {
    lastBrowserTabId = tab.id;
    return tab.id;
  }

  // Last resort: any tab in any normal window that is injectable
  const allTabs = await chrome.tabs.query({ windowType: 'normal' });
  const anyTab  = allTabs.find((t) => isInjectableUrl(t.url));
  if (anyTab?.id) return anyTab.id;

  return null;
}
