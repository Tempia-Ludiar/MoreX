import { TipStatus } from '@/types/tip';

export const categories = [
  'ChatGPT',
  'Claude',
  'Codex',
  'Gemini',
  'Cursor',
  'Notion',
  'プロンプト',
  '自動化',
  '文章作成',
  '画像生成',
  '動画生成',
  'SNS運用',
  'マーケティング',
  '開発',
  'その他',
] as const;

export const statuses: { value: TipStatus; label: string; tone: string; background: string }[] = [
  { value: 'todo', label: '未実行', tone: '#1D4ED8', background: '#DBEAFE' },
  { value: 'doing', label: '実行中', tone: '#7C3AED', background: '#EDE9FE' },
  { value: 'done', label: '実行済み', tone: '#047857', background: '#D1FAE5' },
  { value: 'trash', label: '不要', tone: '#B91C1C', background: '#FEE2E2' },
];

export const getStatusMeta = (status: TipStatus) => statuses.find((item) => item.value === status) ?? statuses[0];
