// Batch — formerly Content Engine. Multi-vibe selection, Think mode, image attach,
// background-safe (parent owns generation state).
import { useState, useCallback, useRef } from "react";
import { useUserProfile } from "@/hooks/useUserProfile";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Loader2, Brain, Paperclip, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { ContentCardData } from "@/components/ContentCard";

const VIBES = [
  "Professional", "Inspirational", "Controversial", "Storytelling", "Educational",
  "Witty", "Vulnerable", "Data-driven", "Bold", "Empathetic", "Contrarian", "Behind-the-scenes",
];
const POST_LENGTHS = [
  { id: "short" as const, label: "Short", desc: "Under 400 chars" },
  { id: "medium" as const, label: "Medium", desc: "800–1200 chars" },
  { id: "long" as const, label: "Long", desc: "2000+ chars" },
];

interface ContentEngineProps {
  onCardsGenerated: (cards: ContentCardData[]) => void;
  isGenerating: boolean;
  setIsGenerating: (v: boolean) => void;
  hasCards: boolean;
  isPro: boolean;
}

const ContentEngine = ({ onCardsGenerated, isGenerating, setIsGenerating, hasCards, isPro }: ContentEngineProps) => {
  const { isPremium } = useUserProfile();
  const [prompt, setPrompt] = useState("");
  const [vibes, setVibes] = useState<string[]>(["Professional"]);
  const [postLength, setPostLength] = useState<"short" | "medium" | "long">("medium");
  const [batchSize, setBatchSize] = useState(5);
  const [think, setThink] = useState(false);
  const [attachments, setAttachments] = useState<{ id: string; url: string; name: string }[]>([]);
  const characterLimit = 300;
  const isOverLimit = !isPremium && prompt.length > characterLimit;
  const fileRef = useRef<HTMLInputElement>(null);

  const toggleVibe = (v: string) => {
    setVibes(prev => prev.includes(v) ? prev.filter(x => x !== v) : [...prev, v]);
  };

  const addImages = async (files: FileList | null) => {
    if (!files) return;
    const items = await Promise.all(Array.from(files).slice(0, 5).map(f => new Promise<{ id: string; url: string; name: string }>((res, rej) => {
      const r = new FileReader();
      r.onload = () => res({ id: `att-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, url: r.result as string, name: f.name });
      r.onerror = rej;
      r.readAsDataURL(f);
    })));
    setAttachments(prev => [...prev, ...items].slice(0, 5));
  };

  const handleGenerate = useCallback(async () => {
    const trimmed = prompt.trim();
    if (!trimmed) { toast.error("Tell me what to write about"); return; }
    if (vibes.length === 0) { toast.error("Pick at least one vibe"); return; }

    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-content", {
        body: {
          prompt: trimmed,
          postLength,
          vibe: vibes.join(", "),
          batchSize,
          think,
          attachments: attachments.map(a => ({ name: a.name, dataUrl: a.url })),
        },
      });
      if (error) throw error;
      if (data?.clarify) {
        toast.message("Clippie wants to clarify", { description: data.clarify });
        return;
      }
      if (data?.posts) {
        const cards: ContentCardData[] = data.posts.map((post: any, i: number) => ({
          id: crypto.randomUUID?.() || `card-${Date.now()}-${i}`,
          type: post.type || post.framework || "Post",
          hook: post.hook, body: post.body, cta: post.cta,
          hashtags: post.hashtags || [], imageSearchTerms: post.imageSearchTerms || [],
        }));
        onCardsGenerated(cards);
        toast.success(`Generated ${cards.length} posts`);
      }
    } catch (err: any) {
      toast.error(err?.message || "Generation failed. Try again.");
    } finally {
      setIsGenerating(false);
    }
  }, [prompt, postLength, vibes, batchSize, think, attachments, onCardsGenerated, setIsGenerating]);

  return (
    <AnimatePresence mode="wait">
      {!hasCards ? (
        <motion.section
          key="input"
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -30 }}
          transition={{ duration: 0.3 }}
          className="px-4 sm:px-6 py-8 flex flex-col items-center justify-center min-h-[60vh]"
        >
          <div className="w-full max-w-2xl space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-2xl sm:text-3xl font-bold font-display text-foreground">
                Create High-Impact Content
              </h2>
              <p className="text-sm text-muted-foreground">
                Tell us your idea. Pick the vibes. We&rsquo;ll write a batch of LinkedIn-ready posts.
              </p>
            </div>

            {/* Attachments preview */}
            {attachments.length > 0 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {attachments.map(a => (
                  <div key={a.id} className="relative shrink-0">
                    <img src={a.url} alt={a.name} className="w-16 h-16 object-cover rounded-xl" />
                    <button onClick={() => setAttachments(prev => prev.filter(x => x.id !== a.id))} className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-background border border-border flex items-center justify-center press-effect">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Text input */}
            <div className="relative">
              <textarea
                value={prompt}
                onChange={e => setPrompt(e.target.value)}
                placeholder="e.g. 'I just got promoted after 2 years of grinding' or 'AI in marketing for tech leaders'"
                className="w-full min-h-[120px] rounded-xl bg-secondary border border-border p-4 pr-32 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                onKeyDown={e => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleGenerate(); }}
              />
              <div className="absolute bottom-3 right-3 flex items-center gap-1.5">
                <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={e => { addImages(e.target.files); e.target.value = ""; }} />
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="h-9 w-9 rounded-lg bg-secondary hover:bg-secondary/70 flex items-center justify-center press-effect text-muted-foreground"
                  title="Attach pictures for context"
                >
                  <Paperclip className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setThink(t => !t)}
                  className={`h-9 px-3 rounded-lg flex items-center gap-1 press-effect text-xs font-medium ${think ? "bg-accent text-accent-foreground" : "bg-secondary text-muted-foreground hover:bg-secondary/70"}`}
                  title="Think before writing — asks for missing context"
                >
                  <Brain className="w-3.5 h-3.5" />Think
                </button>
                <Button
                  size="icon"
                  onClick={handleGenerate}
                  disabled={!prompt.trim() || isGenerating || isOverLimit}
                  className="h-9 w-9 rounded-lg bg-primary hover:bg-primary/90"
                >
                  {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </Button>
              </div>
            </div>
            {isOverLimit && (
              <p className="text-xs text-rose-400 text-center">Free plan caps prompts at {characterLimit} characters.</p>
            )}

            {/* Options row */}
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Post Length</label>
                <div className="grid grid-cols-3 gap-2">
                  {POST_LENGTHS.map(pl => (
                    <button
                      key={pl.id}
                      onClick={() => setPostLength(pl.id)}
                      className={`p-3 rounded-xl text-left transition-all ${postLength === pl.id ? "glass glow-border" : "bg-secondary/50 hover:bg-secondary"}`}
                    >
                      <p className={`text-xs font-semibold ${postLength === pl.id ? "text-foreground" : "text-muted-foreground"}`}>{pl.label}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5 hidden sm:block">{pl.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Vibes <span className="text-[10px] normal-case text-muted-foreground/70">(pick one or many)</span>
                </label>
                <div className="flex gap-1.5 flex-wrap">
                  {VIBES.map(v => (
                    <button
                      key={v}
                      onClick={() => toggleVibe(v)}
                      className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${vibes.includes(v) ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"}`}
                    >
                      {v}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Batch size: {batchSize}</label>
                <input
                  type="range" min={1} max={isPremium ? 50 : 10}
                  value={batchSize} onChange={e => setBatchSize(Number(e.target.value))}
                  className="w-full accent-primary"
                />
                {!isPremium && <p className="text-[10px] text-muted-foreground">Premium unlocks up to 50 posts per batch.</p>}
              </div>
            </div>

            {isGenerating && (
              <div className="glass rounded-2xl p-3 text-xs text-foreground flex items-center justify-center gap-2">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
                Working in the background — feel free to switch tabs.
              </div>
            )}

            <p className="text-[10px] text-muted-foreground text-center">
              Press <kbd className="px-1.5 py-0.5 rounded bg-secondary text-foreground text-[10px]">⌘ Enter</kbd> to generate
            </p>
          </div>
        </motion.section>
      ) : (
        <motion.div key="compact" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="px-4 sm:px-6 py-3">
          <div className="flex items-center gap-3 max-w-3xl mx-auto">
            <div className="relative flex-1">
              <textarea
                value={prompt}
                onChange={e => setPrompt(e.target.value)}
                placeholder="Refine your idea…"
                rows={1}
                className="w-full rounded-lg bg-secondary border border-border px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                onKeyDown={e => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleGenerate(); }}
              />
            </div>
            <Button size="sm" onClick={handleGenerate} disabled={!prompt.trim() || isGenerating || isOverLimit} className="h-9 px-4 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold">
              {isGenerating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
            </Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ContentEngine;
