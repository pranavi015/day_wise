"use client";
import React, { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import TaskCard from "@/components/TaskCard";
import FocusTimer from "@/components/FocusTimer";
import { supabase } from "@/lib/supabase";
import type { Task } from "@/types";
import { Loader2, Trophy, X } from "lucide-react";
import confetti from "canvas-confetti";

export default function TodayPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [streak, setStreak] = useState(0);
  const [reviewCards, setReviewCards] = useState<{ id: string; topic_id: string; title: string; next_review_date: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [showConfetti, setShowConfetti] = useState(false);
  const [toast, setToast] = useState<{ show: boolean; text: string; streak: number } | null>(null);
  const [missedYesterday, setMissedYesterday] = useState(false);
  const [examDate, setExamDate] = useState<string | null>(null);
  const [rescheduling, setRescheduling] = useState(false);
  const [dbError, setDbError] = useState<string | null>(null);

  const todayStr = new Date().toISOString().split("T")[0];
  const todayDisplay = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

  useEffect(() => {
    async function loadData() {
      const { data: authData } = await supabase.auth.getUser();
      if (!authData?.user) {
        setLoading(false);
        return;
      }
      const userId = authData.user.id;

      // Parallel fetch using Promise.allSettled to catch schema 406s
      const promises = await Promise.allSettled([
        supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
        supabase.from("curricula").select("*").eq("user_id", userId).order("sort_order", { ascending: true }),
        supabase.from("task_completions").select("*").eq("user_id", userId),
        supabase.from("sr_cards").select("id, topic_id, next_review_date, curricula(title)").eq("user_id", userId).lte("next_review_date", todayStr)
      ]);

      for (const p of promises) {
        if (p.status === "fulfilled" && p.value.error) {
          console.error("Database schema error detected in TodayPage:", p.value.error);
          setDbError(p.value.error.message);
          setLoading(false);
          return;
        }
      }

      setDbError(null);

      const profile = promises[0].status === "fulfilled" ? promises[0].value.data : null;
      const curricula = promises[1].status === "fulfilled" ? promises[1].value.data : null;
      const completions = promises[2].status === "fulfilled" ? promises[2].value.data : null;
      const srCards = promises[3].status === "fulfilled" ? promises[3].value.data as { id: string; topic_id: string; next_review_date: string; curricula: { title: string } | null }[] | null : null;

      // P15: Exam deadline countdown
      if (profile?.exam_date) setExamDate(profile.exam_date as string);

      // P12: Missed yesterday detection
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayIso = yesterday.toISOString().split("T")[0];
      const hadYesterdayActivity = (completions as { completed_date: string }[] | null)?.some(c => c.completed_date === yesterdayIso) ?? false;
      const joinDateStr = curricula?.[0]?.created_at?.split("T")[0] || null;
      setMissedYesterday(joinDateStr !== null && !hadYesterdayActivity && yesterdayIso >= joinDateStr);

      if (srCards) {
        setReviewCards(srCards.map(c => ({
          id: c.id,
          topic_id: c.topic_id,
          title: c.curricula?.title ?? "Unknown Topic",
          next_review_date: c.next_review_date,
        })));
      }

      // Calculate Streak
      let currentStreak = 0;
      if (completions && Array.isArray(completions) && completions.length > 0) {
        const uniqueDates = Array.from(new Set(completions.map((c: { completed_date: string }) => c.completed_date))).sort((a,b) => b.localeCompare(a));
        const checkDate = new Date();
        // If today is not in there, check if yesterday is. If neither, streak is 0.
        const todayIso = checkDate.toISOString().split("T")[0];
        checkDate.setDate(checkDate.getDate() - 1);
        const yesterdayIso = checkDate.toISOString().split("T")[0];

        if (!uniqueDates.includes(todayIso) && !uniqueDates.includes(yesterdayIso)) {
          currentStreak = 0;
        } else {
          // Count backwards
          const streakIterDate = new Date();
          if (!uniqueDates.includes(todayIso)) {
             streakIterDate.setDate(streakIterDate.getDate() - 1);
          }
          while(true) {
            const iterIso = streakIterDate.toISOString().split("T")[0];
            if (uniqueDates.includes(iterIso)) {
              currentStreak++;
              streakIterDate.setDate(streakIterDate.getDate() - 1);
            } else {
              break;
            }
          }
        }
      }
      setStreak(currentStreak);

      // Task generation logic
      if (curricula && curricula.length > 0) {
        const startDate = new Date(curricula[0].created_at);
        startDate.setHours(0,0,0,0);
        const targetDate = new Date();
        targetDate.setHours(0,0,0,0);
        
        const sched = profile?.schedule_json || {};
        let currentTopicIdx = 0;
        let remainingTopicMins = curricula[currentTopicIdx].estimated_hours * 60;
        
        const iterDate = new Date(startDate);
        const generatedTasks: Task[] = [];

        while (iterDate <= targetDate && currentTopicIdx < curricula.length) {
          const dayOfWeek = iterDate.toLocaleDateString("en-US", { weekday: "short" });
          const dayMins = (sched.weekly_varies ? (sched.per_day_hours?.[dayOfWeek] || 1.5) : (sched.daily_hours || 1.5)) * 60;
          let minsLeftToday = dayMins;
          
          while (minsLeftToday > 0 && currentTopicIdx < curricula.length) {
            const allocate = Math.min(minsLeftToday, remainingTopicMins);
            
            if (iterDate.getTime() === targetDate.getTime()) {
              const topic = curricula[currentTopicIdx];
              const taskId = `${topic.id}_${todayStr}_${generatedTasks.length}`;
              const isComplete = (completions as { task_id: string }[] | null)?.some((c) => c.task_id === taskId) || false;
              
              generatedTasks.push({
                id: taskId,
                topic_id: topic.id,
                topic_name: topic.title,
                title: `Study: ${topic.title}`,
                duration_minutes: allocate,
                type: "learning",
                is_complete: isComplete,
                scheduled_date: todayStr
              });
            }
            
            minsLeftToday -= allocate;
            remainingTopicMins -= allocate;
            
            if (remainingTopicMins <= 0) {
              currentTopicIdx++;
              if (currentTopicIdx < curricula.length) {
                remainingTopicMins = curricula[currentTopicIdx].estimated_hours * 60;
              }
            }
          }
          iterDate.setDate(iterDate.getDate() + 1);
        }
        
        // If we exhausted topics but tasks is empty, add a default task
        if (generatedTasks.length === 0 && currentTopicIdx >= curricula.length) {
          // Finished curriculum
        }
        
        setTasks(generatedTasks);
      }
      setLoading(false);
    }

    loadData();
  }, [todayStr]);

  const completed = tasks.filter((t) => t.is_complete).length;
  const total = tasks.length;
  const totalMins = tasks.reduce((s, t) => s + t.duration_minutes, 0);
  const allDone = total > 0 && completed === total;

  async function toggleTask(id: string) {
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    
    const newVal = !task.is_complete;
    setTasks((prev) => prev.map((t) => t.id === id ? { ...t, is_complete: newVal } : t));

    const { data: authData } = await supabase.auth.getUser();
    if (!authData?.user) return;

    if (newVal) {
      // Check if all tasks are now done
      const newTasks = tasks.map((t) => t.id === id ? { ...t, is_complete: true } : t);
      const isNowAllDone = newTasks.length > 0 && newTasks.every(t => t.is_complete);
      
      if (isNowAllDone) {
        setShowConfetti(true);
        confetti({
          particleCount: 150,
          spread: 70,
          origin: { y: 0.6 },
          colors: ["#6366F1", "#10B981", "#F59E0B"]
        });
        setTimeout(() => setShowConfetti(false), 3000);

        // Milestone check (mock logic: increment streak locally for check)
        const newStreak = streak; // In real app, we'd wait for DB but let's celebrate now
        if ([7, 30, 100].includes(newStreak)) {
           setToast({ show: true, text: "Milestone Reached!", streak: newStreak });
           setTimeout(() => setToast(null), 4000);
        }
      }

      // Mark complete
      const { error } = await supabase.from("task_completions").insert({
        user_id: authData.user.id,
        task_id: id,
        topic_id: task.topic_id,
        completed_date: todayStr
      }).select().single();
      
      if (error) {
        console.error("Failed to mark task complete:", error);
        setToast({ show: true, text: "Error saving task completion.", streak: streak });
        setTimeout(() => setToast(null), 4000);
      }
    } else {
      // Mark incomplete
      const { error } = await supabase.from("task_completions").delete()
        .eq("user_id", authData.user.id)
        .eq("task_id", id)
        .eq("completed_date", todayStr);
        
      if (error) {
        console.error("Failed to mark task incomplete:", error);
        setToast({ show: true, text: "Error updating task.", streak: streak });
        setTimeout(() => setToast(null), 4000);
      }
    }
  }

  async function handleReschedule() {
    setRescheduling(true);
    const { data: authData } = await supabase.auth.getUser();
    if (!authData?.user) { setRescheduling(false); return; }

    const { data: curricula } = await supabase.from("curricula").select("id, title, week_number, estimated_hours").eq("user_id", authData.user.id);
    if (!curricula) { setRescheduling(false); return; }

    const missedTasks = tasks.filter(t => !t.is_complete).map(t => ({ topic_name: t.topic_name, topic_id: t.topic_id, duration_minutes: t.duration_minutes }));
    const maxWeek = Math.max(...curricula.map((c: { week_number: number }) => c.week_number), 1);

    const res = await fetch("/api/reschedule", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ missed_tasks: missedTasks, remaining_weeks: maxWeek, topics: curricula }),
    });

    const data = await res.json() as { updates?: { topic_id: string; new_week_number: number }[]; summary?: string };
    if (data.updates) {
      for (const upd of data.updates) {
        await supabase.from("curricula").update({ week_number: upd.new_week_number }).eq("id", upd.topic_id);
      }
      setMissedYesterday(false);
      if (data.summary) {
        setToast({ show: true, text: data.summary, streak: 0 });
        setTimeout(() => setToast(null), 5000);
      }
    }
    setRescheduling(false);
  }

  if (loading) {
     return <div style={{ minHeight: "100vh", background: "var(--bg-base)", display: "flex", alignItems: "center", justifyContent: "center" }}><Loader2 className="animate-spin text-indigo-500" size={32} /></div>;
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--bg-base)" }}>
      <Sidebar />
      
      {/* Diagnostic Database Guard */}
      {dbError && (
        <div style={{ position: "fixed", inset: 0, zIndex: 9999, background: "rgba(15, 23, 42, 0.8)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: "var(--bg-surface)", border: "1px solid var(--error)", padding: 40, borderRadius: 24, maxWidth: 500, textAlign: "center", boxShadow: "0 24px 48px rgba(0,0,0,0.3)", animation: "fadeInUp 0.4s ease-out" }}>
            <div style={{ width: 64, height: 64, borderRadius: "50%", background: "var(--error-subtle)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px" }}>
              <span style={{ fontSize: 32 }}>⚠️</span>
            </div>
            <h2 style={{ fontSize: 24, fontWeight: 700, margin: "0 0 12px", color: "var(--text-primary)" }}>Database Sync Failed</h2>
            <p style={{ fontSize: 15, color: "var(--text-secondary)", lineHeight: 1.6, marginBottom: 24 }}>
              The application is attempting to read required tables that do not exist or are misconfigured in your database.
            </p>
            <div style={{ background: "var(--bg-muted)", padding: 16, borderRadius: 12, textAlign: "left", fontSize: 13, color: "var(--error)", fontFamily: "monospace", overflowX: "auto", marginBottom: 32, border: "1px dashed var(--error-muted)" }}>
              {dbError}
            </div>
            <p style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)", marginBottom: 12 }}>👉 Fix Action Required:</p>
            <p style={{ fontSize: 13, color: "var(--text-tertiary)" }}>Please open the <code>supabase_schema.sql</code> file, copy its contents, and execute it within your Supabase project&apos;s SQL Editor immediately.</p>
          </div>
        </div>
      )}

      {/* Main content */}
      <main style={{ marginLeft: 224, flex: 1, paddingBottom: 80 }} className="today-main">
        <div style={{ maxWidth: 720, margin: "0 auto", padding: "40px 32px" }}>

          {/* P15: Exam countdown chip */}
          {examDate && (() => {
            const daysLeft = Math.max(0, Math.ceil((new Date(examDate).getTime() - Date.now()) / 86400000));
            return (
              <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: daysLeft <= 7 ? "var(--error-subtle)" : "var(--accent-subtle)", border: `1px solid ${daysLeft <= 7 ? "var(--error)" : "var(--accent-muted)"}`, borderRadius: 20, padding: "4px 12px", fontSize: 12, fontWeight: 700, color: daysLeft <= 7 ? "var(--error)" : "var(--accent)", marginBottom: 12 }}>
                🎯 {daysLeft} day{daysLeft !== 1 ? "s" : ""} to exam
              </div>
            );
          })()}

          {/* P12: Missed day banner */}
          {missedYesterday && (
            <div style={{ background: "var(--warning-subtle)", border: "1px solid #FCD34D", borderRadius: 14, padding: "14px 18px", marginBottom: 20, display: "flex", alignItems: "center", gap: 14, boxShadow: "var(--shadow-sm)" }}>
              <span style={{ fontSize: 22 }}>📅</span>
              <div style={{ flex: 1 }}>
                <p style={{ margin: 0, fontWeight: 700, fontSize: 14, color: "var(--text-primary)" }}>You missed yesterday</p>
                <p style={{ margin: "2px 0 0", fontSize: 12.5, color: "var(--text-secondary)" }}>Want me to redistribute your schedule?</p>
              </div>
              <button
                onClick={handleReschedule}
                disabled={rescheduling}
                style={{ padding: "8px 16px", borderRadius: 10, border: "none", background: "var(--warning)", color: "white", fontWeight: 600, fontSize: 13, cursor: rescheduling ? "wait" : "pointer", whiteSpace: "nowrap" }}
              >
                {rescheduling ? "Rescheduling..." : "Reschedule"}
              </button>
              <button onClick={() => setMissedYesterday(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-tertiary)", padding: 4 }}><X size={14} /></button>
            </div>
          )}
          <div style={{ marginBottom: 32 }}>
            <p style={{ margin: "0 0 6px", fontSize: 13.5, color: "var(--text-tertiary)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>{todayDisplay}</p>
            <h1 style={{ margin: 0, fontSize: 32, fontWeight: 700, color: "var(--text-primary)", letterSpacing: "-0.8px" }}>
              {allDone ? "All done for today 🎉" : "Today's Focus"}
            </h1>
            <p style={{ margin: "8px 0 0", fontSize: 14.5, color: "var(--text-secondary)" }}>
              {Math.floor(totalMins / 60)}h {Math.round(totalMins % 60)}m planned across {total} tasks
            </p>
          </div>

          {/* Progress widget */}
          <div style={{ 
            marginBottom: 32, background: "var(--bg-surface)", 
            border: "1px solid var(--border-subtle)", borderRadius: 16, 
            padding: "20px 24px", boxShadow: "var(--shadow-sm)"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: "var(--text-secondary)", display: "flex", justifyContent: "space-between", width: "100%" }}>
                <span>{completed} of {total} tasks complete</span>
                <span style={{ fontSize: 15, fontWeight: 700, color: allDone ? "var(--success)" : "var(--accent)" }}>
                  {total > 0 ? Math.round((completed / total) * 100) : 0}%
                </span>
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
          {allDone && total > 0 && (
            <div className="follow-through" style={{ background: "var(--success-subtle)", border: "1px solid #A7F3D0", borderRadius: 16, padding: "32px 24px", textAlign: "center", marginBottom: 32, boxShadow: "var(--shadow-md)" }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>🎊</div>
              <h2 style={{ margin: "0 0 8px", fontSize: 20, fontWeight: 700, color: "var(--text-primary)", letterSpacing: "-0.5px" }}>Done for today!</h2>
              <p style={{ margin: 0, color: "var(--text-secondary)", fontSize: 14 }}>Great work. Your progress has been saved. See you tomorrow.</p>
            </div>
          )}
          
          {total === 0 && (
            <div style={{ background: "var(--bg-surface)", border: "1px dashed var(--border-strong)", borderRadius: 16, padding: "48px 24px", textAlign: "center", marginBottom: 32 }}>
               <h2 style={{ margin: "0 0 8px", fontSize: 18, fontWeight: 600, color: "var(--text-primary)", letterSpacing: "-0.3px" }}>No tasks scheduled</h2>
               <p style={{ margin: 0, color: "var(--text-secondary)", fontSize: 14 }}>You are completely caught up, or your curriculum hasn&apos;t started.</p>
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

          {/* Reviews Due (P9) */}
          {reviewCards.length > 0 && (
            <div style={{ marginTop: 40 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--warning)" }} />
                <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "var(--text-primary)" }}>Reviews Due</h2>
                <span style={{ fontSize: 12, background: "var(--warning-subtle)", color: "var(--warning)", borderRadius: 10, padding: "2px 8px", fontWeight: 700 }}>{reviewCards.length}</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {reviewCards.map((card) => (
                  <div key={card.id} style={{ background: "var(--bg-surface)", border: "1px solid var(--warning-subtle)", borderRadius: 12, padding: "14px 16px", display: "flex", alignItems: "center", gap: 14, boxShadow: "var(--shadow-sm)" }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: "var(--warning-subtle)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>🔁</div>
                    <div style={{ flex: 1 }}>
                      <p style={{ margin: 0, fontWeight: 600, fontSize: 14, color: "var(--text-primary)" }}>{card.title}</p>
                      <p style={{ margin: "2px 0 0", fontSize: 12, color: "var(--text-tertiary)" }}>Due: {card.next_review_date}</p>
                    </div>
                    <button
                      onClick={() => window.open(`/roadmap`, "_self")}
                      style={{ fontSize: 12, fontWeight: 600, color: "var(--warning)", background: "var(--warning-subtle)", border: "1px solid #FCD34D", borderRadius: 6, padding: "6px 12px", cursor: "pointer" }}
                    >
                      Review →
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

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
              <p style={{ margin: 0, fontWeight: 700, fontSize: 14.5, color: "var(--text-primary)", letterSpacing: "-0.3px" }}>{streak}-day streak</p>
              <p style={{ margin: "2px 0 0", fontSize: 13, color: "var(--text-secondary)" }}>Keep it going — complete today&apos;s tasks to maintain your streak.</p>
            </div>
          </div>

        </div>
      </main>

      <FocusTimer activeTopicId={tasks.length > 0 ? tasks[0].topic_id : undefined} />

      {/* FULL SCREEN CELEBRATION */}
      {showConfetti && (
        <div style={{ position: "fixed", inset: 0, zIndex: 1000, pointerEvents: "none", display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(99,102,241,0.05)", animation: "fadeIn 0.5s ease-out forwards" }}>
          <div className="follow-through" style={{ background: "white", padding: "40px 60px", borderRadius: 32, boxShadow: "var(--shadow-xl)", textAlign: "center", border: "2px solid var(--accent-subtle)" }}>
             <div style={{ fontSize: 80, marginBottom: 20 }}>🏆</div>
             <h2 style={{ fontSize: 32, fontWeight: 800, color: "var(--text-primary)", margin: "0 0 12px" }}>Daily Goal Hit!</h2>
             <p style={{ fontSize: 18, color: "var(--text-secondary)" }}>You&apos;ve completed all your tasks. See you tomorrow!</p>
          </div>
        </div>
      )}

      {/* STREAK TOAST */}
      {toast && (
        <div className="toast-box" style={{ position: "fixed", bottom: 40, left: "50%", transform: "translateX(-50%)", zIndex: 1100, display: "flex", alignItems: "center", gap: 16, background: "var(--sidebar-bg)", color: "white", padding: "16px 24px", borderRadius: 16, boxShadow: "var(--shadow-xl)", border: "1px solid var(--sidebar-border)" }}>
           <div style={{ width: 44, height: 44, borderRadius: 12, background: "rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Trophy color="var(--warning)" size={24} />
           </div>
           <div style={{ flex: 1 }}>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "var(--warning)" }}>STREAK MILESTONE</p>
              <p style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>Unstoppable! {toast.streak} day streak reached.</p>
           </div>
           <button onClick={() => setToast(null)} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.4)", cursor: "pointer", padding: 4 }}>
              <X size={18} />
           </button>
        </div>
      )}

      <style>{`
        @media (max-width: 768px) { .today-main { margin-left: 0 !important; padding-bottom: 120px !important; } }
      `}</style>
    </div>
  );
}
