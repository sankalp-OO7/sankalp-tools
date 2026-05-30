import { PaperTheme, DEFAULT_THEME } from './_theme';

const MAX_HISTORY = 10;
const MAX_SAVED_THEMES = 6;
const LS_HISTORY = 'pa_history_v2';
const LS_THEMES = 'pa_saved_themes_v2';
const LS_SETTINGS = 'pa_settings_v2';
const LS_FRAMES = 'pa_frames_v2';
const LS_THEME = 'pa_active_theme_v2';

export interface HistoryEntry {
  id: string;
  ts: number;
  keyword: string;
  ratio: string;
  texture: string;
  frameCount: number;
  thumbUrl: string; // first frame thumbnail (low-res)
  frameUrls: string[];
}

export interface SavedTheme {
  id: string;
  name: string;
  ts: number;
  theme: PaperTheme;
}

export interface AppSettings {
  keyword: string;
  breadcrumb: string;
  ratio: string;
  texture: string;
  blurBody: boolean;
  matchCut: boolean;
  slideCount: number;
  topic: string;
}

export const DEFAULT_SETTINGS: AppSettings = {
  keyword: 'World',
  breadcrumb: 'News / Global / Home',
  ratio: '9:16',
  texture: 'aged',
  blurBody: true,
  matchCut: true,
  slideCount: 4,
  topic: '',
};

function safeParse<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch { return fallback; }
}

function safeSet(key: string, val: unknown) {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch { /* quota */ }
}

// Settings
export const loadSettings = (): AppSettings => safeParse(LS_SETTINGS, DEFAULT_SETTINGS);
export const saveSettings = (s: AppSettings) => safeSet(LS_SETTINGS, s);

// Active theme
export const loadTheme = (): PaperTheme => safeParse(LS_THEME, DEFAULT_THEME);
export const saveTheme = (t: PaperTheme) => safeSet(LS_THEME, t);

// Frames
export const loadFrames = (): { headline: string; body: string }[] =>
  safeParse(LS_FRAMES, []);
export const saveFrames = (f: { headline: string; body: string }[]) => safeSet(LS_FRAMES, f);

// History
export const loadHistory = (): HistoryEntry[] => safeParse(LS_HISTORY, []);
export function saveToHistory(entry: Omit<HistoryEntry, 'id' | 'ts'>) {
  const list = loadHistory();
  const newEntry: HistoryEntry = { ...entry, id: Date.now().toString(), ts: Date.now() };
  // Limit total size: keep only first 2 frame URLs per entry + thumb to manage quota
  const trimmed = { ...newEntry, frameUrls: newEntry.frameUrls.slice(0, 3) };
  const updated = [trimmed, ...list].slice(0, MAX_HISTORY);
  safeSet(LS_HISTORY, updated);
  return updated;
}
export function deleteHistory(id: string) {
  const updated = loadHistory().filter(e => e.id !== id);
  safeSet(LS_HISTORY, updated);
  return updated;
}
export const clearHistory = () => safeSet(LS_HISTORY, []);

// Saved Themes
export const loadSavedThemes = (): SavedTheme[] => safeParse(LS_THEMES, []);
export function saveNamedTheme(name: string, theme: PaperTheme) {
  const list = loadSavedThemes();
  const entry: SavedTheme = { id: Date.now().toString(), name, ts: Date.now(), theme };
  const updated = [entry, ...list].slice(0, MAX_SAVED_THEMES);
  safeSet(LS_THEMES, updated);
  return updated;
}
export function deleteSavedTheme(id: string) {
  const updated = loadSavedThemes().filter(e => e.id !== id);
  safeSet(LS_THEMES, updated);
  return updated;
}
