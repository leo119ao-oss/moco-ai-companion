// pages/diary.js
import { useEffect, useState } from "react";

function Entry({ entry, onUpdate, onDelete }){
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(entry.title);
  const [content, setContent] = useState(entry.content);

  return (
    <div style={styles.card}>
      <div style={{ display:"flex", alignItems:"center", gap:10 }}>
        <input
          style={styles.title}
          value={title}
          disabled={!editing}
          onChange={(e)=>setTitle(e.target.value)}
        />
        <span style={styles.date}>{entry.date}</span>
        {!editing ? (
          <button onClick={()=>setEditing(true)} style={styles.btn}>編集</button>
        ) : (
          <>
            <button onClick={()=>{ onUpdate({ ...entry, title, content }); setEditing(false); }} style={styles.btnPrimary}>保存</button>
            <button onClick={()=>{ setTitle(entry.title); setContent(entry.content); setEditing(false); }} style={styles.btn}>取消</button>
          </>
        )}
        <button onClick={()=>onDelete(entry.id)} style={styles.btnDanger}>削除</button>
      </div>
      <textarea
        value={content}
        disabled={!editing}
        onChange={(e)=>setContent(e.target.value)}
        style={styles.textarea}
      />
    </div>
  );
}

export default function Diary(){
  const [entries, setEntries] = useState([]);
  const [filter, setFilter] = useState("");

  useEffect(()=>{
    const ds = JSON.parse(localStorage.getItem("moco_diary_entries") || "[]");
    setEntries(ds);
  }, []);

  function saveAll(next){
    setEntries(next);
    localStorage.setItem("moco_diary_entries", JSON.stringify(next));
  }

  function addNew(){
    const d = new Date();
    const iso = d.toISOString().slice(0,10);
    const id = Date.now();
    const e = { id, date: iso, title: "無題の日記", content: "" };
    saveAll([e, ...entries]);
  }

  function onUpdate(updated){
    const next = entries.map(e => e.id === updated.id ? updated : e);
    saveAll(next);
  }

  function onDelete(id){
    if(!confirm("削除しますか？")) return;
    saveAll(entries.filter(e => e.id !== id));
  }

  const filtered = entries.filter(e =>
    e.title.toLowerCase().includes(filter.toLowerCase()) ||
    e.content.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <img src="/moco.svg" alt="moco" width={36} height={36} />
        <h1 style={{ margin:0 }}>モコの日記</h1>
      </header>

      <div style={{ display:"flex", gap:10, marginBottom:10 }}>
        <button onClick={addNew} style={styles.btnPrimary}>＋ 新規作成</button>
        <input placeholder="検索…" value={filter} onChange={e=>setFilter(e.target.value)} style={styles.search} />
        <button onClick={()=>{
          const blob = new Blob([JSON.stringify(entries, null, 2)], { type:"application/json" });
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url; a.download = "moco-diary.json"; a.click();
          URL.revokeObjectURL(url);
        }} style={styles.btn}>📥 エクスポート</button>
      </div>

      {filtered.length === 0 && <div style={{ color:"#666" }}>（まだ日記がありません）</div>}
      {filtered.map(e => (
        <Entry key={e.id} entry={e} onUpdate={onUpdate} onDelete={onDelete} />
      ))}
    </div>
  );
}

const styles = {
  page: { maxWidth: 900, margin:"24px auto", padding:"12px", fontFamily:"system-ui,-apple-system,Segoe UI", background:"#fffdf9" },
  header:{ display:"flex", alignItems:"center", gap:10, marginBottom:10 },
  search:{ flex:1, padding:"8px 10px", borderRadius:10, border:"1px solid #ddd", background:"#fff" },
  card:{ border:"1px solid #ecdcc6", background:"#fff", padding:12, borderRadius:12, marginBottom:12 },
  title:{ flex:1, fontWeight:700, fontSize:16, border:"1px solid #eee", borderRadius:8, padding:"6px 8px" },
  date:{ fontSize:12, color:"#777" },
  textarea:{ width:"100%", height:160, marginTop:8, padding:10, borderRadius:10, border:"1px solid #e5d6bc", background:"#fffef9" },
  btn:{ padding:"6px 10px", border:"1px solid #ddd", borderRadius:10, background:"#fff" },
  btnPrimary:{ padding:"6px 10px", border:"1px solid #e0a85a", borderRadius:10, background:"#f4b86a", color:"#2b1900", fontWeight:600 },
  btnDanger:{ padding:"6px 10px", border:"1px solid #e88989", borderRadius:10, background:"#ffefef", color:"#8a1a1a" }
};
