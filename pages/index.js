// pages/index.js
import { useEffect, useRef, useState } from "react";
import Toolbar from "../components/Toolbar";

const SR = typeof window !== "undefined" ? (window.SpeechRecognition || window.webkitSpeechRecognition) : null;

function Bubble({ role, text }){
  const isUser = role === "user";
  return (
    <div style={{ display:"flex", gap:10, alignItems:"flex-start", margin:"8px 0" }}>
      {!isUser && <img src="/moco.svg" alt="moco" width={32} height={32} />}
      <div style={{
        background: isUser ? "#d9ecff" : "#fff",
        border: "1px solid #ececec", padding: "10px 12px",
        borderRadius: 16, maxWidth: "85%"
      }}>
        <pre style={{ whiteSpace:"pre-wrap", margin:0, fontFamily:"inherit" }}>{text}</pre>
      </div>
    </div>
  );
}

export default function Home(){
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
  const keepListeningRef = useRef(true); // manual send後も再開する

  const recRef = useRef(null);
  const silenceTimerRef = useRef(null);
  const audioRef = useRef(null); // single audio element
  const bottomRef = useRef(null);

  // --- create single Audio element ---
  useEffect(()=>{
    if (typeof window === "undefined") return;
    const au = new Audio();
    au.preload = "auto";
    au.onended = () => { /* nothing */ };
    audioRef.current = au;
    return () => { au.pause(); audioRef.current = null; };
  }, []);

  // --- play assistant messages ---
  useEffect(()=>{
    const last = messages.at(-1);
    if(!last || last.role !== "assistant") return;
    if(ttsMode !== "cloud") return;
    (async () => {
      try{
        const r = await fetch("/api/tts", {
          method:"POST",
          headers:{ "Content-Type":"application/json" },
          body: JSON.stringify({ text: last.text, provider: ttsProvider, voice })
        });
        if(!r.ok) return;
        const blob = await r.blob();
        const url = URL.createObjectURL(blob);
        const au = audioRef.current;
        if(!au) return;
        au.pause();
        au.src = url;
        au.playbackRate = ttsRate;
        try{ await au.play(); }catch(e){ /* ユーザー操作待ち */ }
        au.onended = () => { URL.revokeObjectURL(url); };
      }catch{}
    })();
    bottomRef.current?.scrollIntoView({ behavior:"smooth" });
  }, [messages, ttsMode, ttsRate, ttsProvider, voice]);

  // persist
  useEffect(()=>{
    const store = JSON.parse(localStorage.getItem("moco_sessions") || "[]");
    store.push({ t: Date.now(), messages });
    localStorage.setItem("moco_sessions", JSON.stringify(store.slice(-50)));
  }, [messages]);

  // --- SR init & auto start ---
  useEffect(()=>{
    if(!SR) return;
    const rec = new SR();
    rec.lang = "ja-JP"; rec.interimResults = true; rec.continuous = true;

    rec.onresult = (e) => {
      let finalText = "", interimText = "";
      for(let i=e.resultIndex;i<e.results.length;i++){
        const r = e.results[i]; const txt = r[0].transcript;
        if (r.isFinal) finalText += txt; else interimText += txt;
      }
      if (finalText){
        setInput(prev => (prev ? prev + " " : "") + finalText.trim());
        setInterim(""); resetSilenceTimer();
      } else { setInterim(interimText); resetSilenceTimer(); }
    };
    rec.onstart = () => { setListening(true); if(bargeInEnabled){ audioRef.current?.pause(); } resetSilenceTimer(); };
    rec.onend = () => {
      setListening(false);
      if (keepListeningRef.current) {
        try{ rec.start(); }catch{ /* sometimes throws if already started */ }
      } else {
        triggerAutoSend();
      }
    };
    rec.onerror = () => setListening(false);

    recRef.current = rec;
    keepListeningRef.current = true;
    try{ rec.start(); }catch{}
  }, [bargeInEnabled]);

  // reset timer when slider changes
  useEffect(()=>{ if (input.trim()) resetSilenceTimer(); }, [autoSendDelay]);

  function resetSilenceTimer(){
    clearTimeout(silenceTimerRef.current);
    silenceTimerRef.current = setTimeout(()=>{ triggerAutoSend(); }, autoSendDelay * 1000);
  }

  async function triggerAutoSend(){
    clearTimeout(silenceTimerRef.current);
    if (!input.trim()) return;
    await send();
  }

  function toggleMic(){
    if(!recRef.current){ alert("このブラウザは音声入力に未対応です（Chrome推奨）"); return; }
    if(listening){ keepListeningRef.current = false; recRef.current.stop(); }
    else{ keepListeningRef.current = true; recRef.current.start(); }
  }

  async function send(){
    const text = input.trim();
    if(!text || loading) return;
    setInput(""); setInterim("");
    const next = [...messages, { role: "user", text }];
    setMessages(next); setLoading(true);
    try{
      const resp = await fetch("/api/chat", {
        method:"POST", headers:{ "Content-Type":"application/json" },
        body: JSON.stringify({ messages: next.slice(-12) })
      });
      const data = await resp.json();
      setMessages(m => [...m, { role:"assistant", text: data.reply || "…" }]);
    }catch{
      setMessages(m => [...m, { role:"assistant", text:"サーバーエラーかも。もう一度試してね。" }]);
    }finally{
      setLoading(false);
      // 手動送信後もマイク継続
      if(recRef.current){ keepListeningRef.current = true; try{ recRef.current.start(); }catch{} }
    }
  }

  function onKey(e){
    if(e.key === "Enter" && !e.shiftKey){
      e.preventDefault(); send();
    }
  }

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

      <div style={styles.chat}>
        {messages.map((m, i) => <Bubble key={i} role={m.role} text={m.text} />)}
        {!!interim && <div style={{ opacity:.7, fontStyle:"italic", marginLeft:42 }}>…{interim}</div>}
        {loading && <div style={{ fontSize:12, color:"#777", marginLeft:42 }}>送信中…</div>}
        <div ref={bottomRef} />
      </div>

      <div style={styles.compose}>
        <textarea
          value={input} onChange={(e)=>setInput(e.target.value)} onKeyDown={onKey}
          placeholder="話しかけてみて…（Enterで送信 / 改行は Shift+Enter）"
          style={styles.textarea}
        />
        <div style={{ display:"flex", gap:10 }}>
          <button onClick={send} disabled={loading} style={styles.sendBtn}>送信</button>
          <button onClick={()=>{ audioRef.current?.pause(); }} style={styles.stopBtn}>🔇 停止</button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: { maxWidth: 900, margin:"20px auto", padding:"12px 12px 24px", fontFamily:"system-ui,-apple-system,Segoe UI", background:"#fffdf9" },
  chat: { border:"1px solid #ecdcc6", background:"#fffaf2", padding:"12px", borderRadius:16, height:"58vh", overflow:"auto" },
  compose: { display:"flex", gap:10, alignItems:"flex-end", marginTop:8 },
  textarea: { flex:1, height:110, padding:10, borderRadius:12, border:"1px solid #e5d6bc", background:"#fffef9" },
  sendBtn: { padding:"10px 16px", background:"#f4b86a", color:"#2b1900", border:"1px solid #e0a85a", borderRadius:12, fontWeight:600 },
  stopBtn: { padding:"10px 12px", background:"#eee", border:"1px solid #ddd", borderRadius:12 },
};
