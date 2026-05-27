// Reef — three-phase visual roadmap for batch LinkedIn scheduling.
// 1. Add images  2. Set dates  3. Visualise horizontal flow + batch-schedule (Pro).
import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, Image as ImageIcon, Calendar, Trash2, GripVertical, Loader2, ArrowRight, ArrowLeft, Send, Lock, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, horizontalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { supabase } from "@/integrations/supabase/client";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useNavigate } from "react-router-dom";

interface ReefNode {
  id: string;
  dbId?: string;
  imageDataUrl: string;
  title: string;
  caption: string;
  scheduledAt?: string;
  position: number;
}

type Phase = "upload" | "schedule" | "visualize";

const SortableCard = ({ node, index, onUpdate, onRemove, phase }: { node: ReefNode; index: number; onUpdate: (id: string, patch: Partial<ReefNode>) => void; onRemove: (id: string) => void; phase: Phase }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: node.id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 };
  return (
    <div ref={setNodeRef} style={style} className="flex-shrink-0 w-56 relative">
      <div className="absolute -top-3 left-3 w-7 h-7 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center z-10 shadow-md">
        {index + 1}
      </div>
      <div className="glass rounded-3xl p-3 space-y-2">
        <div className="relative">
          <img src={node.imageDataUrl} alt={node.title} className="w-full h-32 object-cover rounded-2xl" />
          <button {...attributes} {...listeners} className="absolute top-1.5 right-1.5 p-1 rounded-full bg-background/70 backdrop-blur text-foreground cursor-grab active:cursor-grabbing touch-none" aria-label="Drag to reorder">
            <GripVertical className="w-3.5 h-3.5" />
          </button>
        </div>
        <input
          value={node.title}
          onChange={e => onUpdate(node.id, { title: e.target.value })}
          className="w-full bg-transparent text-xs font-semibold text-foreground outline-none border-b border-transparent focus:border-primary"
          placeholder="Title"
        />
        {phase !== "upload" && (
          <textarea
            value={node.caption}
            onChange={e => onUpdate(node.id, { caption: e.target.value })}
            rows={2}
            placeholder="Caption"
            className="w-full bg-secondary/40 rounded-xl p-2 text-[11px] text-foreground outline-none resize-none"
          />
        )}
        {phase === "schedule" && (
          <label className="flex items-center gap-1.5 text-[11px] text-muted-foreground bg-secondary/40 rounded-xl px-2 py-1.5">
            <Calendar className="w-3 h-3 shrink-0" />
            <input
              type="datetime-local"
              value={node.scheduledAt || ""}
              onChange={e => onUpdate(node.id, { scheduledAt: e.target.value })}
              className="bg-transparent outline-none text-[11px] flex-1 min-w-0"
            />
          </label>
        )}
        {phase === "visualize" && node.scheduledAt && (
          <p className="text-[10px] text-primary font-medium">
            <Calendar className="w-3 h-3 inline mr-1" />
            {new Date(node.scheduledAt).toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
          </p>
        )}
        <button onClick={() => onRemove(node.id)} className="w-full text-[10px] text-muted-foreground hover:text-destructive transition-colors flex items-center justify-center gap-1 press-effect">
          <Trash2 className="w-3 h-3" />Remove
        </button>
      </div>
    </div>
  );
};

