"use client";
import { useState } from "react";
import { Clock, RotateCcw } from "lucide-react";
import type { Task } from "@/types";

interface Props { task: Task; onToggle: (id: string) => void; }

export default function TaskCard({ task, onToggle }: Props) {
  const [animating, setAnimating] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [particles, setParticles] = useState<{ id: number; tx: number; ty: number }[]>([]);

  function handleToggle(e: React.MouseEvent) {
    if (!task.is_complete) { 
      setAnimating(true); 
      // Create particles
      const newParticles = Array.from({ length: 6 }).map((_, i) => ({
        id: Date.now() + i,
        tx: (Math.random() - 0.5) * 60,
        ty: (Math.random() - 0.5) * 60
      }));
      setParticles(newParticles);
      setTimeout(() => {
        setAnimating(false);
        setParticles([]);
      }, 600); 
    }
    onToggle(task.id);
  }

  return (
    <div onClick={handleToggle}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: task.is_complete ? "var(--bg-subtle)" : "var(--bg-surface)",
        border: `1px solid ${hovered && !task.is_complete ? "var(--accent-muted)" : "var(--border-subtle)"}`,
        borderRadius: 12, padding: "14px 16px",
        display: "flex", alignItems: "center", gap: 14,
        cursor: "pointer", opacity: task.is_complete ? 0.6 : 1,
        transform: hovered && !task.is_complete ? "translateY(-2px)" : "translateY(0)",
        transition: "all 200ms cubic-bezier(0.16, 1, 0.3, 1)", userSelect: "none",
        boxShadow: hovered && !task.is_complete ? "var(--shadow-md)" : "var(--shadow-sm)",
        position: "relative"
      }}>

      <div style={{ position: "relative", width: 20, height: 20, flexShrink: 0 }}>
        {particles.map(p => (
          <div key={p.id} className="particle" style={{ 
            "--tx": `${p.tx}px`, 
            "--ty": `${p.ty}px`, 
            animation: "particleBurst 0.6s ease-out forwards",
            left: 8, top: 8
          } as React.CSSProperties} />
        ))}
        {/* DISNEY 1: SQUASH & STRETCH */}
        <div style={{
          width: "100%", height: "100%", borderRadius: 6,
          border: `1.5px solid ${task.is_complete ? "var(--success)" : "var(--border-strong)"}`,
          background: task.is_complete ? "var(--success)" : "transparent",
          display: "flex", alignItems: "center", justifyContent: "center",
          animation: animating ? "squashStretch 0.45s cubic-bezier(0.34,1.56,0.64,1) forwards" : "none",
          transition: "background 200ms ease, border-color 200ms ease",
        }}>
          {task.is_complete && (
            <svg width="12" height="10" viewBox="0 0 10 8" fill="none">
              <path d="M1 3.5L3.8 6.5L9 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </div>
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{
          margin: 0, fontWeight: 500, fontSize: 14,
          color: task.is_complete ? "var(--text-tertiary)" : "var(--text-primary)",
          textDecoration: task.is_complete ? "line-through" : "none",
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          transition: "color 200ms ease"
        }}>{task.title}</p>
        <p style={{ margin: "3px 0 0", fontSize: 12.5, color: "var(--text-tertiary)" }}>{task.topic_name}</p>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
        {task.type === "review" && (
          <span style={{ fontSize: 11.5, color: "var(--accent)", background: "var(--accent-subtle)", borderRadius: 6, padding: "3px 8px", fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}>
            <RotateCcw size={11} strokeWidth={2.5}/> Review
          </span>
        )}
        <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: "var(--text-secondary)", background: "var(--bg-muted)", borderRadius: 6, padding: "3px 8px", fontWeight: 500 }}>
          <Clock size={12} strokeWidth={2}/> {task.duration_minutes}m
        </span>
      </div>
    </div>
  );
}
