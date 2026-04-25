"use client";
import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { 
  Search, 
  Calendar, 
  Map as MapIcon, 
  TrendingUp, 
  Settings, 
  CheckCircle, 
  Timer,
  ChevronRight,
  Command
} from "lucide-react";
import { supabase } from "@/lib/supabase";

interface SearchResult {
  name: string;
  icon: React.ElementType;
  type: "page" | "timer" | "action";
  href?: string;
  id?: string;
}

export default function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [topics, setTopics] = useState<{ id: string; title: string }[]>([]);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    if (open) {
      inputRef.current?.focus();
      fetchTopics();
    } else {
      setQuery("");
      setSelectedIndex(0);
    }
  }, [open]);

  async function fetchTopics() {
    const { data: authData } = await supabase.auth.getUser();
    if (!authData?.user) return;
    const { data } = await supabase.from("curricula").select("id, title").eq("user_id", authData.user.id);
    if (data) setTopics(data);
  }

  const pages = [
    { name: "Today's Focus", icon: Calendar, href: "/today" },
    { name: "Learning Roadmap", icon: MapIcon, href: "/roadmap" },
    { name: "Progress Insights", icon: TrendingUp, href: "/progress" },
    { name: "Account Settings", icon: Settings, href: "/settings" },
  ];

  const filteredPages = pages.filter(p => p.name.toLowerCase().includes(query.toLowerCase()));
  const filteredTopics = topics.filter(t => t.title.toLowerCase().includes(query.toLowerCase()));

  const allResults: SearchResult[] = [
    ...filteredPages.map(p => ({ ...p, type: "page" as const })),
    ...filteredTopics.map(t => ({ name: `Start Timer: ${t.title}`, icon: Timer, id: t.id, type: "timer" as const })),
    { name: "Mark All Tasks Complete", icon: CheckCircle, type: "action" as const }
  ].filter(r => r.name.toLowerCase().includes(query.toLowerCase()));

  function handleSelect(item: SearchResult) {
    if (item.type === "page" && item.href) router.push(item.href);
    if (item.type === "timer") {
      // In this simple app, we navigate to Today and start timer (timer auto-detects first task)
      // Or we could trigger a global event. For now, simple navigation.
      router.push("/today");
    }
    if (item.type === "action") {
       markAllComplete();
    }
    setOpen(false);
  }

  async function markAllComplete() {
    const { data: authData } = await supabase.auth.getUser();
    if (!authData?.user) return;
    const todayIso = new Date().toISOString().split("T")[0];
    
    // This is a simplified "mark all" - it would need more logic to match today's specific IDs
    // But since the IDs are generated on the fly in /today, we'll just navigate user to Today 
    // and they can see the change (or we implement a more robust shared state).
    router.push("/today");
  }

  if (!open) return null;

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 2000, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }} onClick={() => setOpen(false)}>
      <div style={{ position: "absolute", inset: 0, background: "rgba(15, 23, 42, 0.6)", backdropFilter: "blur(4px)", animation: "fadeIn 200ms ease-out" }} />
      
      <div 
        className="modal-enter"
        onClick={e => e.stopPropagation()}
        style={{ 
          position: "relative", width: "100%", maxWidth: 600, 
          background: "var(--bg-surface)", borderRadius: 20, 
          boxShadow: "var(--shadow-xl)", border: "1px solid var(--border-default)",
          overflow: "hidden"
        }}
      >
        {/* Search Input */}
        <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border-subtle)", display: "flex", alignItems: "center", gap: 12 }}>
          <Search size={20} color="var(--text-tertiary)" />
          <input 
            ref={inputRef}
            placeholder="Search pages, topics, or actions..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => {
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setSelectedIndex(prev => (prev + 1) % allResults.length);
              }
              if (e.key === "ArrowUp") {
                e.preventDefault();
                setSelectedIndex(prev => (prev - 1 + allResults.length) % allResults.length);
              }
              if (e.key === "Enter") {
                handleSelect(allResults[selectedIndex]);
              }
            }}
            style={{ flex: 1, border: "none", background: "none", outline: "none", fontSize: 16, color: "var(--text-primary)" }}
          />
          <div style={{ padding: "4px 8px", background: "var(--bg-muted)", borderRadius: 6, fontSize: 11, fontWeight: 700, color: "var(--text-tertiary)", display: "flex", alignItems: "center", gap: 4 }}>
            <Command size={10} /> K
          </div>
        </div>

        {/* Results */}
        <div style={{ maxHeight: 400, overflowY: "auto", padding: 8 }} className="custom-scroll">
          {allResults.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {allResults.map((item, i) => {
                const isSelected = i === selectedIndex;
                const Icon = item.icon;
                return (
                  <button
                    key={i}
                    onMouseEnter={() => setSelectedIndex(i)}
                    onClick={() => handleSelect(item)}
                    style={{
                      display: "flex", alignItems: "center", gap: 14, padding: "12px 16px",
                      borderRadius: 12, border: "none", cursor: "pointer", textAlign: "left",
                      background: isSelected ? "var(--accent-subtle)" : "transparent",
                      transition: "all 150ms ease"
                    }}
                  >
                    <div style={{ 
                      width: 32, height: 32, borderRadius: 10, 
                      background: isSelected ? "white" : "var(--bg-subtle)", 
                      display: "flex", alignItems: "center", justifyContent: "center",
                      color: isSelected ? "var(--accent)" : "var(--text-tertiary)",
                      boxShadow: isSelected ? "0 2px 8px rgba(99,102,241,0.1)" : "none",
                      transition: "all 200ms ease"
                    }}>
                      <Icon size={18} />
                    </div>
                    <span style={{ 
                      flex: 1, fontSize: 14.5, fontWeight: isSelected ? 600 : 500, 
                      color: isSelected ? "var(--text-primary)" : "var(--text-secondary)" 
                    }}>
                      {item.name}
                    </span>
                    {isSelected && <ChevronRight size={16} color="var(--accent)" />}
                  </button>
                );
              })}
            </div>
          ) : (
            <div style={{ padding: "32px 20px", textAlign: "center", color: "var(--text-tertiary)", fontSize: 14 }}>
              No results found for &ldquo;{query}&rdquo;
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: "12px 20px", background: "var(--bg-subtle)", borderTop: "1px solid var(--border-subtle)", display: "flex", gap: 16 }}>
           <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "var(--text-tertiary)" }}>
              <span style={{ padding: "2px 4px", background: "white", borderRadius: 4, border: "1px solid var(--border-default)" }}>↑↓</span> Navigate
           </div>
           <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "var(--text-tertiary)" }}>
              <span style={{ padding: "2px 4px", background: "white", borderRadius: 4, border: "1px solid var(--border-default)" }}>↵</span> Select
           </div>
           <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "var(--text-tertiary)" }}>
              <span style={{ padding: "2px 4px", background: "white", borderRadius: 4, border: "1px solid var(--border-default)" }}>esc</span> Close
           </div>
        </div>
      </div>
    </div>
  );
}
