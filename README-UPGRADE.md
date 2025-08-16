# モデル組み込みアップグレード一式

このフォルダの中身を既存プロジェクト直下に**上書き**してコミットすれば、
- 会話履歴を使う
- モコの人格（SYSTEM_PROMPT）を適用
- OPENAI_API_KEY が無い時はエコーにフォールバック
が有効になります。

## 置き換える/追加されるファイル
- app/lib/prompt.js
- app/api/chat/route.js
- pages/index.js

## 環境変数
- Vercel の Environment Variables に `OPENAI_API_KEY` を設定
- （任意）`OPENAI_MODEL` を設定。未指定時は `gpt-4o-mini` で動作

コミット＆デプロイ後、 https://<your-domain>/api/chat が `{ "ok": true }` を返し、
チャット画面は人格付き応答になります。
