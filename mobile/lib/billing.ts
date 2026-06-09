import { BILLING_PLANS, BillingPlan, FREE_LIMITS } from '@/constants/billing';
import { DEFAULT_USER_CATEGORIES } from '@/lib/userCategories';
import { Tip } from '@/types/tip';

export type BillingUsage = {
  plan: BillingPlan;
  savedTips: number;
  myTips: number;
  customCategories: number;
};

export type LimitKind = keyof typeof FREE_LIMITS;

export async function getCurrentBillingPlan(): Promise<BillingPlan> {
  // Payment is not connected yet. Keep this helper as the single replacement point.
  return 'free';
}

export function isPlusPlan(plan: BillingPlan) {
  return plan === 'plus';
}

export function getPlanLabel(plan: BillingPlan) {
  return BILLING_PLANS[plan].label;
}

export function getLimit(plan: BillingPlan, kind: LimitKind) {
  return isPlusPlan(plan) ? null : FREE_LIMITS[kind];
}

export function countMyTips(tips: Tip[]) {
  return tips.filter((tip) => tip.isInMyTips === true).length;
}

export function countCustomCategories(categories: string[]) {
  const defaults = new Set(DEFAULT_USER_CATEGORIES.map((category) => category.trim().toLowerCase()));
  return categories.filter((category) => !defaults.has(category.trim().toLowerCase())).length;
}

export function isDefaultCategory(category: string) {
  const defaults = new Set(DEFAULT_USER_CATEGORIES.map((item) => item.trim().toLowerCase()));
  return defaults.has(category.trim().toLowerCase());
}

export function isAtLimit(plan: BillingPlan, kind: LimitKind, count: number) {
  const limit = getLimit(plan, kind);
  return limit !== null && count >= limit;
}

export function formatUsage(plan: BillingPlan, kind: LimitKind, count: number) {
  const limit = getLimit(plan, kind);
  return limit === null ? `${count} / 無制限` : `${count} / ${limit}`;
}

export function getUpgradeMessage(kind: LimitKind) {
  if (kind === 'savedTips') {
    return {
      title: '保存TipsのFree上限に達しました',
      body: 'Plus公開後は無制限にできます。現在は準備中のため、不要なTipsを削除して空きを作ってください。',
    };
  }
  if (kind === 'myTips') {
    return {
      title: 'MyTipsのFree上限に達しました',
      body: 'Plus公開後は無制限に残せます。現在は準備中のため、残したいTipsを入れ替えて使ってください。',
    };
  }
  return {
    title: 'カスタムカテゴリのFree上限に達しました',
    body: 'Plus公開後は無制限に作れます。現在は準備中のため、既存カテゴリを編集・削除して調整してください。',
  };
}
