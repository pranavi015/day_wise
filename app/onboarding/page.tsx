"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { BookOpen, Clock, Zap, ChevronRight, ChevronLeft, Plus, X, Check, Sparkles, Loader2 } from "lucide-react";
import type { Topic, Intensity, OnboardingState } from "@/types";
import { experimental_useObject as useObject } from "@ai-sdk/react";
import { z } from "zod";
import { supabase } from "@/lib/supabase";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const intensityOptions: { value: Intensity; label: string; desc: string; icon: string }[] = [
  { value: "relaxed", label: "Relaxed", desc: "Easy pace, plenty of breaks. Good for staying consistent.", icon: "🐢" },
  { value: "balanced", label: "Balanced", desc: "Steady progress without burning out. Recommended.", icon: "⚖️" },
  { value: "intense", label: "Intense", desc: "Maximum learning, minimal reviews. Move fast.", icon: "🚀" },
];

const initialState: OnboardingState = {
  topics: [],
  daily_hours: 1.5,
  weekly_varies: false,
  per_day_hours: { Mon: 1.5, Tue: 1.5, Wed: 1.5, Thu: 1.5, Fri: 1.5, Sat: 1.5, Sun: 1.5 },
  exception_days: [],
  intensity: "balanced",
  sr_enabled: true,
};

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState<"forward" | "back">("forward");
  const [state, setState] = useState<OnboardingState>(initialState);
  const [topicInput, setTopicInput] = useState("");
  const [goalInput, setGoalInput] = useState("");
  const [saving, setSaving] = useState(false);

  const { object, submit, isLoading } = useObject({
    api: "/api/curriculum",
    schema: z.object({
      topics: z.array(
        z.object({
          title: z.string(),
          description: z.string(),
          estimated_hours: z.number(),
          week_number: z.number(),
        })
      ),
    }),
    onFinish: ({ object }: { object?: { topics?: { title: string; description: string; estimated_hours: number; week_number: number }[] } }) => {
      if (object?.topics) {
        const generatedTopics: Topic[] = object.topics.map((t: { title: string; estimated_hours: number }, i: number) => ({
          id: `ai-${Date.now()}-${i}`,
          name: t.title,
          difficulty: 3 as const,
          estimated_minutes: t.estimated_hours * 60,
        }));
        setState((s) => ({ ...s, topics: [...s.topics, ...generatedTopics] }));
        setGoalInput("");
      }
    }
  });

  const animClass = direction === "forward" ? "stagger-item" : "stagger-item";

  function goNext() { setDirection("forward"); setStep((s) => s + 1); }
  function goBack() { setDirection("back"); setStep((s) => s - 1); }

  function addTopic() {
    if (!topicInput.trim()) return;
    const newTopic: Topic = { id: Date.now().toString(), name: topicInput.trim(), difficulty: 3, estimated_minutes: 120 };
    setState((s) => ({ ...s, topics: [...s.topics, newTopic] }));
    setTopicInput("");
  }

  function removeTopic(id: string) {
    setState((s) => ({ ...s, topics: s.topics.filter((t) => t.id !== id) }));
  }

  function addFromGoal() {
    if (!goalInput.trim()) return;
    submit({ goal: goalInput.trim() });
  }

  async function handleFinish() {
    setSaving(true);
    const { data: authData } = await supabase.auth.getUser();
    if (!authData?.user) {
      // Fallback if not logged in
      localStorage.setItem("daywise_onboarding", JSON.stringify(state));
      router.push("/auth/signup");
      return;
    }

    const userId = authData.user.id;

    // 1. Update Profile schedule & pacing
    await supabase.from("profiles").upsert({
      id: userId,
      schedule_json: {
        daily_hours: state.daily_hours,
        weekly_varies: state.weekly_varies,
        per_day_hours: state.per_day_hours,
      },
      pacing: state.intensity,
      sr_enabled: state.sr_enabled,
    });

    // 2. Insert Curricula (if any)
    if (state.topics.length > 0) {
      const inserts = state.topics.map((t, i) => ({
        user_id: userId,
        title: t.name,
        description: "",
        estimated_hours: t.estimated_minutes / 60,
        week_number: Math.floor(i / 3) + 1, // rough estimate if none provided
        sort_order: i,
      }));
      await supabase.from("curricula").insert(inserts);
    }

    router.push("/today");
  }

  const weeklyMinutes = state.weekly_varies
    ? (Object.values(state.per_day_hours).reduce((a, b) => a + b, 0)) * 60
    : state.daily_hours * 60 * 7;

  const totalWeeks = Math.ceil(
    state.topics.reduce((sum, t) => sum + t.estimated_minutes, 0) / (weeklyMinutes || 1)
  ) || 4;

  const inputBase: React.CSSProperties = {
    border: "1px solid var(--border-default)", borderRadius: 8, padding: "12px 16px",
    fontSize: 14, color: "var(--text-primary)", background: "var(--bg-surface)", outline: "none",
    boxShadow: "var(--shadow-sm)", transition: "all 200ms ease"
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-base)", display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <div style={{ background: "var(--sidebar-bg)", padding: "16px 32px", display: "flex", alignItems: "center", justifyContent: "space-between", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: "linear-gradient(135deg, var(--accent), var(--accent-hover))", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 8px rgba(99,102,241,0.25)" }}>
            <Sparkles size={14} color="white" />
          </div>
          <span style={{ color: "rgba(255,255,255,0.95)", fontWeight: 700, fontSize: 16, letterSpacing: "-0.4px" }}>daywise</span>
        </div>
        <span style={{ color: "var(--sidebar-text)", fontSize: 13, fontWeight: 500 }}>
          {step <= 3 ? `Step ${step} of 3` : "Final Preview"}
        </span>
      </div>

      {/* Step indicator */}
      <div style={{ background: "var(--bg-surface)", borderBottom: "1px solid var(--border-subtle)", padding: "16px 32px", display: "flex", gap: 12, alignItems: "center", justifyContent: "center" }}>
        {[1, 2, 3].map((s) => (
          <div key={s} style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{
              width: 32, height: 32, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700,
              background: s < step ? "var(--success)" : s === step ? "var(--accent)" : "var(--bg-muted)",
              color: s <= step ? "white" : "var(--text-tertiary)",
              boxShadow: s === step ? "var(--shadow-glow)" : "none", transition: "all 300ms ease"
            }}>
              {s < step ? <Check size={16} strokeWidth={3} /> : s}
            </div>
            <span style={{ fontSize: 14, color: s === step ? "var(--text-primary)" : "var(--text-tertiary)", fontWeight: s === step ? 600 : 500 }}>
              {s === 1 ? "Goals" : s === 2 ? "Schedule" : "Pacing"}
            </span>
            {s < 3 && <div style={{ width: 32, height: 2, background: s < step ? "var(--success)" : "var(--border-subtle)", transition: "background 300ms ease" }} />}
          </div>
        ))}
      </div>

      {/* Content */}
      <div style={{ flex: 1, display: "flex", justifyContent: "center", alignItems: "flex-start", padding: "48px 24px" }}>
        <div key={step} className={animClass} style={{ width: "100%", maxWidth: 640 }}>

          {/* STEP 1: Topics */}
          {step === 1 && (
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 12 }}>
                <div style={{ width: 48, height: 48, borderRadius: 12, background: "var(--accent)", color: "white", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "var(--shadow-md)" }}>
                  <BookOpen size={24} />
                </div>
                <div>
                  <h1 style={{ fontSize: 28, fontWeight: 700, color: "var(--text-primary)", margin: 0, letterSpacing: "-0.5px" }}>What do you want to learn?</h1>
                  <p style={{ fontSize: 14.5, color: "var(--text-secondary)", margin: "4px 0 0" }}>You can adjust topics anytime later.</p>
                </div>
              </div>

              {/* AI shortcut */}
              <div style={{ background: "linear-gradient(145deg, var(--bg-surface), var(--bg-subtle))", border: "1px solid var(--border-default)", borderRadius: 12, padding: 24, marginTop: 32, marginBottom: 16, boxShadow: "var(--shadow-sm)" }}>
                <p style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)", marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
                  <Sparkles size={16} color="var(--accent)" /> Let AI suggest a path
                </p>
                <div style={{ display: "flex", gap: 10 }}>
                  <input value={goalInput} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setGoalInput(e.target.value)} onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => e.key === "Enter" && addFromGoal()}
                    placeholder='e.g. "Learn Python for data science"' disabled={isLoading} style={{ ...inputBase, flex: 1, opacity: isLoading ? 0.7 : 1 }} />
                  <button onClick={addFromGoal} disabled={isLoading || !goalInput.trim()} style={{ background: "var(--accent)", color: "white", border: "none", borderRadius: 8, padding: "12px 20px", fontWeight: 600, fontSize: 14, cursor: isLoading ? "not-allowed" : "pointer", whiteSpace: "nowrap", boxShadow: "var(--shadow-sm)", transition: "background 200ms", display: "flex", alignItems: "center", gap: 8 }}>
                    {isLoading ? <Loader2 size={16} className="animate-spin" /> : "Build Path"}
                  </button>
                </div>
              </div>

              {/* Streaming Skeleton Loaders */}
              {isLoading && object?.topics && (
                <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
                  {object.topics.map((t, i) => (
                    <div key={i} className="stagger-item skeleton" style={{ height: 56, borderRadius: 10, opacity: 0.7 }} />
                  ))}
                  <div className="skeleton" style={{ height: 56, borderRadius: 10, animationDelay: "200ms", opacity: 0.4 }} />
                </div>
              )}

              {/* Manual add */}
              <div style={{ display: "flex", gap: 10, marginBottom: 24 }}>
                <input value={topicInput} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTopicInput(e.target.value)} onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => e.key === "Enter" && addTopic()}
                  placeholder="Or add a topic manually..." style={{ ...inputBase, flex: 1 }} />
                <button onClick={addTopic} style={{ background: "var(--accent-subtle)", color: "var(--accent)", border: "1px solid var(--accent-muted)", borderRadius: 8, padding: "12px 18px", cursor: "pointer", transition: "all 200ms" }}
                  onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = "var(--bg-muted)")}
                  onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = "var(--accent-subtle)")}>
                  <Plus size={20} strokeWidth={2.5} />
                </button>
              </div>

              {/* Topic list */}
              {state.topics.length > 0 && (
                <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 32 }}>
                  {state.topics.map((t: Topic, i: number) => (
                    <div key={t.id} className="stagger-item" style={{ animationDelay: `${i * 50}ms`, background: "var(--bg-surface)", border: "1px solid var(--border-subtle)", borderRadius: 10, padding: "14px 18px", display: "flex", alignItems: "center", justifyContent: "space-between", boxShadow: "var(--shadow-sm)" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                        <span style={{ width: 26, height: 26, borderRadius: 8, background: "var(--accent-subtle)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: "var(--accent)" }}>{i + 1}</span>
                        <span style={{ fontSize: 15, fontWeight: 500, color: "var(--text-primary)" }}>{t.name}</span>
                      </div>
                      <button onClick={() => removeTopic(t.id)} style={{ background: "var(--bg-subtle)", border: "none", borderRadius: 6, cursor: "pointer", color: "var(--text-tertiary)", padding: 6, display: "flex", transition: "all 150ms" }}
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = "var(--error)"; (e.currentTarget as HTMLElement).style.background = "var(--error-subtle)"; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = "var(--text-tertiary)"; (e.currentTarget as HTMLElement).style.background = "var(--bg-subtle)"; }}>
                        <X size={16} strokeWidth={2.5} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {state.topics.length === 0 && (
                <div style={{ textAlign: "center", padding: "40px 0", color: "var(--text-tertiary)", fontSize: 14.5, background: "var(--bg-surface)", border: "1px dashed var(--border-strong)", borderRadius: 12 }}>
                  No topics yet — add one above to get started.
                </div>
              )}

              <button onClick={goNext} disabled={state.topics.length === 0}
                style={{ width: "100%", background: state.topics.length > 0 ? "linear-gradient(135deg, var(--accent), var(--accent-hover))" : "var(--bg-muted)", color: state.topics.length > 0 ? "white" : "var(--text-disabled)", border: "none", borderRadius: 10, padding: "16px", fontWeight: 600, fontSize: 15, cursor: state.topics.length > 0 ? "pointer" : "not-allowed", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, transition: "all 200ms ease", boxShadow: state.topics.length > 0 ? "var(--shadow-md)" : "none", marginTop: 32 }}>
                Continue <ChevronRight size={18} strokeWidth={2.5} />
              </button>
            </div>
          )}

          {/* STEP 2: Schedule */}
          {step === 2 && (
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 32 }}>
                <div style={{ width: 48, height: 48, borderRadius: 12, background: "var(--accent)", color: "white", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "var(--shadow-md)" }}>
                  <Clock size={24} />
                </div>
                <div>
                  <h1 style={{ fontSize: 28, fontWeight: 700, color: "var(--text-primary)", margin: 0, letterSpacing: "-0.5px" }}>How much time per day?</h1>
                  <p style={{ fontSize: 14.5, color: "var(--text-secondary)", margin: "4px 0 0" }}>We&apos;ll never overload a day.</p>
                </div>
              </div>

              <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border-subtle)", borderRadius: 12, padding: 24, marginBottom: 20, boxShadow: "var(--shadow-sm)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                  <span style={{ fontWeight: 600, fontSize: 15, color: "var(--text-secondary)" }}>Base daily hours</span>
                  <span style={{ fontSize: 32, fontWeight: 700, color: "var(--accent)", letterSpacing: "-0.5px" }}>{state.daily_hours}h</span>
                </div>
                <input type="range" min={0.5} max={8} step={0.5} value={state.daily_hours}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setState((s) => ({ ...s, daily_hours: parseFloat(e.target.value) }))}
                  style={{ width: "100%", accentColor: "var(--accent)", cursor: "pointer", height: 6 }} />
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "var(--text-tertiary)", marginTop: 12, fontWeight: 500 }}>
                  <span>30 min</span><span>8 hours</span>
                </div>
              </div>

              <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border-subtle)", borderRadius: 12, padding: 24, marginBottom: 32, boxShadow: "var(--shadow-sm)" }}>
                <label style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}>
                  <input type="checkbox" checked={state.weekly_varies} onChange={(e) => setState((s) => ({ ...s, weekly_varies: e.target.checked }))} style={{ accentColor: "var(--accent)", width: 18, height: 18, cursor: "pointer" }} />
                  <span style={{ fontSize: 15, fontWeight: 600, color: "var(--text-primary)" }}>My schedule varies by day</span>
                </label>
                {state.weekly_varies && (
                  <div style={{ marginTop: 20, display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 10 }}>
                    {DAYS.map((day) => (
                      <div key={day} style={{ textAlign: "center" }}>
                        <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 8 }}>{day}</div>
                        <input type="number" min={0} max={8} step={0.5} value={state.per_day_hours[day]}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setState((s) => ({ ...s, per_day_hours: { ...s.per_day_hours, [day]: parseFloat(e.target.value) || 0 } }))}
                          style={{ width: "100%", border: "1px solid var(--border-default)", borderRadius: 8, padding: "8px 4px", fontSize: 14, fontWeight: 500, textAlign: "center", background: "var(--bg-subtle)", color: "var(--text-primary)", outline: "none", transition: "border-color 200ms" }}
                          onFocus={(e) => (e.target as HTMLElement).style.borderColor = "var(--accent)"}
                          onBlur={(e) => (e.target as HTMLElement).style.borderColor = "var(--border-default)"} />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div style={{ display: "flex", gap: 12 }}>
                <button onClick={goBack} style={{ flex: 1, background: "var(--bg-surface)", color: "var(--text-secondary)", border: "1px solid var(--border-default)", borderRadius: 10, padding: "16px", fontWeight: 600, fontSize: 15, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, transition: "background 200ms" }}
                  onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.background = "var(--bg-subtle)"}
                  onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.background = "var(--bg-surface)"}>
                  <ChevronLeft size={18} strokeWidth={2.5} /> Back
                </button>
                <button onClick={goNext} style={{ flex: 2, background: "linear-gradient(135deg, var(--accent), var(--accent-hover))", color: "white", border: "none", borderRadius: 10, padding: "16px", fontWeight: 600, fontSize: 15, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, boxShadow: "var(--shadow-md)" }}>
                  Continue <ChevronRight size={18} strokeWidth={2.5} />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Learning style */}
          {step === 3 && (
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 32 }}>
                <div style={{ width: 48, height: 48, borderRadius: 12, background: "var(--accent)", color: "white", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "var(--shadow-md)" }}>
                  <Zap size={24} />
                </div>
                <div>
                  <h1 style={{ fontSize: 28, fontWeight: 700, color: "var(--text-primary)", margin: 0, letterSpacing: "-0.5px" }}>Pick your learning style</h1>
                  <p style={{ fontSize: 14.5, color: "var(--text-secondary)", margin: "4px 0 0" }}>You can change this anytime.</p>
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 24 }}>
                {intensityOptions.map((opt) => (
                  <button key={opt.value} onClick={() => setState((s) => ({ ...s, intensity: opt.value }))}
                    style={{
                      background: state.intensity === opt.value ? "var(--accent-subtle)" : "var(--bg-surface)",
                      border: `2px solid ${state.intensity === opt.value ? "var(--accent)" : "var(--border-subtle)"}`,
                      boxShadow: state.intensity === opt.value ? "var(--shadow-md)" : "var(--shadow-sm)",
                      borderRadius: 12, padding: "18px 20px", cursor: "pointer", textAlign: "left",
                      display: "flex", alignItems: "center", gap: 16, transition: "all 200ms cubic-bezier(0.16, 1, 0.3, 1)",
                      transform: state.intensity === opt.value ? "translateY(-2px)" : "translateY(0)"
                    }}>
                    <span style={{ fontSize: 32 }}>{opt.icon}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontWeight: 700, fontSize: 16, color: "var(--text-primary)", letterSpacing: "-0.2px" }}>{opt.label}</span>
                      </div>
                      <p style={{ margin: "4px 0 0", fontSize: 13.5, color: "var(--text-tertiary)", lineHeight: 1.4 }}>{opt.desc}</p>
                    </div>
                    {state.intensity === opt.value && <div style={{ width: 24, height: 24, borderRadius: "50%", background: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center" }}><Check size={14} strokeWidth={3} color="white" /></div>}
                  </button>
                ))}
              </div>

              {/* Spaced repetition toggle */}
              <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border-subtle)", borderRadius: 12, padding: 24, marginBottom: 32, boxShadow: "var(--shadow-sm)" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div>
                    <p style={{ margin: 0, fontWeight: 600, fontSize: 15, color: "var(--text-primary)" }}>Spaced Repetition</p>
                    <p style={{ margin: "4px 0 0", fontSize: 13, color: "var(--text-tertiary)", maxWidth: 360 }}>
                      Automatically schedule reviews at the optimal time to guarantee retention.
                    </p>
                  </div>
                  <button onClick={() => setState((s) => ({ ...s, sr_enabled: !s.sr_enabled }))}
                    style={{ width: 50, height: 28, borderRadius: 14, border: "none", cursor: "pointer", background: state.sr_enabled ? "var(--accent)" : "var(--border-strong)", position: "relative", transition: "background 250ms", flexShrink: 0 }}>
                    <div style={{ width: 22, height: 22, borderRadius: "50%", background: "white", position: "absolute", top: 3, left: state.sr_enabled ? 25 : 3, transition: "left 250ms cubic-bezier(0.34,1.56,0.64,1)", boxShadow: "0 2px 4px rgba(0,0,0,0.2)" }} />
                  </button>
                </div>
              </div>

              <div style={{ display: "flex", gap: 12 }}>
                <button onClick={goBack} style={{ flex: 1, background: "var(--bg-surface)", color: "var(--text-secondary)", border: "1px solid var(--border-default)", borderRadius: 10, padding: "16px", fontWeight: 600, fontSize: 15, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, transition: "background 200ms" }}
                  onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.background = "var(--bg-subtle)"}
                  onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.background = "var(--bg-surface)"}>
                  <ChevronLeft size={18} strokeWidth={2.5} /> Back
                </button>
                <button onClick={goNext} style={{ flex: 2, background: "linear-gradient(135deg, var(--accent), var(--accent-hover))", color: "white", border: "none", borderRadius: 10, padding: "16px", fontWeight: 600, fontSize: 15, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, boxShadow: "var(--shadow-md)" }}>
                  Preview Schedule <ChevronRight size={18} strokeWidth={2.5} />
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: Preview */}
          {step === 4 && (
            <div className="stagger-item">
              <h1 style={{ fontSize: 32, fontWeight: 700, color: "var(--text-primary)", margin: "0 0 8px", letterSpacing: "-0.8px" }}>Your 7-day preview</h1>
              <p style={{ fontSize: 15, color: "var(--text-secondary)", marginBottom: 32 }}>At this pace, you&apos;ll finish in ~<strong style={{ color: "var(--accent)" }}>{totalWeeks} weeks</strong>.</p>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 10, marginBottom: 32 }}>
                {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day, i: number) => (
                  <div key={day} className="stagger-item" style={{ animationDelay: `${i * 60}ms`, background: "var(--bg-surface)", border: `1px solid ${i === 0 ? "var(--accent-muted)" : "var(--border-subtle)"}`, borderRadius: 10, padding: "12px 6px", textAlign: "center", boxShadow: i === 0 ? "0 4px 12px rgba(99,102,241,0.15)" : "var(--shadow-sm)", transform: i === 0 ? "translateY(-4px)" : "none", transition: "transform 300ms ease" }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: i === 0 ? "var(--accent)" : "var(--text-tertiary)", marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.05em" }}>{day}</div>
                    {state.topics.slice(0, 2).map((t: Topic, ti: number) => (
                      <div key={ti} style={{ fontSize: 10, background: "var(--bg-subtle)", border: "1px solid var(--border-subtle)", borderRadius: 4, padding: "4px", marginBottom: 6, color: "var(--text-secondary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontWeight: 500 }}>
                        {t.name.split(" ")[0]}
                      </div>
                    ))}
                    <div style={{ fontSize: 12, color: "var(--text-primary)", marginTop: 8, fontWeight: 700 }}>
                      {state.weekly_varies ? state.per_day_hours[day as keyof typeof state.per_day_hours] : state.daily_hours}h
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ background: "linear-gradient(135deg, var(--bg-surface), var(--accent-subtle))", border: "1px solid var(--accent-muted)", borderRadius: 12, padding: "20px 24px", marginBottom: 32, display: "flex", alignItems: "center", gap: 16, boxShadow: "var(--shadow-md)" }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: "white", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
                  <span style={{ fontSize: 22 }}>📅</span>
                </div>
                <div>
                  <p style={{ margin: 0, fontWeight: 700, fontSize: 15, color: "var(--text-primary)", letterSpacing: "-0.2px" }}>Looks achievable</p>
                  <p style={{ margin: "2px 0 0", fontSize: 13.5, color: "var(--text-secondary)" }}>{state.topics.length} topics · {state.weekly_varies ? "Custom schedule" : `${state.daily_hours}h/day`} · {state.intensity} pace</p>
                </div>
              </div>

              <div style={{ display: "flex", gap: 12 }}>
                <button onClick={goBack} style={{ flex: 1, background: "var(--bg-surface)", color: "var(--text-secondary)", border: "1px solid var(--border-default)", borderRadius: 10, padding: "16px", fontWeight: 600, fontSize: 15, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, transition: "background 200ms" }}
                  onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.background = "var(--bg-subtle)"}
                  onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.background = "var(--bg-surface)"}>
                  <ChevronLeft size={18} strokeWidth={2.5} /> Adjust
                </button>
                <button onClick={handleFinish} disabled={saving} style={{ flex: 2, background: "linear-gradient(135deg, var(--accent), var(--accent-hover))", color: "white", border: "none", borderRadius: 10, padding: "16px", fontWeight: 600, fontSize: 15, cursor: saving ? "not-allowed" : "pointer", boxShadow: "var(--shadow-md)", transition: "transform 200ms", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
                  onMouseEnter={(e) => { if (!saving) (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)"; }}
                  onMouseLeave={(e) => { if (!saving) (e.currentTarget as HTMLElement).style.transform = "translateY(0)"; }}>
                  {saving ? <><Loader2 size={18} className="animate-spin" /> Saving...</> : <>Looks good — Start Learning →</>}
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
