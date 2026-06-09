# MoreX Mobile MVP v0

MoreXは、X・YouTube・note・Web記事・AI回答などで見つけたTipsを、URL・メモ・画像・カテゴリで保存し、Todoとして実行に移し、役立ったものをMyTipsに残すためのWeb/PWAアプリMVPです。

## 起動方法

```bash
cd mobile
npm install
npm run start
```

Expo GoまたはiOSシミュレーターで起動してください。Webで確認する場合は次を使います。

```bash
npm run web
```

QRコードはiPhone標準カメラではなく、Expo Goアプリ内のスキャナーで読み込むのが確実です。スマホで確認する場合はPCとスマホを同じWi-Fiに接続し、`npm run start` で表示されるLAN用QRを使ってください。

## Supabase設定

`.env.example` をコピーして `.env` を作り、Supabaseの公開用キーを設定します。

```bash
cp .env.example .env
```

```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-or-publishable-key
```

`service_role` key はアプリに入れないでください。

### Tipsクラウド保存の初期設定

Supabase DashboardのSQL Editorを開き、`supabase/migrations/20260601_cloud_tips.sql`
の内容を貼り付けて一度だけ実行してください。Tips用テーブル、ユーザーごとの
アクセス制限（RLS）、画像保存用の非公開Storage bucketが作成されます。
詳しい手順は `docs/supabase_setup_ja.md` を参照してください。

## Web公開

このアプリはGitHubに載せて、VercelなどでWeb公開できます。Vercelでは次の設定にします。

- Root Directory: `mobile`
- Build Command: `npm run vercel-build`
- Output Directory: `dist`
- Environment Variables:
  - `EXPO_PUBLIC_SUPABASE_URL`
  - `EXPO_PUBLIC_SUPABASE_ANON_KEY`

ローカルでWeb公開用ビルドを確認する場合:

```bash
npm run export:web
```

## 実装済み機能

- Expo / React Native / TypeScript / Expo Router構成
- Bottom Tab: Add / Todo / MyTips / Settings
- Supabaseによるユーザー別Tips永続化
- 初回起動時のサンプルTips 3件投入
- スクリーンショット画像選択
- Add画面でのTips作成専用フォーム、URLプレビュー、カテゴリ候補
- priority 1〜100のスライダー入力
- 詳細画面で編集、カテゴリ自由入力、実行済み化、MyTips保存、削除
- Todo画面で進捗表示、カテゴリ/ステータス絞り込み、検索
- MyTips画面で残しておきたいTipsをカテゴリ別に整理
- データ全削除
- Plus機能 Coming Soon表示とFree上限表示
- Supabase Authの新規登録 / ログイン / ログアウト
- Supabase Authセッション保持

## 未実装機能

- X API連携
- AI要約 / AI自動分類
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

- プライバシーポリシー作成
- App Storeスクリーンショット作成
- TestFlight実機確認
- EAS Build / Submit設定
- Web公開前のリンクプレビューAPI安全性確認





