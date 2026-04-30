import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { Paintbrush, ChevronLeft, ChevronRight } from "lucide-react";
import CaptionOverlay from "./CaptionOverlay";

interface VisualLabProps {
  theme: string;
  selectedImage: string | null;
  onSelectImage: (url: string) => void;
}

const MOCK_IMAGES = [
  "https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?w=600&h=400&fit=crop",
  "https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&h=400&fit=crop",
  "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=600&h=400&fit=crop",
  "https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=600&h=400&fit=crop",
  "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=600&h=400&fit=crop",
  "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=600&h=400&fit=crop",
  "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=600&h=400&fit=crop",
  "https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=600&h=400&fit=crop",
];

const VisualLab = ({ theme, selectedImage, onSelectImage }: VisualLabProps) => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const [captionImage, setCaptionImage] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (dir: "left" | "right") => {
    scrollRef.current?.scrollBy({ left: dir === "left" ? -320 : 320, behavior: "smooth" });
  };

  return (
    <section className="px-6 py-4 space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold font-display">
          🎨 Visual Lab
        </h2>
        <div className="flex gap-2">
          <button onClick={() => scroll("left")} className="p-1.5 rounded-lg bg-secondary text-muted-foreground hover:text-foreground transition-colors">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button onClick={() => scroll("right")} className="p-1.5 rounded-lg bg-secondary text-muted-foreground hover:text-foreground transition-colors">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto snap-x-mandatory pb-2 scrollbar-thin"
      >
        {MOCK_IMAGES.map((img, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: idx * 0.05 }}
            className={`relative flex-shrink-0 w-72 h-44 rounded-xl overflow-hidden cursor-pointer snap-center group transition-all ${
              selectedImage === img ? "ring-2 ring-primary" : ""
            }`}
            onMouseEnter={() => setHoveredIdx(idx)}
            onMouseLeave={() => setHoveredIdx(null)}
            onClick={() => onSelectImage(img)}
          >
            <img
              src={img}
              alt={`Visual ${idx + 1}`}
              className="w-full h-full object-cover"
            />
            {selectedImage === img && (
              <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-primary-foreground" />
              </div>
            )}
            {hoveredIdx === idx && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute inset-0 bg-background/60 flex items-center justify-center"
              >
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setCaptionImage(img);
                  }}
                  className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium flex items-center gap-2"
                >
                  <Paintbrush className="w-4 h-4" />
                  Customize
                </button>
              </motion.div>
            )}
          </motion.div>
        ))}
      </div>

      {captionImage && (
        <CaptionOverlay
          imageUrl={captionImage}
          onClose={() => setCaptionImage(null)}
        />
      )}
    </section>
  );
};

export default VisualLab;
