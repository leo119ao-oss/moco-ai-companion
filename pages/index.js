// SSR to avoid stale HTML from CDN
export async function getServerSideProps(){ return { props:{} }; }

import { useEffect, useRef, useState } from "react";
import Toolbar from "../components/Toolbar";

const SR = typeof window !== "undefined" ? (window.SpeechRecognition || window.webkitSpeechRecognition) : null;

function Bubble({ role, text }){
  const isUser = role === "user";
  return (
    <div style={{ display:"flex", gap:10, alignItems:"flex-start", margin:"8px 0" }}>
      {!isUser && <img src="/moco.svg" alt="moco" width={32} height={32} />}
      <div style={{ background: isUser ? "#d9ecff" : "#fff", border: "1px solid #ececec", padding: "10px 12px", borderRadius: 16, maxWidth: "85%" }}>
        <pre style={{ whiteSpace:"pre-wrap", margin:0, fontFamily:"inherit" }}>{text}</pre>
      </div>
    </div>
  );
}

function Calendar({ entriesByDate, value, onChange }){
  const [cursor, setCursor] = useState(value ? new Date(value) : new Date());
  const y = cursor.getFullYear(), m = cursor.getMonth();
  const first = new Date(y, m, 1);
  const startDay = first.getDay();
  const daysInMonth = new Date(y, m+1, 0).getDate();
  const todayIso = new Date().toISOString().slice(0,10);
  const cells = []; for(let i=0;i<startDay;i++) cells.push(null); for(let d=1; d<=daysInMonth; d++) cells.push(new Date(y,m,d));
  const iso = (d)=>d.toISOString().slice(0,10);
  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:6 }}>
        <button onClick={()=>setCursor(new Date(y, m-1, 1))}>‹</button>
        <div style={{ fontWeight:700 }}>{y}年 {m+1}月</div>
        <button onClick={()=>setCursor(new Date(y, m+1, 1))}>›</button>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:6, fontSize:12 }}>
        {["日","月","火","水","木","金","土"].map(w => <div key={w} style={{textAlign:"center", color:"#777"}}>{w}</div>)}
        {cells.map((d,i)=>{
          if(!d) return <div key={"e"+i}/>;
          const k = iso(d), has = !!entriesByDate[k], isToday = k === todayIso, isSelected = k === value;
          return (
            <button key={k} onClick={()=>onChange(k)} style={{ padding:"6px 4px", minHeight:40, borderRadius:10, border: isSelected ? "2px solid #5596ff":"1px solid #e6e2db", background: isSelected ? "#eef4ff" : "#fff", position:"relative" }}>
              <div style={{fontSize:12, textAlign:"right"}}>{d.getDate()}</div>
              {has && <div style={{ position:"absolute", left:6, bottom:6, width:6, height:6, borderRadius:6, background:"#f4b86a"}}/>}
              {isToday && <div style={{ position:"absolute", right:6, bottom:6, width:6, height:6, borderRadius:6, background:"#6abf4b"}}/>}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function Home(){
  // Chat state
  const [messages, setMessages] = useState([{ role: "assistant", text: "こんにちは。今日はどうする？" }]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [interim, setInterim] = useState("");

  // Voice defaults
  const [ttsMode, setTtsMode] = useState("cloud");
  const [ttsRate, setTtsRate] = useState(1.4);
  const [ttsProvider, setTtsProvider] = useState("openai");
  const [voice, setVoice] = useState("alloy");

  const [autoSendDelay, setAutoSendDelay] = useState(3);
  const [bargeInEnabled, setBargeInEnabled] = useState(true);

  const [listening, setListening] = useState(false);
  const keepListeningRef = useRef(true);

  const recRef = useRef(null); const silenceTimerRef = useRef(null);
  const audioRef = useRef(null); const bottomRef = useRef(null);

  // Diary state
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0,10));
  const [entriesByDate, setEntriesByDate] = useState({});
  const currentEntry = entriesByDate[selectedDate] || { title: "無題の日記", content: "" };

  // Single audio instance
  useEffect(()=>{ const au = new Audio(); au.preload = "auto"; audioRef.current = au; return ()=>{au.pause(); audioRef.current=null;}; }, []);

  // Play when assistant speaks
  useEffect(()=>{
    const last = messages.at(-1);
    if(!last || last.role !== "assistant" || ttsMode !== "cloud") return;
    (async () => {
      try{
        const r = await fetch("/api/tts", { method:"POST", headers:{ "Content-Type":"application/json" }, body: JSON.stringify({ text: last.text, provider: ttsProvider, voice }) });
        if(!r.ok) return;
        const blob = await r.blob(); const url = URL.createObjectURL(blob);
        const au = audioRef.current; if(!au) return;
        au.pause(); au.src = url; au.playbackRate = ttsRate;
        try{ await au.play(); }catch{ /* ユーザー操作待ち */ }
        au.onended = ()=>{ URL.revokeObjectURL(url); };
      }catch{}
    })();
    bottomRef.current?.scrollIntoView({ behavior:"smooth" });
  }, [messages, ttsMode, ttsRate, ttsProvider, voice]);

  // Persist chat
  useEffect(()=>{
    const store = JSON.parse(localStorage.getItem("moco_sessions") || "[]");
    store.push({ t: Date.now(), messages });
    localStorage.setItem("moco_sessions", JSON.stringify(store.slice(-50)));
  }, [messages]);

  // SR init & auto start
  useEffect(()=>{
    if(!SR) return;
    const rec = new SR();
    rec.lang = "ja-JP"; rec.interimResults = true; rec.continuous = true;
    rec.onresult = (e) => {
      let finalText = "", interimText = "";
      for(let i=e.resultIndex;i<e.results.length;i++){ const r = e.results[i]; const txt = r[0].transcript; if (r.isFinal) finalText += txt; else interimText += txt; }
      if (finalText){ setInput(p => (p ? p + " " : "") + finalText.trim()); setInterim(""); resetSilenceTimer(); }
      else { setInterim(interimText); resetSilenceTimer(); }
    };
    rec.onstart = () => { setListening(true); if(bargeInEnabled){ audioRef.current?.pause(); } resetSilenceTimer(); };
    rec.onend = () => { setListening(false); if (keepListeningRef.current) { try{ rec.start(); }catch{} } else { triggerAutoSend(); } };
    rec.onerror = () => setListening(false);
    recRef.current = rec; keepListeningRef.current = true; try{ rec.start(); }catch{}
  }, [bargeInEnabled]);

  // Reset timer when slider changes
  useEffect(()=>{ if (input.trim()) resetSilenceTimer(); }, [autoSendDelay]);

  function resetSilenceTimer(){ clearTimeout(silenceTimerRef.current); silenceTimerRef.current = setTimeout(()=>{ triggerAutoSend(); }, autoSendDelay * 1000); }
  async function triggerAutoSend(){ clearTimeout(silenceTimerRef.current); if (!input.trim()) return; await send(); }
  function toggleMic(){ if(!recRef.current){ alert("このブラウザは音声入力に未対応です（Chrome推奨）"); return; } if(listening){ keepListeningRef.current = false; recRef.current.stop(); } else { keepListeningRef.current = true; recRef.current.start(); } }

  async function send(){
    const text = input.trim(); if(!text || loading) return;
    setInput(""); setInterim("");
    const next = [...messages, { role: "user", text }]; setMessages(next); setLoading(true);
    try{
      const resp = await fetch("/api/chat", { method:"POST", headers:{ "Content-Type":"application/json" }, body: JSON.stringify({ messages: next.slice(-12) }) });
      const data = await resp.json();
      setMessages(m => [...m, { role:"assistant", text: data.reply || "…" }]);
    }catch{ setMessages(m => [...m, { role:"assistant", text:"サーバーエラーかも。もう一度試してね。" }]); }
    finally{ setLoading(false); if(recRef.current){ keepListeningRef.current = true; try{ recRef.current.start(); }catch{} } }
  }

  // Diary persistence
  useEffect(()=>{ const saved = JSON.parse(localStorage.getItem("moco_diary_map") || "{}"); setEntriesByDate(saved); }, []);
  function saveDiaryMap(next){ setEntriesByDate(next); localStorage.setItem("moco_diary_map", JSON.stringify(next)); }
  function updateCurrentEntry(fields){ const next = { ...entriesByDate, [selectedDate]: { ...(entriesByDate[selectedDate]||{title:"無題の日記", content:""}), ...fields } }; saveDiaryMap(next); }
  async function autoWriteDiary(){
    try{
      const resp = await fetch("/api/diary", { method:"POST", headers:{ "Content-Type":"application/json" }, body: JSON.stringify({ messages, date: selectedDate }) });
      const data = await resp.json(); updateCurrentEntry({ title: "今日のよかったこと", content: data.diary || "" });
    }catch{}
  }

  function onKey(e){ if(e.key === "Enter" && !e.shiftKey){ e.preventDefault(); send(); } }

  return (
    <div style={styles.page}>
      <h1 style={{ margin:"6px 0 12px" }}>モコ — お母さん大学 AIコンパニオン</h1>

      <Toolbar
        onMicToggle={toggleMic} listening={listening}
        ttsMode={ttsMode} setTtsMode={setTtsMode}
        ttsRate={ttsRate} setTtsRate={setTtsRate}
        autoSendDelay={autoSendDelay} setAutoSendDelay={setAutoSendDelay}
        onBargeInToggle={setBargeInEnabled} bargeInEnabled={bargeInEnabled}
        ttsProvider={ttsProvider} setTtsProvider={setTtsProvider}
        voice={voice} setVoice={setVoice}
      />

      <div style={styles.columns}>
        <div style={styles.colLeft}>
          <div style={styles.chat}>
            {messages.map((m, i) => <Bubble key={i} role={m.role} text={m.text} />)}
            {!!interim && <div style={{ opacity:.7, fontStyle:"italic", marginLeft:42 }}>…{interim}</div>}
            {loading && <div style={{ fontSize:12, color:"#777", marginLeft:42 }}>送信中…</div>}
            <div ref={bottomRef} />
          </div>
          <div style={styles.compose}>
            <textarea value={input} onChange={(e)=>setInput(e.target.value)} onKeyDown={onKey} placeholder="話しかけてみて…（Enterで送信 / 改行は Shift+Enter）" style={styles.textarea} />
            <div style={{ display:"flex", gap:10 }}>
              <button onClick={send} disabled={loading} style={styles.sendBtn}>送信</button>
              <button onClick={()=>{ audioRef.current?.pause(); }} style={styles.stopBtn}>🔇 停止</button>
            </div>
          </div>
        </div>

        <div style={styles.colRight}>
          <Calendar entriesByDate={entriesByDate} value={selectedDate} onChange={setSelectedDate} />
          <div style={styles.diaryCard}>
            <input value={currentEntry.title} onChange={(e)=>updateCurrentEntry({ title:e.target.value })} style={styles.diaryTitle} />
            <textarea value={currentEntry.content} onChange={(e)=>updateCurrentEntry({ content:e.target.value })} style={styles.diaryText} />
            <div style={{ display:"flex", gap:8 }}>
              <button onClick={autoWriteDiary} style={styles.btnPrimary}>会話から作成</button>
              <button onClick={()=>{ const blob = new Blob([JSON.stringify(entriesByDate, null, 2)], { type:"application/json" }); const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = "moco-diary.json"; a.click(); URL.revokeObjectURL(url); }} style={styles.btn}>エクスポート</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: { maxWidth: 1100, margin:"20px auto", padding:"12px 12px 24px", fontFamily:"system-ui,-apple-system,Segoe UI", background:"#fffdf9" },
  columns: { display:"grid", gridTemplateColumns:"1.3fr 1fr", gap:14 },
  colLeft: { display:"flex", flexDirection:"column", gap:8 },
  colRight: { display:"flex", flexDirection:"column", gap:8 },
  chat: { border:"1px solid #ecdcc6", background:"#fffaf2", padding:"12px", borderRadius:16, height:"58vh", overflow:"auto" },
  compose: { display:"flex", gap:10, alignItems:"flex-end", marginTop:8 },
  textarea: { flex:1, height:110, padding:10, borderRadius:12, border:"1px solid #e5d6bc", background:"#fffef9" },
  sendBtn: { padding:"10px 16px", background:"#f4b86a", color:"#2b1900", border:"1px solid #e0a85a", borderRadius:12, fontWeight:600 },
  stopBtn: { padding:"10px 12px", background:"#eee", border:"1px solid #ddd", borderRadius:12 },
  diaryCard:{ border:"1px solid #ecdcc6", background:"#fff", padding:12, borderRadius:12 },
  diaryTitle:{ width:"100%", fontWeight:700, fontSize:16, border:"1px solid #eee", borderRadius:8, padding:"6px 8px", marginBottom:8 },
  diaryText:{ width:"100%", height:220, border:"1px solid #e5d6bc", background:"#fffef9", borderRadius:10, padding:10 },
  btn:{ padding:"6px 10px", border:"1px solid #ddd", borderRadius:10, background:"#fff" },
  btnPrimary:{ padding:"6px 10px", border:"1px solid #e0a85a", borderRadius:10, background:"#f4b86a", color:"#2b1900", fontWeight:600 }
};
