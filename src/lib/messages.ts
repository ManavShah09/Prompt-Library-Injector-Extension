import type { PromptLibrary } from './types';

// ─── Outgoing Messages (Popup → Background) ──────────────────────────────────

export interface FetchLibraryMessage {
  type: 'FETCH_LIBRARY';
  forceRefresh?: boolean;
}

export interface InjectTextMessage {
  type: 'INJECT_TEXT';
  text: string;
}

export type PopupMessage = FetchLibraryMessage | InjectTextMessage;

// ─── Incoming Messages (Background → Content Script) ─────────────────────────

export interface ContentInjectMessage {
  type: 'INJECT_TEXT';
  text: string;
}

// ─── Response Types ───────────────────────────────────────────────────────────

export interface SuccessResponse {
  success: true;
}

export interface ErrorResponse {
  success: false;
  error: string;
}

export interface LibrarySuccessResponse extends SuccessResponse {
  library: PromptLibrary;
}

export type LibraryResponse = LibrarySuccessResponse | ErrorResponse;
export type InjectResponse  = SuccessResponse | ErrorResponse;
