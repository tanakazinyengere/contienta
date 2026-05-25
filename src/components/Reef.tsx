import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, Image as ImageIcon, Calendar, Trash2, GripVertical, Save, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { supabase } from "@/integrations/supabase/client";
import { useUserProfile } from "@/hooks/useUserProfile";

interface ReefNode {
  id: string; // local UUID
  dbId?: string; // supabase row id
  imageDataUrl: string;
  title: string;
  caption: string;
  scheduledAt?: string;
  position: number;
}

const SortableNode = ({ node, index, onUpdate, onRemove }: { node: ReefNode; index: number; onUpdate: (id: string, patch: Partial<ReefNode>) => void; onRemove: (id: string) => void }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: node.id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 };
  return (
    <div ref={setNodeRef} style={style} className="relative pl-14">
      <div className="absolute left-3 top-4 w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">
        {index + 1}
      </div>
      <div className="glass rounded-3xl p-4 flex flex-col sm:flex-row gap-4">
        <button {...attributes} {...listeners} className="self-start sm:self-center p-1 text-muted-foreground hover:text-foreground cursor-grab active:cursor-grabbing touch-none" aria-label="Drag to reorder">
          <GripVertical className="w-4 h-4" />
        </button>
        <img src={node.imageDataUrl} alt={node.title} className="w-full sm:w-32 h-32 object-cover rounded-2xl" />
        <div className="flex-1 space-y-2">
          <input
            value={node.title}
            onChange={e => onUpdate(node.id, { title: e.target.value })}
            className="w-full bg-transparent text-sm font-semibold text-foreground outline-none border-b border-transparent focus:border-primary py-1"
            placeholder="Title"
          />
          <textarea
            value={node.caption}
            onChange={e => onUpdate(node.id, { caption: e.target.value })}
            rows={2}
            placeholder="Post caption for this image"
            className="w-full bg-secondary/50 rounded-xl p-2 text-xs text-foreground outline-none resize-none"
          />
          <div className="flex flex-wrap gap-2 items-center">
            <label className="flex items-center gap-1.5 text-xs text-muted-foreground glass rounded-xl px-2.5 py-1.5">
              <Calendar className="w-3.5 h-3.5" />
              <input
                type="datetime-local"
                value={node.scheduledAt || ""}
                onChange={e => onUpdate(node.id, { scheduledAt: e.target.value })}
                className="bg-transparent outline-none text-xs"
              />
            </label>
            <button onClick={() => onRemove(node.id)} className="text-xs text-muted-foreground hover:text-destructive transition-colors flex items-center gap-1 ml-auto press-effect">
              <Trash2 className="w-3.5 h-3.5" />Remove
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const Reef = () => {
  const user = useUserProfile();
  const [nodes, setNodes] = useState<ReefNode[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));

  // Load on mount
  useEffect(() => {
    if (!user.isLoggedIn) return;
    setLoading(true);
    supabase.from("reef_nodes").select("*").eq("user_id", user.userId).order("position").then(({ data, error }) => {
      if (error) { console.error(error); setLoading(false); return; }
      const loaded: ReefNode[] = (data || []).map(r => ({
        id: r.id,
        dbId: r.id,
        imageDataUrl: r.image_url,
        title: r.title,
        caption: r.caption,
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
          user_id: user.userId,
          reef_id: user.userId, // single reef per user for now
          position: idx,
          image_url: n.imageDataUrl,
          title: n.title,
          caption: n.caption,
          scheduled_at: n.scheduledAt ? new Date(n.scheduledAt).toISOString() : null,
        }));
        const { data, error } = await supabase.from("reef_nodes").upsert(rows).select("id, position");
        if (error) throw error;
        // Patch back db ids in case any were new
        if (data) {
          setNodes(curr => curr.map((n, idx) => {
            const match = data.find(d => d.position === idx);
            return match ? { ...n, dbId: match.id, id: match.id } : n;
          }));
        }
      } catch (e: any) {
        console.error(e);
        toast.error("Couldn't save reef order");
      } finally {
        setSaving(false);
      }
    }, 1200);
  }, [user.isLoggedIn, user.userId]);

  const updateNode = (id: string, patch: Partial<ReefNode>) => {
    setNodes(prev => {
      const next = prev.map(n => n.id === id ? { ...n, ...patch } : n);
      scheduleSave(next);
      return next;
    });
  };

  const removeNode = async (id: string) => {
    const target = nodes.find(n => n.id === id);
    setNodes(prev => {
      const next = prev.filter(n => n.id !== id);
      scheduleSave(next);
      return next;
    });
    if (target?.dbId) {
      await supabase.from("reef_nodes").delete().eq("id", target.dbId);
    }
  };

  const handleFiles = async (files: FileList | null) => {
    if (!files) return;
    const arr = Array.from(files).slice(0, 10);
    const newNodes: ReefNode[] = await Promise.all(
      arr.map(
        f =>
          new Promise<ReefNode>((res, rej) => {
            const r = new FileReader();
            r.onload = () =>
              res({
                id: `n-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
                imageDataUrl: r.result as string,
                title: f.name.replace(/\.[^.]+$/, "").slice(0, 40),
                caption: "",
                position: nodes.length,
              });
            r.onerror = rej;
            r.readAsDataURL(f);
          })
      )
    );
    setNodes(prev => {
      const next = [...prev, ...newNodes].map((n, i) => ({ ...n, position: i }));
      scheduleSave(next);
      return next;
    });
    toast.success(`${newNodes.length} image${newNodes.length > 1 ? "s" : ""} added to your reef`);
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

  return (
    <div className="px-4 sm:px-6 py-6 space-y-6 max-w-5xl mx-auto">
      <div className="text-center space-y-2">
        <h2 className="text-fluid-xl font-bold font-display text-foreground">🪸 Reef</h2>
        <p className="text-fluid-sm text-muted-foreground">
          Upload pictures in the order they tell your story. Drag to reorder — saved automatically.
        </p>
        {saving && <p className="text-[10px] text-primary flex items-center justify-center gap-1"><Loader2 className="w-3 h-3 animate-spin" />Saving…</p>}
      </div>

      {!user.isLoggedIn && (
        <div className="glass rounded-2xl p-4 text-center text-xs text-muted-foreground">Sign in to save your reef across sessions.</div>
      )}

      <label className="block">
        <input type="file" accept="image/*" multiple className="hidden" onChange={e => handleFiles(e.target.files)} />
        <div className="glass rounded-3xl p-8 border-2 border-dashed border-border text-center cursor-pointer hover:border-primary transition-colors press-effect">
          <Upload className="w-8 h-8 mx-auto text-primary mb-2" />
          <p className="text-sm font-medium text-foreground">Drop or pick images</p>
          <p className="text-xs text-muted-foreground mt-1">Drag the handle on the left of each card to reorder.</p>
        </div>
      </label>

      {loading && <div className="text-center text-xs text-muted-foreground"><Loader2 className="w-4 h-4 animate-spin inline mr-1" />Loading your reef…</div>}

      {nodes.length > 0 && (
        <div className="relative">
          <div className="absolute left-6 top-0 bottom-0 w-px bg-gradient-to-b from-primary/60 via-primary/20 to-transparent" />
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
            <SortableContext items={nodes.map(n => n.id)} strategy={verticalListSortingStrategy}>
              <div className="space-y-4">
                <AnimatePresence>
                  {nodes.map((n, i) => (
                    <motion.div key={n.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}>
                      <SortableNode node={n} index={i} onUpdate={updateNode} onRemove={removeNode} />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </SortableContext>
          </DndContext>
        </div>
      )}

      {!loading && nodes.length === 0 && (
        <div className="text-center py-8 text-xs text-muted-foreground">
          <ImageIcon className="w-8 h-8 mx-auto mb-2 opacity-40" />
          Your reef is empty. Add images to start mapping a story.
        </div>
      )}
    </div>
  );
};

export default Reef;
