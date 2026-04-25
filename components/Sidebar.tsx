"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Map as MapIcon, BarChart2, LogOut, Sparkles, Settings } from "lucide-react";
import React, { useState } from "react";

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
}

const navItems: NavItem[] = [
  { href: "/today",    label: "Today",    icon: Home },
  { href: "/roadmap",  label: "Roadmap",  icon: MapIcon },
  { href: "/progress", label: "Progress", icon: BarChart2 },
  { href: "/settings", label: "Settings", icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  return (
    <>
      <aside style={{
        width: 224, minHeight: "100vh",
        background: "var(--sidebar-bg)",
        display: "flex", flexDirection: "column",
        position: "fixed", left: 0, top: 0, zIndex: 40,
        borderRight: "1px solid var(--sidebar-border)",
        boxShadow: "4px 0 24px rgba(0,0,0,0.05)"
      }} className="sidebar-desktop">

        <div style={{ padding: "24px 20px 20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: "linear-gradient(135deg, var(--accent), var(--accent-hover))", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 8px rgba(99,102,241,0.25)" }}>
              <Sparkles size={14} color="white" />
            </div>
            <span style={{ color: "rgba(255,255,255,0.95)", fontWeight: 600, fontSize: 16, letterSpacing: "-0.4px" }}>daywise</span>
          </div>
        </div>

        <nav style={{ flex: 1, padding: "8px 12px" }}>
          <p style={{ fontSize: 11, fontWeight: 600, color: "var(--sidebar-text)", letterSpacing: "0.08em", textTransform: "uppercase", padding: "12px 8px 8px" }}>Menu</p>
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            const hovered = hoveredItem === href;
            return (
              <Link key={href} href={href}
                onMouseEnter={() => setHoveredItem(href)}
                onMouseLeave={() => setHoveredItem(null)}
                style={{
                  display: "flex", alignItems: "center", gap: 10,
                  padding: "9px 10px", borderRadius: 8, marginBottom: 4,
                  textDecoration: "none", position: "relative",
                  background: active ? "var(--sidebar-active)" : hovered ? "var(--sidebar-hover)" : "transparent",
                  color: active ? "var(--sidebar-active-text)" : "var(--sidebar-text)",
                  fontWeight: active ? 500 : 400, fontSize: 13.5,
                  transition: "all 150ms ease",
                }}>
                
                {/* Active Indicator Left Bar */}
                {active && <div style={{ position: "absolute", left: -12, top: "50%", transform: "translateY(-50%)", width: 4, height: 18, borderRadius: "0 4px 4px 0", background: "var(--accent)", boxShadow: "var(--shadow-glow)" }} />}

                <Icon size={16} strokeWidth={active ? 2 : 1.5} style={{ color: active ? "var(--accent-muted)" : "inherit" }} />
                <span style={{ transform: hovered && !active ? "translateX(2px)" : "translateX(0)", transition: "transform 150ms" }}>
                  {label}
                </span>
              </Link>
            );
          })}
        </nav>

        <div style={{ padding: "16px 12px", borderTop: "1px solid var(--sidebar-border)" }}>
          <Link href="/auth/login"
            style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 10px", borderRadius: 8, textDecoration: "none", color: "var(--sidebar-text)", fontSize: 13.5, transition: "all 150ms ease" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.85)"; (e.currentTarget as HTMLElement).style.background = "var(--sidebar-hover)"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--sidebar-text)"; (e.currentTarget as HTMLElement).style.background = "transparent"; }}>
            <LogOut size={16} strokeWidth={1.5} />
            Sign out
          </Link>
        </div>
      </aside>

      <nav style={{
        position: "fixed", bottom: 0, left: 0, right: 0,
        background: "var(--sidebar-bg)", display: "flex",
        borderTop: "1px solid var(--sidebar-border)",
        zIndex: 40, padding: "8px 0 max(10px, env(safe-area-inset-bottom))",
        boxShadow: "0 -4px 24px rgba(0,0,0,0.1)"
      }} className="sidebar-mobile">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link key={href} href={href} style={{
              flex: 1, display: "flex", flexDirection: "column", alignItems: "center",
              gap: 4, textDecoration: "none", padding: "4px 0",
              color: active ? "var(--sidebar-active-text)" : "var(--sidebar-text)",
              transition: "color 150ms ease"
            }}>
              <Icon size={20} strokeWidth={active ? 2 : 1.5} style={{ color: active ? "var(--accent-muted)" : "inherit" }} />
              <span style={{ fontSize: 11, fontWeight: active ? 500 : 400 }}>{label}</span>
            </Link>
          );
        })}
      </nav>

      <style>{`
        .sidebar-mobile { display: none !important; }
        @media (max-width: 768px) {
          .sidebar-desktop { display: none !important; }
          .sidebar-mobile  { display: flex !important; }
        }
      `}</style>
    </>
  );
}
