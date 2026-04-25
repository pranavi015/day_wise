"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { BookOpen, Clock, Zap, ChevronRight, ChevronLeft, Plus, X, Check, Sparkles } from "lucide-react";
import type { Topic, Intensity, OnboardingState } from "@/types";

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
    const goal = goalInput.trim();
    const suggested: Topic[] = [
      { id: "ai-1", name: `${goal} — Fundamentals`, difficulty: 2, estimated_minutes: 120 },
      { id: "ai-2", name: `${goal} — Core Concepts`, difficulty: 3, estimated_minutes: 150 },
      { id: "ai-3", name: `${goal} — Practice & Projects`, difficulty: 4, estimated_minutes: 180 },
    ];
    setState((s) => ({ ...s, topics: suggested }));
    setGoalInput("");
  }

  function handleFinish() {
    localStorage.setItem("daywise_onboarding", JSON.stringify(state));
    router.push("/today");
  }

  const weeklyMinutes = state.weekly_varies
    ? (Object.values(state.per_day_hours).reduce((a, b) => a + b, 0)) * 60
    : state.daily_hours * 60 * 7;
  
  const totalWeeks = Math.ceil(
    state.topics.reduce((sum, t) => sum + t.estimated_minutes, 0) / (weeklyMinutes || 1)
  ) || 4;

  const inputBase: React.CSSProperties = {
    border: "1px solid var(--border-subtle)", borderRadius: 7, padding: "10px 14px",
    fontSize: 13.5, color: "var(--text-primary)", background: "var(--bg-base)", outline: "none",
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-base)", display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <div style={{ background: "var(--sidebar-bg)", padding: "14px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 24, height: 24, borderRadius: 6, background: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Sparkles size={12} color="white" />
          </div>
          <span style={{ color: "rgba(255,255,255,0.9)", fontWeight: 600, fontSize: 15, letterSpacing: "-0.3px" }}>daywise</span>
        </div>
        <span style={{ color: "rgba(255,255,255,0.45)", fontSize: 12.5 }}>
          {step <= 3 ? `Step ${step} of 3` : "Preview"}
        </span>
      </div>

      {/* Step indicator */}
      <div style={{ background: "var(--bg-surface)", borderBottom: "1px solid var(--border-subtle)", padding: "12px 24px", display: "flex", gap: 8, alignItems: "center" }}>
        {[1, 2, 3].map((s) => (
          <div key={s} style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{
              width: 26, height: 26, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 600,
              background: s < step ? "var(--success)" : s === step ? "var(--accent)" : "var(--bg-muted)",
              color: s <= step ? "white" : "var(--text-tertiary)",
            }}>
              {s < step ? <Check size={13} /> : s}
            </div>
            <span style={{ fontSize: 13, color: s === step ? "var(--text-primary)" : "var(--text-tertiary)", fontWeight: s === step ? 500 : 400 }}>
              {s === 1 ? "Topics" : s === 2 ? "Schedule" : "Style"}
            </span>
            {s < 3 && <div style={{ width: 28, height: 1, background: s < step ? "var(--success)" : "var(--border-subtle)" }} />}
          </div>
        ))}
      </div>

      {/* Content */}
      <div style={{ flex: 1, display: "flex", justifyContent: "center", alignItems: "flex-start", padding: "40px 24px" }}>
        <div key={step} className={animClass} style={{ width: "100%", maxWidth: 600 }}>

          {/* STEP 1: Topics */}
          {step === 1 && (
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: "var(--accent-subtle)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <BookOpen size={20} color="var(--accent)" />
                </div>
                <div>
                  <h1 style={{ fontSize: 22, fontWeight: 700, color: "var(--text-primary)", margin: 0, letterSpacing: "-0.3px" }}>What do you want to learn?</h1>
                  <p style={{ fontSize: 13, color: "var(--text-tertiary)", margin: 0 }}>You can adjust topics anytime later.</p>
                </div>
              </div>

              {/* AI shortcut */}
              <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border-subtle)", borderRadius: 10, padding: 18, marginTop: 22, marginBottom: 14 }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", marginBottom: 10 }}>✨ Let AI suggest topics</p>
                <div style={{ display: "flex", gap: 8 }}>
                  <input value={goalInput} onChange={(e) => setGoalInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addFromGoal()}
                    placeholder='e.g. "Learn Python for data science"' style={{ ...inputBase, flex: 1 }} />
                  <button onClick={addFromGoal} style={{ background: "var(--accent)", color: "white", border: "none", borderRadius: 7, padding: "10px 18px", fontWeight: 500, fontSize: 13.5, cursor: "pointer", whiteSpace: "nowrap" }}>
                    Build
                  </button>
                </div>
              </div>

              {/* Manual add */}
              <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
                <input value={topicInput} onChange={(e) => setTopicInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addTopic()}
                  placeholder="Or add a topic manually..." style={{ ...inputBase, flex: 1 }} />
                <button onClick={addTopic} style={{ background: "var(--accent-subtle)", color: "var(--accent)", border: "1px solid var(--accent-muted)", borderRadius: 7, padding: "10px 14px", cursor: "pointer" }}>
                  <Plus size={17} />
                </button>
              </div>

              {/* Topic list */}
              {state.topics.length > 0 && (
                <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 22 }}>
                  {state.topics.map((t, i) => (
                    <div key={t.id} className="stagger-item" style={{ animationDelay: `${i * 50}ms`, background: "var(--bg-surface)", border: "1px solid var(--border-subtle)", borderRadius: 8, padding: "10px 14px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <span style={{ width: 22, height: 22, borderRadius: 6, background: "var(--accent-subtle)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 600, color: "var(--accent)" }}>{i + 1}</span>
                        <span style={{ fontSize: 13.5, fontWeight: 500, color: "var(--text-primary)" }}>{t.name}</span>
                      </div>
                      <button onClick={() => removeTopic(t.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-tertiary)", padding: 4, display: "flex" }}>
                        <X size={15} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {state.topics.length === 0 && (
                <div style={{ textAlign: "center", padding: "28px 0", color: "var(--text-tertiary)", fontSize: 13.5 }}>
                  No topics yet — add one above to get started.
                </div>
              )}

              <button onClick={goNext} disabled={state.topics.length === 0}
                style={{ width: "100%", background: state.topics.length > 0 ? "var(--accent)" : "var(--bg-muted)", color: state.topics.length > 0 ? "white" : "var(--text-disabled)", border: "none", borderRadius: 8, padding: "13px", fontWeight: 500, fontSize: 14, cursor: state.topics.length > 0 ? "pointer" : "not-allowed", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, transition: "all 150ms ease" }}>
                Continue <ChevronRight size={17} />
              </button>
            </div>
          )}

          {/* STEP 2: Schedule */}
          {step === 2 && (
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 22 }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: "var(--accent-subtle)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Clock size={20} color="var(--accent)" />
                </div>
                <div>
                  <h1 style={{ fontSize: 22, fontWeight: 700, color: "var(--text-primary)", margin: 0, letterSpacing: "-0.3px" }}>How much time per day?</h1>
                  <p style={{ fontSize: 13, color: "var(--text-tertiary)", margin: 0 }}>We&apos;ll never overload a day.</p>
                </div>
              </div>

              <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border-subtle)", borderRadius: 10, padding: 20, marginBottom: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                  <span style={{ fontWeight: 500, fontSize: 13.5, color: "var(--text-secondary)" }}>Daily hours</span>
                  <span style={{ fontSize: 22, fontWeight: 700, color: "var(--accent)" }}>{state.daily_hours}h</span>
                </div>
                <input type="range" min={0.5} max={8} step={0.5} value={state.daily_hours}
                  onChange={(e) => setState((s) => ({ ...s, daily_hours: parseFloat(e.target.value) }))}
                  style={{ width: "100%", accentColor: "var(--accent)" }} />
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--text-tertiary)", marginTop: 4 }}>
                  <span>30 min</span><span>8 hours</span>
                </div>
              </div>

              <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border-subtle)", borderRadius: 10, padding: 18, marginBottom: 22 }}>
                <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
                  <input type="checkbox" checked={state.weekly_varies} onChange={(e) => setState((s) => ({ ...s, weekly_varies: e.target.checked }))} style={{ accentColor: "var(--accent)", width: 15, height: 15 }} />
                  <span style={{ fontSize: 13.5, fontWeight: 500, color: "var(--text-secondary)" }}>My schedule varies by day</span>
                </label>
                {state.weekly_varies && (
                  <div style={{ marginTop: 14, display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 8 }}>
                    {DAYS.map((day) => (
                      <div key={day} style={{ textAlign: "center" }}>
                        <div style={{ fontSize: 11, color: "var(--text-tertiary)", marginBottom: 4 }}>{day}</div>
                        <input type="number" min={0} max={8} step={0.5} value={state.per_day_hours[day]}
                          onChange={(e) => setState((s) => ({ ...s, per_day_hours: { ...s.per_day_hours, [day]: parseFloat(e.target.value) || 0 } }))}
                          style={{ width: "100%", border: "1px solid var(--border-subtle)", borderRadius: 6, padding: "6px 4px", fontSize: 12, textAlign: "center", background: "var(--bg-base)", color: "var(--text-primary)" }} />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div style={{ display: "flex", gap: 10 }}>
                <button onClick={goBack} style={{ flex: 1, background: "var(--bg-surface)", color: "var(--text-secondary)", border: "1px solid var(--border-subtle)", borderRadius: 8, padding: "13px", fontWeight: 500, fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                  <ChevronLeft size={17} /> Back
                </button>
                <button onClick={goNext} style={{ flex: 2, background: "var(--accent)", color: "white", border: "none", borderRadius: 8, padding: "13px", fontWeight: 500, fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                  Continue <ChevronRight size={17} />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Learning style */}
          {step === 3 && (
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 22 }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: "var(--accent-subtle)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Zap size={20} color="var(--accent)" />
                </div>
                <div>
                  <h1 style={{ fontSize: 22, fontWeight: 700, color: "var(--text-primary)", margin: 0, letterSpacing: "-0.3px" }}>Pick your learning style</h1>
                  <p style={{ fontSize: 13, color: "var(--text-tertiary)", margin: 0 }}>You can change this anytime.</p>
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 18 }}>
                {intensityOptions.map((opt) => (
                  <button key={opt.value} onClick={() => setState((s) => ({ ...s, intensity: opt.value }))}
                    style={{
                      background: state.intensity === opt.value ? "var(--accent-subtle)" : "var(--bg-surface)",
                      border: `1.5px solid ${state.intensity === opt.value ? "var(--accent)" : "var(--border-subtle)"}`,
                      borderRadius: 10, padding: "14px 16px", cursor: "pointer", textAlign: "left",
                      display: "flex", alignItems: "center", gap: 14, transition: "all 150ms ease-out"
                    }}>
                    <span style={{ fontSize: 26 }}>{opt.icon}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontWeight: 600, fontSize: 14, color: "var(--text-primary)" }}>{opt.label}</span>
                      </div>
                      <p style={{ margin: "3px 0 0", fontSize: 12.5, color: "var(--text-tertiary)" }}>{opt.desc}</p>
                    </div>
                    {state.intensity === opt.value && <Check size={16} color="var(--accent)" />}
                  </button>
                ))}
              </div>

              {/* Spaced repetition toggle */}
              <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border-subtle)", borderRadius: 10, padding: 18, marginBottom: 22 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div>
                    <p style={{ margin: 0, fontWeight: 500, fontSize: 13.5, color: "var(--text-primary)" }}>Spaced Repetition</p>
                    <p style={{ margin: "3px 0 0", fontSize: 12, color: "var(--text-tertiary)", maxWidth: 360 }}>
                      Automatically schedule reviews at the best time to help you remember.
                    </p>
                  </div>
                  <button onClick={() => setState((s) => ({ ...s, sr_enabled: !s.sr_enabled }))}
                    style={{ width: 46, height: 25, borderRadius: 13, border: "none", cursor: "pointer", background: state.sr_enabled ? "var(--accent)" : "var(--border-default)", position: "relative", transition: "background 200ms", flexShrink: 0 }}>
                    <div style={{ width: 19, height: 19, borderRadius: "50%", background: "white", position: "absolute", top: 3, left: state.sr_enabled ? 24 : 3, transition: "left 200ms" }} />
                  </button>
                </div>
              </div>

              <div style={{ display: "flex", gap: 10 }}>
                <button onClick={goBack} style={{ flex: 1, background: "var(--bg-surface)", color: "var(--text-secondary)", border: "1px solid var(--border-subtle)", borderRadius: 8, padding: "13px", fontWeight: 500, fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                  <ChevronLeft size={17} /> Back
                </button>
                <button onClick={goNext} style={{ flex: 2, background: "var(--accent)", color: "white", border: "none", borderRadius: 8, padding: "13px", fontWeight: 500, fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                  Preview Schedule <ChevronRight size={17} />
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: Preview */}
          {step === 4 && (
            <div>
              <h1 style={{ fontSize: 22, fontWeight: 700, color: "var(--text-primary)", margin: "0 0 4px", letterSpacing: "-0.3px" }}>Your 7-day preview</h1>
              <p style={{ fontSize: 13, color: "var(--text-tertiary)", marginBottom: 22 }}>At this pace, you&apos;ll finish in ~{totalWeeks} weeks.</p>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 8, marginBottom: 22 }}>
                {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day, i) => (
                  <div key={day} className="stagger-item" style={{ animationDelay: `${i * 50}ms`, background: "var(--bg-surface)", border: `1px solid ${i === 0 ? "var(--accent-muted)" : "var(--border-subtle)"}`, borderRadius: 8, padding: "10px 6px", textAlign: "center" }}>
                    <div style={{ fontSize: 10, fontWeight: 600, color: i === 0 ? "var(--accent)" : "var(--text-tertiary)", marginBottom: 7 }}>{day}</div>
                    {state.topics.slice(0, 2).map((t, ti) => (
                      <div key={ti} style={{ fontSize: 9.5, background: "var(--accent-subtle)", borderRadius: 3, padding: "2px 4px", marginBottom: 3, color: "var(--accent)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {t.name.split(" ")[0]}
                      </div>
                    ))}
                    <div style={{ fontSize: 10, color: "var(--text-tertiary)", marginTop: 5 }}>
                      {state.weekly_varies ? state.per_day_hours[day as keyof typeof state.per_day_hours] : state.daily_hours}h
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ background: "var(--accent-subtle)", border: "1px solid var(--accent-muted)", borderRadius: 8, padding: "14px 16px", marginBottom: 22, display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ fontSize: 20 }}>📅</span>
                <div>
                  <p style={{ margin: 0, fontWeight: 600, fontSize: 13.5, color: "var(--text-primary)" }}>Looks achievable</p>
                  <p style={{ margin: 0, fontSize: 12.5, color: "var(--text-tertiary)" }}>{state.topics.length} topics · {state.weekly_varies ? "Custom schedule" : `${state.daily_hours}h/day`} · {state.intensity} pace</p>
                </div>
              </div>

              <div style={{ display: "flex", gap: 10 }}>
                <button onClick={goBack} style={{ flex: 1, background: "var(--bg-surface)", color: "var(--text-secondary)", border: "1px solid var(--border-subtle)", borderRadius: 8, padding: "13px", fontWeight: 500, fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                  <ChevronLeft size={17} /> Adjust
                </button>
                <button onClick={handleFinish} style={{ flex: 2, background: "var(--accent)", color: "white", border: "none", borderRadius: 8, padding: "13px", fontWeight: 500, fontSize: 14, cursor: "pointer" }}>
                  Looks good — Start Learning →
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
