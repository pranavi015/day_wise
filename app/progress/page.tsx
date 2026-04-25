"use client";
import Sidebar from "@/components/Sidebar";
import { mockWeeklyProgress } from "@/lib/mockData";
import { TrendingUp, Flame, BookOpen, Target } from "lucide-react";

const statCards = [
  { label: "Completion Rate", value: "74%", trend: "up", icon: Target, color: "var(--accent)" },
  { label: "Current Streak", value: "5 days", trend: "up", icon: Flame, color: "var(--warning)" },
  { label: "Topics Mastered", value: "2", trend: "neutral", icon: BookOpen, color: "var(--success)" },
  { label: "Adherence Rate", value: "82%", trend: "up", icon: TrendingUp, color: "var(--accent)" },
];

export default function ProgressPage() {
  const maxMins = Math.max(...mockWeeklyProgress.map((d) => d.minutes_planned));

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--bg-base)" }}>
      <Sidebar />

      <main style={{ flex: 1, paddingBottom: 40, marginLeft: 224 }} className="progress-main">
        <div style={{ maxWidth: 760, margin: "0 auto", padding: "40px 32px" }}>

          {/* Header */}
          <div style={{ marginBottom: 32 }}>
            <h1 style={{ margin: "0 0 8px", fontSize: 32, fontWeight: 700, color: "var(--text-primary)", letterSpacing: "-0.8px" }}>Your Progress</h1>
            <p style={{ margin: 0, fontSize: 14.5, color: "var(--text-secondary)" }}>Week of April 21 – 27, 2026</p>
          </div>

          {/* AI Coach line */}
          <div style={{ 
            background: "var(--sidebar-bg)", borderRadius: 16, padding: "20px 24px", 
            marginBottom: 32, display: "flex", gap: 16, alignItems: "center",
            boxShadow: "0 8px 16px -4px rgba(0,0,0,0.15), 0 4px 6px -2px rgba(0,0,0,0.05)"
          }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: "rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <span style={{ fontSize: 24 }}>🧑‍🏫</span>
            </div>
            <div>
              <p style={{ margin: "0 0 4px", fontSize: 12, color: "var(--sidebar-text)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>Weekly Insights</p>
              <p style={{ margin: 0, fontSize: 14.5, color: "var(--sidebar-active-text)", fontWeight: 400, lineHeight: 1.5 }}>
                Solid week on Python Basics — tackle Lists &amp; Dictionaries this week and you&apos;re right on track.
              </p>
            </div>
          </div>

          {/* Stat cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 16, marginBottom: 32 }} className="stat-grid">
            {statCards.map(({ label, value, trend, icon: Icon, color }, i) => (
              <div key={label} className="stagger-item" style={{ 
                animationDelay: `${i * 60}ms`, background: "var(--bg-surface)", 
                border: "1px solid var(--border-subtle)", borderRadius: 16, padding: "20px",
                boxShadow: "var(--shadow-sm)", position: "relative", overflow: "hidden"
              }}>
                <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 4, background: color }} />
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", paddingLeft: 8 }}>
                  <div>
                    <p style={{ margin: "0 0 6px", fontSize: 13, color: "var(--text-tertiary)", fontWeight: 600 }}>{label}</p>
                    <p style={{ margin: 0, fontSize: 28, fontWeight: 700, color: "var(--text-primary)", letterSpacing: "-0.5px" }}>{value}</p>
                  </div>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: "var(--bg-subtle)", border: "1px solid var(--border-subtle)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "inset 0 2px 4px rgba(0,0,0,0.02)" }}>
                    <Icon size={18} color={color} strokeWidth={2.5}/>
                  </div>
                </div>
                {trend === "up" && <p style={{ margin: "12px 0 0", paddingLeft: 8, fontSize: 12, color: "var(--success)", fontWeight: 500, display: "flex", alignItems: "center", gap: 4 }}>
                  <TrendingUp size={12} /> Better than last week
                </p>}
              </div>
            ))}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 24 }} className="charts-grid">
            {/* Bar chart */}
            <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border-subtle)", borderRadius: 16, padding: "24px", boxShadow: "var(--shadow-sm)" }}>
              <h2 style={{ margin: "0 0 24px", fontSize: 16, fontWeight: 600, color: "var(--text-primary)" }}>Planned vs Actual</h2>

              <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height: 140 }}>
                {mockWeeklyProgress.map((day, i) => (
                  <div key={day.date} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                    <div style={{ width: "100%", display: "flex", gap: 3, alignItems: "flex-end", height: 110 }}>
                      <div style={{ flex: 1, background: "var(--accent-muted)", borderRadius: "4px 4px 0 0", height: `${(day.minutes_planned / maxMins) * 100}%`, transition: "height 600ms cubic-bezier(0.16, 1, 0.3, 1)", transitionDelay: `${i * 80}ms` }} />
                      <div style={{ flex: 1, background: "var(--accent)", borderRadius: "4px 4px 0 0", height: `${(day.minutes_spent / maxMins) * 100}%`, transition: "height 600ms cubic-bezier(0.16, 1, 0.3, 1)", transitionDelay: `${i * 80 + 40}ms`, boxShadow: "0 -2px 6px rgba(99,102,241,0.2)" }} />
                    </div>
                    <span style={{ fontSize: 11, color: "var(--text-tertiary)", fontWeight: 600 }}>{day.date}</span>
                  </div>
                ))}
              </div>

              <div style={{ display: "flex", gap: 16, marginTop: 24, paddingTop: 16, borderTop: "1px solid var(--border-subtle)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 12, height: 12, borderRadius: 3, background: "var(--accent-muted)" }} />
                  <span style={{ fontSize: 13, color: "var(--text-secondary)", fontWeight: 500 }}>Planned mins</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 12, height: 12, borderRadius: 3, background: "var(--accent)" }} />
                  <span style={{ fontSize: 13, color: "var(--text-secondary)", fontWeight: 500 }}>Actual mins</span>
                </div>
              </div>
            </div>

            {/* Topic breakdown */}
            <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border-subtle)", borderRadius: 16, padding: "24px", boxShadow: "var(--shadow-sm)" }}>
              <h2 style={{ margin: "0 0 20px", fontSize: 16, fontWeight: 600, color: "var(--text-primary)" }}>Time by Topic</h2>
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {[
                  { name: "Python Basics", mins: 130, color: "var(--accent)" },
                  { name: "Functions & Scope", mins: 90, color: "#8B5CF6" },
                  { name: "Lists & Dicts", mins: 45, color: "#C4B5FD" },
                ].map((topic) => (
                  <div key={topic.name}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                      <span style={{ fontSize: 13.5, fontWeight: 600, color: "var(--text-secondary)" }}>{topic.name}</span>
                      <span style={{ fontSize: 12.5, color: "var(--text-tertiary)", fontWeight: 500 }}>{topic.mins}m</span>
                    </div>
                    <div style={{ height: 8, background: "var(--bg-muted)", borderRadius: 4, overflow: "hidden" }}>
                      <div style={{ height: "100%", background: topic.color, borderRadius: 4, width: `${(topic.mins / 130) * 100}%`, transition: "width 800ms cubic-bezier(0.16, 1, 0.3, 1)" }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      </main>

      <style>{`
        @media (max-width: 900px) {
          .charts-grid { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 768px) {
          .progress-main { margin-left: 0 !important; padding-bottom: 70px; }
          .stat-grid { grid-template-columns: 1fr 1fr; }
        }
        @media (max-width: 480px) {
          .stat-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
}
