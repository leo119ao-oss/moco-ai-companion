// components/Toolbar.jsx
export default function Toolbar({
  onMicToggle, listening,
  ttsEnabled, setTtsEnabled,
  loggingEnabled, setLoggingEnabled,
  onMakeDiary
}) {
  return (
    <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8 }}>
      <button onClick={onMicToggle} style={{ padding: "6px 12px" }}>
        {listening ? "🎙 停止" : "🎙 音声入力"}
      </button>
      <label style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <input type="checkbox" checked={ttsEnabled} onChange={e => setTtsEnabled(e.target.checked)} />
        音声読み上げ
      </label>
      <label style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <input type="checkbox" checked={loggingEnabled} onChange={e => setLoggingEnabled(e.target.checked)} />
        記録ON（ローカル保存）
      </label>
      <button onClick={onMakeDiary} style={{ padding: "6px 12px" }}>📓 日記を作る</button>
    </div>
  );
}
