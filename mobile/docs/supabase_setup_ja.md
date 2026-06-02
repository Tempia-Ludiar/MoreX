# Supabaseクラウド保存 初期設定

この作業は、MoreXを公開する前に1回だけ行います。

## 1. SQLを実行する

1. [Supabase Dashboard](https://supabase.com/dashboard) を開きます。
2. MoreXで使っているプロジェクトを選びます。
3. 左側の `SQL Editor` を押します。
4. `New query` を押します。
5. このリポジトリの `supabase/migrations/20260601_cloud_tips.sql` を開きます。
6. ファイルの中身をすべてSQL Editorへ貼り付けます。
7. `Run` を押します。
8. `Success. No rows returned` と表示されたら完了です。

このSQLは、次の3つをまとめて作ります。

- Tipsを保存する `tips` テーブル
- ログイン中の本人だけが自分のTipsを操作できるアクセス制限（RLS）
- スクリーンショットを非公開で保存する `tip-images` bucket

## 2. 作成結果を確認する

1. 左側の `Table Editor` を押します。
2. `tips` が表示されることを確認します。
3. 左側の `Storage` を押します。
4. `tip-images` が表示されることを確認します。
5. `tip-images` に `Public` と表示されていないことを確認します。

### すでに初期設定済みの場合

以前に `20260601_cloud_tips.sql` を実行済みの場合は、追加で
`supabase/migrations/20260602_sample_tips_flag.sql` の内容をSQL Editorへ貼り付け、
一度だけ実行してください。LibraryからサンプルTipsだけを削除できるようになります。

続けて `supabase/migrations/20260603_remove_doing_status.sql` も実行してください。
以前の「保留」Tipsが「未実行」へ戻り、今後は未実行・実行済み・不要の
3ステータスだけになります。

## 3. アプリで確認する

1. MoreXへログインします。
2. Tipsを1件保存します。
3. ログアウトし、別のメールアドレスで新規登録します。
4. 最初のアカウントで追加したTipsが表示されないことを確認します。
5. 最初のアカウントへ戻り、保存したTipsが再表示されることを確認します。

## 4. 一般公開前に確認する

### メール確認を使うか決める

1. Supabase Dashboardで `Authentication` を開きます。
2. `Providers` または `Sign In / Providers` を開きます。
3. Email設定にある `Confirm email` を確認します。

`Confirm email` を有効にすると、登録した人は受信メールのリンクを押してから
ログインします。メールアドレスの入力ミスやなりすましを減らせるため、
一般公開時は有効にすることを推奨します。

### 独自SMTPを設定する

Supabase標準のメール送信は試験向けです。一般公開前に `Authentication` の
SMTP設定から、Resendなどのメール配信サービスを設定してください。
これにより、確認メールやパスワード再設定メールを安定して送信できます。

### 利用量を確認する

Supabase Dashboardの組織設定にある `Usage` を定期的に確認します。
画像を多く保存すると、Tips本文より先にStorage容量が増えます。

### バックアップ方針を決める

Free Planで運用する間も、定期的にDBを書き出して別の場所へ保管してください。
Pro Plan以上ではDashboardから日次バックアップを利用できます。
画像ファイルはDBバックアップに含まれないため、画像のバックアップは別途必要です。

## 注意

- `.env` には公開用の `anon` または `publishable` keyだけを設定します。
- `service_role` keyは絶対にアプリへ設定しないでください。
- SQL実行前に端末へ保存したTipsは、自動移行されません。複数アカウントの
  データが混ざる事故を防ぐためです。
