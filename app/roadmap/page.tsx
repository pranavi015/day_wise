"use client";
import { useState } from "react";
import Sidebar from "@/components/Sidebar";
import { mockRoadmapWeeks } from "@/lib/mockData";
import { CheckCircle2, Clock } from "lucide-react";

const difficultyLabel = ["", "Easy", "Easy", "Medium", "Hard", "Hard"];
const difficultyColor = ["", "var(--success)", "var(--success)", "var(--accent)", "var(--warning)", "var(--error)"];

export default function RoadmapPage() {
  const [weeks, setWeeks] = useState(mockRoadmapWeeks);
  const [recalculating, setRecalculating] = useState(false);

  function deferTopic(weekIdx: number, topicIdx: number) {
    setRecalculating(true);
    setTimeout(() => {
      setWeeks((prev) => {
        const updated = prev.map((w) => ({ ...w, topics: [...w.topics] }));
        const topic = updated[weekIdx].topics.splice(topicIdx, 1)[0];
        if (updated[weekIdx + 1]) {
          updated[weekIdx + 1].topics.unshift(topic);
        }
        return updated;
      });
      setRecalculating(false);
    }, 1200);
  }

  const totalTopics = weeks.reduce((s, w) => s + w.topics.length, 0);
  const doneTopics = weeks.reduce((s, w) => s + w.topics.filter((t) => t.completed).length, 0);

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--bg-base)" }}>
      <Sidebar />

      <main style={{ flex: 1, paddingBottom: 40, marginLeft: 224 }} className="roadmap-main">
        <div style={{ maxWidth: 720, margin: "0 auto", padding: "40px 32px" }}>

          {/* Header */}
          <div style={{ marginBottom: 32 }}>
            <h1 style={{ margin: "0 0 8px", fontSize: 32, fontWeight: 700, color: "var(--text-primary)", letterSpacing: "-0.8px" }}>Your Roadmap</h1>
            <p style={{ margin: 0, fontSize: 14.5, color: "var(--text-secondary)" }}>
              {doneTopics} of {totalTopics} topics completed · {weeks.length} weeks total
            </p>
          </div>

          {/* Recalculating banner */}
          {recalculating && (
            <div className="modal-enter" style={{ background: "var(--accent-subtle)", border: "1px solid var(--accent-muted)", borderRadius: 12, padding: "16px 20px", marginBottom: 24, display: "flex", alignItems: "center", gap: 12, boxShadow: "var(--shadow-sm)" }}>
              <div style={{ width: 16, height: 16, border: "2px solid var(--accent)", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.6s linear infinite" }} />
              <span style={{ fontSize: 14, fontWeight: 600, color: "var(--accent)" }}>Recalculating your optimal schedule...</span>
            </div>
          )}

          {/* Week cards */}
          {weeks.map((week, wi) => {
            const isCurrentWeek = wi === 1;
            const weekHours = Math.round(week.topics.reduce((s, t) => s + t.estimated_minutes, 0) / 60 * 10) / 10;

            return (
              <div key={week.week} className="stagger-item" style={{ animationDelay: `${wi * 80}ms`, marginBottom: 16 }}>
                <div style={{
                  background: "var(--bg-surface)",
                  border: `1px solid var(--border-subtle)`,
                  borderRadius: 16, overflow: "hidden",
                  boxShadow: "var(--shadow-sm)",
                  position: "relative"
                }}>
                  {/* Current week highlight bar */}
                  {isCurrentWeek && <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 4, background: "var(--accent)" }} />}

                  {/* Week header */}
                  <div style={{ padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid var(--border-subtle)", background: isCurrentWeek ? "var(--bg-surface)" : "var(--bg-subtle)" }}>
                    <div style={{ display: "flex", alignItems: "center" }}>
                      <span style={{ fontWeight: 700, fontSize: 16, color: "var(--text-primary)", paddingLeft: isCurrentWeek ? 12 : 0, transition: "padding 200ms" }}>{week.label}</span>
                      {isCurrentWeek && (
                        <span style={{ marginLeft: 12, fontSize: 11, background: "var(--accent-subtle)", color: "var(--accent)", border: "1px solid var(--accent-muted)", borderRadius: 20, padding: "2px 8px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>Current</span>
                      )}
                    </div>
                    <span style={{ fontSize: 13, color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: 6, fontWeight: 500 }}>
                      <Clock size={14} /> {weekHours}h
                    </span>
                  </div>

                  {/* Topics */}
                  <div style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: 12 }}>
                    {week.topics.map((topic, ti) => (
                      <div key={topic.id} style={{ display: "flex", alignItems: "center", gap: 14 }}>
                        <CheckCircle2 size={18} color={topic.completed ? "var(--success)" : "var(--border-strong)"} style={{ flexShrink: 0, opacity: topic.completed ? 1 : 0.6 }} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ margin: 0, fontWeight: 500, fontSize: 14, color: topic.completed ? "var(--text-tertiary)" : "var(--text-primary)", textDecoration: topic.completed ? "line-through" : "none" }}>
                            {topic.name}
                          </p>
                          <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
                            <span style={{ fontSize: 12, color: "var(--text-tertiary)" }}>{Math.round(topic.estimated_minutes / 60 * 10) / 10}h</span>
                            <span style={{ fontSize: 12, color: difficultyColor[topic.difficulty], fontWeight: 500 }}>
                              {difficultyLabel[topic.difficulty]}
                            </span>
                          </div>
                        </div>
                        {!topic.completed && wi < weeks.length - 1 && (
                          <button
                            onClick={() => deferTopic(wi, ti)}
                            style={{ 
                              fontSize: 12, fontWeight: 500, color: "var(--text-secondary)", 
                              background: "var(--bg-base)", border: "1px solid var(--border-default)", 
                              borderRadius: 6, padding: "6px 12px", cursor: "pointer", 
                              whiteSpace: "nowrap", transition: "all 150ms ease",
                              boxShadow: "var(--shadow-sm)"
                            }}
                            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "var(--border-strong)"; (e.currentTarget as HTMLElement).style.background = "var(--bg-surface)"; }}
                            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "var(--border-default)"; (e.currentTarget as HTMLElement).style.background = "var(--bg-base)"; }}>
                            Defer →
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}

        </div>
      </main>

      <style>{`
        @media (max-width: 768px) { .roadmap-main { margin-left: 0 !important; padding-bottom: 70px; } }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
