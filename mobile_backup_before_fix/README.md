# MoreX Mobile MVP v0

MoreXは、Xなどで見つけたAI活用Tipsを、スクリーンショット・本文・URL・自分用メモで保存し、カレンダーで実行日を決め、メモを中心に保存して実行に移すためのiOSアプリMVPです。

## 起動方法

```bash
cd mobile
npm install
npm run start
```

Expo GoまたはiOSシミュレーターで起動してください。Webで確認する場合は 
pm run web を使います。\n\nQRコードはiPhone標準カメラではなく、Expo Goアプリ内のスキャナーで読み込むのが確実です。スマホで確認する場合はPCとスマホを同じWi-Fiに接続し、
pm run start で表示されるLAN用QRを使ってください。

## 実装済み機能

- Expo / React Native / TypeScript / Expo Router構成
- Bottom Tab: Add / Library / Playbook / Settings
- AsyncStorageによるTips永続化
- 初回起動時のサンプルTips 3件投入
- スクリーンショット画像選択
- Add画面でのTips作成専用フォーム
- priority 1〜100のスライダー入力
- 詳細画面で編集、カテゴリ自由入力、カレンダー日付変更、実行済み化、削除
- Library画面で優先度順ソート、カテゴリ/ステータス絞り込み、検索
- Playbook画面で実行済みTipsを無料3件まで表示
- データ全削除
- Plus機能 Coming Soon 表示

## 未実装機能

- X API連携
- AI要約 / AI自動分類
- ログイン / クラウド同期
- OCR検索
- 通知 / リマインダー本実装
- 課金処理
- ドラッグ&ドロップ

## 今後の予定

- Claude DesignでUI方向性を磨く
- ステータス変更の操作をより片手向けにする
- 画像保存をFileSystem管理へ拡張する
- iCloud同期やエクスポートの設計を追加する

## デザイン改善の流れ

`docs/design.md` と `docs/claude_design_brief.md` を正本にし、採用したUI案を `docs/design_tokens.md` に反映してからコンポーネントへ落とし込みます。

## App Store公開に向けたTODO

- アイコン作成
- App Storeスクリーンショット作成
- プライバシーポリシー作成
- TestFlight実機確認
- EAS Build / Submit設定





