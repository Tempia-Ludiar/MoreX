import AsyncStorage from '@react-native-async-storage/async-storage';
import { addDaysKey, todayKey } from '@/lib/date';
import { supabase } from '@/lib/supabaseClient';
import { Tip, TipDraft } from '@/types/tip';

const SEEDED_KEY_PREFIX = 'morex.cloud-seeded.v1';
const IMAGES_BUCKET = 'tip-images';
const SIGNED_IMAGE_URL_TTL_SECONDS = 60 * 60;

type TipRow = {
  id: string;
  user_id: string;
  title: string | null;
  content: string | null;
  image_path: string | null;
  source_url: string | null;
  memo: string | null;
  category: string | null;
  status: Tip['status'];
  scheduled_date: string | null;
  priority: number;
  after_memo: string | null;
  is_in_my_tips: boolean;
  is_sample: boolean;
  created_at: string;
  updated_at: string;
};

const nowIso = () => new Date().toISOString();

const sampleDrafts: TipDraft[] = [
  {
    title: 'ClaudeでLP構成を作るTips',
    content: 'Claudeにターゲット、課題、オファー、CTAを渡してLP構成を3案出してもらう。最後に一番強い構成を選び、見出しだけ人間が磨く。',
    memo: '新サービスの仮LPを作る時に使えそう。まずは構成比較に使う。',
    category: 'Claude',
    status: 'todo',
    scheduledDate: todayKey(),
    priority: 78,
    afterMemo: '',
    isSample: true,
  },
  {
    title: 'Codexに仕様書を渡して実装させるTips',
    content: '設計書、禁止事項、画面一覧、データ型、完了条件をまとめてからCodexに渡すと、実装のブレが減る。',
    memo: 'MoreX自身の開発フローに近い。仕様書の粒度チェックに使う。',
    category: 'Codex',
    status: 'doing',
    scheduledDate: addDaysKey(3),
    priority: 86,
    isSample: true,
  },
  {
    title: 'ChatGPTでKindle章構成を整理するTips',
    content: '読者の悩み、到達点、章ごとの役割を先に決めてから、章タイトルと見出しを生成する。',
    memo: '文章作成カテゴリ。保存だけで終わらせず、週末に試す。',
    category: 'ChatGPT',
    status: 'todo',
    scheduledDate: addDaysKey(8),
    priority: 58,
    isSample: true,
  },
];

function optionalValue(value: string | undefined) {
  return value ?? null;
}

function explainError(error: { message: string; code?: string | null }) {
  if (error.code === '42P01' || error.message.includes("Could not find the table 'public.tips'")) {
    return new Error('Tips用のクラウド保存先が未設定です。Supabase SQL Editorで supabase/migrations/20260601_cloud_tips.sql を実行してください。');
  }
  if (error.message.includes('is_sample')) {
    return new Error('サンプルTips削除機能の初期設定が必要です。Supabase SQL Editorで supabase/migrations/20260602_sample_tips_flag.sql を実行してください。');
  }
  return new Error(`クラウド保存でエラーが発生しました: ${error.message}`);
}

async function getUserId() {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw explainError(error);
  if (!data.user) throw new Error('ログイン情報を確認できませんでした。もう一度ログインしてください。');
  return data.user.id;
}

async function getSignedImageUrl(imagePath: string | null) {
  if (!imagePath) return undefined;
  const { data, error } = await supabase.storage
    .from(IMAGES_BUCKET)
    .createSignedUrl(imagePath, SIGNED_IMAGE_URL_TTL_SECONDS);
  if (error) return undefined;
  return data.signedUrl;
}

