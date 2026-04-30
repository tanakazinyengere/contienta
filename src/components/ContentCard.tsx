import { motion } from "framer-motion";
import { Copy, RotateCw, Maximize, Plus, Minus, Loader2, Bookmark } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface ContentCardData {
  id: string;
  type: string;
  hook: string;
  body: string;
  cta: string;
  hashtags: string[];
  imageSearchTerms?: string[];
}

interface ContentCardProps {
  card: ContentCardData;
  index: number;
  onRegenerate: (id: string) => void;
  onExpand: (card: ContentCardData) => void;
  onUpdateCard: (id: string, updates: Partial<ContentCardData>) => void;
}

const typeColors: Record<string, string> = {
  "How-to": "bg-emerald-500/20 text-emerald-400",
  "Listicle Waterfall": "bg-emerald-500/20 text-emerald-400",
  "Controversial": "bg-rose-500/20 text-rose-400",
  "Contrarian Lightning Bolt": "bg-rose-500/20 text-rose-400",
  "Personal Story": "bg-amber-500/20 text-amber-400",
  "Documentary Slide": "bg-amber-500/20 text-amber-400",
  "Data Insight": "bg-cyan-500/20 text-cyan-400",
  "Data-Driven Teardown": "bg-cyan-500/20 text-cyan-400",
  "Listicle": "bg-violet-500/20 text-violet-400",
  "Question Hook": "bg-pink-500/20 text-pink-400",
  "Myth Buster": "bg-orange-500/20 text-orange-400",
  "Framework": "bg-sky-500/20 text-sky-400",
  "SLAY Framework": "bg-sky-500/20 text-sky-400",
  "BAB Framework": "bg-indigo-500/20 text-indigo-400",
  "PAS Framework": "bg-teal-500/20 text-teal-400",
  "Hook-Context-Tension-Pivot-Payoff": "bg-purple-500/20 text-purple-400",
};

const ContentCard = ({ card, index, onRegenerate, onExpand, onUpdateCard }: ContentCardProps) => {
  const [isAdjusting, setIsAdjusting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const fullText = `${card.hook}\n\n${card.body}\n\n${card.cta}\n\n${card.hashtags.join(" ")}`;
  const charCount = fullText.length;

  const handleCopy = () => {
    navigator.clipboard.writeText(fullText);
    toast.success("Copied to clipboard!");
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Sign in to save posts");
        return;
      }
      const { error } = await supabase.from("saved_posts").insert({
        user_id: session.user.id,
        post_type: card.type,
        hook: card.hook,
        body: card.body,
        cta: card.cta,
        hashtags: card.hashtags,
        image_search_terms: card.imageSearchTerms || [],
      });
      if (error) throw error;
      toast.success("Post saved to dashboard!");
    } catch (err) {
      console.error("Save failed:", err);
      toast.error("Failed to save post");
    } finally {
      setIsSaving(false);
    }
  };

  const handleWeight = async (direction: "increase" | "decrease") => {
    if (direction === "increase" && charCount >= 3000) {
      toast.error("Already at maximum LinkedIn character limit (3,000)");
      return;
    }
    if (direction === "decrease" && charCount <= 50) {
      toast.error("Post is already very short");
      return;
    }

    setIsAdjusting(true);
    try {
      const { data, error } = await supabase.functions.invoke("adjust-weight", {
        body: { hook: card.hook, body: card.body, cta: card.cta, direction },
      });
      if (error) throw error;
      if (data) {
        onUpdateCard(card.id, {
          hook: data.hook || card.hook,
          body: data.body || card.body,
          cta: data.cta || card.cta,
        });
        toast.success(direction === "increase" ? "Post expanded" : "Post condensed");
      }
    } catch (err) {
      console.error("Weight adjust failed:", err);
      toast.error("Failed to adjust weight");
    } finally {
      setIsAdjusting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3, type: "spring", bounce: 0.15 }}
      className="glass rounded-3xl p-5 space-y-3 hover:glow-border transition-all duration-300 press-effect break-inside-avoid mb-4"
    >
      <div className="flex items-start justify-between">
        <span className={`text-[10px] font-semibold px-2 py-1 rounded-xl ${typeColors[card.type] || "bg-primary/20 text-primary"}`}>
          {card.type}
        </span>
        {/* Always visible action buttons */}
        <div className="flex gap-1">
          <button
            onClick={() => handleWeight("increase")}
            disabled={isAdjusting}
            className="p-1.5 rounded-xl hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors press-effect"
            title="Expand post"
          >
            {isAdjusting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={() => handleWeight("decrease")}
            disabled={isAdjusting}
            className="p-1.5 rounded-xl hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors press-effect"
            title="Condense post"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => onExpand(card)} className="p-1.5 rounded-xl hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors press-effect" title="Fullscreen">
            <Maximize className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => onRegenerate(card.id)} className="p-1.5 rounded-xl hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors press-effect" title="Regenerate">
            <RotateCw className="w-3.5 h-3.5" />
          </button>
          <button onClick={handleCopy} className="p-1.5 rounded-xl hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors press-effect" title="Copy">
            <Copy className="w-3.5 h-3.5" />
          </button>
          <button onClick={handleSave} disabled={isSaving} className="p-1.5 rounded-xl hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors press-effect" title="Save">
            {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Bookmark className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      <p className="text-sm font-bold text-foreground leading-snug">{card.hook}</p>
      <p className="text-xs text-muted-foreground leading-relaxed line-clamp-4 whitespace-pre-line">{card.body}</p>
      <p className="text-xs text-primary font-medium">{card.cta}</p>
      <div className="flex items-center justify-between">
        <div className="flex flex-wrap gap-1">
          {card.hashtags.map((tag) => (
            <span key={tag} className="text-[10px] text-muted-foreground">{tag}</span>
          ))}
        </div>
        <span className="text-[10px] text-muted-foreground">{charCount} chars</span>
      </div>
    </motion.div>
  );
};

export default ContentCard;
