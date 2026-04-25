"use client";
import React, { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import TaskCard from "@/components/TaskCard";
import FocusTimer from "@/components/FocusTimer";
import { supabase } from "@/lib/supabase";
import type { Task } from "@/types";
import { Loader2 } from "lucide-react";

export default function TodayPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [streak, setStreak] = useState(0);
  const [loading, setLoading] = useState(true);

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

      // Parallel fetch
      const results = await Promise.all([
        supabase.from("profiles").select("*").eq("id", userId).single(),
        supabase.from("curricula").select("*").eq("user_id", userId).order("sort_order", { ascending: true }),
        supabase.from("task_completions").select("*").eq("user_id", userId)
      ]) as any[];

      const profile = results[0].data;
      const curricula = results[1].data;
      const completions = results[2].data;

      // Calculate Streak
      let currentStreak = 0;
      if (completions && Array.isArray(completions) && completions.length > 0) {
        const uniqueDates = Array.from(new Set(completions.map((c: { completed_date: string }) => c.completed_date))).sort((a,b) => b.localeCompare(a));
        let checkDate = new Date();
        // If today is not in there, check if yesterday is. If neither, streak is 0.
        const todayIso = checkDate.toISOString().split("T")[0];
        checkDate.setDate(checkDate.getDate() - 1);
        const yesterdayIso = checkDate.toISOString().split("T")[0];

        if (!uniqueDates.includes(todayIso) && !uniqueDates.includes(yesterdayIso)) {
          currentStreak = 0;
        } else {
          // Count backwards
          let streakIterDate = new Date();
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
      if (curricula && curricula.length > 0 && profile) {
        const startDate = new Date(curricula[0].created_at);
        startDate.setHours(0,0,0,0);
        const targetDate = new Date();
        targetDate.setHours(0,0,0,0);
        
        const sched = profile.schedule_json || {};
        let currentTopicIdx = 0;
        let remainingTopicMins = curricula[currentTopicIdx].estimated_hours * 60;
        
        let iterDate = new Date(startDate);
        let generatedTasks: Task[] = [];

        while (iterDate <= targetDate && currentTopicIdx < curricula.length) {
          const dayOfWeek = iterDate.toLocaleDateString("en-US", { weekday: "short" });
          const dayMins = (sched.weekly_varies ? (sched.per_day_hours?.[dayOfWeek] || 1.5) : (sched.daily_hours || 1.5)) * 60;
          let minsLeftToday = dayMins;
          
          while (minsLeftToday > 0 && currentTopicIdx < curricula.length) {
            const allocate = Math.min(minsLeftToday, remainingTopicMins);
            
            if (iterDate.getTime() === targetDate.getTime()) {
              const topic = curricula[currentTopicIdx];
              const taskId = `${topic.id}_${todayStr}_${generatedTasks.length}`;
              const isComplete = (completions as any[])?.some((c: any) => c.task_id === taskId) || false;
              
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
      // Mark complete
      await supabase.from("task_completions").insert({
        user_id: authData.user.id,
        task_id: id,
        topic_id: task.topic_id,
        completed_date: todayStr
      }).select().single();
    } else {
      // Mark incomplete
      await supabase.from("task_completions").delete()
        .eq("user_id", authData.user.id)
        .eq("task_id", id)
        .eq("completed_date", todayStr);
    }
  }

  if (loading) {
     return <div style={{ minHeight: "100vh", background: "var(--bg-base)", display: "flex", alignItems: "center", justifyContent: "center" }}><Loader2 className="animate-spin text-indigo-500" size={32} /></div>;
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--bg-base)" }}>
      <Sidebar />

      {/* Main content */}
      <main style={{ marginLeft: 224, flex: 1, paddingBottom: 80 }} className="today-main">
        <div style={{ maxWidth: 720, margin: "0 auto", padding: "40px 32px" }}>

          {/* Header */}
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

      <style>{`
        @media (max-width: 768px) { .today-main { margin-left: 0 !important; padding-bottom: 120px !important; } }
      `}</style>
    </div>
  );
}
