import { useUserProfile } from "@/hooks/useUserProfile";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { ContentCardData } from "@/components/ContentCard";
import confetti from "canvas-confetti";

const VIBES = ["Professional", "Inspirational", "Controversial", "Storytelling", "Educational"];
const POST_LENGTHS = [
  { id: "short" as const, label: "Short", desc: "Under 400 chars · Punchy & provocative", emoji: "⚡" },
  { id: "medium" as const, label: "Medium", desc: "800–1200 chars · Narrative + advice", emoji: "📝" },
  { id: "long" as const, label: "Long", desc: "2000+ chars · Deep-dive guides", emoji: "📖" },
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
  const [vibe, setVibe] = useState("Professional");
  const [postLength, setPostLength] = useState<"short" | "medium" | "long">("medium");
  const characterLimit = 300;
  const isOverLimit = !isPremium && prompt.length > characterLimit;
  const [batchSize, setBatchSize] = useState(5);


  const handleGenerate = useCallback(async () => {
    const trimmed = prompt.trim();
    if (!trimmed) {
      toast.error("Please enter your idea, topic, or story");
      return;
    }

    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-content", {
        body: { prompt: trimmed, postLength, vibe, batchSize },
      });

      if (error) throw error;

      if (data?.posts) {
        const cards: ContentCardData[] = data.posts.map((post: any, i: number) => ({
          id: crypto.randomUUID?.() || `card-${Date.now()}-${i}-${Math.random()}`,
          type: post.type || post.framework || "High-Impact Narrative",
          hook: post.hook,
          body: post.body,
          cta: post.cta,
          hashtags: post.hashtags || [],
          imageSearchTerms: post.imageSearchTerms || [],
        }));
        onCardsGenerated(cards);
        toast.success(`Generated ${cards.length} High-Impact Narratives!`);
        
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#6366f1', '#a855f7', '#ec4899']
        });
      }
    } catch (err: any) {
      console.error("Generation failed:", err);
      toast.error(err?.message || "Generation failed. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  }, [prompt, postLength, vibe, batchSize, onCardsGenerated, setIsGenerating]);

  return (
    <AnimatePresence mode="wait">
      {!hasCards ? (
        <motion.section
          key="input"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -30 }}
          transition={{ duration: 0.3 }}
          className="px-4 sm:px-6 py-8 flex flex-col items-center justify-center min-h-[60vh]"
        >
          <div className="w-full max-w-2xl space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-2xl sm:text-3xl font-bold font-display text-foreground">
                Create High-Impact Narratives
              </h2>
              <p className="text-sm text-muted-foreground">
                Share your authority angle, mission, or breakthrough idea. ClippedIn transforms it into LinkedIn-ready narratives designed to convert.
              </p>
            </div>
            {!isPro && (
              <div className="rounded-3xl border border-primary/20 bg-primary/5 p-4 text-sm text-foreground">
                <p className="font-semibold">You have used 1/5 daily credits.</p>
                <p className="text-muted-foreground">Upgrade to Diamond for unlimited peak-time Strategic Distribution and PostLab Thinking Mode.</p>
              </div>
            )}

            {/* Text input */}
            <div className="relative">
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="e.g. 'I just got promoted after 2 years of grinding' or 'Write about AI in Marketing for tech leaders' or just 'Remote work tips'..."
                className="w-full min-h-[120px] rounded-xl bg-secondary border border-border p-4 pr-14 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleGenerate();
                }}
              />
              <Button
                size="icon"
                onClick={handleGenerate}
                disabled={!prompt.trim() || isGenerating}
                className="absolute bottom-3 right-3 h-10 w-10 rounded-lg bg-primary hover:bg-primary/90"
              >
                {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </Button>
            </div>

            {/* Options row */}
            <div className="space-y-4">
              {/* Post length */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Post Length</label>
                <div className="grid grid-cols-3 gap-2">
                  {POST_LENGTHS.map((pl) => (
                    <button
                      key={pl.id}
                      onClick={() => setPostLength(pl.id)}
                      className={`p-3 rounded-xl text-left transition-all ${
                        postLength === pl.id
                          ? "glass glow-border"
                          : "bg-secondary/50 hover:bg-secondary"
                      }`}
                    >
                      <span className="text-lg">{pl.emoji}</span>
                      <p className={`text-xs font-semibold mt-1 ${postLength === pl.id ? "text-foreground" : "text-muted-foreground"}`}>{pl.label}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5 hidden sm:block">{pl.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Vibe + Batch */}
              <div className="flex flex-wrap items-end gap-4">
                <div className="space-y-2 flex-1 min-w-[200px]">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Vibe</label>
                  <div className="flex gap-1.5 flex-wrap">
                    {VIBES.map((v) => (
                      <button
                        key={v}
                        onClick={() => setVibe(v)}
                        className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                          vibe === v
                            ? "bg-primary text-primary-foreground"
                            : "bg-secondary text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {v}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">High-Impact Narratives: {batchSize}</label>
                  <input
                    type="range"
                    min={1}
                    max={50}
                    value={batchSize}
                    onChange={(e) => setBatchSize(Number(e.target.value))}
                    className="w-20 accent-primary"
                  />
                </div>
              </div>
            </div>

            <p className="text-[10px] text-muted-foreground text-center">
              Press <kbd className="px-1.5 py-0.5 rounded bg-secondary text-foreground text-[10px]">⌘ Enter</kbd> to generate
            </p>
          </div>
        </motion.section>
      ) : (
        <motion.div
          key="compact"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="px-4 sm:px-6 py-3"
        >
          <div className="flex items-center gap-3 max-w-3xl mx-auto">
            <div className="relative flex-1">
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Refine your idea..."
                rows={1}
                className="w-full rounded-lg bg-secondary border border-border px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleGenerate();
                }}
              />
              {!isPremium && (
                <div className="absolute bottom-1 right-2 text-[10px] text-muted-foreground">
                  {prompt.length}/{characterLimit}
                </div>
              )}
              {isOverLimit && (
                <div className="absolute top-full mt-1 left-0 right-0 text-center">
                  <p className="text-xs text-rose-400 bg-rose-50 dark:bg-rose-950 px-2 py-1 rounded">
                    Character limit reached. Upgrade to Platinum for unlimited editing.
                  </p>
                </div>
              )}
            </div>
            <div className="flex gap-1.5 flex-shrink-0">
              {POST_LENGTHS.map((pl) => (
                <button
                  key={pl.id}
                  onClick={() => setPostLength(pl.id)}
                  className={`px-2 py-1.5 text-[10px] font-medium rounded-md transition-all ${
                    postLength === pl.id
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-muted-foreground"
                  }`}
                  title={pl.desc}
                >
                  {pl.emoji}
                </button>
              ))}
            </div>
            <Button
              size="sm"
              onClick={handleGenerate}
              disabled={!prompt.trim() || isGenerating || isOverLimit}
              className="h-9 px-4 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold disabled:opacity-50"
            >
              {isGenerating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
            </Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ContentEngine;
