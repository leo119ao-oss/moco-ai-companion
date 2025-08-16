// pages/index.js
import { useEffect, useRef, useState } from "react";

export default function Home() {
  const [messages, setMessages] = useState([
    { role: "assistant", text: "こんにちは、私はモコ。何でも話してね。" }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function send() {
    const text = input.trim();
    if (!text || loading) return;
    setInput("");
    const nextMessages = [...messages, { role: "user", text }];
    setMessages(nextMessages);
    setLoading(true);
    try {
      const resp = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: nextMessages.slice(-12) }),
      });
      const data = await resp.json();
      setMessages(m => [...m, { role: "assistant", text: data.reply || "(応答なし)" }]);
    } catch (e) {
      setMessages(m => [...m, { role: "assistant", text: "サーバーエラーが出たかも…もう一度試してね。" }]);
    } finally {
      setLoading(false);
    }
  }

  function onKey(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  return (
    <div style={{ maxWidth: 900, margin: "24px auto", padding: 12, fontFamily: "system-ui, -apple-system, Segoe UI" }}>
      <h1>モコ — お母さん大学 AIコンパニオン</h1>

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
      <div style={{ marginTop: 8 }}>
        <button onClick={send} disabled={loading} style={{ padding: "8px 16px" }}>
          送信
        </button>
      </div>
    </div>
  );
}
