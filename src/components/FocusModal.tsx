import { motion, AnimatePresence } from "framer-motion";
import { X, Copy, Plus, Minus, RotateCw, Loader2, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { ContentCardData } from "./ContentCard";

interface FocusModalProps {
  card: ContentCardData | null;
  imageUrl: string | null;
  onClose: () => void;
  onUpdateCard?: (id: string, updates: Partial<ContentCardData>) => void;
  onRegenerate?: (id: string) => void;
}

const FocusModal = ({ card, imageUrl, onClose, onUpdateCard, onRegenerate }: FocusModalProps) => {
  const [isAdjusting, setIsAdjusting] = useState(false);
  const [stockImages, setStockImages] = useState<string[]>([]);
  const [loadingImages, setLoadingImages] = useState(false);
  const [imagesLoaded, setImagesLoaded] = useState(false);

  if (!card) return null;

  const fullText = `${card.hook}\n\n${card.body}\n\n${card.cta}\n\n${card.hashtags.join(" ")}`;
  const charCount = fullText.length;

  const handleCopy = () => {
    navigator.clipboard.writeText(fullText);
    toast.success("Copied to clipboard!");
  };

  const handleWeight = async (direction: "increase" | "decrease") => {
    if (!onUpdateCard) return;
    if (direction === "increase" && charCount >= 3000) {
      toast.error("Already at maximum LinkedIn limit (3,000)");
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
    } catch {
      toast.error("Failed to adjust weight");
    } finally {
      setIsAdjusting(false);
    }
  };

  const loadStockImages = async () => {
    if (imagesLoaded || loadingImages) return;
    const terms = card.imageSearchTerms;
    if (!terms || terms.length === 0) {
      toast.info("No image suggestions for this post");
      return;
    }
    setLoadingImages(true);
    try {
      // Use Pexels-like placeholder images based on search terms
      const images = terms.flatMap((term) => {
        const encoded = encodeURIComponent(term);
        return [
          `https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=400&q=80&fit=crop`, // fallback
          `https://source.unsplash.com/400x300/?${encoded}`,
        ];
      });
      // Use unique URLs with search terms
      const uniqueImages = terms.map((term) => 
        `https://source.unsplash.com/600x400/?${encodeURIComponent(term)}`
      );
      setStockImages(uniqueImages);
      setImagesLoaded(true);
    } catch {
      toast.error("Failed to load images");
    } finally {
      setLoadingImages(false);
    }
  };

  // Auto-load images on open
  if (!imagesLoaded && !loadingImages && card.imageSearchTerms && card.imageSearchTerms.length > 0) {
    loadStockImages();
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="glass rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-auto p-6"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header with controls */}
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold px-2 py-1 rounded-md bg-primary/20 text-primary">
                {card.type}
              </span>
              <span className="text-[10px] text-muted-foreground">{charCount} chars</span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => handleWeight("increase")}
                disabled={isAdjusting}
                className="p-2 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                title="Expand post"
              >
                {isAdjusting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              </button>
              <button
                onClick={() => handleWeight("decrease")}
                disabled={isAdjusting}
                className="p-2 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                title="Condense post"
              >
                <Minus className="w-4 h-4" />
              </button>
              {onRegenerate && (
                <button
                  onClick={() => onRegenerate(card.id)}
                  className="p-2 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                  title="Regenerate"
                >
                  <RotateCw className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={handleCopy}
                className="p-2 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                title="Copy"
              >
                <Copy className="w-4 h-4" />
              </button>
              <button onClick={onClose} className="p-2 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Post content */}
          <div className="space-y-4">
            <h2 className="text-xl font-bold font-display text-foreground">{card.hook}</h2>
            <div className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
              {card.body}
            </div>
            <p className="text-sm text-primary font-semibold">{card.cta}</p>
            <div className="flex flex-wrap gap-2">
              {card.hashtags.map((tag) => (
                <span key={tag} className="text-xs text-muted-foreground bg-secondary px-2 py-1 rounded-md">{tag}</span>
              ))}
            </div>
          </div>

          {/* Stock image suggestions */}
          {stockImages.length > 0 && (
            <div className="mt-6 space-y-3">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <ImageIcon className="w-3.5 h-3.5" />
                Suggested Images
              </h3>
              <div className="flex gap-3 overflow-x-auto pb-2 -mx-2 px-2 scrollbar-thin">
                {stockImages.map((url, i) => (
                  <div
                    key={i}
                    className="flex-shrink-0 w-48 h-32 rounded-xl overflow-hidden glass hover:glow-border transition-all cursor-pointer"
                  >
                    <img
                      src={url}
                      alt={card.imageSearchTerms?.[i] || "Stock image"}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-muted-foreground">
                Search terms: {card.imageSearchTerms?.join(", ")}
              </p>
            </div>
          )}

          {loadingImages && (
            <div className="mt-6 flex items-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              Loading image suggestions...
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default FocusModal;
