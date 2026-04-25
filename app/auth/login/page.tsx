"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Mail, Lock, Eye, EyeOff, Sparkles } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");
  const [focusedField, setFocusedField] = useState<string | null>(null);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!email || !password) { setError("Please fill in all fields."); return; }
    setLoading(true);
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
    if (authError) { setError(authError.message); setLoading(false); return; }
    router.push("/today");
  }

  async function handleGoogleLogin() {
    setGoogleLoading(true);
    setError("");
    const { error: authError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/today` },
    });
    if (authError) { setError(authError.message); setGoogleLoading(false); }
  }

  const inputStyle = (field: string): React.CSSProperties => ({
    width: "100%", padding: "12px 14px 12px 40px",
    border: `1px solid ${focusedField === field ? "var(--accent)" : "var(--border-default)"}`,
    borderRadius: 8, fontSize: 13.5, color: "var(--text-primary)",
    background: "var(--bg-surface)", outline: "none",
    transition: "border-color 200ms ease, box-shadow 200ms ease",
    boxShadow: focusedField === field ? "var(--shadow-glow)" : "var(--shadow-sm)"
  });

  return (
    <div style={{ 
      minHeight: "100vh", 
      background: "radial-gradient(ellipse at top, var(--bg-surface), var(--bg-base))", 
      display: "flex", alignItems: "center", justifyContent: "center", padding: 24 
    }}>
      <div className="modal-enter" style={{ width: "100%", maxWidth: 400 }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <div style={{ width: 32, height: 32, borderRadius: 10, background: "linear-gradient(135deg, var(--accent), var(--accent-hover))", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "var(--shadow-md)" }}>
              <Sparkles size={16} color="white" />
            </div>
            <span style={{ fontWeight: 700, fontSize: 20, color: "var(--text-primary)", letterSpacing: "-0.5px" }}>daywise</span>
          </div>
          <p style={{ fontSize: 14, color: "var(--text-tertiary)" }}>Welcome back. Sign in to your account.</p>
        </div>

        <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border-subtle)", borderRadius: 16, padding: "32px", boxShadow: "var(--shadow-xl)" }}>
          <form onSubmit={handleLogin}>
            {error && <div style={{ background: "var(--error-subtle)", border: "1px solid #FECACA", borderRadius: 8, padding: "12px 14px", marginBottom: 20, fontSize: 13.5, color: "var(--error)" }}>{error}</div>}

            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 13, fontWeight: 500, color: "var(--text-secondary)", display: "block", marginBottom: 8 }}>Email</label>
              <div style={{ position: "relative" }}>
                <Mail size={16} color={focusedField === "email" ? "var(--accent)" : "var(--text-tertiary)"} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", transition: "color 200ms" }} />
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com"
                  onFocus={() => setFocusedField("email")} onBlur={() => setFocusedField(null)} style={inputStyle("email")} />
              </div>
            </div>

            <div style={{ marginBottom: 24 }}>
              <label style={{ fontSize: 13, fontWeight: 500, color: "var(--text-secondary)", display: "block", marginBottom: 8 }}>Password</label>
              <div style={{ position: "relative" }}>
                <Lock size={16} color={focusedField === "password" ? "var(--accent)" : "var(--text-tertiary)"} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", transition: "color 200ms" }} />
                <input type={showPass ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••"
                  onFocus={() => setFocusedField("password")} onBlur={() => setFocusedField(null)} style={{ ...inputStyle("password"), paddingRight: 40 }} />
                <button type="button" onClick={() => setShowPass((s) => !s)} style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--text-tertiary)", display: "flex" }}>
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading}
              onMouseEnter={(e) => { if (!loading) (e.currentTarget as HTMLElement).style.transform = "scale(0.98)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = "scale(1)"; }}
              onMouseDown={(e) => { (e.currentTarget as HTMLElement).style.transform = "scale(0.96)"; }}
              onMouseUp={(e) => { (e.currentTarget as HTMLElement).style.transform = "scale(0.98)"; }}
              style={{ width: "100%", background: loading ? "var(--accent-muted)" : "linear-gradient(135deg, var(--accent), var(--accent-hover))", color: "white", border: "none", borderRadius: 8, padding: "12px", fontWeight: 600, fontSize: 14, cursor: loading ? "not-allowed" : "pointer", transition: "all 200ms ease", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, boxShadow: "var(--shadow-md)" }}>
              {loading ? <><div style={{ width: 14, height: 14, border: "2px solid rgba(255,255,255,0.4)", borderTopColor: "white", borderRadius: "50%", animation: "spin 0.6s linear infinite" }} />Signing in...</> : "Sign in"}
            </button>
          </form>

          <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "24px 0" }}>
            <div style={{ flex: 1, height: 1, background: "var(--border-subtle)" }} />
            <span style={{ fontSize: 12, color: "var(--text-tertiary)" }}>or</span>
            <div style={{ flex: 1, height: 1, background: "var(--border-subtle)" }} />
          </div>

          <button
            onClick={handleGoogleLogin}
            disabled={googleLoading}
            onMouseEnter={(e) => { if (!googleLoading) (e.currentTarget as HTMLElement).style.background = "var(--bg-subtle)"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--bg-surface)"; }}
            style={{ width: "100%", background: "var(--bg-surface)", color: "var(--text-primary)", border: "1px solid var(--border-default)", borderRadius: 8, padding: "12px", fontWeight: 500, fontSize: 14, cursor: googleLoading ? "not-allowed" : "pointer", transition: "background 200ms ease, border-color 200ms ease", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, opacity: googleLoading ? 0.7 : 1, boxShadow: "var(--shadow-sm)" }}>
            {googleLoading
              ? <><div style={{ width: 14, height: 14, border: "2px solid var(--border-default)", borderTopColor: "var(--accent)", borderRadius: "50%", animation: "spin 0.6s linear infinite" }} />Redirecting...</>
              : <><svg width="18" height="18" viewBox="0 0 18 18"><path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"/><path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z"/><path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"/><path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"/></svg>Continue with Google</>}
          </button>
        </div>

        <p style={{ textAlign: "center", fontSize: 13, color: "var(--text-tertiary)", marginTop: 24 }}>
          Don&apos;t have an account?{" "}
          <Link href="/auth/signup" style={{ color: "var(--accent)", fontWeight: 600, textDecoration: "none" }}>Sign up</Link>
        </p>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
