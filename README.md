# MoreX

MoreXは、Xなどで見つけたAI活用Tipsを保存し、整理し、実行に変えるためのExpo / React Native / Webアプリです。

アプリ本体は `mobile` ディレクトリにあります。

## ローカル起動

```bash
cd mobile
npm install
npm run web
```

スマホのExpo Goで確認する場合:

```bash
cd mobile
npm run start
```

## Supabase環境変数

`mobile/.env.example` をコピーして `mobile/.env` を作成してください。

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-or-publishable-key
```

`service_role` key はアプリに入れないでください。

## Vercel公開

GitHubにpushしたあと、VercelでこのリポジトリをImportします。

- Root Directory: `mobile`
- Build Command: `npm run vercel-build`
- Output Directory: `dist`
- Environment Variables:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

