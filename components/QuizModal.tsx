"use client";
import React, { useState } from "react";
import { Loader2, X, CheckCircle2, XCircle, ChevronRight } from "lucide-react";
import { supabase } from "@/lib/supabase";

interface Question {
  question: string;
  options: string[];
  correct_index: number;
  explanation: string;
}

interface QuizModalProps {
  topicId: string;
  topicTitle: string;
  topicDescription?: string;
  onClose: () => void;
}

export default function QuizModal({ topicId, topicTitle, topicDescription, onClose }: QuizModalProps) {
  const [stage, setStage] = useState<"loading" | "quiz" | "result">("loading");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [answers, setAnswers] = useState<number[]>([]);
  const [transitioning, setTransitioning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    async function loadQuiz() {
      try {
        const res = await fetch("/api/quiz", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ topic_title: topicTitle, topic_description: topicDescription }),
        });
        if (!res.ok) throw new Error("Failed to generate quiz");
        const data = await res.json() as { questions: Question[] };
        setQuestions(data.questions);
        setStage("quiz");
      } catch {
        setError("Could not generate quiz. Please try again.");
        setStage("quiz");
      }
    }
    loadQuiz();
  }, [topicTitle, topicDescription]);

  async function handleAnswer() {
    if (selected === null) return;
    const newAnswers = [...answers, selected];
    setAnswers(newAnswers);

    setTransitioning(true);
    setTimeout(() => {
      setTransitioning(false);
      if (currentQ + 1 < questions.length) {
        setCurrentQ(currentQ + 1);
        setSelected(null);
      } else {
        // Done — save score and show results
        const score = newAnswers.filter((a, i) => a === questions[i].correct_index).length;
        saveQuizResult(score, questions.length);
        setStage("result");
      }
    }, 350);
  }

  async function saveQuizResult(score: number, total: number) {
    const { data: authData } = await supabase.auth.getUser();
    if (!authData?.user) return;

    const userId = authData.user.id;

    // Save quiz attempt
    await supabase.from("quiz_attempts").insert({
      user_id: userId,
      topic_id: topicId,
      score,
      total_questions: total,
    });

    // Trigger SM-2 update: map quiz score (0-total) → SM-2 score (0-5)
    const sm2Score = Math.round((score / total) * 5);
    await fetch("/api/sm2", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: userId, topic_id: topicId, score: sm2Score }),
    });
  }

  const score = answers.filter((a, i) => a === questions[i]?.correct_index).length;

  return (
    <div
      style={{ position: "fixed", inset: 0, zIndex: 3000, display: "flex", alignItems: "center", justifyContent: "center", padding: 24, background: "rgba(15,23,42,0.7)", backdropFilter: "blur(4px)", animation: "fadeIn 200ms ease-out" }}
      onClick={onClose}
    >
      <div
        className="modal-enter"
        onClick={e => e.stopPropagation()}
        style={{ width: "100%", maxWidth: 560, background: "var(--bg-surface)", borderRadius: 24, boxShadow: "var(--shadow-xl)", border: "1px solid var(--border-default)", overflow: "hidden" }}
      >
        {/* Header */}
        <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--border-subtle)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: "var(--accent)", textTransform: "uppercase", letterSpacing: "0.07em" }}>Test Yourself</p>
            <p style={{ margin: "2px 0 0", fontSize: 16, fontWeight: 700, color: "var(--text-primary)" }}>{topicTitle}</p>
          </div>
          <button onClick={onClose} style={{ background: "var(--bg-muted)", border: "none", borderRadius: 8, width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "var(--text-secondary)" }}>
            <X size={16} />
          </button>
        </div>

        {/* Loading */}
        {stage === "loading" && (
          <div style={{ padding: "60px 24px", display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
            <Loader2 size={32} className="animate-spin" color="var(--accent)" />
            <p style={{ margin: 0, color: "var(--text-secondary)", fontSize: 14 }}>Generating your quiz...</p>
          </div>
        )}

        {/* Quiz */}
        {stage === "quiz" && error && (
          <div style={{ padding: "40px 24px", textAlign: "center" }}>
            <p style={{ color: "var(--error)", fontSize: 14 }}>{error}</p>
          </div>
        )}

        {stage === "quiz" && !error && questions.length > 0 && (
          <div style={{ padding: "28px 24px", opacity: transitioning ? 0 : 1, transform: transitioning ? "translateX(20px)" : "translateX(0)", transition: "opacity 300ms ease, transform 300ms ease" }}>
            {/* Progress */}
            <div style={{ display: "flex", gap: 6, marginBottom: 24 }}>
              {questions.map((_, i) => (
                <div key={i} style={{ flex: 1, height: 4, borderRadius: 2, background: i < currentQ ? "var(--accent)" : i === currentQ ? "var(--accent-muted)" : "var(--bg-muted)", transition: "background 300ms" }} />
              ))}
            </div>

            <p style={{ fontSize: 12, color: "var(--text-tertiary)", fontWeight: 600, marginBottom: 10 }}>Question {currentQ + 1} of {questions.length}</p>
            <p style={{ fontSize: 17, fontWeight: 600, color: "var(--text-primary)", lineHeight: 1.5, marginBottom: 24 }}>{questions[currentQ].question}</p>

            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 24 }}>
              {questions[currentQ].options.map((opt, i) => (
                <button
                  key={i}
                  onClick={() => setSelected(i)}
                  style={{
                    padding: "14px 18px", borderRadius: 12, border: `2px solid ${selected === i ? "var(--accent)" : "var(--border-default)"}`,
                    background: selected === i ? "var(--accent-subtle)" : "var(--bg-subtle)",
                    cursor: "pointer", textAlign: "left", fontSize: 14, fontWeight: 500,
                    color: selected === i ? "var(--accent)" : "var(--text-secondary)",
                    transition: "all 150ms ease",
                  }}
                >
                  <span style={{ marginRight: 10, fontWeight: 700 }}>{String.fromCharCode(65 + i)}.</span>{opt}
                </button>
              ))}
            </div>

            <button
              onClick={handleAnswer}
              disabled={selected === null}
              style={{ width: "100%", padding: "14px", borderRadius: 12, border: "none", background: selected !== null ? "var(--accent)" : "var(--bg-muted)", color: selected !== null ? "white" : "var(--text-disabled)", fontWeight: 600, fontSize: 15, cursor: selected !== null ? "pointer" : "not-allowed", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, transition: "background 200ms" }}
            >
              {currentQ + 1 === questions.length ? "Finish Quiz" : "Next"} <ChevronRight size={18} />
            </button>
          </div>
        )}

        {/* Results */}
        {stage === "result" && (
          <div style={{ padding: "32px 24px" }}>
            <div style={{ textAlign: "center", marginBottom: 28 }}>
              <div style={{ fontSize: 56, marginBottom: 8 }}>{score === questions.length ? "🎉" : score >= questions.length / 2 ? "👍" : "📚"}</div>
              <p style={{ fontSize: 32, fontWeight: 800, color: "var(--text-primary)", margin: "0 0 4px" }}>{score} / {questions.length}</p>
              <p style={{ fontSize: 14, color: "var(--text-secondary)", margin: 0 }}>{score === questions.length ? "Perfect score! Outstanding memory." : score >= questions.length / 2 ? "Good job! Review the explanations below." : "Keep studying — review the explanations."}</p>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 24 }}>
              {questions.map((q, i) => {
                const isCorrect = answers[i] === q.correct_index;
                return (
                  <div key={i} style={{ padding: "14px 16px", borderRadius: 12, border: `1px solid ${isCorrect ? "var(--success)" : "var(--error)"}`, background: isCorrect ? "var(--success-subtle)" : "var(--error-subtle)" }}>
                    <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                      {isCorrect ? <CheckCircle2 size={18} color="var(--success)" style={{ flexShrink: 0, marginTop: 1 }} /> : <XCircle size={18} color="var(--error)" style={{ flexShrink: 0, marginTop: 1 }} />}
                      <div>
                        <p style={{ margin: "0 0 4px", fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>{q.question}</p>
                        {!isCorrect && (
                          <>
                            <p style={{ margin: "0 0 2px", fontSize: 12, color: "var(--error)" }}>Your answer: {q.options[answers[i]]}</p>
                            <p style={{ margin: "0 0 4px", fontSize: 12, color: "var(--success)" }}>Correct: {q.options[q.correct_index]}</p>
                            <p style={{ margin: 0, fontSize: 12, color: "var(--text-secondary)", fontStyle: "italic" }}>{q.explanation}</p>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <button onClick={onClose} style={{ width: "100%", padding: "14px", borderRadius: 12, border: "none", background: "var(--accent)", color: "white", fontWeight: 600, fontSize: 15, cursor: "pointer" }}>
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
