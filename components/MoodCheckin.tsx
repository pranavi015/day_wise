"use client";
import React, { useState } from "react";
import { supabase } from "@/lib/supabase";

interface MoodCheckinProps {
  onComplete: () => void;
}

const MOODS = [
  { score: 1, emoji: "😴", label: "Exhausted" },
  { score: 2, emoji: "😕", label: "Low" },
  { score: 3, emoji: "😐", label: "Okay" },
  { score: 4, emoji: "🙂", label: "Good" },
  { score: 5, emoji: "⚡", label: "Energized" },
];

export default function MoodCheckin({ onComplete }: MoodCheckinProps) {
  const [selected, setSelected] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSelect(score: number) {
    setSelected(score);
    setSaving(true);

    const { data: authData } = await supabase.auth.getUser();
    if (authData?.user) {
      await supabase.from("mood_logs").insert({
        user_id: authData.user.id,
        mood_score: score,
      });
    }

    // Short delay so user sees their selection before modal closes
    setTimeout(() => {
      setSaving(false);
      onComplete();
    }, 600);
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 4000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(15,23,42,0.65)",
        backdropFilter: "blur(6px)",
        animation: "fadeIn 250ms ease-out",
      }}
    >
      <div
        className="modal-enter"
        style={{
          background: "var(--bg-surface)",
          borderRadius: 24,
          padding: "40px 36px",
          maxWidth: 400,
          width: "100%",
          boxShadow: "var(--shadow-xl)",
          border: "1px solid var(--border-default)",
          textAlign: "center",
        }}
      >
        <p style={{ margin: "0 0 6px", fontSize: 12, fontWeight: 700, color: "var(--accent)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
          Before you start
        </p>
        <h2 style={{ margin: "0 0 28px", fontSize: 20, fontWeight: 700, color: "var(--text-primary)", letterSpacing: "-0.3px" }}>
          How&apos;s your energy right now?
        </h2>

        <div style={{ display: "flex", justifyContent: "center", gap: 12 }}>
          {MOODS.map(({ score, emoji, label }) => (
            <button
              key={score}
              onClick={() => handleSelect(score)}
              disabled={saving}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 6,
                padding: "12px 8px",
                borderRadius: 16,
                border: `2px solid ${selected === score ? "var(--accent)" : "var(--border-default)"}`,
                background: selected === score ? "var(--accent-subtle)" : "var(--bg-subtle)",
                cursor: saving ? "wait" : "pointer",
                transition: "all 180ms cubic-bezier(0.16,1,0.3,1)",
                transform: selected === score ? "scale(1.1)" : "scale(1)",
                minWidth: 52,
              }}
            >
              <span style={{ fontSize: 28 }}>{emoji}</span>
              <span style={{ fontSize: 10, fontWeight: 600, color: selected === score ? "var(--accent)" : "var(--text-tertiary)" }}>
                {label}
              </span>
            </button>
          ))}
        </div>

        <p style={{ margin: "20px 0 0", fontSize: 12, color: "var(--text-tertiary)" }}>
          This takes 2 seconds and helps track your learning patterns.
        </p>
      </div>
    </div>
  );
}
