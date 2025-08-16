// components/Toolbar.jsx
export default function Toolbar({
  onMicToggle, listening,
  ttsMode, setTtsMode, ttsRate, setTtsRate,
  autoSendDelay, setAutoSendDelay,
  onBargeInToggle, bargeInEnabled,
  ttsProvider, setTtsProvider
}){
  return (
    <div style={styles.wrap}>
      <button onClick={onMicToggle} style={styles.btn}>
        {listening ? "🎙 停止" : "🎙 音声入力"}
      </button>

      <div style={styles.group}>
        <div style={styles.label}>読み上げ</div>
        <div style={styles.row}>
          <label style={styles.badge}>
            <input type="radio" name="tts" value="off"
              checked={ttsMode==="off"} onChange={()=>setTtsMode("off")} />
            なし
          </label>
        </div>
        <div style={styles.row}>
          <label style={styles.badge}>
            <input type="radio" name="tts" value="browser"
              checked={ttsMode==="browser"} onChange={()=>setTtsMode("browser")} />
            ブラウザ
          </label>
          <label style={styles.badge}>
            <input type="radio" name="tts" value="cloud"
              checked={ttsMode==="cloud"} onChange={()=>setTtsMode("cloud")} />
            クラウド
          </label>
          {ttsMode==="cloud" && (
            <select value={ttsProvider} onChange={e=>setTtsProvider(e.target.value)} style={styles.select}>
              <option value="auto">Auto (Eleven → OpenAI)</option>
              <option value="elevenlabs">ElevenLabs</option>
              <option value="openai">OpenAI</option>
            </select>
          )}
        </div>
        <div style={styles.row}>
          <span style={styles.small}>速度</span>
          <input type="range" min="1.0" max="3.0" step="0.1"
            value={ttsRate} onChange={e=>setTtsRate(parseFloat(e.target.value))}
            style={{ width: 140 }} />
          <span style={styles.small}>{ttsRate.toFixed(1)}×</span>
        </div>
      </div>

      <div style={styles.group}>
        <div style={styles.row}>
          <span style={styles.small}>自動送信（無音秒）</span>
          <input type="range" min="1" max="8" step="1"
            value={autoSendDelay} onChange={e=>setAutoSendDelay(parseInt(e.target.value))}
            style={{ width: 160 }} />
          <span style={styles.small}>{autoSendDelay}s</span>
        </div>
      </div>

      <label style={styles.label}>
        <input type="checkbox" checked={bargeInEnabled}
          onChange={e=>onBargeInToggle(e.target.checked)} />
        かぶせ発話（話し始めたら読み上げ停止）
      </label>

      <a href="/diary" target="_blank" rel="noreferrer" style={styles.diaryLink}>📓 日記を開く</a>
    </div>
  );
}

const styles = {
  wrap: { display:"flex", gap:12, alignItems:"center", flexWrap:"wrap", marginBottom:10 },
  btn: { padding:"6px 12px", borderRadius:10, border:"1px solid #ddd", background:"#fff" },
  group: { border:"1px solid #eee", padding:"6px 10px", borderRadius:10, background:"#faf7f2" },
  label: { display:"flex", alignItems:"center", gap:6 },
  row: { display:"flex", alignItems:"center", gap:8, marginTop:4 },
  small: { fontSize:12, color:"#555" },
  badge: { display:"flex", alignItems:"center", gap:6, padding:"2px 8px", border:"1px solid #e0d8cd", borderRadius:8, background:"#fff" },
  select: { padding:"4px 6px", borderRadius:8, border:"1px solid #ddd" },
  diaryLink: { marginLeft:"auto", textDecoration:"none", background:"#f4b86a", color:"#2b1900", padding:"6px 10px", borderRadius:10, border:"1px solid #e0a85a", fontWeight:600 }
};
