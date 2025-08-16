# TTS Fallback Pack

- `/api/tts` … **ElevenLabs を優先** → 失敗/枯渇時は **OpenAI TTS** に自動フォールバック
- UI（ツールバー）で **Auto / ElevenLabs / OpenAI** の切替、再生速度（1.0〜3.0x）
- `/api/diary` + `/diary` で日記作成・蓄積・編集・エクスポート付き

## 必要な環境変数（Vercel）
- `OPENAI_API_KEY`（必須）
- `OPENAI_MODEL`（任意、既定 `gpt-4o-mini`）
- `OPENAI_TTS_MODEL`（任意、既定 `gpt-4o-mini-tts`）
- `ELEVENLABS_API_KEY`（任意：あると ElevenLabs が優先される）
