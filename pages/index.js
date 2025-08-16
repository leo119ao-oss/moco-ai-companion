// pages/index.js
import { useEffect, useRef, useState } from "react";
import Toolbar from "../components/Toolbar";

const SR = typeof window !== "undefined" ? (window.SpeechRecognition || window.webkitSpeechRecognition) : null;

function Bubble({ role, text }){
  const isUser = role === "user";
  return (
    <div style={{ display:"flex", gap:10, alignItems:"flex-start", margin:"8px 0" }}>
      {!isUser && <img src="/moco.svg" alt="moco" width={36} height={36} />}
      <div style={{
        background: isUser ? "#d9ecff" : "#fff",
        border: "1px solid #ececec",
        padding: "10px 12px",
        borderRadius: 16,
        maxWidth: "72%",
        boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
      }}>
        <pre style={{ whiteSpace:"pre-wrap", margin:0, fontFamily:"inherit" }}>{text}</pre>
      </div>
    </div>
  );
}

export default function Home(){
  const [messages, setMessages] = useState([
    { role: "assistant", text: "こんにちは、私はモコ。何でも話してね。"}
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [interim, setInterim] = useState("");
  const [listening, setListening] = useState(false);
  const [ttsMode, setTtsMode] = useState("off"); // off | browser | cloud
  const [ttsRate, setTtsRate] = useState(1.4);
  const [ttsProvider, setTtsProvider] = useState("auto"); // auto | elevenlabs | openai
  const [autoSendDelay, setAutoSendDelay] = useState(3);
  const [bargeInEnabled, setBargeInEnabled] = useState(true);

  const bottomRef = useRef(null);
  const recRef = useRef(null);
  const silenceTimerRef = useRef(null);
  const audioRef = useRef(null);

  useEffect(()=>{
    bottomRef.current?.scrollIntoView({ behavior:"smooth" });

    const last = messages.at(-1);
    if(!last || last.role !== "assistant") return;

    if(ttsMode === "browser"){
      const utt = new SpeechSynthesisUtterance(last.text);
      utt.lang = "ja-JP";
      utt.rate = ttsRate;
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utt);
    } else if (ttsMode === "cloud"){
      (async () => {
        try{
          const r = await fetch("/api/tts", {
            method:"POST",
            headers:{ "Content-Type":"application/json" },
            body: JSON.stringify({ text: last.text, provider: ttsProvider })
          });
          if(!r.ok) return;
          const blob = await r.blob();
          const au = new Audio(URL.createObjectURL(blob));
          au.playbackRate = ttsRate;
          if(audioRef.current){ audioRef.current.pause(); }
          audioRef.current = au;
          await au.play();
        }catch{}
      })();
    }
  }, [messages, ttsMode, ttsRate, ttsProvider]);

  useEffect(()=>{
    if (typeof window === "undefined") return;
    const store = JSON.parse(localStorage.getItem("moco_sessions") || "[]");
    store.push({ t: Date.now(), messages });
    localStorage.setItem("moco_sessions", JSON.stringify(store.slice(-50)));
  }, [messages]);

  useEffect(()=>{
    if(!SR) return;
    const rec = new SR();
    rec.lang = "ja-JP";
    rec.interimResults = true;
    rec.continuous = true;

    rec.onresult = (e) => {
      let finalText = "";
      let interimText = "";
      for (let i = e.resultIndex; i < e.results.length; i++){
        const r = e.results[i];
        const txt = r[0].transcript;
        if (r.isFinal) finalText += txt;
        else interimText += txt;
      }
      if (finalText){
        setInput(prev => (prev ? prev + " " : "") + finalText.trim());
        setInterim("");
        resetSilenceTimer();
      } else {
        setInterim(interimText);
      }
    };
    rec.onstart = () => {
      setListening(true);
      if(bargeInEnabled){
        window.speechSynthesis?.cancel();
        if(audioRef.current) audioRef.current.pause();
      }
      resetSilenceTimer();
    };
    rec.onend = () => {
      setListening(false);
      triggerAutoSend();
    };
    rec.onerror = () => setListening(false);

    recRef.current = rec;
  }, [bargeInEnabled]);

  function resetSilenceTimer(){
    clearTimeout(silenceTimerRef.current);
    silenceTimerRef.current = setTimeout(()=>{
      triggerAutoSend();
    }, autoSendDelay * 1000);
  }

  async function triggerAutoSend(){
    clearTimeout(silenceTimerRef.current);
    if (!input.trim()) return;
    await send();
  }

  function toggleMic(){
    if(!recRef.current){ alert("このブラウザは音声入力に未対応です（Chrome推奨）"); return; }
    if(listening){ recRef.current.stop(); setListening(false); }
    else{ recRef.current.start(); }
  }

  async function send(){
    const text = input.trim();
    if(!text || loading) return;
    setInput("");
    const next = [...messages, { role: "user", text }];
    setMessages(next);
    setLoading(true);
    try{
      const resp = await fetch("/api/chat", {
        method:"POST",
        headers:{ "Content-Type":"application/json" },
        body: JSON.stringify({ messages: next.slice(-12) })
      });
      const data = await resp.json();
      setMessages(m => [...m, { role:"assistant", text: data.reply || "(応答なし)" }]);
    }catch{
      setMessages(m => [...m, { role:"assistant", text:"サーバーエラーが出たかも…もう一度試してね。" }]);
    }finally{
      setLoading(false);
    }
  }

  async function makeDiaryEntry(){
    try{
      const resp = await fetch("/api/diary", {
        method:"POST",
        headers:{ "Content-Type":"application/json" },
        body: JSON.stringify({ messages })
      });
      const data = await resp.json();
      const text = data.diary || "(日記を作れなかった…)";
      const entry = {
        id: Date.now(),
        date: new Date().toISOString().slice(0,10),
        title: "今日のよかったこと",
        content: text
      };
      const ds = JSON.parse(localStorage.getItem("moco_diary_entries") || "[]");
      ds.unshift(entry);
      localStorage.setItem("moco_diary_entries", JSON.stringify(ds.slice(0,500)));
      window.open("/diary", "_blank");
    }catch{}
  }

  function onKey(e){
    if(e.key === "Enter" && !e.shiftKey){
      e.preventDefault();
      send();
    }
  }

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <img src="/moco.svg" alt="moco" width={36} height={36} />
        <h1 style={{ margin:0, fontSize:22 }}>モコ — お母さん大学 AIコンパニオン</h1>
        <button onClick={makeDiaryEntry} style={styles.diaryBtn}>📓 日記を作る</button>
      </header>

      <Toolbar
        onMicToggle={toggleMic} listening={listening}
        ttsMode={ttsMode} setTtsMode={setTtsMode}
        ttsRate={ttsRate} setTtsRate={setTtsRate}
        autoSendDelay={autoSendDelay} setAutoSendDelay={setAutoSendDelay}
        onBargeInToggle={setBargeInEnabled} bargeInEnabled={bargeInEnabled}
        ttsProvider={ttsProvider} setTtsProvider={setTtsProvider}
      />

      <main style={styles.main}>
        {messages.map((m, i) => <Bubble key={i} role={m.role} text={m.text} />)}
        {!!interim && (
          <div style={{ opacity:.7, fontStyle:"italic", margin:"6px 0 10px 46px" }}>…{interim}</div>
        )}
        {loading && <div style={{ fontSize:12, color:"#777", marginLeft:46 }}>送信中…</div>}
        <div ref={bottomRef} />
      </main>

      <section style={styles.inputArea}>
        <textarea
          value={input}
          onChange={(e)=>setInput(e.target.value)}
          onKeyDown={onKey}
          placeholder="話しかけてみて…（Enterで送信/改行はShift+Enter）"
          style={styles.textarea}
        />
        <div style={{ display:"flex", gap:10 }}>
          <button onClick={send} disabled={loading} style={styles.sendBtn}>送信</button>
          <button onClick={()=>{
            window.speechSynthesis?.cancel();
            if(audioRef.current) audioRef.current.pause();
          }} style={styles.stopBtn}>🔇 停止</button>
        </div>
      </section>
    </div>
  );
}

const styles = {
  page: { maxWidth: 900, margin:"24px auto", padding:"12px 12px 40px", fontFamily:"system-ui,-apple-system,Segoe UI", background:"#fffdf9" },
  header:{ display:"flex", alignItems:"center", gap:10, marginBottom:10 },
  main: { border:"1px solid #ecdcc6", background:"#fffaf2", padding:"14px", borderRadius:16, height:"58vh", overflow:"auto", boxShadow:"inset 0 0 20px rgba(229,214,188,.25)" },
  inputArea: { marginTop:12, display:"flex", gap:10, alignItems:"flex-end" },
  textarea: { flex:1, height:110, padding:10, borderRadius:12, border:"1px solid #e5d6bc", background:"#fffef9" },
  sendBtn: { padding:"10px 16px", background:"#f4b86a", color:"#2b1900", border:"1px solid #e0a85a", borderRadius:12, fontWeight:600 },
  stopBtn: { padding:"10px 12px", background:"#eee", border:"1px solid #ddd", borderRadius:12 }
};