const Reef = () => {
  const user = useUserProfile();
  const navigate = useNavigate();
  const [phase, setPhase] = useState<Phase>("upload");
  const [nodes, setNodes] = useState<ReefNode[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [batchScheduling, setBatchScheduling] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));

  useEffect(() => {
    if (!user.isLoggedIn) return;
    setLoading(true);
    supabase.from("reef_nodes").select("*").eq("user_id", user.userId).order("position").then(({ data }) => {
      const loaded: ReefNode[] = (data || []).map(r => ({
        id: r.id, dbId: r.id, imageDataUrl: r.image_url, title: r.title, caption: r.caption,
        scheduledAt: r.scheduled_at ? new Date(r.scheduled_at).toISOString().slice(0, 16) : undefined,
        position: r.position,
      }));
      setNodes(loaded);
      setLoading(false);
    });
  }, [user.isLoggedIn, user.userId]);

  const scheduleSave = useCallback((next: ReefNode[]) => {
    if (!user.isLoggedIn) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      setSaving(true);
      try {
        const rows = next.map((n, idx) => ({
          ...(n.dbId ? { id: n.dbId } : {}),
          user_id: user.userId, reef_id: user.userId, position: idx,
          image_url: n.imageDataUrl, title: n.title, caption: n.caption,
          scheduled_at: n.scheduledAt ? new Date(n.scheduledAt).toISOString() : null,
        }));
        const { data } = await supabase.from("reef_nodes").upsert(rows).select("id, position");
        if (data) setNodes(curr => curr.map((n, idx) => {
          const match = data.find(d => d.position === idx);
          return match ? { ...n, dbId: match.id, id: match.id } : n;
        }));
      } catch (e) { console.error(e); }
      finally { setSaving(false); }
    }, 1000);
  }, [user.isLoggedIn, user.userId]);

  const updateNode = (id: string, patch: Partial<ReefNode>) => {
    setNodes(prev => { const next = prev.map(n => n.id === id ? { ...n, ...patch } : n); scheduleSave(next); return next; });
  };
  const removeNode = async (id: string) => {
    const target = nodes.find(n => n.id === id);
    setNodes(prev => { const next = prev.filter(n => n.id !== id); scheduleSave(next); return next; });
    if (target?.dbId) await supabase.from("reef_nodes").delete().eq("id", target.dbId);
  };

  const handleFiles = async (files: FileList | null) => {
    if (!files) return;
    const arr = Array.from(files).slice(0, 20);
    const newNodes: ReefNode[] = await Promise.all(arr.map(f => new Promise<ReefNode>((res, rej) => {
      const r = new FileReader();
      r.onload = () => res({
        id: `n-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        imageDataUrl: r.result as string,
        title: f.name.replace(/\.[^.]+$/, "").slice(0, 40),
        caption: "", position: nodes.length,
      });
      r.onerror = rej;
      r.readAsDataURL(f);
    })));
    setNodes(prev => { const next = [...prev, ...newNodes].map((n, i) => ({ ...n, position: i })); scheduleSave(next); return next; });
  };

  const onDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setNodes(prev => {
      const oldIdx = prev.findIndex(n => n.id === active.id);
      const newIdx = prev.findIndex(n => n.id === over.id);
      const next = arrayMove(prev, oldIdx, newIdx).map((n, i) => ({ ...n, position: i }));
      scheduleSave(next);
      return next;
    });
  };

  const batchSchedule = async () => {
    if (!user.isPremium) { toast.error("Batch scheduling is a Premium feature"); navigate("/pricing"); return; }
    const ready = nodes.filter(n => n.scheduledAt && n.caption.trim());
    if (ready.length === 0) { toast.error("Add captions and dates to at least one card"); return; }
    setBatchScheduling(true);
    try {
      const rows = ready.map(n => ({
        user_id: user.userId,
        text: `${n.title ? n.title + "\n\n" : ""}${n.caption}`,
        image_url: n.imageDataUrl,
        scheduled_at: new Date(n.scheduledAt!).toISOString(),
      }));
      const { error } = await supabase.from("scheduled_linkedin_posts").insert(rows);
      if (error) throw error;
      toast.success(`Queued ${rows.length} posts to LinkedIn`);
    } catch (e: any) {
      toast.error(e.message || "Couldn't queue posts");
    } finally {
      setBatchScheduling(false);
    }
  };

  const canAdvance = phase === "upload" ? nodes.length > 0
    : phase === "schedule" ? nodes.some(n => n.scheduledAt)
    : false;

  const phaseTitle = {
    upload: { num: "1", title: "Add pictures", sub: "Drop the images that tell your story. Reorder them later." },
    schedule: { num: "2", title: "Set dates & captions", sub: "Pick when each post should go live and write its caption." },
    visualize: { num: "3", title: "Visualise & batch schedule", sub: "Your roadmap. Drag to reorder, then schedule them all at once." },
  }[phase];

  return (
    <div className="px-4 sm:px-6 py-6 space-y-5 max-w-6xl mx-auto">
      <header className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-fluid-xl font-bold font-display text-foreground">Reef</h2>
          {saving && <span className="text-[10px] text-primary flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin" />Saving</span>}
        </div>
        {/* Phase tracker */}
        <div className="flex items-center gap-2">
          {(["upload", "schedule", "visualize"] as Phase[]).map((p, i) => (
            <button
              key={p}
              onClick={() => { if (i === 0 || nodes.length > 0) setPhase(p); }}
              className={`flex items-center gap-1.5 text-[11px] font-medium press-effect ${phase === p ? "text-foreground" : "text-muted-foreground"}`}
            >
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${phase === p ? "bg-primary text-primary-foreground" : "bg-secondary"}`}>
                {i + 1}
              </span>
              <span className="hidden sm:inline">{p === "upload" ? "Pictures" : p === "schedule" ? "Dates" : "Roadmap"}</span>
              {i < 2 && <span className="text-muted-foreground/40">·</span>}
            </button>
          ))}
        </div>
        <div>
          <p className="text-fluid-sm text-foreground font-semibold">{phaseTitle.title}</p>
          <p className="text-xs text-muted-foreground">{phaseTitle.sub}</p>
        </div>
      </header>

      {/* Upload phase */}
      {phase === "upload" && (
        <label className="block">
          <input type="file" accept="image/*" multiple className="hidden" onChange={e => handleFiles(e.target.files)} />
          <div className="glass rounded-3xl p-10 border-2 border-dashed border-border text-center cursor-pointer hover:border-primary transition-colors press-effect">
            <Upload className="w-8 h-8 mx-auto text-primary mb-2" />
            <p className="text-sm font-medium text-foreground">Pick or drop images</p>
            <p className="text-xs text-muted-foreground mt-1">Up to 20 at once. JPG, PNG, WEBP.</p>
          </div>
        </label>
      )}

      {loading && <div className="text-center text-xs text-muted-foreground"><Loader2 className="w-4 h-4 animate-spin inline mr-1" />Loading your reef…</div>}

      {/* Horizontal scrolling roadmap (all phases once cards exist) */}
      {nodes.length > 0 && (
        <div className="relative">
          {/* Connector line behind cards */}
          <div className="absolute top-1/2 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent pointer-events-none" />
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
            <SortableContext items={nodes.map(n => n.id)} strategy={horizontalListSortingStrategy}>
              <div className="flex gap-6 overflow-x-auto pb-4 pt-6 px-1 snap-x">
                <AnimatePresence>
                  {nodes.map((n, i) => (
                    <motion.div key={n.id} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="snap-start">
                      <SortableCard node={n} index={i} onUpdate={updateNode} onRemove={removeNode} phase={phase} />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </SortableContext>
          </DndContext>
        </div>
      )}

      {/* Phase navigation */}
      <div className="flex items-center justify-between gap-3 pt-2">
        <button
          onClick={() => setPhase(phase === "visualize" ? "schedule" : "upload")}
          disabled={phase === "upload"}
          className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-xl bg-secondary disabled:opacity-30 press-effect"
        >
          <ArrowLeft className="w-3.5 h-3.5" />Back
        </button>

        {phase !== "visualize" ? (
          <button
            onClick={() => setPhase(phase === "upload" ? "schedule" : "visualize")}
            disabled={!canAdvance}
            className="flex items-center gap-1.5 text-xs px-4 py-2 rounded-xl bg-primary text-primary-foreground disabled:opacity-40 press-effect font-semibold"
          >
            {phase === "upload" ? "Next: dates" : "Next: roadmap"}<ArrowRight className="w-3.5 h-3.5" />
          </button>
        ) : (
          <button
            onClick={batchSchedule}
            disabled={batchScheduling || nodes.length === 0}
            className="flex items-center gap-1.5 text-xs px-4 py-2 rounded-xl bg-primary text-primary-foreground disabled:opacity-40 press-effect font-semibold"
          >
            {batchScheduling ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : user.isPremium ? <Send className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
            {user.isPremium ? "Batch schedule all" : "Unlock batch schedule"}
          </button>
        )}
      </div>

      {!loading && nodes.length === 0 && phase !== "upload" && (
        <div className="text-center py-8 text-xs text-muted-foreground">
          <ImageIcon className="w-8 h-8 mx-auto mb-2 opacity-40" />
          Add some pictures first.
        </div>
      )}

      {!user.isLoggedIn && (
        <div className="glass rounded-2xl p-3 text-center text-[11px] text-muted-foreground">Sign in to save your reef across sessions.</div>
      )}

      {phase === "visualize" && user.isPremium && (
        <p className="text-[10px] text-emerald-400 text-center flex items-center justify-center gap-1">
          <CheckCircle2 className="w-3 h-3" />Premium unlocked — batch scheduling enabled.
        </p>
      )}
    </div>
  );
};

export default Reef;
