# Diary + Cloud TTS Update Pack

## これで入る機能
- 📓 **日記作成API**（/api/diary）復活：会話ログから日記案を生成
- 🗂 **日記ページ**（/diary）：別タブで開き、日付・タイトル付きで蓄積、編集/削除、検索、JSONエクスポート
- 🔊 **クラウドTTS**：OpenAI（既定）/ ElevenLabs（任意）に対応。速度はクライアントで1.0〜3.0x調整
- 🗣 **かぶせ発話**・ライブ字幕・無音で自動送信（既存の音声機能と共存）

## 追加/変更ファイル
- app/lib/prompt.js
- app/api/chat/route.js
- app/api/diary/route.js
- app/api/tts/openai/route.js
- app/api/tts/elevenlabs/route.js （任意：APIキーが無いと400）
- components/Toolbar.jsx （TTSモード/プロバイダ/速度/自動送信）
- pages/index.js （クラウドTTS呼び出し＆「日記を作る」→ /diary オープン）
- pages/diary.js （編集可能な日記ページ）
- public/moco.svg

## 必要な環境変数（Vercel > Settings > Environment Variables）
- `OPENAI_API_KEY`（必須：チャット＆OpenAI TTS）
- `OPENAI_MODEL`（任意：未指定は gpt-4o-mini）
- `OPENAI_TTS_MODEL`（任意：未指定は gpt-4o-mini-tts）
- `ELEVENLABS_API_KEY`（任意：ElevenLabs を使う場合）

## 使い方
1) このフォルダ内容を既存プロジェクト直下に**上書き**→コミット&デプロイ
2) チャット画面のヘッダ「📓 日記を作る」で日記を生成→自動で **/diary** が別タブで開く
3) ツールバーで「読み上げ：クラウド」「プロバイダ：OpenAI/ElevenLabs」を選択、速度スライダーで調整
4) /diary ではタイトル・本文を編集可。右上の「エクスポート」で JSON 保存

※ サーバー永続化は含まれていません。将来クラウド保存するなら Vercel KV / Supabase を併用してください。
