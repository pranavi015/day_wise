"use client";
import { useState, useEffect, useRef } from "react";
import { Play, Pause, RotateCcw, Timer, X } from "lucide-react";

export default function FocusTimer() {
  const [isOpen, setIsOpen] = useState(false);
  const [seconds, setSeconds] = useState(25 * 60);
  const [running, setRunning] = useState(false);
  const [hoverBtn, setHoverBtn] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setSeconds((s) => { if (s <= 1) { setRunning(false); return 0; } return s - 1; });
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [running]);

  const mins = String(Math.floor(seconds / 60)).padStart(2, "0");
  const secs = String(seconds % 60).padStart(2, "0");
  const progress = 1 - seconds / (25 * 60);
  const circumference = 2 * Math.PI * 20;
  function reset() { setRunning(false); setSeconds(25 * 60); }

  const btnStyle = (key: string, primary?: boolean): React.CSSProperties => ({
    width: 34, height: 34, borderRadius: 7, border: "none", cursor: "pointer",
    display: "flex", alignItems: "center", justifyContent: "center",
    background: hoverBtn === key ? (primary ? "var(--accent-hover)" : "var(--bg-muted)") : (primary ? "var(--accent)" : "var(--bg-subtle)"),
    color: primary ? "white" : "var(--text-secondary)",
    transform: hoverBtn === key ? "scale(0.95)" : "scale(1)",  /* DISNEY 2: ANTICIPATION */
    transition: "all 150ms ease",
  });

  return (
    <div style={{ position: "fixed", bottom: 0, left: 216, right: 0, background: "var(--bg-surface)", borderTop: "1px solid var(--border-subtle)", zIndex: 30 }} className="timer-bar">
      {running && (
        <div style={{ height: 2, background: "var(--bg-subtle)", overflow: "hidden" }}>
          <div style={{ height: "100%", background: "var(--accent)", width: `${progress * 100}%`, transition: "width 1s linear" }} />
        </div>
      )}

      {isOpen ? (
        <div className="modal-enter" style={{ padding: "14px 20px", display: "flex", alignItems: "center", gap: 20 }}>
          <div style={{ position: "relative", width: 50, height: 50, flexShrink: 0 }}>
            <svg width="50" height="50" viewBox="0 0 50 50">
              <circle cx="25" cy="25" r="20" fill="none" stroke="var(--border-subtle)" strokeWidth="3" />
              <circle cx="25" cy="25" r="20" fill="none" stroke="var(--accent)" strokeWidth="3"
                strokeDasharray={`${circumference}`} strokeDashoffset={`${circumference * (1 - progress)}`}
                strokeLinecap="round" transform="rotate(-90 25 25)"
                style={{ transition: "stroke-dashoffset 1s linear" }} />
            </svg>
            <span style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 600, color: "var(--text-primary)" }}>{mins}:{secs}</span>
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ fontWeight: 500, fontSize: 13, color: "var(--text-primary)" }}>Focus Session</p>
            <p style={{ fontSize: 11.5, color: "var(--text-tertiary)", marginTop: 1 }}>25-minute Pomodoro</p>
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            <button onMouseEnter={() => setHoverBtn("play")} onMouseLeave={() => setHoverBtn(null)} onClick={() => setRunning((r) => !r)} style={btnStyle("play", true)}>
              {running ? <Pause size={14} /> : <Play size={14} />}
            </button>
            <button onMouseEnter={() => setHoverBtn("reset")} onMouseLeave={() => setHoverBtn(null)} onClick={reset} style={btnStyle("reset")}><RotateCcw size={13} /></button>
            <button onMouseEnter={() => setHoverBtn("close")} onMouseLeave={() => setHoverBtn(null)} onClick={() => setIsOpen(false)} style={btnStyle("close")}><X size={13} /></button>
          </div>
        </div>
      ) : (
        <div style={{ padding: "10px 20px" }}>
          <button
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--accent)"; (e.currentTarget as HTMLElement).style.color = "white"; (e.currentTarget as HTMLElement).style.transform = "scale(0.98)"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--bg-subtle)"; (e.currentTarget as HTMLElement).style.color = "var(--text-secondary)"; (e.currentTarget as HTMLElement).style.transform = "scale(1)"; }}
            onClick={() => setIsOpen(true)}
            style={{ width: "100%", background: "var(--bg-subtle)", color: "var(--text-secondary)", border: "1px solid var(--border-subtle)", borderRadius: 7, padding: "9px", fontWeight: 500, fontSize: 13.5, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 7, transition: "all 180ms ease" }}>
            <Timer size={15} /> Start Focus Session
          </button>
        </div>
      )}
      <style>{`.timer-bar { left: 216px; } @media (max-width: 768px) { .timer-bar { left: 0; bottom: 56px; } }`}</style>
    </div>
  );
}
