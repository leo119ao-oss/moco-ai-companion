# MOCO AI Companion Plus（音声・記録・アナリティクス・日記）

この一式を既存プロジェクト直下に**上書き**してコミットするだけで、以下が有効になります。

- 🎙 **音声入力**（Web Speech API：Chrome推奨）
- 🔊 **音声読み上げ**（SpeechSynthesis）
- 🧾 **記録機能**（ブラウザの localStorage / JSONダウンロード）
- 📈 **簡易アナリティクス**（localStorage集計 + /api/track にイベント送信）
- 📓 **日記代理作成**（/api/diary：OpenAI あり/なし両対応）

## 追加/変更される主なファイル
- app/lib/prompt.js
- app/api/chat/route.js
- app/api/diary/route.js
- app/api/track/route.js
- components/Toolbar.jsx
- pages/index.js

## 環境変数（Vercel）
- OPENAI_API_KEY（任意：設定でAI応答/日記が高品質に）
- OPENAI_MODEL（任意：未指定は gpt-4o-mini）

## 注意
- サーバー永続保存は含めていません（Vercelの無償枠でも動作）。
  永続化が必要なら Vercel KV / Supabase を追加してください。
- 音声入力はブラウザ依存（Chrome推奨）。iOS Safari は制限があります。

## 使い方
1) このフォルダの内容をプロジェクトに上書き → コミット  
2) デプロイ後、画面上部のツールバーで「🎙音声入力」「音声読み上げ」「記録ON」を切り替え  
3) 📓「日記を作る」を押すと、そのセッションから日記を生成します（localStorageにも保存）  
4) 「📥 記録をダウンロード」でJSONを取得できます。
