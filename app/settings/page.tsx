"use client";
import React, { useState, useEffect, useRef } from "react";
import Sidebar from "@/components/Sidebar";
import { supabase } from "@/lib/supabase";
import { Loader2, Upload, User, Check } from "lucide-react";
import type { Intensity } from "@/types";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const intensityOptions = [
  { value: "relaxed", label: "Relaxed", desc: "Easy pace, plenty of breaks." },
  { value: "balanced", label: "Balanced", desc: "Steady progress. Recommended." },
  { value: "intense", label: "Intense", desc: "Maximum learning, minimal breaks." },
];

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");

  const [profile, setProfile] = useState({
    id: "",
    full_name: "",
    avatar_url: ""
  });
  
  const [schedule, setSchedule] = useState({
    daily_hours: 1.5,
    weekly_varies: false,
    per_day_hours: { Mon: 1.5, Tue: 1.5, Wed: 1.5, Thu: 1.5, Fri: 1.5, Sat: 1.5, Sun: 1.5 }
  });

  const [pacing, setPacing] = useState<Intensity>("balanced");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function load() {
      const { data: authData } = await supabase.auth.getUser();
      if (!authData?.user) return;
      const userId = authData.user.id;

      const { data } = await supabase.from("profiles").select("*").eq("id", userId).single();
      if (data) {
        setProfile({ id: userId, full_name: data.full_name || "", avatar_url: data.avatar_url || "" });
        if (data.schedule_json) setSchedule(data.schedule_json);
        if (data.pacing) setPacing(data.pacing as Intensity);
      } else {
         setProfile({ ...profile, id: userId });
      }
      setLoading(false);
    }
    load();
  }, []);

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !profile.id) return;
    setSaving(true);
    
    // Upload to avatars bucket
    const fileExt = file.name.split('.').pop();
    const filePath = `${profile.id}-${Math.random()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage.from("avatars").upload(filePath, file);
    if (!uploadError) {
      const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(filePath);
      setProfile((p) => ({ ...p, avatar_url: publicUrl }));
      await supabase.from("profiles").upsert({ id: profile.id, avatar_url: publicUrl });
    }
    setSaving(false);
  }

  async function handleSave() {
    setSaving(true);
    try {
      await supabase.from("profiles").upsert({
        id: profile.id,
        full_name: profile.full_name,
        schedule_json: schedule,
        pacing: pacing
      });
      setSaveMessage("Settings saved successfully.");
      setTimeout(() => setSaveMessage(""), 3000);
    } catch (e) {
      console.error(e);
    }
    setSaving(false);
  }

  if (loading) {
     return <div style={{ minHeight: "100vh", background: "var(--bg-base)", display: "flex", alignItems: "center", justifyContent: "center" }}><Loader2 className="animate-spin text-indigo-500" size={32} /></div>;
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--bg-base)" }}>
      <Sidebar />

      <main style={{ marginLeft: 224, flex: 1, paddingBottom: 80 }} className="settings-main">
        <div style={{ maxWidth: 640, margin: "0 auto", padding: "40px 32px" }}>

          {/* Header */}
          <div style={{ marginBottom: 32, display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
            <div>
              <h1 style={{ margin: 0, fontSize: 32, fontWeight: 700, color: "var(--text-primary)", letterSpacing: "-0.8px" }}>Settings</h1>
              <p style={{ margin: "8px 0 0", fontSize: 14.5, color: "var(--text-secondary)" }}>Manage your profile and learning pacing.</p>
            </div>
            
            <button onClick={handleSave} disabled={saving} style={{ background: "linear-gradient(135deg, var(--accent), var(--accent-hover))", color: "white", border: "none", borderRadius: 8, padding: "10px 20px", fontWeight: 600, fontSize: 14, cursor: saving ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: 8, boxShadow: "var(--shadow-sm)" }}>
              {saving ? <Loader2 size={16} className="animate-spin" /> : "Save Changes"}
            </button>
          </div>

          {saveMessage && (
            <div style={{ background: "var(--success-subtle)", color: "var(--success)", padding: "12px 16px", borderRadius: 8, marginBottom: 24, fontSize: 14, fontWeight: 500, border: "1px solid #A7F3D0", display: "flex", alignItems: "center", gap: 8 }}>
              <Check size={16} /> {saveMessage}
            </div>
          )}

          {/* Profile Section */}
          <section style={{ background: "var(--bg-surface)", border: "1px solid var(--border-subtle)", borderRadius: 16, padding: "24px", marginBottom: 24, boxShadow: "var(--shadow-sm)" }}>
            <h2 style={{ fontSize: 18, fontWeight: 600, color: "var(--text-primary)", marginBottom: 20 }}>Profile</h2>
            
            <div style={{ display: "flex", gap: 24, alignItems: "center", marginBottom: 24 }}>
              <div style={{ width: 80, height: 80, borderRadius: "50%", background: "var(--bg-muted)", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                {profile.avatar_url ? (
                  <img src={profile.avatar_url} alt="Avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  <User size={32} color="var(--text-tertiary)" />
                )}
              </div>
              <div>
                <input type="file" accept="image/*" ref={fileInputRef} onChange={handleAvatarUpload} style={{ display: "none" }} />
                <button onClick={() => fileInputRef.current?.click()} style={{ background: "var(--bg-subtle)", border: "1px solid var(--border-default)", padding: "8px 16px", borderRadius: 8, fontSize: 13, fontWeight: 600, color: "var(--text-secondary)", cursor: "pointer", display: "flex", gap: 8, alignItems: "center" }}>
                  <Upload size={14} /> Upload Avatar
                </button>
                <p style={{ fontSize: 12, color: "var(--text-tertiary)", marginTop: 8 }}>JPEG, PNG max 2MB</p>
              </div>
            </div>

            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 8 }}>Display Name</label>
              <input value={profile.full_name} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setProfile({...profile, full_name: e.target.value})} 
                     style={{ width: "100%", border: "1px solid var(--border-default)", borderRadius: 8, padding: "10px 14px", fontSize: 14, color: "var(--text-primary)", outline: "none" }} />
            </div>
          </section>

          {/* Schedule Section */}
          <section style={{ background: "var(--bg-surface)", border: "1px solid var(--border-subtle)", borderRadius: 16, padding: "24px", marginBottom: 24, boxShadow: "var(--shadow-sm)" }}>
            <h2 style={{ fontSize: 18, fontWeight: 600, color: "var(--text-primary)", marginBottom: 20 }}>Schedule</h2>

            <div style={{ marginBottom: 24 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <span style={{ fontWeight: 600, fontSize: 14, color: "var(--text-secondary)" }}>Base daily hours</span>
                <span style={{ fontSize: 20, fontWeight: 700, color: "var(--accent)" }}>{schedule.daily_hours}h</span>
              </div>
              <input type="range" min={0.5} max={8} step={0.5} value={schedule.daily_hours}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSchedule((s) => ({ ...s, daily_hours: parseFloat(e.target.value) }))}
                style={{ width: "100%", accentColor: "var(--accent)", cursor: "pointer", height: 6 }} />
            </div>

            <div>
              <label style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer", marginBottom: 16 }}>
                <input type="checkbox" checked={schedule.weekly_varies} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSchedule((s) => ({ ...s, weekly_varies: e.target.checked }))} style={{ accentColor: "var(--accent)", width: 16, height: 16, cursor: "pointer" }} />
                <span style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}>My schedule varies by day</span>
              </label>
              {schedule.weekly_varies && (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 8 }}>
                  {DAYS.map((day) => (
                    <div key={day} style={{ textAlign: "center" }}>
                      <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 6 }}>{day}</div>
                      <input type="number" min={0} max={8} step={0.5} value={schedule.per_day_hours[day as keyof typeof schedule.per_day_hours]}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSchedule((s) => ({ ...s, per_day_hours: { ...s.per_day_hours, [day]: parseFloat(e.target.value) || 0 } }))}
                        style={{ width: "100%", border: "1px solid var(--border-default)", borderRadius: 6, padding: "6px 2px", fontSize: 13, fontWeight: 500, textAlign: "center", outline: "none" }} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* Pacing Section */}
          <section style={{ background: "var(--bg-surface)", border: "1px solid var(--border-subtle)", borderRadius: 16, padding: "24px", boxShadow: "var(--shadow-sm)" }}>
            <h2 style={{ fontSize: 18, fontWeight: 600, color: "var(--text-primary)", marginBottom: 20 }}>Pacing</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {intensityOptions.map((opt) => (
                <label key={opt.value} style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "16px", border: `1px solid ${pacing === opt.value ? "var(--accent)" : "var(--border-default)"}`, borderRadius: 12, cursor: "pointer", background: pacing === opt.value ? "var(--accent-subtle)" : "transparent" }}>
                  <input type="radio" name="pacing" value={opt.value} checked={pacing === opt.value} onChange={() => setPacing(opt.value as Intensity)} style={{ accentColor: "var(--accent)", marginTop: 2 }} />
                  <div>
                    <p style={{ margin: 0, fontWeight: 600, fontSize: 14, color: "var(--text-primary)" }}>{opt.label}</p>
                    <p style={{ margin: "4px 0 0", fontSize: 13, color: "var(--text-tertiary)" }}>{opt.desc}</p>
                  </div>
                </label>
              ))}
            </div>
          </section>

        </div>
      </main>

      <style>{`
        @media (max-width: 768px) { .settings-main { margin-left: 0 !important; padding-bottom: 120px !important; } }
      `}</style>
    </div>
  );
}
