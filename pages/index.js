import { useState, useEffect, useRef } from "react";

export default function Home() {
  const [messages, setMessages] = useState([
    { role: "assistant", text: "こんにちは、私はモコ。何でも話してね。" },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function send() {
    if (!input.trim() || loading) return;
    const userMsg = { role: "user", text: input.trim() };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setLoading(true);
    try {
      const resp = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [...messages, userMsg] }),
      });
      const data = await resp.json();
      setMessages((m) => [...m, { role: "assistant", text: data.reply || "（応答なし）" }]);
    } catch (e) {
      setMessages((m) => [
        ...m,
        { role: "assistant", text: "サーバーエラーが出たかも…もう一度試してね。" },
      ]);
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  const onKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

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
            background: m.role === "user" ? "#d1f0ff" : "#fff"
          }}>
            <pre style={{ whiteSpace: "pre-wrap", margin: 0 }}>{m.text}</pre>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <div style={{ marginTop: 12 }}>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKey}
          placeholder="話しかけてみて…（Enterで送信／改行はShift+Enter）"
          style={{ width: "100%", height: 80, padding: 8 }}
        />
        <div style={{ marginTop: 8, display: "flex", gap: 8 }}>
          <button onClick={send} disabled={loading} style={{ padding: "8px 16px" }}>
            {loading ? "送信中…" : "送信"}
          </button>
        </div>
      </div>
    </div>
  );
}
