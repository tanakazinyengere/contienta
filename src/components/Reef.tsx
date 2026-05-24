import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, Image as ImageIcon, Plus, Calendar, Trash2, GripVertical } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

interface ReefNode {
  id: string;
  imageDataUrl: string;
  title: string;
  caption: string;
  scheduledAt?: string;
}

const Reef = () => {
  const [nodes, setNodes] = useState<ReefNode[]>([]);

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
              });
            r.onerror = rej;
            r.readAsDataURL(f);
          })
      )
    );
    setNodes(prev => [...prev, ...newNodes]);
    toast.success(`${newNodes.length} image${newNodes.length > 1 ? "s" : ""} added to your reef`);
  };

  const updateNode = (id: string, patch: Partial<ReefNode>) =>
    setNodes(prev => prev.map(n => (n.id === id ? { ...n, ...patch } : n)));

  const removeNode = (id: string) => setNodes(prev => prev.filter(n => n.id !== id));

  return (
    <div className="px-4 sm:px-6 py-6 space-y-6 max-w-5xl mx-auto">
      <div className="text-center space-y-2">
        <h2 className="text-fluid-xl font-bold font-display text-foreground">🪸 Reef</h2>
        <p className="text-fluid-sm text-muted-foreground">
          Upload pictures in the order they tell your story. Attach a post to each, then schedule them down the reef.
        </p>
      </div>

      <label className="block">
        <input
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={e => handleFiles(e.target.files)}
        />
        <div className="glass rounded-3xl p-8 border-2 border-dashed border-border text-center cursor-pointer hover:border-primary transition-colors press-effect">
          <Upload className="w-8 h-8 mx-auto text-primary mb-2" />
          <p className="text-sm font-medium text-foreground">Drop or pick images</p>
          <p className="text-xs text-muted-foreground mt-1">Order = story order. Up to 10 at a time.</p>
        </div>
      </label>

      {nodes.length > 0 && (
        <div className="relative">
          <div className="absolute left-6 top-0 bottom-0 w-px bg-gradient-to-b from-primary/60 via-primary/20 to-transparent" />
          <div className="space-y-4">
            <AnimatePresence>
              {nodes.map((n, i) => (
                <motion.div
                  key={n.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="relative pl-14"
                >
                  <div className="absolute left-3 top-4 w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">
                    {i + 1}
                  </div>
                  <div className="glass rounded-3xl p-4 flex flex-col sm:flex-row gap-4">
                    <img
                      src={n.imageDataUrl}
                      alt={n.title}
                      className="w-full sm:w-32 h-32 object-cover rounded-2xl"
                    />
                    <div className="flex-1 space-y-2">
                      <input
                        value={n.title}
                        onChange={e => updateNode(n.id, { title: e.target.value })}
                        className="w-full bg-transparent text-sm font-semibold text-foreground outline-none border-b border-transparent focus:border-primary py-1"
                        placeholder="Title"
                      />
                      <textarea
                        value={n.caption}
                        onChange={e => updateNode(n.id, { caption: e.target.value })}
                        rows={2}
                        placeholder="Post caption for this image (or generate one in the Engine and paste here)"
                        className="w-full bg-secondary/50 rounded-xl p-2 text-xs text-foreground outline-none resize-none"
                      />
                      <div className="flex flex-wrap gap-2 items-center">
                        <label className="flex items-center gap-1.5 text-xs text-muted-foreground glass rounded-xl px-2.5 py-1.5">
                          <Calendar className="w-3.5 h-3.5" />
                          <input
                            type="datetime-local"
                            value={n.scheduledAt || ""}
                            onChange={e => updateNode(n.id, { scheduledAt: e.target.value })}
                            className="bg-transparent outline-none text-xs"
                          />
                        </label>
                        <button
                          onClick={() => removeNode(n.id)}
                          className="text-xs text-muted-foreground hover:text-destructive transition-colors flex items-center gap-1 ml-auto press-effect"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}

      {nodes.length === 0 && (
        <div className="text-center py-8 text-xs text-muted-foreground">
          <ImageIcon className="w-8 h-8 mx-auto mb-2 opacity-40" />
          Your reef is empty. Add images to start mapping a story.
        </div>
      )}
    </div>
  );
};

export default Reef;
