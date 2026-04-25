"use client";
import { useState } from "react";
import Sidebar from "@/components/Sidebar";
import TaskCard from "@/components/TaskCard";
import FocusTimer from "@/components/FocusTimer";
import { mockTasks } from "@/lib/mockData";
import type { Task } from "@/types";

export default function TodayPage() {
  const [tasks, setTasks] = useState<Task[]>(mockTasks);

  const today = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
  const completed = tasks.filter((t) => t.is_complete).length;
  const total = tasks.length;
  const totalMins = tasks.reduce((s, t) => s + t.duration_minutes, 0);
  const allDone = completed === total;

  function toggleTask(id: string) {
    setTasks((prev) => prev.map((t) => t.id === id ? { ...t, is_complete: !t.is_complete } : t));
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--bg-base)" }}>
      <Sidebar />

      {/* Main content */}
      <main style={{ marginLeft: 216, flex: 1, paddingBottom: 80 }} className="today-main">
        <div style={{ maxWidth: 680, margin: "0 auto", padding: "32px 24px" }}>

          {/* Header */}
          <div style={{ marginBottom: 28 }}>
            <p style={{ margin: "0 0 4px", fontSize: 13, color: "var(--text-tertiary)", fontWeight: 500 }}>{today}</p>
            <h1 style={{ margin: 0, fontSize: 26, fontWeight: 700, color: "var(--text-primary)", letterSpacing: "-0.4px" }}>
              {allDone ? "All done for today 🎉" : "Today's tasks"}
            </h1>
            <p style={{ margin: "6px 0 0", fontSize: 13.5, color: "var(--text-tertiary)" }}>
              {Math.floor(totalMins / 60)}h {totalMins % 60}m planned today
            </p>
          </div>

          {/* Progress bar */}
          <div style={{ marginBottom: 28, background: "var(--bg-surface)", border: "1px solid var(--border-subtle)", borderRadius: 8, padding: "14px 16px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <span style={{ fontSize: 13, fontWeight: 500, color: "var(--text-secondary)" }}>
                {completed} of {total} tasks complete
              </span>
              <span style={{ fontSize: 13, fontWeight: 600, color: allDone ? "var(--success)" : "var(--accent)" }}>
                {total > 0 ? Math.round((completed / total) * 100) : 0}%
              </span>
            </div>
            <div style={{ height: 6, background: "var(--bg-muted)", borderRadius: 3, overflow: "hidden" }}>
              <div style={{
                height: "100%", borderRadius: 3,
                background: allDone ? "var(--success)" : "var(--accent)",
                width: `${total > 0 ? (completed / total) * 100 : 0}%`,
                transition: "width 400ms ease-out, background 300ms"
              }} />
            </div>
          </div>

          {/* All done state */}
          {allDone && (
            <div className="follow-through" style={{ background: "var(--success-subtle)", border: "1px solid var(--success)", borderRadius: 10, padding: 24, textAlign: "center", marginBottom: 24 }}>
              <div style={{ fontSize: 44, marginBottom: 10 }}>🎊</div>
              <h2 style={{ margin: "0 0 6px", fontSize: 18, fontWeight: 700, color: "var(--text-primary)" }}>Done for today!</h2>
              <p style={{ margin: 0, color: "var(--text-tertiary)", fontSize: 13.5 }}>Great work. Your progress has been saved. See you tomorrow.</p>
            </div>
          )}

          {/* Task list */}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {tasks.map((task, i) => (
              <div key={task.id} className="stagger-item" style={{ animationDelay: `${i * 60}ms` }}>
                <TaskCard task={task} onToggle={toggleTask} />
              </div>
            ))}
          </div>

          {/* Streak callout */}
          <div style={{ marginTop: 24, background: "var(--accent-subtle)", border: "1px solid var(--accent-muted)", borderRadius: 8, padding: "12px 16px", display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 20 }}>🔥</span>
            <div>
              <p style={{ margin: 0, fontWeight: 600, fontSize: 13.5, color: "var(--text-primary)" }}>5-day streak</p>
              <p style={{ margin: 0, fontSize: 12, color: "var(--text-tertiary)" }}>Keep it going — complete today&apos;s tasks to maintain your streak.</p>
            </div>
          </div>

        </div>
      </main>

      <FocusTimer />

      <style>{`
        .today-main { margin-left: 216px; }
        @media (max-width: 768px) { .today-main { margin-left: 0 !important; } }
      `}</style>
    </div>
  );
}
