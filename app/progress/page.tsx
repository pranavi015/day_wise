"use client";
import Sidebar from "@/components/Sidebar";
import { mockWeeklyProgress } from "@/lib/mockData";
import { TrendingUp, Flame, BookOpen, Target } from "lucide-react";

const statCards = [
  { label: "Completion Rate", value: "74%", trend: "up", icon: Target, color: "var(--accent)" },
  { label: "Current Streak", value: "5 days", trend: "up", icon: Flame, color: "#F59E0B" },
  { label: "Topics Mastered", value: "2", trend: "neutral", icon: BookOpen, color: "var(--success)" },
  { label: "Adherence Rate", value: "82%", trend: "up", icon: TrendingUp, color: "var(--accent)" },
];

export default function ProgressPage() {
  const maxMins = Math.max(...mockWeeklyProgress.map((d) => d.minutes_planned));

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--bg-base)" }}>
      <Sidebar />

      <main style={{ flex: 1, paddingBottom: 40 }} className="progress-main">
        <div style={{ maxWidth: 720, margin: "0 auto", padding: "32px 24px" }}>

          {/* Header */}
          <div style={{ marginBottom: 28 }}>
            <h1 style={{ margin: "0 0 4px", fontSize: 26, fontWeight: 700, color: "var(--text-primary)", letterSpacing: "-0.4px" }}>Your Progress</h1>
            <p style={{ margin: 0, fontSize: 13.5, color: "var(--text-tertiary)" }}>Week of April 21 – 27, 2026</p>
          </div>

          {/* AI Coach line */}
          <div style={{ background: "var(--sidebar-bg)", borderRadius: 10, padding: "16px 20px", marginBottom: 28, display: "flex", gap: 12 }}>
            <span style={{ fontSize: 22, flexShrink: 0 }}>🧑‍🏫</span>
            <div>
              <p style={{ margin: "0 0 4px", fontSize: 11.5, color: "rgba(255,255,255,0.5)", fontWeight: 500 }}>Weekly coach line</p>
              <p style={{ margin: 0, fontSize: 13.5, color: "rgba(255,255,255,0.85)", fontWeight: 400, lineHeight: 1.6 }}>
                Solid week on Python Basics — tackle Lists &amp; Dictionaries this week and you&apos;re right on track.
              </p>
            </div>
          </div>

          {/* Stat cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10, marginBottom: 24 }} className="stat-grid">
            {statCards.map(({ label, value, trend, icon: Icon, color }, i) => (
              <div key={label} className="stagger-item" style={{ animationDelay: `${i * 60}ms`, background: "var(--bg-surface)", border: "1px solid var(--border-subtle)", borderLeft: `3px solid ${color}`, borderRadius: 10, padding: "14px 16px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <p style={{ margin: "0 0 4px", fontSize: 12, color: "var(--text-tertiary)", fontWeight: 500 }}>{label}</p>
                    <p style={{ margin: 0, fontSize: 24, fontWeight: 700, color: "var(--text-primary)" }}>{value}</p>
                  </div>
                  <div style={{ width: 34, height: 34, borderRadius: 8, background: "var(--bg-subtle)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Icon size={16} color={color} />
                  </div>
                </div>
                {trend === "up" && <p style={{ margin: "8px 0 0", fontSize: 11.5, color: "var(--success)" }}>↑ Better than last week</p>}
              </div>
            ))}
          </div>

          {/* Bar chart */}
          <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border-subtle)", borderRadius: 10, padding: "18px 20px", marginBottom: 16 }}>
            <h2 style={{ margin: "0 0 18px", fontSize: 15, fontWeight: 600, color: "var(--text-primary)" }}>Planned vs Actual (minutes)</h2>

            <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 120 }}>
              {mockWeeklyProgress.map((day, i) => (
                <div key={day.date} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                  <div style={{ width: "100%", display: "flex", gap: 2, alignItems: "flex-end", height: 100 }}>
                    <div style={{ flex: 1, background: "var(--accent-muted)", borderRadius: "3px 3px 0 0", height: `${(day.minutes_planned / maxMins) * 100}%`, transition: "height 600ms ease-out", transitionDelay: `${i * 80}ms` }} />
                    <div style={{ flex: 1, background: "var(--accent)", borderRadius: "3px 3px 0 0", height: `${(day.minutes_spent / maxMins) * 100}%`, transition: "height 600ms ease-out", transitionDelay: `${i * 80 + 40}ms` }} />
                  </div>
                  <span style={{ fontSize: 10, color: "var(--text-tertiary)", fontWeight: 500 }}>{day.date}</span>
                </div>
              ))}
            </div>

            <div style={{ display: "flex", gap: 14, marginTop: 14 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{ width: 10, height: 10, borderRadius: 2, background: "var(--accent-muted)" }} />
                <span style={{ fontSize: 12, color: "var(--text-tertiary)" }}>Planned</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{ width: 10, height: 10, borderRadius: 2, background: "var(--accent)" }} />
                <span style={{ fontSize: 12, color: "var(--text-tertiary)" }}>Actual</span>
              </div>
            </div>
          </div>

          {/* Topic breakdown */}
          <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border-subtle)", borderRadius: 10, padding: "18px 20px" }}>
            <h2 style={{ margin: "0 0 14px", fontSize: 15, fontWeight: 600, color: "var(--text-primary)" }}>Time by Topic</h2>
            {[
              { name: "Python Basics", mins: 130, color: "var(--accent)" },
              { name: "Functions & Scope", mins: 90, color: "#7C3AED" },
              { name: "Lists & Dicts", mins: 45, color: "#A78BFA" },
            ].map((topic) => (
              <div key={topic.name} style={{ marginBottom: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                  <span style={{ fontSize: 13, fontWeight: 500, color: "var(--text-secondary)" }}>{topic.name}</span>
                  <span style={{ fontSize: 12, color: "var(--text-tertiary)" }}>{topic.mins} min</span>
                </div>
                <div style={{ height: 5, background: "var(--bg-muted)", borderRadius: 3, overflow: "hidden" }}>
                  <div style={{ height: "100%", background: topic.color, borderRadius: 3, width: `${(topic.mins / 130) * 100}%`, transition: "width 600ms ease-out" }} />
                </div>
              </div>
            ))}
          </div>

        </div>
      </main>

      <style>{`
        .progress-main { margin-left: 216px; }
        .stat-grid { grid-template-columns: repeat(2, 1fr); }
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
