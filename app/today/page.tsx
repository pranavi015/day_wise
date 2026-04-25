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
      <main style={{ marginLeft: 224, flex: 1, paddingBottom: 80 }} className="today-main">
        <div style={{ maxWidth: 720, margin: "0 auto", padding: "40px 32px" }}>

          {/* Header */}
          <div style={{ marginBottom: 32 }}>
            <p style={{ margin: "0 0 6px", fontSize: 13.5, color: "var(--text-tertiary)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>{today}</p>
            <h1 style={{ margin: 0, fontSize: 32, fontWeight: 700, color: "var(--text-primary)", letterSpacing: "-0.8px" }}>
              {allDone ? "All done for today 🎉" : "Today's Focus"}
            </h1>
            <p style={{ margin: "8px 0 0", fontSize: 14.5, color: "var(--text-secondary)" }}>
              {Math.floor(totalMins / 60)}h {totalMins % 60}m planned across {total} tasks
            </p>
          </div>

          {/* Progress widget */}
          <div style={{ 
            marginBottom: 32, background: "var(--bg-surface)", 
            border: "1px solid var(--border-subtle)", borderRadius: 16, 
            padding: "20px 24px", boxShadow: "var(--shadow-sm)"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: "var(--text-secondary)" }}>
                {completed} of {total} tasks complete
              </span>
              <span style={{ fontSize: 15, fontWeight: 700, color: allDone ? "var(--success)" : "var(--accent)" }}>
                {total > 0 ? Math.round((completed / total) * 100) : 0}%
              </span>
            </div>
            <div style={{ height: 8, background: "var(--bg-muted)", borderRadius: 4, overflow: "hidden" }}>
              <div style={{
                height: "100%", borderRadius: 4,
                background: allDone ? "var(--success)" : "linear-gradient(90deg, var(--accent), var(--accent-hover))",
                width: `${total > 0 ? (completed / total) * 100 : 0}%`,
                transition: "width 500ms cubic-bezier(0.16, 1, 0.3, 1), background 300ms",
                boxShadow: "0 0 8px rgba(99,102,241,0.4)"
              }} />
            </div>
          </div>

          {/* All done state */}
          {allDone && (
            <div className="follow-through" style={{ background: "var(--success-subtle)", border: "1px solid #A7F3D0", borderRadius: 16, padding: "32px 24px", textAlign: "center", marginBottom: 32, boxShadow: "var(--shadow-md)" }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>🎊</div>
              <h2 style={{ margin: "0 0 8px", fontSize: 20, fontWeight: 700, color: "var(--text-primary)", letterSpacing: "-0.5px" }}>Done for today!</h2>
              <p style={{ margin: 0, color: "var(--text-secondary)", fontSize: 14 }}>Great work. Your progress has been saved. See you tomorrow.</p>
            </div>
          )}

          {/* Task list */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {tasks.map((task, i) => (
              <div key={task.id} className="stagger-item" style={{ animationDelay: `${i * 60}ms` }}>
                <TaskCard task={task} onToggle={toggleTask} />
              </div>
            ))}
          </div>

          {/* Streak callout */}
          <div style={{ 
            marginTop: 32, background: "linear-gradient(135deg, var(--bg-surface), var(--accent-subtle))", 
            border: "1px solid var(--accent-muted)", borderRadius: 16, 
            padding: "16px 20px", display: "flex", alignItems: "center", gap: 16,
            boxShadow: "var(--shadow-sm)"
          }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: "white", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
              <span style={{ fontSize: 20 }}>🔥</span>
            </div>
            <div>
              <p style={{ margin: 0, fontWeight: 700, fontSize: 14.5, color: "var(--text-primary)", letterSpacing: "-0.3px" }}>5-day streak</p>
              <p style={{ margin: "2px 0 0", fontSize: 13, color: "var(--text-secondary)" }}>Keep it going — complete today&apos;s tasks to maintain your streak.</p>
            </div>
          </div>

        </div>
      </main>

      <FocusTimer />

      <style>{`
        @media (max-width: 768px) { .today-main { margin-left: 0 !important; padding-bottom: 120px !important; } }
      `}</style>
    </div>
  );
}
