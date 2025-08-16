// components/Toolbar.jsx
export default function Toolbar({
  onMicToggle, listening,
  ttsEnabled, setTtsEnabled, ttsRate, setTtsRate,
  autoSendDelay, setAutoSendDelay,
  onBargeInToggle, bargeInEnabled,
}){
  return (
    <div style={styles.wrap}>
      <button onClick={onMicToggle} style={styles.btn}>
        {listening ? "🎙 停止" : "🎙 音声入力"}
      </button>

      <div style={styles.group}>
        <label style={styles.label}>
          <input type="checkbox" checked={ttsEnabled} onChange={e=>setTtsEnabled(e.target.checked)} />
          読み上げ
        </label>
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
          <span style={styles.small}>自動送信
            <span style={{ marginLeft: 6, opacity: .7 }}>(無音の秒数)</span>
          </span>
          <input type="range" min="1" max="8" step="1"
            value={autoSendDelay} onChange={e=>setAutoSendDelay(parseInt(e.target.value))}
            style={{ width: 160 }} />
          <span style={styles.small}>{autoSendDelay}s</span>
        </div>
      </div>

      <label style={styles.label}>
        <input type="checkbox" checked={bargeInEnabled}
          onChange={e=>onBargeInToggle(e.target.checked)} />
        かぶせ発話（AIの読み上げを止めて話す）
      </label>
    </div>
  );
}

const styles = {
  wrap: { display:"flex", gap:12, alignItems:"center", flexWrap:"wrap", marginBottom:10 },
  btn: { padding:"6px 12px", borderRadius:10, border:"1px solid #ddd", background:"#fff" },
  group: { border:"1px solid #eee", padding:"6px 10px", borderRadius:10, background:"#faf7f2" },
  label: { display:"flex", alignItems:"center", gap:6 },
  row: { display:"flex", alignItems:"center", gap:8, marginTop:4 },
  small: { fontSize:12, color:"#555" }
};
