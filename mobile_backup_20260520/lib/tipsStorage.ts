import AsyncStorage from '@react-native-async-storage/async-storage';
import { addDaysKey, todayKey } from '@/lib/date';
import { Tip, TipDraft } from '@/types/tip';

const STORAGE_KEY = 'morex.tips.v0';
const SEEDED_KEY = 'morex.seeded.v0';

const nowIso = () => new Date().toISOString();
const makeId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

const normalizeTip = (tip: Tip): Tip => {
  const legacyTiming = (tip as Tip & { timing?: string }).timing;
  const legacyStatus = tip.status as string;
  const status = legacyStatus === 'done' ? 'done' : legacyStatus === 'doing' ? 'doing' : legacyStatus === 'trash' ? 'trash' : 'todo';
  const priority = typeof tip.priority === 'number' ? Math.min(100, Math.max(1, Math.round(tip.priority))) : 50;
  if (tip.scheduledDate) return { ...tip, status, priority };
  if (legacyTiming === 'today') return { ...tip, status, priority, scheduledDate: todayKey() };
  if (legacyTiming === 'this_week') return { ...tip, status, priority, scheduledDate: addDaysKey(3) };
  return { ...tip, status, priority };
};

const sampleTips: Tip[] = [
  {
    id: 'sample-claude-lp',
    title: 'ClaudeでLP構成を作るTips',
    content: 'Claudeにターゲット、課題、オファー、CTAを渡してLP構成を3案出してもらう。最後に一番強い構成を選び、見出しだけ人間が磨く。',
    memo: '新サービスの仮LPを作る時に使えそう。まずは構成比較に使う。',
    category: 'Claude',
    status: 'todo',
    scheduledDate: todayKey(),
    priority: 78,
    afterMemo: '',
    createdAt: nowIso(),
    updatedAt: nowIso(),
  },
  {
    id: 'sample-codex-spec',
    title: 'Codexに仕様書を渡して実装させるTips',
    content: '設計書、禁止事項、画面一覧、データ型、完了条件をまとめてからCodexに渡すと、実装のブレが減る。',
    memo: 'MoreX自身の開発フローに近い。仕様書の粒度チェックに使う。',
    category: 'Codex',
    status: 'doing',
    scheduledDate: addDaysKey(3),
    priority: 86,
    createdAt: nowIso(),
    updatedAt: nowIso(),
  },
  {
    id: 'sample-chatgpt-kindle',
    title: 'ChatGPTでKindle章構成を整理するTips',
    content: '読者の悩み、到達点、章ごとの役割を先に決めてから、章タイトルと見出しを生成する。',
    memo: '文章作成カテゴリ。保存だけで終わらせず、週末に試す。',
    category: 'ChatGPT',
    status: 'todo',
    scheduledDate: addDaysKey(8),
    priority: 58,
    createdAt: nowIso(),
    updatedAt: nowIso(),
  },
];

async function persistTips(tips: Tip[]) {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(tips));
}

export async function ensureSampleTips() {
  const seeded = await AsyncStorage.getItem(SEEDED_KEY);
  if (seeded) return;
  const existing = await AsyncStorage.getItem(STORAGE_KEY);
  if (!existing) {
    await persistTips(sampleTips);
  }
  await AsyncStorage.setItem(SEEDED_KEY, 'true');
}

export async function getTips(): Promise<Tip[]> {
  await ensureSampleTips();
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    const tips = (JSON.parse(raw) as Tip[]).map(normalizeTip);
    return tips.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  } catch {
    return [];
  }
}

export async function getTipById(id: string): Promise<Tip | null> {
  const tips = await getTips();
  return tips.find((tip) => tip.id === id) ?? null;
}

export async function createTip(draft: TipDraft): Promise<Tip> {
  const tips = await getTips();
  const timestamp = nowIso();
  const tip: Tip = {
    ...draft,
    id: makeId(),
    createdAt: timestamp,
    updatedAt: timestamp,
    status: draft.status ?? 'todo',
    scheduledDate: draft.scheduledDate,
    priority: draft.priority ?? 50,
  };
  await persistTips([tip, ...tips]);
  return tip;
}

export async function updateTip(id: string, patch: Partial<TipDraft>): Promise<Tip | null> {
  const tips = await getTips();
  let updated: Tip | null = null;
  const nextTips = tips.map((tip) => {
    if (tip.id !== id) return tip;
    updated = { ...tip, ...patch, updatedAt: nowIso() };
    return updated;
  });
  await persistTips(nextTips);
  return updated;
}

export async function deleteTip(id: string): Promise<void> {
  const tips = await getTips();
  await persistTips(tips.filter((tip) => tip.id !== id));
}

export async function clearTips(): Promise<void> {
  await persistTips([]);
  await AsyncStorage.setItem(SEEDED_KEY, 'true');
}