async function rowToTip(row: TipRow): Promise<Tip> {
  return {
    id: row.id,
    title: row.title ?? undefined,
    content: row.content ?? undefined,
    imageUri: await getSignedImageUrl(row.image_path),
    imagePath: row.image_path ?? undefined,
    sourceUrl: row.source_url ?? undefined,
    memo: row.memo ?? undefined,
    category: row.category ?? undefined,
    status: row.status,
    scheduledDate: row.scheduled_date ?? undefined,
    priority: row.priority,
    afterMemo: row.after_memo ?? undefined,
    isInMyTips: row.is_in_my_tips,
    isSample: row.is_sample,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function draftToRow(draft: TipDraft, userId: string, imagePath?: string) {
  return {
    user_id: userId,
    title: optionalValue(draft.title),
    content: optionalValue(draft.content),
    image_path: imagePath ?? null,
    source_url: optionalValue(draft.sourceUrl),
    memo: optionalValue(draft.memo),
    category: optionalValue(draft.category),
    status: draft.status ?? 'todo',
    scheduled_date: optionalValue(draft.scheduledDate),
    priority: draft.priority ?? 50,
    after_memo: optionalValue(draft.afterMemo),
    is_in_my_tips: draft.isInMyTips ?? false,
    is_sample: draft.isSample ?? false,
  };
}

function imageExtension(uri: string) {
  const match = uri.match(/\.([a-zA-Z0-9]+)(?:[?#].*)?$/);
  const extension = match?.[1]?.toLowerCase();
  if (extension && ['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(extension)) return extension;
  return 'jpg';
}

function imageContentType(extension: string) {
  if (extension === 'jpg') return 'image/jpeg';
  if (extension === 'jpeg') return 'image/jpeg';
  return `image/${extension}`;
}

function isRemoteImage(uri: string) {
  return uri.startsWith('http://') || uri.startsWith('https://');
}

async function uploadImage(userId: string, uri: string) {
  const extension = imageExtension(uri);
  const imagePath = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2, 10)}.${extension}`;
  const response = await fetch(uri);
  if (!response.ok) throw new Error('選択した画像を読み込めませんでした。別の画像を選んでください。');
  const file = await response.arrayBuffer();
  const { error } = await supabase.storage
    .from(IMAGES_BUCKET)
    .upload(imagePath, file, { contentType: imageContentType(extension), upsert: false });
  if (error) throw explainError(error);
  return imagePath;
}

async function removeImage(imagePath?: string) {
  if (!imagePath) return;
  const { error } = await supabase.storage.from(IMAGES_BUCKET).remove([imagePath]);
  if (error) throw explainError(error);
}

async function ensureSampleTips(userId: string) {
  const seededKey = `${SEEDED_KEY_PREFIX}.${userId}`;
  if (await AsyncStorage.getItem(seededKey)) return;

  const { count, error: countError } = await supabase
    .from('tips')
    .select('id', { count: 'exact', head: true });
  if (countError) throw explainError(countError);

  if (count === 0) {
    const { error } = await supabase.from('tips').insert(
      sampleDrafts.map((draft) => draftToRow(draft, userId)),
    );
    if (error) throw explainError(error);
  }
  await AsyncStorage.setItem(seededKey, 'true');
}

export async function getTips(): Promise<Tip[]> {
  const userId = await getUserId();
  await ensureSampleTips(userId);
  const { data, error } = await supabase
    .from('tips')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw explainError(error);
  return Promise.all((data as TipRow[]).map(rowToTip));
}

export async function getTipById(id: string): Promise<Tip | null> {
  const { data, error } = await supabase.from('tips').select('*').eq('id', id).maybeSingle();
  if (error) throw explainError(error);
  return data ? rowToTip(data as TipRow) : null;
}

export async function createTip(draft: TipDraft): Promise<Tip> {
  const userId = await getUserId();
  const imagePath = draft.imageUri ? await uploadImage(userId, draft.imageUri) : undefined;
  const { data, error } = await supabase
    .from('tips')
    .insert(draftToRow(draft, userId, imagePath))
    .select('*')
    .single();
  if (error) {
    await removeImage(imagePath);
    throw explainError(error);
  }
  return rowToTip(data as TipRow);
}

export async function updateTip(id: string, patch: Partial<TipDraft>): Promise<Tip | null> {
  const existing = await getTipById(id);
  if (!existing) return null;

  const userId = await getUserId();
  let nextImagePath = existing.imagePath;
  if ('imageUri' in patch && patch.imageUri !== existing.imageUri) {
    nextImagePath = patch.imageUri && !isRemoteImage(patch.imageUri)
      ? await uploadImage(userId, patch.imageUri)
      : undefined;
  }

  const nextDraft: TipDraft = { ...existing, ...patch };
  const { data, error } = await supabase
    .from('tips')
    .update({ ...draftToRow(nextDraft, userId, nextImagePath), updated_at: nowIso() })
    .eq('id', id)
    .select('*')
    .maybeSingle();
  if (error) {
    if (nextImagePath !== existing.imagePath) await removeImage(nextImagePath);
    throw explainError(error);
  }
  if (nextImagePath !== existing.imagePath) await removeImage(existing.imagePath);
  return data ? rowToTip(data as TipRow) : null;
}

export async function deleteTip(id: string): Promise<void> {
  const existing = await getTipById(id);
  const { error } = await supabase.from('tips').delete().eq('id', id);
  if (error) throw explainError(error);
  await removeImage(existing?.imagePath);
}

export async function clearTips(): Promise<void> {
  const userId = await getUserId();
  const { data, error: selectError } = await supabase.from('tips').select('image_path');
  if (selectError) throw explainError(selectError);
  const { error } = await supabase.from('tips').delete().eq('user_id', userId);
  if (error) throw explainError(error);
  const imagePaths = (data as Array<{ image_path: string | null }>)
    .map((row) => row.image_path)
    .filter((path): path is string => Boolean(path));
  if (imagePaths.length > 0) {
    const { error: imageError } = await supabase.storage.from(IMAGES_BUCKET).remove(imagePaths);
    if (imageError) throw explainError(imageError);
  }
  await AsyncStorage.setItem(`${SEEDED_KEY_PREFIX}.${userId}`, 'true');
}

export async function deleteSampleTips(): Promise<void> {
  const { data, error: selectError } = await supabase
    .from('tips')
    .select('image_path')
    .eq('is_sample', true);
  if (selectError) throw explainError(selectError);

  const { error } = await supabase.from('tips').delete().eq('is_sample', true);
  if (error) throw explainError(error);

  const imagePaths = (data as Array<{ image_path: string | null }>)
    .map((row) => row.image_path)
    .filter((path): path is string => Boolean(path));
  if (imagePaths.length > 0) {
    const { error: imageError } = await supabase.storage.from(IMAGES_BUCKET).remove(imagePaths);
    if (imageError) throw explainError(imageError);
  }
}
