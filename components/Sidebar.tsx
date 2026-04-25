"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Map, BarChart2, LogOut, Sparkles } from "lucide-react";
import { useState } from "react";

const navItems = [
  { href: "/today",    label: "Today",    icon: Home },
  { href: "/roadmap",  label: "Roadmap",  icon: Map },
  { href: "/progress", label: "Progress", icon: BarChart2 },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  return (
    <>
      <aside style={{
        width: 216, minHeight: "100vh",
        background: "var(--sidebar-bg)",
        display: "flex", flexDirection: "column",
        position: "fixed", left: 0, top: 0, zIndex: 40,
        borderRight: "1px solid rgba(255,255,255,0.04)"
      }} className="sidebar-desktop">

        <div style={{ padding: "20px 18px 16px", borderBottom: "1px solid var(--sidebar-border)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 26, height: 26, borderRadius: 7, background: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Sparkles size={13} color="white" />
            </div>
            <span style={{ color: "rgba(255,255,255,0.9)", fontWeight: 600, fontSize: 15, letterSpacing: "-0.3px" }}>daywise</span>
          </div>
        </div>

        <nav style={{ flex: 1, padding: "10px 10px" }}>
          <p style={{ fontSize: 10, fontWeight: 600, color: "var(--sidebar-text)", letterSpacing: "0.08em", textTransform: "uppercase", padding: "8px 8px 6px" }}>Menu</p>
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            const hovered = hoveredItem === href;
            return (
              <Link key={href} href={href}
                onMouseEnter={() => setHoveredItem(href)}
                onMouseLeave={() => setHoveredItem(null)}
                style={{
                  display: "flex", alignItems: "center", gap: 9,
                  padding: "7px 9px", borderRadius: 7, marginBottom: 2,
                  textDecoration: "none",
                  background: active ? "var(--sidebar-active)" : hovered ? "var(--sidebar-hover)" : "transparent",
                  color: active ? "var(--sidebar-active-text)" : "var(--sidebar-text)",
                  fontWeight: active ? 500 : 400, fontSize: 13.5,
                  transition: "all 150ms ease",
                  transform: hovered && !active ? "translateX(2px)" : "translateX(0)",
                }}>
                <Icon size={15} strokeWidth={active ? 2 : 1.5} />
                {label}
                {active && <div style={{ marginLeft: "auto", width: 5, height: 5, borderRadius: "50%", background: "var(--accent-muted)" }} />}
              </Link>
            );
          })}
        </nav>

        <div style={{ padding: "12px 10px", borderTop: "1px solid var(--sidebar-border)" }}>
          <Link href="/auth/login"
            style={{ display: "flex", alignItems: "center", gap: 9, padding: "7px 9px", borderRadius: 7, textDecoration: "none", color: "var(--sidebar-text)", fontSize: 13, transition: "all 150ms ease" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.8)"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--sidebar-text)"; }}>
            <LogOut size={14} strokeWidth={1.5} />
            Sign out
          </Link>
        </div>
      </aside>

      <nav style={{
        position: "fixed", bottom: 0, left: 0, right: 0,
        background: "var(--sidebar-bg)", display: "flex",
        borderTop: "1px solid rgba(255,255,255,0.06)",
        zIndex: 40, padding: "8px 0 max(10px, env(safe-area-inset-bottom))"
      }} className="sidebar-mobile">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link key={href} href={href} style={{
              flex: 1, display: "flex", flexDirection: "column", alignItems: "center",
              gap: 4, textDecoration: "none", padding: "4px 0",
              color: active ? "rgba(255,255,255,0.95)" : "var(--sidebar-text)",
              transition: "color 150ms ease"
            }}>
              <Icon size={18} strokeWidth={active ? 2 : 1.5} />
              <span style={{ fontSize: 10, fontWeight: active ? 500 : 400 }}>{label}</span>
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
