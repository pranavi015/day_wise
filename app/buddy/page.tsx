"use client";
import React, { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import { supabase } from "@/lib/supabase";
import { Loader2, Copy, Check, Users, Bell } from "lucide-react";

interface BuddyProfile {
  buddy_id: string;
  full_name: string | null;
  share_data: boolean;
  completion_rate: number;
  streak: number;
}

export default function BuddyPage() {
  const [loading, setLoading] = useState(true);
  const [shareLink, setShareLink] = useState<string | null>(null);
  const [buddy, setBuddy] = useState<BuddyProfile | null>(null);
  const [copied, setCopied] = useState(false);
  const [nudgeSent, setNudgeSent] = useState(false);

  useEffect(() => {
    loadBuddyData();
  }, []);

  async function loadBuddyData() {
    setLoading(true);
    const { data: authData } = await supabase.auth.getUser();
    if (!authData?.user) { setLoading(false); return; }
    const userId = authData.user.id;

    // Check for existing pair
    const { data: pair } = await supabase
      .from("study_pairs")
      .select("buddy_id, share_data, token")
      .eq("user_id", userId)
      .single();

    if (pair?.buddy_id) {
      // Get buddy profile stats
      const { data: buddyProfile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", pair.buddy_id)
        .single();

      const todayIso = new Date().toISOString().split("T")[0];
      const { count: completedToday } = await supabase
        .from("task_completions")
        .select("*", { count: "exact", head: true })
        .eq("user_id", pair.buddy_id)
        .eq("completed_date", todayIso);

      setBuddy({
        buddy_id: pair.buddy_id,
        full_name: buddyProfile?.full_name ?? null,
        share_data: pair.share_data,
        completion_rate: completedToday ?? 0,
        streak: 0, // would need full streak calc
      });
    } else {
      // Generate invite token if none exists
      const token = `${userId.slice(0, 8)}-${Date.now().toString(36)}`;
      setShareLink(`${typeof window !== "undefined" ? window.location.origin : ""}/buddy/accept?token=${token}`);

      // Upsert the pending invite
      await supabase.from("study_pairs").upsert({
        user_id: userId,
        token,
        share_data: true,
      }, { onConflict: "user_id" });
    }

    setLoading(false);
  }

  function copyLink() {
    if (!shareLink) return;
    navigator.clipboard.writeText(shareLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function sendNudge() {
    setNudgeSent(true);
    setTimeout(() => setNudgeSent(false), 3000);
  }

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--bg-base)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Loader2 size={32} className="animate-spin text-indigo-500" />
      </div>
    );
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--bg-base)" }}>
      <Sidebar />
      <main style={{ marginLeft: 224, flex: 1 }} className="buddy-main">
        <div style={{ maxWidth: 640, margin: "0 auto", padding: "40px 32px" }}>
          <div style={{ marginBottom: 32 }}>
            <h1 style={{ margin: "0 0 8px", fontSize: 32, fontWeight: 700, color: "var(--text-primary)", letterSpacing: "-0.8px" }}>Study Buddy</h1>
            <p style={{ margin: 0, fontSize: 14.5, color: "var(--text-secondary)" }}>Stay accountable together.</p>
          </div>

          {buddy ? (
            /* Connected Buddy Card */
            <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border-subtle)", borderRadius: 20, padding: 28, boxShadow: "var(--shadow-md)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 24 }}>
                <div style={{ width: 52, height: 52, borderRadius: "50%", background: "var(--accent-subtle)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, border: "2px solid var(--accent-muted)" }}>
                  {buddy.full_name?.[0]?.toUpperCase() ?? "?"}
                </div>
                <div>
                  <p style={{ margin: 0, fontWeight: 700, fontSize: 16, color: "var(--text-primary)" }}>{buddy.full_name ?? "Your Buddy"}</p>
                  <p style={{ margin: "2px 0 0", fontSize: 13, color: "var(--success)", fontWeight: 600 }}>● Connected</p>
                </div>
              </div>

              {buddy.share_data ? (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>
                  <div style={{ background: "var(--bg-subtle)", borderRadius: 14, padding: "16px 20px", border: "1px solid var(--border-subtle)" }}>
                    <p style={{ margin: "0 0 4px", fontSize: 12, fontWeight: 700, color: "var(--text-tertiary)", textTransform: "uppercase" }}>Today&apos;s Tasks</p>
                    <p style={{ margin: 0, fontSize: 28, fontWeight: 800, color: "var(--accent)" }}>{buddy.completion_rate}</p>
                    <p style={{ margin: "2px 0 0", fontSize: 12, color: "var(--text-tertiary)" }}>completed</p>
                  </div>
                  <div style={{ background: "var(--bg-subtle)", borderRadius: 14, padding: "16px 20px", border: "1px solid var(--border-subtle)" }}>
                    <p style={{ margin: "0 0 4px", fontSize: 12, fontWeight: 700, color: "var(--text-tertiary)", textTransform: "uppercase" }}>Streak</p>
                    <p style={{ margin: 0, fontSize: 28, fontWeight: 800, color: "var(--warning)" }}>🔥 {buddy.streak}</p>
                    <p style={{ margin: "2px 0 0", fontSize: 12, color: "var(--text-tertiary)" }}>days</p>
                  </div>
                </div>
              ) : (
                <div style={{ padding: "16px", background: "var(--bg-subtle)", borderRadius: 12, marginBottom: 24, fontSize: 13, color: "var(--text-secondary)" }}>
                  Your buddy has set their data to private.
                </div>
              )}

              <button
                onClick={sendNudge}
                style={{ width: "100%", padding: "14px", borderRadius: 12, border: "none", cursor: "pointer", background: nudgeSent ? "var(--success)" : "var(--accent)", color: "white", fontWeight: 600, fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, transition: "background 300ms" }}
              >
                <Bell size={16} /> {nudgeSent ? "Nudge sent! 👋" : "Send a Nudge"}
              </button>
            </div>
          ) : (
            /* Invite Card */
            <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border-subtle)", borderRadius: 20, padding: 32, boxShadow: "var(--shadow-md)", textAlign: "center" }}>
              <div style={{ width: 64, height: 64, borderRadius: "50%", background: "var(--accent-subtle)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
                <Users size={28} color="var(--accent)" />
              </div>
              <h2 style={{ margin: "0 0 8px", fontSize: 22, fontWeight: 700, color: "var(--text-primary)" }}>Invite a Study Buddy</h2>
              <p style={{ margin: "0 0 28px", fontSize: 14.5, color: "var(--text-secondary)", lineHeight: 1.6 }}>
                Share the link below with a friend. When they accept, you&apos;ll both be able to see each other&apos;s progress.
              </p>

              {shareLink && (
                <div style={{ display: "flex", gap: 8 }}>
                  <input
                    readOnly
                    value={shareLink}
                    style={{ flex: 1, padding: "12px 16px", borderRadius: 10, border: "1px solid var(--border-default)", background: "var(--bg-subtle)", fontSize: 13, color: "var(--text-secondary)", outline: "none", overflow: "hidden", textOverflow: "ellipsis" }}
                  />
                  <button
                    onClick={copyLink}
                    style={{ padding: "12px 16px", borderRadius: 10, border: "none", background: copied ? "var(--success)" : "var(--accent)", color: "white", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontWeight: 600, fontSize: 13, transition: "background 200ms", whiteSpace: "nowrap" }}
                  >
                    {copied ? <><Check size={14} /> Copied!</> : <><Copy size={14} /> Copy Link</>}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
      <style>{`
        @media (max-width: 768px) { .buddy-main { margin-left: 0 !important; } }
      `}</style>
    </div>
  );
}
