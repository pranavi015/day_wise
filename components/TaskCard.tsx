"use client";
import { useState } from "react";
import { Clock, RotateCcw } from "lucide-react";
import type { Task } from "@/types";

interface Props { task: Task; onToggle: (id: string) => void; }

export default function TaskCard({ task, onToggle }: Props) {
  const [animating, setAnimating] = useState(false);
  const [hovered, setHovered] = useState(false);

  function handleToggle() {
    if (!task.is_complete) { setAnimating(true); setTimeout(() => setAnimating(false), 500); }
    onToggle(task.id);
  }

  return (
    <div onClick={handleToggle}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: task.is_complete ? "var(--bg-subtle)" : "var(--bg-surface)",
        border: `1px solid ${hovered && !task.is_complete ? "var(--border-default)" : "var(--border-subtle)"}`,
        borderRadius: 8, padding: "11px 14px",
        display: "flex", alignItems: "center", gap: 12,
        cursor: "pointer", opacity: task.is_complete ? 0.55 : 1,
        transform: hovered && !task.is_complete ? "translateY(-1px)" : "translateY(0)",
        transition: "all 180ms ease", userSelect: "none",
        boxShadow: hovered && !task.is_complete ? "0 2px 8px rgba(0,0,0,0.05)" : "none",
      }}>

      {/* DISNEY 1: SQUASH & STRETCH */}
      <div style={{
        width: 18, height: 18, borderRadius: 5,
        border: `1.5px solid ${task.is_complete ? "var(--success)" : "var(--border-default)"}`,
        background: task.is_complete ? "var(--success)" : "transparent",
        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
        animation: animating ? "squashStretch 0.45s cubic-bezier(0.34,1.56,0.64,1) forwards" : "none",
        transition: "background 200ms ease, border-color 200ms ease",
      }}>
        {task.is_complete && (
          <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
            <path d="M1 3.5L3.8 6.5L9 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{
          margin: 0, fontWeight: 500, fontSize: 13.5,
          color: task.is_complete ? "var(--text-tertiary)" : "var(--text-primary)",
          textDecoration: task.is_complete ? "line-through" : "none",
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          transition: "color 200ms ease"
        }}>{task.title}</p>
        <p style={{ margin: "2px 0 0", fontSize: 12, color: "var(--text-tertiary)" }}>{task.topic_name}</p>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
        {task.type === "review" && (
          <span style={{ fontSize: 11, color: "var(--accent)", background: "var(--accent-subtle)", borderRadius: 4, padding: "2px 7px", fontWeight: 500, display: "flex", alignItems: "center", gap: 3 }}>
            <RotateCcw size={9} /> Review
          </span>
        )}
        <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11.5, color: "var(--text-tertiary)", background: "var(--bg-subtle)", borderRadius: 4, padding: "2px 8px" }}>
          <Clock size={10} /> {task.duration_minutes}m
        </span>
      </div>
    </div>
  );
}
