# Voice & Diary Calendar Fix Pack

- 既定で **音声認識ON**、**クラウドTTS（OpenAI）ON**
- 既定の TTS: `provider=openai`、速度スライダー 1.0〜3.0x
- **Enter 送信**（Shift+Enterで改行）
- **無音自動送信**：動作安定化（入力更新/録音開始でタイマー再セット）
- **絵文字/Markdown禁止**、会話調の短い文に最適化
- **同一ページに日記ペイン**（カレンダー＋エディタ）

## 必要な環境変数
- OPENAI_API_KEY（必須）
- OPENAI_TTS_MODEL（任意、既定 gpt-4o-mini-tts）
- ELEVENLABS_API_KEY（任意：Auto選択時の優先先）
