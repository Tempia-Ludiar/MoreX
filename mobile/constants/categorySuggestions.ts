import { LinkPreviewType } from '@/lib/linkPreview';

export const CATEGORY_SUGGESTIONS_BY_SOURCE: Record<LinkPreviewType | 'ChatGPT' | 'Claude' | 'Codex', string[]> = {
  X: ['SNS運用', '投稿ネタ', 'マーケティング', '文章作成', '発信アイデア', 'トレンド', '営業', 'リサーチ'],
  YouTube: ['学習メモ', '動画生成', 'マーケティング', '開発', 'UI改善', '事例研究', 'アイデア', 'リサーチ'],
  note: ['文章作成', '学習メモ', '投稿ネタ', 'SNS運用', 'リサーチ', '事例研究', 'マーケティング', '思考整理'],
  Web記事: ['リサーチ', '学習メモ', 'マーケティング', '開発', 'UI改善', '事例研究', '文章作成', '業務改善'],
  AI回答: ['プロンプト', '自動化', '開発', '文章作成', '業務改善', 'UI改善', 'アイデア', '学習メモ'],
  ChatGPT: ['プロンプト', '文章作成', '業務改善', 'アイデア', '自動化', '学習メモ', 'マーケティング', '開発'],
  Claude: ['プロンプト', '文章作成', '開発', '仕様整理', '思考整理', 'UI改善', 'マーケティング', '学習メモ'],
  Codex: ['開発', '実装メモ', '仕様整理', '自動化', 'バグ修正', 'コードレビュー', 'UI改善', '学習メモ'],
};

export function getCategorySuggestions(source: LinkPreviewType) {
  return CATEGORY_SUGGESTIONS_BY_SOURCE[source] ?? CATEGORY_SUGGESTIONS_BY_SOURCE['Web記事'];
}
