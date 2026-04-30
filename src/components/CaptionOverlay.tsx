import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Download, Type } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface CaptionOverlayProps {
  imageUrl: string;
  onClose: () => void;
}

const POSITIONS = ["top", "center", "bottom"] as const;
const FONTS = ["Inter", "Plus Jakarta Sans"] as const;

const CaptionOverlay = ({ imageUrl, onClose }: CaptionOverlayProps) => {
  const [text, setText] = useState("Your caption here");
  const [position, setPosition] = useState<typeof POSITIONS[number]>("bottom");
  const [font, setFont] = useState<typeof FONTS[number]>("Inter");
  const [showBacking, setShowBacking] = useState(true);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const positionClass = {
    top: "items-start pt-6",
    center: "items-center",
    bottom: "items-end pb-6",
  };

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      const fontSize = Math.max(24, img.width / 20);
      ctx.font = `bold ${fontSize}px ${font}`;
      ctx.textAlign = "center";

      const textY =
        position === "top" ? fontSize * 2 :
        position === "center" ? img.height / 2 :
        img.height - fontSize;

      if (showBacking && text) {
        const metrics = ctx.measureText(text);
        const padding = 16;
        ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
        ctx.fillRect(
          img.width / 2 - metrics.width / 2 - padding,
          textY - fontSize + 4,
          metrics.width + padding * 2,
          fontSize + padding
        );
      }

      ctx.fillStyle = "#ffffff";
      ctx.fillText(text, img.width / 2, textY);

      const link = document.createElement("a");
      link.download = "clippedin-image.png";
      link.href = canvas.toDataURL("image/png");
      link.click();
    };
    img.src = imageUrl;
  };

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
          className="glass rounded-2xl max-w-2xl w-full p-6 space-y-4"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold font-display flex items-center gap-2">
              <Type className="w-5 h-5 text-primary" />
              Caption Editor
            </h3>
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Preview */}
          <div className={`relative rounded-xl overflow-hidden flex justify-center ${positionClass[position]}`} style={{ height: 300 }}>
            <img src={imageUrl} alt="Preview" className="absolute inset-0 w-full h-full object-cover" />
            {text && (
              <div className={`absolute inset-x-0 flex justify-center ${positionClass[position]}`} style={{ height: "100%" }}>
                <span
                  className={`px-4 py-2 text-lg font-bold text-primary-foreground ${showBacking ? "bg-background/60 rounded-lg" : ""}`}
                  style={{ fontFamily: font }}
                >
                  {text}
                </span>
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Enter caption..."
              className="bg-secondary border-border"
            />
            <div className="flex gap-2">
              {FONTS.map((f) => (
                <button
                  key={f}
                  onClick={() => setFont(f)}
                  className={`px-3 py-2 text-xs rounded-lg transition-all ${
                    font === f ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
                  }`}
                  style={{ fontFamily: f }}
                >
                  {f === "Plus Jakarta Sans" ? "Jakarta" : f}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {POSITIONS.map((p) => (
              <button
                key={p}
                onClick={() => setPosition(p)}
                className={`px-3 py-1.5 text-xs rounded-lg capitalize transition-all ${
                  position === p ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
                }`}
              >
                {p}
              </button>
            ))}
            <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer ml-auto">
              <input
                type="checkbox"
                checked={showBacking}
                onChange={(e) => setShowBacking(e.target.checked)}
                className="accent-primary"
              />
              Dark backing
            </label>
          </div>

          <Button onClick={handleDownload} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
            <Download className="w-4 h-4 mr-2" />
            Download Image
          </Button>

          <canvas ref={canvasRef} className="hidden" />
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default CaptionOverlay;
