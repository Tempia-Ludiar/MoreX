import AsyncStorage from '@react-native-async-storage/async-storage';
import { TipDraft } from '@/types/tip';

const PENDING_TIP_DRAFT_KEY = 'morex.pending-tip-draft.v1';

export async function savePendingTipDraft(draft: TipDraft) {
  await AsyncStorage.setItem(PENDING_TIP_DRAFT_KEY, JSON.stringify(draft));
}

export async function getPendingTipDraft(): Promise<TipDraft | null> {
  const raw = await AsyncStorage.getItem(PENDING_TIP_DRAFT_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as TipDraft;
  } catch {
    return null;
  }
}

export async function clearPendingTipDraft() {
  await AsyncStorage.removeItem(PENDING_TIP_DRAFT_KEY);
}
