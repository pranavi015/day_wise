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
  const [dailyData, setDailyData] = useState<{ date: string; minutes_planned: number; minutes_spent: number }[]>([]);
  const [topicData, setTopicData] = useState<{ name: string; mins: number }[]>([]);
  const [heatmapData, setHeatmapData] = useState<Record<string, number>>({});

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
        supabase.from("profiles").select("schedule_json").eq("id", userId).single(),
        supabase.from("task_completions").select("*").eq("user_id", userId),
        supabase.from("focus_sessions").select("*").eq("user_id", userId).gte("completed_at", startOfYear),
        supabase.from("curricula").select("*").eq("user_id", userId)
      ]);

      const profile = results[0].data;
      const completions = results[1].data;
      const sessions = results[2].data;
      const curricula = results[3].data;

      const sched = profile?.schedule_json || {};

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
      const last7Days = [];
      const topicMinsMap: Record<string, number> = {};

      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateIso = d.toISOString().split("T")[0];
        const dayOfWeek = d.toLocaleDateString("en-US", { weekday: "short" });
        
        let plannedMins = 0;
        if (sched.weekly_varies) {
          plannedMins = (sched.per_day_hours?.[dayOfWeek] || 0) * 60;
        } else {
          plannedMins = (sched.daily_hours || 0) * 60;
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
          minutes_spent: spentMins
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

      // Yearly heatmap data
      const heatmap: Record<string, number> = {};
      sessions?.forEach(s => {
        const d = s.completed_at.split("T")[0];
        heatmap[d] = (heatmap[d] || 0) + s.duration_minutes;
      });
      setHeatmapData(heatmap);

      // 4. Set final stats
      const totalPlanned = last7Days.reduce((a,b)=>a+b.minutes_planned,0) || 1;
      const totalSpent = last7Days.reduce((a,b)=>a+b.minutes_spent,0);
      const adherence = Math.min(Math.round((totalSpent / totalPlanned) * 100), 100);

      // Simple mock for "completion rate" vs "adherence"
      setStats({
        completionRate: completions ? Math.min(Math.round((completions.length / (totalPlanned / 60)) * 100), 100) : 0,
        streak: currentStreak,
        topicsMastered: 0, // Requires complex check if cumulative minutes > estimated_hours
        adherenceRate: adherence
      });

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
                {stats.adherenceRate > 80 ? "Outstanding adherence! Keep up this exact pacing to hit your goal effortlessly." : "A bit behind schedule this week. Consider adjusting your goals to a more relaxed pace if you feel overwhelmed."}
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
                const mins = heatmapData[iso] || 0;
                const isFuture = date > new Date();
                
                let level = 0;
                if (mins > 0) level = 1;
                if (mins > 60) level = 2;
                if (mins > 120) level = 3;
                if (mins > 240) level = 4;
                
                const colors = ["var(--bg-muted)", "rgba(99,102,241, 0.2)", "rgba(99,102,241, 0.4)", "rgba(99,102,241, 0.7)", "rgba(99,102,241, 1)"];
                
                return (
                  <div key={i} title={`${iso}: ${mins} mins`} style={{ 
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
