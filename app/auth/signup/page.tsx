"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Mail, Lock, Eye, EyeOff, User, Sparkles } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");
  const [focusedField, setFocusedField] = useState<string | null>(null);

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!name || !email || !password) { setError("Please fill in all fields."); return; }
    if (password.length < 8) { setError("Password must be at least 8 characters."); return; }
    setLoading(true);
    const { error: authError } = await supabase.auth.signUp({
      email, password,
      options: { data: { full_name: name } },
    });
    if (authError) { setError(authError.message); setLoading(false); return; }
    router.push("/onboarding");
  }

  async function handleGoogleSignup() {
    setGoogleLoading(true);
    setError("");
    const { error: authError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/onboarding` },
    });
    if (authError) { setError(authError.message); setGoogleLoading(false); }
    // On success, Supabase redirects the browser automatically
  }

  const inputStyle = (field: string): React.CSSProperties => ({
    width: "100%", padding: "10px 14px 10px 38px",
    border: `1px solid ${focusedField === field ? "var(--accent)" : "var(--border-subtle)"}`,
    borderRadius: 7, fontSize: 13.5, color: "var(--text-primary)",
    background: "var(--bg-base)", outline: "none",
    transition: "border-color 150ms ease",
    boxShadow: focusedField === field ? "0 0 0 3px rgba(79,70,229,0.08)" : "none"
  });

  const strength = password.length === 0 ? 0 : password.length < 6 ? 1 : password.length < 10 ? 2 : 3;
  const strengthColor = ["transparent", "var(--error)", "var(--warning)", "var(--success)"][strength];
  const strengthLabel = ["", "Weak", "Fair", "Strong"][strength];

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-base)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div className="modal-enter" style={{ width: "100%", maxWidth: 380 }}>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Sparkles size={14} color="white" />
            </div>
            <span style={{ fontWeight: 600, fontSize: 17, color: "var(--text-primary)", letterSpacing: "-0.3px" }}>daywise</span>
          </div>
          <p style={{ fontSize: 13, color: "var(--text-tertiary)" }}>Create your account</p>
        </div>

        <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border-subtle)", borderRadius: 10, padding: "24px" }}>
          <form onSubmit={handleSignup}>
            {error && <div style={{ background: "var(--error-subtle)", border: "1px solid #FECACA", borderRadius: 6, padding: "10px 12px", marginBottom: 16, fontSize: 13, color: "var(--error)" }}>{error}</div>}

            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 12.5, fontWeight: 500, color: "var(--text-secondary)", display: "block", marginBottom: 6 }}>Full name</label>
              <div style={{ position: "relative" }}>
                <User size={14} color="var(--text-tertiary)" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} />
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name"
                  onFocus={() => setFocusedField("name")} onBlur={() => setFocusedField(null)} style={inputStyle("name")} />
              </div>
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 12.5, fontWeight: 500, color: "var(--text-secondary)", display: "block", marginBottom: 6 }}>Email</label>
              <div style={{ position: "relative" }}>
                <Mail size={14} color="var(--text-tertiary)" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} />
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com"
                  onFocus={() => setFocusedField("email")} onBlur={() => setFocusedField(null)} style={inputStyle("email")} />
              </div>
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 12.5, fontWeight: 500, color: "var(--text-secondary)", display: "block", marginBottom: 6 }}>Password</label>
              <div style={{ position: "relative" }}>
                <Lock size={14} color="var(--text-tertiary)" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} />
                <input type={showPass ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Min. 8 characters"
                  onFocus={() => setFocusedField("password")} onBlur={() => setFocusedField(null)} style={{ ...inputStyle("password"), paddingRight: 38 }} />
                <button type="button" onClick={() => setShowPass((s) => !s)} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--text-tertiary)", display: "flex" }}>
                  {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
              {/* ANIMATION: Password strength microinteraction */}
              {password.length > 0 && (
                <div style={{ marginTop: 8 }}>
                  <div style={{ display: "flex", gap: 4, marginBottom: 4 }}>
                    {[1, 2, 3].map((s) => (
                      <div key={s} style={{ flex: 1, height: 2, borderRadius: 99, background: s <= strength ? strengthColor : "var(--bg-muted)", transition: "background 300ms ease" }} />
                    ))}
                  </div>
                  <p style={{ fontSize: 11, color: strengthColor, fontWeight: 500, transition: "color 300ms ease" }}>{strengthLabel}</p>
                </div>
              )}
            </div>

            <button type="submit" disabled={loading}
              onMouseEnter={(e) => { if (!loading) (e.currentTarget as HTMLElement).style.transform = "scale(0.98)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = "scale(1)"; }}
              onMouseDown={(e) => { (e.currentTarget as HTMLElement).style.transform = "scale(0.96)"; }}
              onMouseUp={(e) => { (e.currentTarget as HTMLElement).style.transform = "scale(0.98)"; }}
              style={{ width: "100%", background: loading ? "var(--accent-muted)" : "var(--accent)", color: "white", border: "none", borderRadius: 7, padding: "11px", fontWeight: 500, fontSize: 14, cursor: loading ? "not-allowed" : "pointer", transition: "all 150ms ease", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
              {loading ? <><div style={{ width: 14, height: 14, border: "2px solid rgba(255,255,255,0.4)", borderTopColor: "white", borderRadius: "50%", animation: "spin 0.6s linear infinite" }} />Creating account...</> : "Create account"}
            </button>
          </form>

          <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "18px 0" }}>
            <div style={{ flex: 1, height: 1, background: "var(--border-subtle)" }} />
            <span style={{ fontSize: 11.5, color: "var(--text-tertiary)" }}>or</span>
            <div style={{ flex: 1, height: 1, background: "var(--border-subtle)" }} />
          </div>

          <button
            onClick={handleGoogleSignup}
            disabled={googleLoading}
            onMouseEnter={(e) => { if (!googleLoading) (e.currentTarget as HTMLElement).style.background = "var(--bg-subtle)"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--bg-base)"; }}
            style={{ width: "100%", background: "var(--bg-base)", color: "var(--text-primary)", border: "1px solid var(--border-subtle)", borderRadius: 7, padding: "10px", fontWeight: 500, fontSize: 13.5, cursor: googleLoading ? "not-allowed" : "pointer", transition: "background 150ms ease", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, opacity: googleLoading ? 0.7 : 1 }}>
            {googleLoading
              ? <><div style={{ width: 14, height: 14, border: "2px solid var(--border-default)", borderTopColor: "var(--accent)", borderRadius: "50%", animation: "spin 0.6s linear infinite" }} />Redirecting...</>
              : <><svg width="16" height="16" viewBox="0 0 18 18"><path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"/><path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z"/><path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"/><path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"/></svg>Continue with Google</>}
          </button>
        </div>

        <p style={{ textAlign: "center", fontSize: 12.5, color: "var(--text-tertiary)", marginTop: 18 }}>
          Already have an account?{" "}
          <Link href="/auth/login" style={{ color: "var(--accent)", fontWeight: 500, textDecoration: "none" }}>Sign in</Link>
        </p>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
