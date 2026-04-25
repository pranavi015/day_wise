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

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    const { data: authData } = await supabase.auth.getUser();
    if (authData?.user) {
      const { data } = await supabase.from("curricula")
        .select("*")
        .eq("user_id", authData.user.id)
        .order("sort_order", { ascending: true });
      if (data) setCurricula(data as DBTopic[]);
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

  async function handleAddTopic(title: string, desc: string, hours: number, week: number) {
    const { data: authData } = await supabase.auth.getUser();
    if (!authData?.user) return;

    // Add to local state (will be pushed to DB on save)
    const newTopic = {
      id: `new-${Date.now()}`,
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
    // Immediate save for defer to make it functional outside edit mode
    const idx = curricula.findIndex((c: DBTopic) => c.id === topicId);
    if (idx === -1) return;

    const newItems = [...curricula];
    newItems[idx].week_number += 1;
    setCurricula(newItems);

    // Auto-save just this one
    setSaving(true);
    await supabase.from("curricula").update({ week_number: newItems[idx].week_number }).eq("id", topicId);
    setSaving(false);
  }

  async function toggleEditMode() {
    if (editing) {
      // Save everything
      setSaving(true);
      const { data: authData } = await supabase.auth.getUser();

      // Batch upsert isn't directly clean if IDs are 'new-', so we separate them
      const itemsToUpdate = curricula.filter((c: DBTopic) => !c.id.startsWith("new-")).map((c: DBTopic) => ({
        id: c.id, user_id: c.user_id, title: c.title, description: c.description, estimated_hours: c.estimated_hours, week_number: c.week_number, sort_order: c.sort_order
      }));

      const itemsToInsert = curricula.filter((c: DBTopic) => c.id.startsWith("new-")).map((c: DBTopic) => ({
        user_id: c.user_id, title: c.title, description: c.description, estimated_hours: c.estimated_hours, week_number: c.week_number, sort_order: c.sort_order
      }));

      // In real scenario we must also detect deletions. The easiest way is to delete all and re-insert, but that breaks foreign keys (completions).
      // So we upsert the updates, insert new ones. For deletions, we need to find what's missing.
      const { data: dbItems } = await supabase.from("curricula").select("id").eq("user_id", authData?.user?.id || "");
      if (dbItems) {
        const currentIds = curricula.map((c: DBTopic) => c.id);
        const toDelete = dbItems.filter((db: { id: string }) => !currentIds.includes(db.id)).map((db: { id: string }) => db.id);
        if (toDelete.length > 0) {
          await supabase.from("curricula").delete().in("id", toDelete);
        }
      }

      if (itemsToUpdate.length > 0) await supabase.from("curricula").upsert(itemsToUpdate);
      if (itemsToInsert.length > 0) await supabase.from("curricula").insert(itemsToInsert);

      await fetchData(); // refresh real IDs
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

  if (loading) {
    return <div style={{ minHeight: "100vh", background: "var(--bg-base)", display: "flex", alignItems: "center", justifyContent: "center" }}><Loader2 className="animate-spin text-indigo-500" size={32} /></div>;
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--bg-base)" }}>
      <Sidebar />
      <AddTopicModal isOpen={modalOpen} defaultWeek={activeModalWeek} onClose={() => setModalOpen(false)} onAdd={handleAddTopic} />

      <main style={{ flex: 1, paddingBottom: 40, marginLeft: 224 }} className="roadmap-main">
        <div style={{ maxWidth: 720, margin: "0 auto", padding: "40px 32px" }}>

          {/* Header */}
          <div style={{ marginBottom: 32, display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
            <div>
              <h1 style={{ margin: "0 0 8px", fontSize: 32, fontWeight: 700, color: "var(--text-primary)", letterSpacing: "-0.8px" }}>Your Roadmap</h1>
              <p style={{ margin: 0, fontSize: 14.5, color: "var(--text-secondary)" }}>
                {curricula.length} topics total across {maxWeek} weeks
              </p>
            </div>
            <button onClick={toggleEditMode} disabled={saving} style={{ background: editing ? "var(--success)" : "var(--bg-surface)", color: editing ? "white" : "var(--text-primary)", border: `1px solid ${editing ? "var(--success)" : "var(--border-strong)"}`, borderRadius: 8, padding: "8px 16px", fontWeight: 600, fontSize: 13, cursor: saving ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: 8, boxShadow: "var(--shadow-sm)" }}>
              {saving ? <Loader2 size={14} className="animate-spin" /> : editing ? "Save Changes" : "Edit Roadmap"}
            </button>
          </div>

          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={(e: DragStartEvent) => setActiveId(e.active.id.toString())} onDragEnd={handleDragEnd}>
            <SortableContext items={curricula.map((c: DBTopic) => c.id)} strategy={verticalListSortingStrategy}>
              {weekNodes.map((weekNode: { week: number; topics: DBTopic[] }) => {
                const weekHours = Math.round(weekNode.topics.reduce((s: number, t: DBTopic) => s + t.estimated_hours, 0) * 10) / 10;

                // Active highlighting concept based on dates (hard to do without a start date, so we assume Week 1 is current for prototype)
                const isCurrentWeek = weekNode.week === 1 && !editing;

                if (weekNode.topics.length === 0 && !editing) return null;

                return (
                  <div key={weekNode.week} style={{ marginBottom: 16 }}>
                    <div style={{ background: "var(--bg-surface)", border: `1px solid var(--border-subtle)`, borderRadius: 16, overflow: "hidden", boxShadow: "var(--shadow-sm)", position: "relative" }}>
                      {isCurrentWeek && <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 4, background: "var(--accent)" }} />}

                      {/* Week header */}
                      <div style={{ padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid var(--border-subtle)", background: isCurrentWeek ? "var(--bg-surface)" : "var(--bg-subtle)" }}>
                        <div style={{ display: "flex", alignItems: "center" }}>
                          <span style={{ fontWeight: 700, fontSize: 16, color: "var(--text-primary)", paddingLeft: isCurrentWeek ? 12 : 0 }}>Week {weekNode.week}</span>
                        </div>
                        <span style={{ fontSize: 13, color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: 6, fontWeight: 500 }}>
                          <Clock size={14} /> {weekHours}h
                        </span>
                      </div>

                      {/* Topics */}
                      <div style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: 12 }}>
                        {weekNode.topics.map((topic: DBTopic) => (
                          <SortableTopicItem key={topic.id} topic={topic} editing={editing} onDelete={handleDelete} onDefer={handleDefer} />
                        ))}

                        {weekNode.topics.length === 0 && (
                          <div style={{ textAlign: "center", padding: "12px", border: "1px dashed var(--border-default)", borderRadius: 8, color: "var(--text-tertiary)", fontSize: 13 }}>
                            No topics in this week.
                          </div>
                        )}

                        {editing && (
                          <button onClick={() => { setActiveModalWeek(weekNode.week); setModalOpen(true); }} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "10px", background: "transparent", border: "1px dashed var(--border-strong)", borderRadius: 10, color: "var(--text-secondary)", fontWeight: 500, fontSize: 13, cursor: "pointer", marginTop: 8 }}>
                            <ListPlus size={16} /> Add Topic to Week {weekNode.week}
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

      <style>{`
        @media (max-width: 768px) { .roadmap-main { margin-left: 0 !important; padding-bottom: 70px; } }
      `}</style>
    </div>
  );
}
