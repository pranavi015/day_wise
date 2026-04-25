"use client";
import { useState } from "react";
import Sidebar from "@/components/Sidebar";
import { mockRoadmapWeeks } from "@/lib/mockData";
import { CheckCircle2, Clock } from "lucide-react";

const difficultyLabel = ["", "Easy", "Easy", "Medium", "Hard", "Hard"];
const difficultyColor = ["", "var(--success)", "var(--success)", "var(--accent)", "var(--error)", "var(--error)"];

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

      <main style={{ flex: 1, paddingBottom: 40 }} className="roadmap-main">
        <div style={{ maxWidth: 720, margin: "0 auto", padding: "32px 24px" }}>

          {/* Header */}
          <div style={{ marginBottom: 28 }}>
            <h1 style={{ margin: "0 0 4px", fontSize: 26, fontWeight: 700, color: "var(--text-primary)", letterSpacing: "-0.4px" }}>Your Roadmap</h1>
            <p style={{ margin: 0, fontSize: 13.5, color: "var(--text-tertiary)" }}>
              {doneTopics} of {totalTopics} topics completed · {weeks.length} weeks total
            </p>
          </div>

          {/* Recalculating banner */}
          {recalculating && (
            <div className="modal-enter" style={{ background: "var(--accent-subtle)", border: "1px solid var(--accent-muted)", borderRadius: 8, padding: "12px 16px", marginBottom: 20, display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 14, height: 14, border: "2px solid var(--accent)", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.6s linear infinite" }} />
              <span style={{ fontSize: 13.5, fontWeight: 500, color: "var(--accent)" }}>Recalculating your schedule...</span>
            </div>
          )}

          {/* Week cards */}
          {weeks.map((week, wi) => {
            const isCurrentWeek = wi === 1;
            const weekHours = Math.round(week.topics.reduce((s, t) => s + t.estimated_minutes, 0) / 60 * 10) / 10;

            return (
              <div key={week.week} className="stagger-item" style={{ animationDelay: `${wi * 80}ms`, marginBottom: 12 }}>
                <div style={{
                  background: "var(--bg-surface)",
                  border: `1px solid ${isCurrentWeek ? "var(--accent-muted)" : "var(--border-subtle)"}`,
                  borderLeft: `3px solid ${isCurrentWeek ? "var(--accent)" : "var(--border-default)"}`,
                  borderRadius: 10, overflow: "hidden"
                }}>
                  {/* Week header */}
                  <div style={{ padding: "12px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid var(--border-subtle)" }}>
                    <div>
                      <span style={{ fontWeight: 600, fontSize: 15, color: "var(--text-primary)" }}>{week.label}</span>
                      {isCurrentWeek && (
                        <span style={{ marginLeft: 8, fontSize: 11, background: "var(--accent)", color: "white", borderRadius: 20, padding: "2px 8px", fontWeight: 500 }}>Current</span>
                      )}
                    </div>
                    <span style={{ fontSize: 12.5, color: "var(--text-tertiary)", display: "flex", alignItems: "center", gap: 4 }}>
                      <Clock size={12} /> {weekHours}h
                    </span>
                  </div>

                  {/* Topics */}
                  <div style={{ padding: "12px 16px", display: "flex", flexDirection: "column", gap: 10 }}>
                    {week.topics.map((topic, ti) => (
                      <div key={topic.id} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <CheckCircle2 size={16} color={topic.completed ? "var(--success)" : "var(--border-default)"} style={{ flexShrink: 0 }} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ margin: 0, fontWeight: 500, fontSize: 13.5, color: topic.completed ? "var(--text-tertiary)" : "var(--text-primary)", textDecoration: topic.completed ? "line-through" : "none" }}>
                            {topic.name}
                          </p>
                          <div style={{ display: "flex", gap: 8, marginTop: 2 }}>
                            <span style={{ fontSize: 11.5, color: "var(--text-tertiary)" }}>{Math.round(topic.estimated_minutes / 60 * 10) / 10}h</span>
                            <span style={{ fontSize: 11.5, color: difficultyColor[topic.difficulty], fontWeight: 500 }}>
                              {difficultyLabel[topic.difficulty]}
                            </span>
                          </div>
                        </div>
                        {!topic.completed && wi < weeks.length - 1 && (
                          <button
                            onClick={() => deferTopic(wi, ti)}
                            style={{ fontSize: 11.5, color: "var(--text-tertiary)", background: "var(--bg-subtle)", border: "1px solid var(--border-subtle)", borderRadius: 5, padding: "3px 10px", cursor: "pointer", whiteSpace: "nowrap", transition: "all 150ms ease" }}
                            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "var(--border-default)"; (e.currentTarget as HTMLElement).style.color = "var(--text-secondary)"; }}
                            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "var(--border-subtle)"; (e.currentTarget as HTMLElement).style.color = "var(--text-tertiary)"; }}>
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
        .roadmap-main { margin-left: 216px; }
        @media (max-width: 768px) { .roadmap-main { margin-left: 0 !important; padding-bottom: 70px; } }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
