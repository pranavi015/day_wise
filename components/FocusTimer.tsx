"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { Play, Pause, RotateCcw, Timer, X } from "lucide-react";
import { supabase } from "@/lib/supabase";
import MoodCheckin from "./MoodCheckin";

export default function FocusTimer({ activeTopicId }: { activeTopicId?: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [showMood, setShowMood] = useState(false);
  const [seconds, setSeconds] = useState(25 * 60);
  const [running, setRunning] = useState(false);
  const [hoverBtn, setHoverBtn] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const saveFocusSession = useCallback(async () => {
    const { data: authData } = await supabase.auth.getUser();
    if (!authData?.user) return;
    
    await supabase.from("focus_sessions").insert({
      user_id: authData.user.id,
      topic_id: activeTopicId || null,
      duration_minutes: 25
    });
  }, [activeTopicId]);

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setSeconds((s) => { 
          if (s <= 1) { 
            setRunning(false); 
            // trigger saving
            saveFocusSession();
            return 0; 
          } 
          return s - 1; 
        });
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [running, saveFocusSession]);

  const mins = String(Math.floor(seconds / 60)).padStart(2, "0");
  const secs = String(seconds % 60).padStart(2, "0");
  const progress = 1 - seconds / (25 * 60);
  const circumference = 2 * Math.PI * 22;
  function reset() { setRunning(false); setSeconds(25 * 60); }

  const btnStyle = (key: string, primary?: boolean): React.CSSProperties => ({
    width: 36, height: 36, borderRadius: 10, border: "none", cursor: "pointer",
    display: "flex", alignItems: "center", justifyContent: "center",
    background: hoverBtn === key ? (primary ? "var(--accent-hover)" : "var(--bg-muted)") : (primary ? "var(--accent)" : "var(--bg-subtle)"),
    color: primary ? "white" : "var(--text-secondary)",
    transform: hoverBtn === key ? "scale(0.95)" : "scale(1)", 
    transition: "all 150ms ease",
    boxShadow: primary ? "var(--shadow-sm)" : "none"
  });

  return (
    <div className="timer-widget" style={{ 
      position: "fixed", zIndex: 50, transition: "all 300ms cubic-bezier(0.16, 1, 0.3, 1)",
      filter: "drop-shadow(var(--shadow-lg))" 
    }}>
      {isOpen ? (
        <div className="modal-enter" style={{ 
          background: "var(--bg-surface)", 
          border: "1px solid var(--border-subtle)", 
          borderRadius: 20, 
          padding: "20px", 
          display: "flex", alignItems: "center", gap: 20,
          width: 320
        }}>
          <div style={{ position: "relative", width: 52, height: 52, flexShrink: 0 }}>
            <svg width="52" height="52" viewBox="0 0 52 52">
              <circle cx="26" cy="26" r="22" fill="none" stroke="var(--bg-muted)" strokeWidth="4" />
              <circle cx="26" cy="26" r="22" fill="none" stroke="var(--accent)" strokeWidth="4"
                strokeDasharray={`${circumference}`} strokeDashoffset={`${circumference * (1 - progress)}`}
                strokeLinecap="round" transform="rotate(-90 26 26)"
                style={{ transition: "stroke-dashoffset 1s linear" }} />
            </svg>
            <span style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: "var(--text-primary)" }}>{mins}:{secs}</span>
          </div>
          
          <div style={{ flex: 1 }}>
            <p style={{ fontWeight: 600, fontSize: 14, color: "var(--text-primary)", letterSpacing: "-0.2px" }}>Focus Session</p>
            <p style={{ fontSize: 12, color: "var(--text-tertiary)", marginTop: 2 }}>25m Pomodoro</p>
          </div>
          
          <div style={{ display: "flex", gap: 6, flexDirection: "column" }}>
            <div style={{ display: "flex", gap: 6 }}>
              <button onMouseEnter={() => setHoverBtn("play")} onMouseLeave={() => setHoverBtn(null)} onClick={() => setRunning((r) => !r)} style={btnStyle("play", true)}>
                {running ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" />}
              </button>
              <button onMouseEnter={() => setHoverBtn("reset")} onMouseLeave={() => setHoverBtn(null)} onClick={reset} style={btnStyle("reset")}><RotateCcw size={15} /></button>
            </div>
          </div>
          
          <button onClick={() => setIsOpen(false)} style={{ position: "absolute", top: 12, right: 12, background: "none", border: "none", color: "var(--text-tertiary)", cursor: "pointer", padding: 4 }}>
            <X size={14} />
          </button>
        </div>
      ) : (
        <button
          className="modal-enter"
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.transform = "scale(0.97) translateY(-2px)"; (e.currentTarget as HTMLElement).style.boxShadow = "var(--shadow-xl)"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = "scale(1) translateY(0)"; (e.currentTarget as HTMLElement).style.boxShadow = "var(--shadow-md)"; }}
          onClick={() => setShowMood(true)}
          style={{ 
            background: "linear-gradient(135deg, var(--accent), var(--accent-hover))", 
            color: "white", border: "none", borderRadius: 30, 
            padding: "12px 20px", fontWeight: 600, fontSize: 14, 
            cursor: "pointer", display: "flex", alignItems: "center", gap: 8, 
            transition: "all 250ms cubic-bezier(0.16, 1, 0.3, 1)",
            boxShadow: "var(--shadow-md)", borderTop: "1px solid rgba(255,255,255,0.2)"
          }}>
          <Timer size={18} /> Start Session
        </button>
      )}
      {showMood && (
        <MoodCheckin onComplete={() => { setShowMood(false); setIsOpen(true); }} />
      )}
      <style>{`
        .timer-widget { bottom: 32px; right: 32px; } 
        @media (max-width: 768px) { .timer-widget { bottom: 84px; right: 16px; } }
      `}</style>
    </div>
  );
}
