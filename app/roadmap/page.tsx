"use client";
import React, { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import { supabase } from "@/lib/supabase";
import { CheckCircle2, Clock, Loader2, GripVertical, X, ListPlus } from "lucide-react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverlay,
  DragStartEvent
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface DBTopic {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  estimated_hours: number;
  week_number: number;
  sort_order: number;
}

interface AddTopicModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (title: string, desc: string, hours: number, week: number) => void;
  defaultWeek: number;
}

// Simple modal component inside file to keep imports clean
function AddTopicModal({ isOpen, onClose, onAdd, defaultWeek }: AddTopicModalProps) {
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [hours, setHours] = useState(2);

  if (!isOpen) return null;

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div className="modal-enter" style={{ background: "var(--bg-surface)", width: 400, padding: 24, borderRadius: 16, border: "1px solid var(--border-default)", boxShadow: "var(--shadow-xl)" }}>
        <h3 style={{ margin: "0 0 16px", fontSize: 18, color: "var(--text-primary)" }}>Add Topic to Week {defaultWeek}</h3>
        <input placeholder="Topic Title" value={title} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTitle(e.target.value)} style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid var(--border-default)", marginBottom: 12 }} />
        <input placeholder="Short Description" value={desc} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDesc(e.target.value)} style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid var(--border-default)", marginBottom: 12 }} />
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
          <label style={{ fontSize: 14, color: "var(--text-secondary)" }}>Est. Hours:</label>
          <input type="number" step={0.5} min={0.5} value={hours} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setHours(parseFloat(e.target.value))} style={{ width: 80, padding: 8, borderRadius: 8, border: "1px solid var(--border-default)" }} />
        </div>
        <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
          <button onClick={onClose} style={{ padding: "8px 16px", background: "var(--bg-muted)", border: "none", borderRadius: 6, cursor: "pointer" }}>Cancel</button>
          <button onClick={() => { onAdd(title, desc, hours, defaultWeek); setTitle(""); setDesc(""); setHours(2); onClose(); }} style={{ padding: "8px 16px", background: "var(--accent)", color: "white", border: "none", borderRadius: 6, cursor: "pointer" }}>Add Topic</button>
        </div>
      </div>
    </div>
  );
}

// Sortable Topic Item
function SortableTopicItem({ topic, editing, onDelete, onDefer }: { topic: DBTopic, editing: boolean, onDelete: (id: string) => void, onDefer: (id: string) => void }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: topic.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    display: "flex", alignItems: "center", gap: 14,
    padding: "12px", background: "var(--bg-surface)",
    border: "1px solid var(--border-subtle)", borderRadius: 10,
    boxShadow: isDragging ? "var(--shadow-md)" : "none",
    zIndex: isDragging ? 10 : 1
  };

  return (
    <div ref={setNodeRef} style={style}>
      {editing ? (
        <div {...attributes} {...listeners} style={{ cursor: "grab", color: "var(--text-disabled)", display: "flex", alignItems: "center", height: "100%", padding: 4 }}>
          <GripVertical size={16} />
        </div>
      ) : (
        <CheckCircle2 size={18} color="var(--border-strong)" style={{ flexShrink: 0, opacity: 0.6 }} />
      )}

      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ margin: 0, fontWeight: 500, fontSize: 14, color: "var(--text-primary)" }}>{topic.title}</p>
        <span style={{ fontSize: 12, color: "var(--text-tertiary)" }}>{topic.estimated_hours}h</span>
      </div>

      {editing ? (
        <button onClick={() => onDelete(topic.id)} style={{ padding: 6, background: "var(--error-subtle)", color: "var(--error)", border: "none", borderRadius: 6, cursor: "pointer" }}>
          <X size={14} />
        </button>
      ) : (
        <button onClick={() => onDefer(topic.id)} style={{ fontSize: 12, color: "var(--text-secondary)", background: "var(--bg-base)", border: "1px solid var(--border-default)", borderRadius: 6, padding: "6px 12px", cursor: "pointer", boxShadow: "var(--shadow-sm)" }}>
          Defer →
        </button>
      )}
    </div>
  );
}

