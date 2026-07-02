/**
 * Content Script — Text Injector
 *
 * Responsibilities:
 * 1. Track the last focused interactive element (before popup opens and steals focus)
 * 2. Listen for INJECT_TEXT messages from the background and inject the text
 *
 * Injection strategy (in priority order):
 *   A. Standard <textarea> / <input>  →  execCommand, then native setter + events
 *   B. contenteditable divs (ChatGPT, Claude, Gemini, etc.)  →  Selection API + InputEvent
 */

// ─── Focus Tracking ───────────────────────────────────────────────────────────

let lastFocusedEl: HTMLElement | null = null;

document.addEventListener(
  'focusin',
  (e: FocusEvent) => {
    const target = e.target as HTMLElement;
    if (isInteractiveInput(target)) {
      lastFocusedEl = target;
    }
  },
  true // capture phase so we see events before they bubble away
);

function isInteractiveInput(el: HTMLElement): boolean {
  if (el instanceof HTMLInputElement) {
    const blocked = ['checkbox', 'radio', 'file', 'submit', 'button', 'reset', 'image', 'range', 'color'];
    return !blocked.includes(el.type);
  }
  return (
    el instanceof HTMLTextAreaElement ||
    el.isContentEditable ||
    el.getAttribute('contenteditable') === 'true'
  );
}

// ─── Message Listener ─────────────────────────────────────────────────────────

chrome.runtime.onMessage.addListener(
  (message: { type: string; text?: string }, _sender, sendResponse) => {
    if (message.type === 'INJECT_TEXT' && typeof message.text === 'string') {
      const result = injectText(message.text);
      sendResponse(result);
    }
    return true; // Keep channel open for async (even though we respond sync)
  }
);

// ─── Injection Logic ──────────────────────────────────────────────────────────

function injectText(text: string): { success: boolean; error?: string } {
  const el = (lastFocusedEl ?? document.activeElement) as HTMLElement | null;

  if (!el || el === document.body || el === document.documentElement) {
    return {
      success: false,
      error:
        'No text field is selected. Click inside a text input on the page first, then click Inject.',
    };
  }

  // ── Strategy A: <input> / <textarea> ───────────────────────────────────
  if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
    return injectIntoInputEl(el, text);
  }

  // ── Strategy B: contenteditable (ChatGPT, Claude, Gemini, etc.) ────────
  if (el.isContentEditable || el.getAttribute('contenteditable') === 'true') {
    return injectIntoContentEditable(el, text);
  }

  // ── Strategy C: search child elements for a usable input ───────────────
  const child =
    el.querySelector<HTMLTextAreaElement>('textarea') ??
    el.querySelector<HTMLInputElement>('input[type="text"], input:not([type])') ??
    el.querySelector<HTMLElement>('[contenteditable="true"]');

  if (child) {
    child.focus();
    lastFocusedEl = child;
    return injectText(text); // recurse with the child now tracked
  }

  return {
    success: false,
    error:
      'The selected element is not a text input. Click inside a text field and try again.',
  };
}

// ── Sub-strategy A: standard <input> / <textarea> ──────────────────────────

function injectIntoInputEl(
  el: HTMLInputElement | HTMLTextAreaElement,
  text: string
): { success: boolean; error?: string } {
  el.focus();
  const start = el.selectionStart ?? el.value.length;
  const end   = el.selectionEnd   ?? el.value.length;

  // Attempt 1: execCommand — works for most vanilla and some React inputs
  try {
    el.setSelectionRange(start, end);
    const ok = document.execCommand('insertText', false, text);
    if (ok && el.value.includes(text)) return { success: true };
  } catch {
    /* fall through */
  }

  // Attempt 2: React / Vue native setter trick
  // React wraps input.value via a native setter; bypassing it allows the
  // synthetic event to trigger the controlled component update.
  const proto =
    el instanceof HTMLTextAreaElement
      ? window.HTMLTextAreaElement.prototype
      : window.HTMLInputElement.prototype;

  const nativeSetter = Object.getOwnPropertyDescriptor(proto, 'value')?.set;
  const newValue = el.value.slice(0, start) + text + el.value.slice(end);

  if (nativeSetter) {
    nativeSetter.call(el, newValue);
  } else {
    el.value = newValue;
  }

  el.selectionStart = el.selectionEnd = start + text.length;
  el.dispatchEvent(new Event('input',  { bubbles: true }));
  el.dispatchEvent(new Event('change', { bubbles: true }));

  return { success: true };
}

// ── Sub-strategy B: contenteditable ────────────────────────────────────────

function injectIntoContentEditable(
  el: HTMLElement,
  text: string
): { success: boolean; error?: string } {
  el.focus();

  const selection = window.getSelection();

  if (selection && selection.rangeCount > 0) {
    const range = selection.getRangeAt(0);
    range.deleteContents();

    // Preserve newlines by inserting text + <br> nodes into a DocumentFragment
    const lines    = text.split('\n');
    const fragment = document.createDocumentFragment();
    lines.forEach((line, i) => {
      if (i > 0) fragment.appendChild(document.createElement('br'));
      if (line)  fragment.appendChild(document.createTextNode(line));
    });

    range.insertNode(fragment);

    // Collapse cursor to the end of the inserted content
    range.collapse(false);
    selection.removeAllRanges();
    selection.addRange(range);
  } else {
    // No selection — just append a new paragraph
    const p   = document.createElement('p');
    p.textContent = text;
    el.appendChild(p);
  }

  // Fire an InputEvent so frameworks (React/Vue) detect the change
  el.dispatchEvent(
    new InputEvent('input', {
      bubbles:    true,
      cancelable: true,
      inputType:  'insertText',
      data:       text,
    })
  );

  return { success: true };
}
