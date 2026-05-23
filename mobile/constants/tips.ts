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
  { value: 'todo', label: '未実行', tone: '#4f46e5', background: '#eef0ff' },
  { value: 'done', label: '実行済み', tone: '#10b981', background: '#e6f9f0' },
  { value: 'trash', label: '不要', tone: '#6b6b80', background: '#f5f5f7' },
];

export const getStatusMeta = (status: TipStatus) =>
  statuses.find((item) => item.value === status) ?? statuses[0];