export default function RoadmapPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [curricula, setCurricula] = useState<DBTopic[]>([]);
  const [editing, setEditing] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [activeModalWeek, setActiveModalWeek] = useState(1);
  const [toast, setToast] = useState<{ show: boolean; msg: string; type: "success" | "error" } | null>(null);
  const [dbError, setDbError] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    const { data: authData, error: authError } = await supabase.auth.getUser();

    if (authData?.user) {
      const { data, error } = await supabase.from("curricula")
        .select("*")
        .eq("user_id", authData.user.id)
        .order("sort_order", { ascending: true });

      if (error) {
        console.error("Database schema error:", error.message);
        setDbError(error.message);
      } else if (data) {
        setDbError(null);
        setCurricula(data as DBTopic[]);
      }
    } else if (authError) {
      console.warn("Auth fetching failed", authError);
    }
    setLoading(false);
  }

  async function handleDragEnd(event: DragEndEvent) {
    setActiveId(null);
    const { active, over } = event;
    if (!over) return;

    if (active.id !== over.id) {
      setCurricula((items: DBTopic[]) => {
        const oldIndex = items.findIndex((i: DBTopic) => i.id === active.id.toString());
        const newIndex = items.findIndex((i: DBTopic) => i.id === over.id.toString());

        const newArray = arrayMove(items, oldIndex, newIndex);

        const targetWeek = newArray[newIndex].week_number;
        newArray[newIndex].week_number = targetWeek;

        return newArray.map((item: DBTopic, idx: number) => ({ ...item, sort_order: idx }));
      });
    }
  }

  async function handleDelete(id: string) {
    setCurricula((prev: DBTopic[]) => prev.filter((c: DBTopic) => c.id !== id));
  }

  async function toggleEditMode() {
    if (editing) {
      setSaving(true);
      const { data: authData } = await supabase.auth.getUser();

      const itemsToUpsert = curricula.map((c: DBTopic, idx: number) => ({
        id: c.id,
        user_id: c.user_id,
        title: c.title,
        description: c.description || "",
        estimated_hours: c.estimated_hours,
        week_number: c.week_number,
        sort_order: idx
      }));

      const { data: dbItems } = await supabase.from("curricula").select("id").eq("user_id", authData?.user?.id || "");
      if (dbItems) {
        const currentIds = curricula.map((c: DBTopic) => c.id);
        const toDelete = dbItems.filter((db: { id: string }) => !currentIds.includes(db.id)).map((db: { id: string }) => db.id);
        if (toDelete.length > 0) {
          await supabase.from("curricula").delete().in("id", toDelete);
        }
      }

      if (itemsToUpsert.length > 0) {
        const { error } = await supabase.from("curricula").upsert(itemsToUpsert);
        if (error) {
          console.error("Failed to save roadmap:", error);
          setDbError(error.message);
          setToast({ show: true, msg: "Database Error: Could not save.", type: "error" });
        } else {
          setDbError(null);
          setToast({ show: true, msg: "Roadmap saved successfully!", type: "success" });
        }
        setTimeout(() => setToast(null), 3000);
      } else {
        setToast({ show: true, msg: "Roadmap saved successfully!", type: "success" });
        setTimeout(() => setToast(null), 3000);
      }

      await fetchData();
      setSaving(false);
    }
    setEditing(!editing);
  }

  // Calculate Weeks Grouping
  const weekMap = new Map<number, DBTopic[]>();
  curricula.forEach((c: DBTopic) => {
    if (!weekMap.has(c.week_number)) weekMap.set(c.week_number, []);
    weekMap.get(c.week_number)?.push(c);
  });

  // Ensure we at least show weeks 1..max
  const maxWeek = curricula.length > 0 ? Math.max(...curricula.map((c: DBTopic) => c.week_number)) : 1;
  const weekNodes: { week: number; topics: DBTopic[] }[] = [];
  for (let w = 1; w <= maxWeek + (editing ? 1 : 0); w++) {
    weekNodes.push({ week: w, topics: weekMap.get(w) || [] });
  }

  async function handleAddTopic(title: string, desc: string, hours: number, week: number) {
    const { data: authData } = await supabase.auth.getUser();
    if (!authData?.user) return;

    // Use a true UUID so we don't break Supabase constraints if someone skips the backend fetch
    const newTopic = {
      id: crypto.randomUUID(),
      user_id: authData.user.id,
      title,
      description: desc,
      estimated_hours: hours,
      week_number: week,
      sort_order: curricula.length
    };

    setCurricula([...curricula, newTopic]);
  }

  async function handleDefer(topicId: string) {
    const idx = curricula.findIndex((c: DBTopic) => c.id === topicId);
    if (idx === -1) return;

    const newItems = [...curricula];
    newItems[idx].week_number += 1;
    setCurricula(newItems);

    setSaving(true);
    await supabase.from("curricula").update({ week_number: newItems[idx].week_number }).eq("id", topicId);
    setSaving(false);
  }

  if (loading) {
    return <div style={{ minHeight: "100vh", background: "var(--bg-base)", display: "flex", alignItems: "center", justifyContent: "center" }}><Loader2 className="animate-spin text-indigo-500" size={32} /></div>;
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--bg-base)" }}>
      <Sidebar />
      <AddTopicModal isOpen={modalOpen} defaultWeek={activeModalWeek} onClose={() => setModalOpen(false)} onAdd={handleAddTopic} />

      {dbError && (
        <div style={{ position: "fixed", inset: 0, zIndex: 9999, background: "rgba(15, 23, 42, 0.8)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: "var(--bg-surface)", border: "1px solid var(--error)", padding: 40, borderRadius: 24, maxWidth: 500, textAlign: "center", boxShadow: "0 24px 48px rgba(0,0,0,0.3)", animation: "fadeInUp 0.4s ease-out" }}>
            <div style={{ width: 64, height: 64, borderRadius: "50%", background: "var(--error-subtle)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px" }}>
              <X size={32} color="var(--error)" strokeWidth={3} />
            </div>
            <h2 style={{ fontSize: 24, fontWeight: 700, margin: "0 0 12px", color: "var(--text-primary)" }}>Database Mismatch Detected</h2>
            <p style={{ fontSize: 15, color: "var(--text-secondary)", lineHeight: 1.6, marginBottom: 24 }}>
              Your Supabase dashboard is missing the latest schema configurations. The application cannot save or load data correctly until the columns exist.
            </p>
            <div style={{ background: "var(--bg-muted)", padding: 16, borderRadius: 12, textAlign: "left", fontSize: 13, color: "var(--error)", fontFamily: "monospace", overflowX: "auto", marginBottom: 32, border: "1px dashed var(--error-muted)" }}>
              {dbError}
            </div>
            <p style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)", marginBottom: 12 }}>👉 Fix Action Required:</p>
            <p style={{ fontSize: 13, color: "var(--text-tertiary)" }}>Please execute the <code>supabase_schema.sql</code> artifact contents in your Supabase SQL Editor and then refresh the page.</p>
          </div>
        </div>
      )}

      <main style={{ flex: 1, paddingBottom: 60, marginLeft: 224 }} className="roadmap-main">
        {/* Ambient Gradient Header Background for absolute premium feel */}
        <div style={{ position: "absolute", top: 0, left: 224, right: 0, height: 300, background: "radial-gradient(ellipse at top right, rgba(99,102,241,0.08), transparent 70%)", pointerEvents: "none", zIndex: 0 }} />

        <div style={{ maxWidth: 840, margin: "0 auto", padding: "60px 40px", position: "relative", zIndex: 1 }}>

          {/* Header */}
          <div style={{ marginBottom: 40, display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
            <div>
              <h1 style={{ margin: "0 0 10px", fontSize: 36, fontWeight: 800, color: "var(--text-primary)", letterSpacing: "-1px" }}>Your Roadmap</h1>
              <p style={{ margin: 0, fontSize: 15, color: "var(--text-secondary)", fontWeight: 500 }}>
                {curricula.length > 0 ? `${curricula.length} topics strategically distributed across ${maxWeek} weeks.` : "Design your learning journey from scratch."}
              </p>
            </div>
            {curricula.length > 0 && (
              <button
                onClick={toggleEditMode}
                disabled={saving}
                style={{
                  background: editing ? "var(--success)" : "linear-gradient(135deg, var(--bg-surface), var(--bg-subtle))",
                  color: editing ? "white" : "var(--text-primary)",
                  border: `1px solid ${editing ? "var(--success)" : "var(--border-strong)"}`,
                  borderRadius: 10, padding: "12px 20px", fontWeight: 600, fontSize: 14,
                  cursor: saving ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: 10,
                  boxShadow: "var(--shadow-md)", transition: "all 0.2s ease"
                }}
              >
                {saving ? <Loader2 size={16} className="animate-spin" /> : editing ? "Save Changes" : "Edit Roadmap"}
              </button>
            )}
          </div>

          {/* Zero State Hero */}
          {curricula.length === 0 && !editing && (
            <div style={{ background: "linear-gradient(145deg, var(--bg-surface), var(--bg-subtle))", border: "1px dashed var(--border-strong)", borderRadius: 24, padding: "80px 40px", textAlign: "center", boxShadow: "var(--shadow-lg)", position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", top: -50, left: -50, width: 200, height: 200, background: "var(--accent)", opacity: 0.05, borderRadius: "50%", filter: "blur(40px)" }} />
              <div style={{ position: "absolute", bottom: -50, right: -50, width: 150, height: 150, background: "var(--focus)", opacity: 0.05, borderRadius: "50%", filter: "blur(30px)" }} />

              <div style={{ width: 80, height: 80, borderRadius: "50%", background: "var(--accent-subtle)", border: "4px solid var(--bg-surface)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px", boxShadow: "0 8px 24px rgba(99,102,241,0.2)" }}>
                <ListPlus size={36} color="var(--accent)" />
              </div>
              <h2 style={{ fontSize: 26, fontWeight: 700, margin: "0 0 12px", color: "var(--text-primary)", letterSpacing: "-0.5px" }}>Blank Canvas</h2>
              <p style={{ fontSize: 16, color: "var(--text-secondary)", margin: "0 auto 32px", maxWidth: 450, lineHeight: 1.6 }}>
                You don&apos;t have any topics scheduled yet. Start mapping out what you want to learn, and we&apos;ll automatically generate your daily tasks.
              </p>
              <button onClick={toggleEditMode} style={{ background: "linear-gradient(135deg, var(--accent), var(--accent-hover))", color: "white", border: "none", borderRadius: 12, padding: "16px 32px", fontSize: 15, fontWeight: 600, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 10, boxShadow: "0 10px 20px rgba(99,102,241,0.25)", transition: "transform 0.2s cubic-bezier(0.34,1.56,0.64,1)" }}>
                <ListPlus size={18} /> Schedule First Topic
              </button>
            </div>
          )}

          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={(e: DragStartEvent) => setActiveId(e.active.id.toString())} onDragEnd={handleDragEnd}>
            <SortableContext items={curricula.map((c: DBTopic) => c.id)} strategy={verticalListSortingStrategy}>
              {weekNodes.map((weekNode: { week: number; topics: DBTopic[] }) => {
                const weekHours = Math.round(weekNode.topics.reduce((s: number, t: DBTopic) => s + t.estimated_hours, 0) * 10) / 10;

                // Active highlighting concept based on dates (hard to do without a start date, so we assume Week 1 is current for prototype)
                const isCurrentWeek = weekNode.week === 1 && !editing && curricula.length > 0;

                if (weekNode.topics.length === 0 && !editing) return null;

                return (
                  <div key={weekNode.week} style={{ marginBottom: 24 }}>
                    <div style={{ background: "var(--bg-surface)", border: `1px solid ${isCurrentWeek ? "var(--accent-muted)" : "var(--border-subtle)"}`, borderRadius: 20, overflow: "hidden", boxShadow: isCurrentWeek ? "0 12px 32px rgba(99,102,241,0.08)" : "var(--shadow-sm)", position: "relative", transition: "all 0.3s ease" }}>
                      {isCurrentWeek && <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 4, background: "var(--accent)", zIndex: 2 }} />}

                      {/* Week header */}
                      <div style={{ padding: "20px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid var(--border-subtle)", background: isCurrentWeek ? "linear-gradient(90deg, var(--accent-subtle) 0%, transparent 50%)" : "var(--bg-subtle)" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                          <span style={{ fontWeight: 700, fontSize: 17, color: "var(--text-primary)", paddingLeft: isCurrentWeek ? 8 : 0 }}>Week {weekNode.week}</span>
                          {isCurrentWeek && <span style={{ background: "var(--accent)", color: "white", padding: "4px 10px", borderRadius: 12, fontSize: 11, fontWeight: 700, letterSpacing: 0.5, textTransform: "uppercase" }}>Current</span>}
                        </div>
                        <span style={{ fontSize: 13, color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: 8, fontWeight: 600, background: "var(--bg-surface)", padding: "6px 12px", borderRadius: 8, border: "1px solid var(--border-subtle)" }}>
                          <Clock size={14} color="var(--accent)" /> {weekHours}h
                        </span>
                      </div>

                      {/* Topics */}
                      <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 12 }}>
                        {weekNode.topics.map((topic: DBTopic) => (
                          <SortableTopicItem key={topic.id} topic={topic} editing={editing} onDelete={handleDelete} onDefer={handleDefer} />
                        ))}

                        {weekNode.topics.length === 0 && (
                          <div style={{ textAlign: "center", padding: "24px", border: "1px dashed var(--border-default)", borderRadius: 12, color: "var(--text-tertiary)", fontSize: 14 }}>
                            No topics grouped in this week.
                          </div>
                        )}

                        {editing && (
                          <button onClick={() => { setActiveModalWeek(weekNode.week); setModalOpen(true); }} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "14px", background: "var(--bg-subtle)", border: "1px dashed var(--border-strong)", borderRadius: 12, color: "var(--text-primary)", fontWeight: 600, fontSize: 14, cursor: "pointer", marginTop: 8, transition: "background 0.2s" }} onMouseOver={e => e.currentTarget.style.background = "var(--bg-surface)"} onMouseOut={e => e.currentTarget.style.background = "var(--bg-subtle)"}>
                            <ListPlus size={18} color="var(--accent)" /> Add Topic to Week {weekNode.week}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </SortableContext>


            <DragOverlay>
              {activeId ? (
                <div style={{ opacity: 0.8, padding: 12, background: "var(--bg-surface)", border: "1px solid var(--border-strong)", borderRadius: 10, boxShadow: "var(--shadow-xl)" }}>
                  <p style={{ margin: 0, fontWeight: 500, fontSize: 14 }}>{curricula.find((c: DBTopic) => c.id === activeId)?.title}</p>
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>

        </div>
      </main>

      {/* Toast Notification */}
      {toast?.show && (
        <div style={{ position: "fixed", bottom: 40, right: 40, background: toast.type === "success" ? "var(--success)" : "var(--error)", color: "white", padding: "12px 24px", borderRadius: 12, display: "flex", alignItems: "center", gap: 10, boxShadow: "var(--shadow-lg)", zIndex: 1000, animation: "fadeInUp 0.3s ease-out forwards" }}>
          <CheckCircle2 size={18} />
          <span style={{ fontWeight: 600, fontSize: 14 }}>{toast.msg}</span>
        </div>
      )}

      <style>{`
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @media (max-width: 768px) { .roadmap-main { margin-left: 0 !important; padding-bottom: 70px; } }
      `}</style>
    </div>
  );
}
