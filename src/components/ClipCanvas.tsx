import ContentCard, { type ContentCardData } from "./ContentCard";
import FocusModal from "./FocusModal";
import ProGate from "./ProGate";
import { useState } from "react";
import { ArrowLeft, Lock } from "lucide-react";
import { motion } from "framer-motion";

interface ClipCanvasProps {
  cards: ContentCardData[];
  selectedImage: string | null;
  onRegenerate: (id: string) => void;
  onUpdateCard: (id: string, updates: Partial<ContentCardData>) => void;
  onClear: () => void;
  isPro?: boolean;
}

const ClipCanvas = ({ cards, selectedImage, onRegenerate, onUpdateCard, onClear, isPro = false }: ClipCanvasProps) => {
  const [expandedCard, setExpandedCard] = useState<ContentCardData | null>(null);
  const [showProGate, setShowProGate] = useState(false);

  const FREE_LIMIT = 5;
  const visibleCards = isPro ? cards : cards.slice(0, FREE_LIMIT);
  const blurredCards = isPro ? [] : cards.slice(FREE_LIMIT);

  return (
    <section className="px-4 sm:px-6 py-4 space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold font-display">
          📋 Clip Canvas <span className="text-xs text-muted-foreground font-normal ml-2">{cards.length} posts</span>
        </h2>
        <button
          onClick={onClear}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-lg bg-secondary"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          New prompt
        </button>
      </div>

      <div className="columns-1 sm:columns-2 lg:columns-3 gap-4">
        {visibleCards.map((card, idx) => (
          <ContentCard
            key={card.id}
            card={card}
            index={idx}
            onRegenerate={onRegenerate}
            onExpand={setExpandedCard}
            onUpdateCard={onUpdateCard}
          />
        ))}
      </div>

      {/* Blurred Pro-gated posts */}
      {blurredCards.length > 0 && (
        <div className="relative">
          <div className="columns-1 sm:columns-2 lg:columns-3 gap-4 blur-md pointer-events-none select-none opacity-60">
            {blurredCards.slice(0, 6).map((card, idx) => (
              <ContentCard
                key={card.id}
                card={card}
                index={idx + FREE_LIMIT}
                onRegenerate={() => {}}
                onExpand={() => {}}
                onUpdateCard={() => {}}
              />
            ))}
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="z-10"
            >
              {showProGate ? (
                <ProGate onClose={() => setShowProGate(false)} />
              ) : (
                <button
                  onClick={() => setShowProGate(true)}
                  className="glass rounded-3xl px-8 py-6 text-center space-y-3 glow-border press-effect"
                >
                  <Lock className="w-8 h-8 text-primary mx-auto" />
                  <p className="text-sm font-bold text-foreground">
                    +{blurredCards.length} more posts locked
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Upgrade to Pro to unlock all generated content
                  </p>
                </button>
              )}
            </motion.div>
          </div>
        </div>
      )}

      <FocusModal
        card={expandedCard}
        imageUrl={selectedImage}
        onClose={() => setExpandedCard(null)}
        onUpdateCard={onUpdateCard}
        onRegenerate={onRegenerate}
      />
    </section>
  );
};

export default ClipCanvas;
