export type BillingPlan = 'free' | 'plus';

export const PLUS_PRICE_JPY = 680;

export const FREE_LIMITS = {
  savedTips: 50,
  myTips: 10,
  customCategories: 5,
} as const;

export const BILLING_PLANS: Record<BillingPlan, {
  label: string;
  priceLabel: string;
  description: string;
}> = {
  free: {
    label: 'Free',
    priceLabel: '¥0',
    description: 'MoreXの基本機能を試せるプラン',
  },
  plus: {
    label: 'Plus',
    priceLabel: `¥${PLUS_PRICE_JPY}/月`,
    description: '保存・MyTips・カテゴリを無制限に使えるプラン',
  },
};
