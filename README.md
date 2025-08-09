# Moco — お母さん大学 AIコンパニオン（Vercel Ready）

Next.js（React） + API Routes のワンクリックデプロイ構成。

## 使い方
1) `OPENAI_API_KEY` を Vercel の Project Settings > Environment Variables に追加。
2) Import Project → Deploy で公開。
3) 公開URLにアクセスしてチャット開始。

## ローカル開発
```bash
npm install
npm run dev
```
http://localhost:3000

## モデル切替
`/pages/api/chat.js` の fetch を他APIに差し替えればOK。
