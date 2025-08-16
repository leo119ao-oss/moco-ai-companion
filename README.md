# MOCO AI Companion (完動版テンプレ)

このテンプレは **そのまま Vercel に上げても動く** ように作ってあります。  
`OPENAI_API_KEY` が未設定の場合は **エコー応答**、設定すると **OpenAI応答** に自動切替します。

## 使い方
1. リポジトリ直下にこのファイル群を置く（`package.json` と `pages/`, `app/` がトップにある）
2. GitHub に push → Vercel が自動デプロイ
3. そのままでも `/api/chat` は `{ ok: true }`、チャット画面は「エコー: 入力文」を返します

## OpenAI を有効化する
Vercel ダッシュボード → Project → Settings → **Environment Variables** に以下を追加：

- `OPENAI_API_KEY`: あなたのOpenAIのAPIキー
- （任意）`OPENAI_MODEL`: 例 `gpt-4o-mini`

保存後、**Redeploy** してください。キーが有効ならAIの返答に切り替わります。

## ローカル開発
```bash
npm install
npm run dev
# http://localhost:3000
```
