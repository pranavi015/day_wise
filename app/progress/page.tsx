"use client";
import React, { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import { TrendingUp, Flame, BookOpen, Target, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function ProgressPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    completionRate: 0,
    streak: 0,
    topicsMastered: 0,
    adherenceRate: 0
  });
  const [dailyData, setDailyData] = useState<{ date: string; minutes_planned: number; minutes_spent: number; is_past: boolean; is_active_day: boolean }[]>([]);
  const [topicData, setTopicData] = useState<{ name: string; mins: number }[]>([]);
  const [heatmapData, setHeatmapData] = useState<Record<string, number>>({});
  const [coachSummary, setCoachSummary] = useState<string | null>(null);
  const [coachLoading, setCoachLoading] = useState(false);
  const [burnoutScore, setBurnoutScore] = useState<number | null>(null);
  const [moodData, setMoodData] = useState<{ date: string; mood: number; completion: number }[]>([]);

  useEffect(() => {
    async function fetchProgress() {
      const { data: authData } = await supabase.auth.getUser();
      if (!authData?.user) {
        setLoading(false);
        return;
      }
      const userId = authData.user.id;

      // Parallel Data Fetching
      const startOfYear = new Date(new Date().getFullYear(), 0, 1).toISOString();
      const results = await Promise.all([
        supabase.from("profiles").select("schedule_json, created_at").eq("id", userId).maybeSingle(),
        supabase.from("task_completions").select("*").eq("user_id", userId),
        supabase.from("focus_sessions").select("*").eq("user_id", userId).gte("completed_at", startOfYear),
        supabase.from("curricula").select("*").eq("user_id", userId),
        supabase.from("mood_logs").select("mood_score, logged_at").eq("user_id", userId).gte("logged_at", new Date(Date.now() - 30 * 86400000).toISOString())
      ]);

      const profile = results[0].data;
      const completions = results[1].data;
      const sessions = results[2].data;
      const curricula = results[3].data;
      const moodLogs = results[4].data as { mood_score: number; logged_at: string }[] | null;

      const sched = profile?.schedule_json || {};

      const startDateStr = (curricula && curricula.length > 0) ? curricula[0].created_at : (profile?.created_at || new Date().toISOString());
      const startDate = new Date(startDateStr);
      startDate.setHours(0, 0, 0, 0);

      // 1. Calculate Streak
      let currentStreak = 0;
      if (completions && Array.isArray(completions) && completions.length > 0) {
        const uniqueDates = Array.from(new Set(completions.map((c: { completed_date: string }) => c.completed_date))).sort((a,b) => b.localeCompare(a));
        const checkDate = new Date();
        const todayIso = checkDate.toISOString().split("T")[0];
        checkDate.setDate(checkDate.getDate() - 1);
        const yesterdayIso = checkDate.toISOString().split("T")[0];

        if (uniqueDates.includes(todayIso) || uniqueDates.includes(yesterdayIso)) {
          const streakIterDate = new Date();
          if (!uniqueDates.includes(todayIso)) streakIterDate.setDate(streakIterDate.getDate() - 1);
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

      // 2. Build Daily Aggregates (Last 7 Days)
      const last7Days: { date: string; minutes_planned: number; minutes_spent: number; is_past: boolean; is_active_day: boolean }[] = [];
      const topicMinsMap: Record<string, number> = {};

      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateIso = d.toISOString().split("T")[0];
        const dayOfWeek = d.toLocaleDateString("en-US", { weekday: "short" });
        d.setHours(0, 0, 0, 0);
        
        let plannedMins = 0;
        if (d >= startDate) {
          if (sched.weekly_varies) {
            plannedMins = (sched.per_day_hours?.[dayOfWeek] || 0) * 60;
          } else {
            plannedMins = (sched.daily_hours || 0) * 60;
          }
        }

        // Sessions on this date
        const daySessions = sessions?.filter(s => s.completed_at.startsWith(dateIso)) || [];
        const spentMins = daySessions.reduce((sum, s) => sum + s.duration_minutes, 0);

        // Aggregate Topic Times
        daySessions.forEach(s => {
          if (s.topic_id) {
            topicMinsMap[s.topic_id] = (topicMinsMap[s.topic_id] || 0) + s.duration_minutes;
          }
        });

        last7Days.push({
          date: dayOfWeek,
          minutes_planned: plannedMins,
          minutes_spent: spentMins,
          is_past: i > 0,
          is_active_day: d >= startDate
        });
      }

      setDailyData(last7Days);

      // 3. Map Topic Data
      const topicArray = Object.keys(topicMinsMap).map((tid) => {
        const topic = curricula?.find(c => c.id === tid);
        return {
          name: topic ? topic.title : "Unknown Concept",
          mins: topicMinsMap[tid]
        };
      }).sort((a,b) => b.mins - a.mins).slice(0, 4); // Top 4
      
      setTopicData(topicArray);

      // Yearly heatmap data (Task Completions)
      const heatmap: Record<string, number> = {};
      (completions as { completed_date: string }[] | null)?.forEach(c => {
        const d = c.completed_date;
        if (d) {
          heatmap[d] = (heatmap[d] || 0) + 1;
        }
      });
      setHeatmapData(heatmap);

      // 4. Calculate course completion rate
      const totalTopics = curricula?.length || 0;
      
      const completedTopicIds = new Set(
        (completions as { task_id: string; topic_id?: string }[] || []).map(c => c.topic_id || c.task_id)
      );
      
      const completedTopicsCount = curricula?.filter(c => completedTopicIds.has(c.id)).length || 0;
      const finalCompletionRate = totalTopics === 0 ? 0 : Math.min(Math.round((completedTopicsCount / totalTopics) * 100), 100);

      // 5. Set final stats
      const totalPlanned = last7Days.reduce((a,b)=>a+b.minutes_planned,0);
      const totalSpent = last7Days.reduce((a,b)=>a+b.minutes_spent,0);
      const adherence = totalPlanned > 0 ? Math.min(Math.round((totalSpent / totalPlanned) * 100), 100) : 0;

      setStats({
        completionRate: finalCompletionRate,
        streak: currentStreak,
        topicsMastered: 0,
        adherenceRate: adherence
      });

      // Burnout Risk Score (P13)
      const trackedDaysCount = last7Days.filter(d => d.is_active_day).length;
      const actualTrackedDays = last7Days.filter(d => d.minutes_spent > 0).length;
      if (totalPlanned > 0 && actualTrackedDays >= 3) {
        const validTrackedDays = Math.max(1, trackedDaysCount);
        const missedDays = last7Days.filter(d => d.minutes_spent === 0 && d.minutes_planned > 0 && d.is_past).length;
        const overStudying = adherence > 130 ? 20 : 0;
        
        const rawBurnout = Math.min(100, Math.round((
          (1 - Math.min(adherence / 100, 1)) * 40 +
          (missedDays / validTrackedDays) * 40 +
          overStudying
        )));
        setBurnoutScore(rawBurnout);
      } else {
        setBurnoutScore(null); // Explicit Empty State
      }

      // Mood vs Completion (P14)
      if (moodLogs && moodLogs.length > 0) {
        const moodByDate: Record<string, number[]> = {};
        moodLogs.forEach(m => {
          const d = m.logged_at.split("T")[0];
          if (!moodByDate[d]) moodByDate[d] = [];
          moodByDate[d].push(m.mood_score);
        });
        const moodPoints = Object.entries(moodByDate).map(([date, scores]) => {
          const avgMood = scores.reduce((a, b) => a + b, 0) / scores.length;
          const dayCompletions = (completions as { completed_date: string }[])?.filter(c => c.completed_date === date).length ?? 0;
          return { date, mood: Math.round(avgMood * 10) / 10, completion: dayCompletions };
        }).sort((a, b) => a.date.localeCompare(b.date)).slice(-14);
        setMoodData(moodPoints);
      }

      setLoading(false);
    }
    fetchProgress();
  }, []);

  const statCards = [
    { label: "Completion Rate", value: `${stats.completionRate}%`, trend: "up", icon: Target, color: "var(--accent)" },
    { label: "Current Streak", value: `${stats.streak} days`, trend: "up", icon: Flame, color: "var(--warning)" },
    { label: "Topics Mastered", value: `${stats.topicsMastered}`, trend: "neutral", icon: BookOpen, color: "var(--success)" },
    { label: "Adherence Rate", value: `${stats.adherenceRate}%`, trend: "up", icon: TrendingUp, color: "var(--accent)" },
  ];

  const maxMins = Math.max(...dailyData.map((d) => Math.max(d.minutes_planned, d.minutes_spent)), 60);

  async function generateCoach() {
    const { data: authData } = await supabase.auth.getUser();
    if (!authData?.user) return;
    setCoachLoading(true);
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    const weekStartStr = weekStart.toISOString().split("T")[0];

    // Check cache first
    const { data: cached } = await supabase.from("weekly_summaries").select("summary_text").eq("user_id", authData.user.id).eq("week_start", weekStartStr).single();
    if (cached?.summary_text) {
      setCoachSummary(cached.summary_text);
      setCoachLoading(false);
      return;
    }

    const res = await fetch("/api/coach", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id: authData.user.id,
        topics_completed: topicData.map(t => t.name),
        total_focus_minutes: dailyData.reduce((a, b) => a + b.minutes_spent, 0),
        quiz_scores: [],
        missed_days: dailyData.filter(d => d.minutes_spent === 0 && d.minutes_planned > 0).length,
      }),
    });
    const data = await res.json() as { summary?: string };
    if (data.summary) setCoachSummary(data.summary);
    setCoachLoading(false);
  }

  if (loading) {
     return <div style={{ minHeight: "100vh", background: "var(--bg-base)", display: "flex", alignItems: "center", justifyContent: "center" }}><Loader2 className="animate-spin text-indigo-500" size={32} /></div>;
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--bg-base)" }}>
      <Sidebar />

      <main style={{ flex: 1, paddingBottom: 40, marginLeft: 224 }} className="progress-main">
        <div style={{ maxWidth: 760, margin: "0 auto", padding: "40px 32px" }}>

          {/* Header */}
          <div style={{ marginBottom: 32 }}>
            <h1 style={{ margin: "0 0 8px", fontSize: 32, fontWeight: 700, color: "var(--text-primary)", letterSpacing: "-0.8px" }}>Your Progress</h1>
            <p style={{ margin: 0, fontSize: 14.5, color: "var(--text-secondary)" }}>Activity Overview</p>
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
                {dailyData.reduce((a,b)=>a+b.minutes_planned,0) === 0 ? "You haven't planned any tasks for this week yet. Set up your curriculum to begin!" : 
                 (dailyData.filter(d => d.is_active_day).length <= 1 && dailyData.reduce((a,b)=>a+b.minutes_spent,0) === 0) ? "Welcome to Day 1! Complete your first focus session today to kickstart your journey." :
                 stats.adherenceRate > 80 ? "Outstanding adherence! Keep up this exact pacing to hit your goal effortlessly." : 
                 "A bit behind schedule this week. Consider adjusting your goals to a more relaxed pace if you feel overwhelmed."}
              </p>
            </div>
          </div>

          {/* Activity Heatmap */}
          <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border-subtle)", borderRadius: 16, padding: "24px", marginBottom: 32, boxShadow: "var(--shadow-sm)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
               <h2 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: "var(--text-primary)" }}>Activity Heatmap</h2>
               <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                 <span style={{ fontSize: 11, color: "var(--text-tertiary)" }}>Less</span>
                 {[0, 1, 2, 3, 4].map(l => (
                   <div key={l} style={{ width: 10, height: 10, borderRadius: 2, background: l === 0 ? "var(--bg-muted)" : `rgba(99,102,241, ${0.2 + l * 0.2})` }} />
                 ))}
                 <span style={{ fontSize: 11, color: "var(--text-tertiary)" }}>More</span>
               </div>
            </div>
            
            <div style={{ 
              display: "grid", 
              gridTemplateColumns: "repeat(53, 1fr)", 
              gap: 3, 
              overflowX: "auto", 
              paddingBottom: 8 
            }} className="custom-scroll">
              {Array.from({ length: 53 * 7 }).map((_, i) => {
                const date = new Date(new Date().getFullYear(), 0, 1);
                date.setDate(date.getDate() + i);
                const iso = date.toISOString().split("T")[0];
                const tasksCount = heatmapData[iso] || 0;
                const isFuture = date > new Date();
                
                let level = 0;
                if (tasksCount > 0) level = 1;
                if (tasksCount >= 3) level = 2;
                if (tasksCount >= 5) level = 3;
                if (tasksCount >= 7) level = 4;
                
                const colors = ["var(--bg-muted)", "rgba(99,102,241, 0.2)", "rgba(99,102,241, 0.4)", "rgba(99,102,241, 0.7)", "rgba(99,102,241, 1)"];
                
                return (
                  <div key={i} title={`${iso}: ${tasksCount} task${tasksCount !== 1 ? 's' : ''} completed`} style={{ 
                    aspectRatio: "1/1", 
                    borderRadius: 2, 
                    background: isFuture ? "transparent" : colors[level],
                    border: isFuture ? "1px solid var(--border-subtle)" : "none",
                    minWidth: 10
                  }} />
                );
              })}
            </div>
          </div>

          {/* Stat cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 16, marginBottom: 32 }} className="stat-grid">
            {statCards.map(({ label, value, icon: Icon, color }, i) => (
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
              </div>
            ))}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 24 }} className="charts-grid">
            {/* Bar chart */}
            <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border-subtle)", borderRadius: 16, padding: "24px", boxShadow: "var(--shadow-sm)" }}>
              <h2 style={{ margin: "0 0 24px", fontSize: 16, fontWeight: 600, color: "var(--text-primary)" }}>Planned vs Actual</h2>

              <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height: 140 }}>
                {dailyData.map((day, i) => (
                  <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
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
                  <span style={{ fontSize: 13, color: "var(--text-secondary)", fontWeight: 500 }}>Planned {dailyData.reduce((a,b)=>a+b.minutes_planned,0)}m</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 12, height: 12, borderRadius: 3, background: "var(--accent)" }} />
                  <span style={{ fontSize: 13, color: "var(--text-secondary)", fontWeight: 500 }}>Actual {dailyData.reduce((a,b)=>a+b.minutes_spent,0)}m</span>
                </div>
              </div>
            </div>

            {/* Topic breakdown */}
            <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border-subtle)", borderRadius: 16, padding: "24px", boxShadow: "var(--shadow-sm)" }}>
              <h2 style={{ margin: "0 0 20px", fontSize: 16, fontWeight: 600, color: "var(--text-primary)" }}>Time by Topic</h2>
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {topicData.length > 0 ? topicData.map((topic, idx) => {
                  const colors = ["var(--accent)", "#8B5CF6", "#C4B5FD", "#FCD34D"];
                  const maxTopicMins = Math.max(...topicData.map(t => t.mins), 1);
                  return (
                  <div key={idx}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                      <span style={{ fontSize: 13.5, fontWeight: 600, color: "var(--text-secondary)" }}>{topic.name}</span>
                      <span style={{ fontSize: 12.5, color: "var(--text-tertiary)", fontWeight: 500 }}>{topic.mins}m</span>
                    </div>
                    <div style={{ height: 8, background: "var(--bg-muted)", borderRadius: 4, overflow: "hidden" }}>
                      <div style={{ height: "100%", background: colors[idx % colors.length], borderRadius: 4, width: `${(topic.mins / maxTopicMins) * 100}%`, transition: "width 800ms cubic-bezier(0.16, 1, 0.3, 1)" }} />
                    </div>
                  </div>
                )}) : (
                   <p style={{ color: "var(--text-tertiary)", fontSize: 14 }}>No data for this week yet. Complete a focus session to see insights.</p>
                )}
              </div>
            </div>
          </div>

          {/* P11 — AI Weekly Coach */}
          <div style={{ background: "var(--sidebar-bg)", borderRadius: 20, padding: 28, marginTop: 32, boxShadow: "0 8px 24px rgba(0,0,0,0.15)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: coachSummary ? 20 : 0 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: "rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>🧑‍🏫</div>
              <div style={{ flex: 1 }}>
                <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: "var(--sidebar-text)", textTransform: "uppercase", letterSpacing: "0.08em" }}>AI Weekly Coach</p>
                <p style={{ margin: "2px 0 0", fontSize: 14, color: "var(--sidebar-active-text)", fontWeight: 500 }}>Your personalized weekly summary</p>
              </div>
              <button
                onClick={generateCoach}
                disabled={coachLoading}
                style={{ padding: "8px 16px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.15)", background: "rgba(255,255,255,0.08)", color: "var(--sidebar-active-text)", fontWeight: 600, fontSize: 13, cursor: coachLoading ? "wait" : "pointer", display: "flex", alignItems: "center", gap: 6, whiteSpace: "nowrap" }}
              >
                {coachLoading ? "Generating..." : coachSummary ? "Refresh" : "Generate"}
              </button>
            </div>
            {coachSummary && (
              <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: 20 }}>
                {coachSummary.split("\n").filter(p => p.trim()).map((para, i) => (
                  <p key={i} style={{ margin: i > 0 ? "14px 0 0" : 0, fontSize: 14, color: "var(--sidebar-active-text)", lineHeight: 1.7, opacity: 0.9 }}>{para}</p>
                ))}
              </div>
            )}
          </div>

          {/* P13 — Burnout Risk Gauge */}
          <div style={{ background: "linear-gradient(135deg, var(--bg-surface), var(--bg-subtle))", border: "1px solid var(--border-subtle)", borderRadius: 24, padding: "32px", marginTop: 32, boxShadow: "var(--shadow-md)", display: "flex", alignItems: "center", gap: 40 }}>
            {burnoutScore !== null ? (
              <>
                <div style={{ position: "relative", width: 140, height: 80, flexShrink: 0 }}>
                  {(() => {
                    const r = 60;
                    const arcLen = Math.PI * r;
                    const filled = (burnoutScore / 100) * arcLen;
                    const color = burnoutScore < 35 ? "#10B981" : burnoutScore < 65 ? "#F59E0B" : "#EF4444";
                    return (
                      <svg viewBox="0 0 140 80" width="140" height="80">
                        <path d="M 10 70 A 60 60 0 0 1 130 70" fill="none" stroke="var(--bg-muted)" strokeWidth="12" strokeLinecap="round" />
                        <path d="M 10 70 A 60 60 0 0 1 130 70" fill="none" stroke={color} strokeWidth="12" strokeLinecap="round"
                          strokeDasharray={`${filled} ${arcLen}`} style={{ transition: "stroke-dasharray 800ms cubic-bezier(0.16,1,0.3,1)" }} />
                        <text x="70" y="60" textAnchor="middle" fontSize="26" fontWeight="800" fill={color}>{burnoutScore}</text>
                        <text x="70" y="76" textAnchor="middle" fontSize="10" fontWeight="700" fill="var(--text-tertiary)">/ 100</text>
                      </svg>
                    );
                  })()}
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ margin: "0 0 8px", fontSize: 13, fontWeight: 800, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "1px" }}>Wellbeing Score</p>
                  <p style={{ margin: "0 0 12px", fontSize: 24, fontWeight: 800, color: burnoutScore < 35 ? "var(--success)" : burnoutScore < 65 ? "var(--warning)" : "var(--error)", letterSpacing: "-0.5px" }}>
                    {burnoutScore < 35 ? "On Track & Healthy" : burnoutScore < 65 ? "Moderate Risk" : "High Burnout Risk"}
                  </p>
                  <p style={{ margin: 0, fontSize: 15, color: "var(--text-secondary)", lineHeight: 1.6 }}>
                    {burnoutScore < 35 ? "You're consistently hitting goals without overworking. Perfect pacing!" : burnoutScore < 65 ? "You've missed a few sessions recently. Try adjusting your daily goals for better consistency." : "High burnout risk detected. You form habits best when rested. Take a proper day off."}
                  </p>
                </div>
              </>
            ) : (
              <div style={{ display: "flex", gap: 40, alignItems: "center", opacity: 0.8 }}>
                <div style={{ position: "relative", width: 140, height: 80, flexShrink: 0 }}>
                  <svg viewBox="0 0 140 80" width="140" height="80">
                    <path d="M 10 70 A 60 60 0 0 1 130 70" fill="none" stroke="var(--bg-muted)" strokeWidth="12" strokeLinecap="round" />
                    <text x="70" y="64" textAnchor="middle" fontSize="24" fontWeight="800" fill="var(--text-tertiary)">N / A</text>
                  </svg>
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ margin: "0 0 8px", fontSize: 13, fontWeight: 800, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "1px" }}>Wellbeing Score</p>
                  <p style={{ margin: "0 0 12px", fontSize: 24, fontWeight: 800, color: "var(--text-primary)", letterSpacing: "-0.5px" }}>Getting started</p>
                  <p style={{ margin: 0, fontSize: 15, color: "var(--text-secondary)", lineHeight: 1.6 }}>
                    Complete a few sessions to unlock insights
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* P14 — Mood vs Completion Chart */}
          {moodData.length > 0 && (
            <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border-subtle)", borderRadius: 20, padding: 28, marginTop: 32, boxShadow: "var(--shadow-sm)" }}>
              <h2 style={{ margin: "0 0 6px", fontSize: 16, fontWeight: 600, color: "var(--text-primary)" }}>Mood vs Completion</h2>
              <p style={{ margin: "0 0 20px", fontSize: 13, color: "var(--text-tertiary)" }}>Your energy levels correlated with tasks completed</p>
              <div style={{ display: "flex", alignItems: "flex-end", gap: 8, overflowX: "auto", paddingBottom: 8 }}>
                {moodData.map((point, i) => (
                  <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, minWidth: 36 }}>
                    <span style={{ fontSize: 11, color: "var(--text-tertiary)", fontWeight: 600 }}>{point.completion}</span>
                    <div
                      title={`${point.date}: Mood ${point.mood}/5, ${point.completion} tasks`}
                      style={{ width: 28, height: 28, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, background: `rgba(99,102,241,${point.mood / 5 * 0.6 + 0.1})`, border: "2px solid var(--accent-muted)", cursor: "pointer" }}
                    >
                      {["😴","😕","😐","🙂","⚡"][Math.round(point.mood) - 1]}
                    </div>
                    <span style={{ fontSize: 10, color: "var(--text-tertiary)" }}>{point.date.slice(5)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

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
