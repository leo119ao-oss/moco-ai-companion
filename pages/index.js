// pages/index.js
import { useEffect, useRef, useState } from "react";
import Toolbar from "../components/Toolbar";

const SR = typeof window !== "undefined" ? (window.SpeechRecognition || window.webkitSpeechRecognition) : null;

export default function Home() {
  const [messages, setMessages] = useState([
    { role: "assistant", text: "こんにちは、私はモコ。何でも話してね。" }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const [ttsEnabled, setTtsEnabled] = useState(false);
  const [loggingEnabled, setLoggingEnabled] = useState(true);
  const bottomRef = useRef(null);
  const recRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    if (ttsEnabled) {
      const last = messages.at(-1);
      if (last?.role === "assistant" && typeof window !== "undefined") {
        const utt = new SpeechSynthesisUtterance(last.text);
        utt.lang = "ja-JP";
        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(utt);
      }
    }
    if (loggingEnabled && typeof window !== "undefined") {
      const store = JSON.parse(localStorage.getItem("moco_sessions") || "[]");
      store.push({ t: Date.now(), messages });
      localStorage.setItem("moco_sessions", JSON.stringify(store.slice(-50)));
    }
  }, [messages]);

  useEffect(() => {
    if (!SR) return;
    const rec = new SR();
    rec.lang = "ja-JP";
    rec.interimResults = false;
    rec.continuous = false;
    rec.onresult = (e) => {
      const text = Array.from(e.results).map(r => r[0].transcript).join("");
      setInput(prev => (prev ? prev + " " : "") + text);
    };
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);
    recRef.current = rec;
  }, []);

  function toggleMic() {
    if (!recRef.current) { alert("このブラウザは音声入力に未対応です（Chrome推奨）"); return; }
    if (listening) { recRef.current.stop(); setListening(false); }
    else { setListening(true); recRef.current.start(); }
  }

  async function track(event, data) {
    try {
      fetch("/api/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ event, data, t: Date.now() })
      });
      if (typeof window !== "undefined") {
        const a = JSON.parse(localStorage.getItem("moco_analytics") || "{}");
        a[event] = (a[event] || 0) + 1;
        localStorage.setItem("moco_analytics", JSON.stringify(a));
      }
    } catch {}
  }

  async function send() {
    const text = input.trim();
    if (!text || loading) return;
    setInput("");
    const next = [...messages, { role: "user", text }];
    setMessages(next);
    setLoading(true);
    await track("send", { len: text.length });
    try {
      const resp = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next.slice(-12) })
      });
      const data = await resp.json();
      setMessages(m => [...m, { role: "assistant", text: data.reply || "(応答なし)" }]);
      await track("reply", {});
    } catch (e) {
      setMessages(m => [...m, { role: "assistant", text: "サーバーエラーが出たかも…もう一度試してね。" }]);
      await track("error", { where: "chat" });
    } finally { setLoading(false); }
  }

  function onKey(e) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
  }

  async function makeDiary() {
    try {
      const resp = await fetch("/api/diary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages })
      });
      const data = await resp.json();
      const text = data.diary || "(日記を作れなかった…)";
      setMessages(m => [...m, { role: "assistant", text }]);
      if (typeof window !== "undefined") {
        const ds = JSON.parse(localStorage.getItem("moco_diary") || "[]");
        ds.push({ t: Date.now(), text });
        localStorage.setItem("moco_diary", JSON.stringify(ds.slice(-100)));
      }
      await track("diary", {});
    } catch {
      setMessages(m => [...m, { role: "assistant", text: "日記作成でエラーが出たみたい。" }]);
      await track("error", { where: "diary" });
    }
  }

  return (
    <div style={{ maxWidth: 900, margin: "24px auto", padding: 12, fontFamily: "system-ui, -apple-system, Segoe UI" }}>
      <h1>モコ — お母さん大学 AIコンパニオン</h1>

      <Toolbar
        onMicToggle={toggleMic}
        listening={listening}
        ttsEnabled={ttsEnabled} setTtsEnabled={setTtsEnabled}
        loggingEnabled={loggingEnabled} setLoggingEnabled={setLoggingEnabled}
        onMakeDiary={makeDiary}
      />

      <div style={{ border: "1px solid #eee", background: "#fafafa", height: "60vh", overflow: "auto", padding: 12, borderRadius: 8 }}>
        {messages.map((m, i) => (
          <div key={i} style={{
            maxWidth: "70%",
            padding: 12,
            borderRadius: 10,
            margin: "8px 0",
            alignSelf: m.role === "user" ? "flex-end" : "flex-start",
            background: m.role === "user" ? "#d1e9ff" : "#fff"
          }}>
            <pre style={{ whiteSpace: "pre-wrap", margin: 0 }}>{m.text}</pre>
          </div>
        ))}
        {loading && <div style={{ fontSize: 12, color: "#888" }}>送信中…</div>}
        <div ref={bottomRef} />
      </div>

      <textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={onKey}
        placeholder="話しかけてみて…（Enterで送信/改行はShift+Enter）"
        style={{ width: "100%", height: 120, marginTop: 16, padding: 8 }}
      />
      <div style={{ marginTop: 8, display: "flex", gap: 8 }}>
        <button onClick={send} disabled={loading} style={{ padding: "8px 16px" }}>
          送信
        </button>
        <button onClick={() => {
          const data = {
            sessions: JSON.parse(localStorage.getItem("moco_sessions") || "[]"),
            analytics: JSON.parse(localStorage.getItem("moco_analytics") || "{}"),
            diary: JSON.parse(localStorage.getItem("moco_diary") || "[]")
          };
          const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url; a.download = "moco-logs.json"; a.click();
          URL.revokeObjectURL(url);
        }}>📥 記録をダウンロード</button>
      </div>
    </div>
  );
}
