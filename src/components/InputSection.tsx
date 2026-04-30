import { useState } from "react";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const VIBES = ["Professional", "Inspirational", "Controversial", "Storytelling", "Educational"];

interface InputSectionProps {
  onGenerate: (theme: string, vibe: string, batchSize: number) => void;
  onThemeChange: (theme: string) => void;
  isGenerating: boolean;
}

const InputSection = ({ onGenerate, onThemeChange, isGenerating }: InputSectionProps) => {
  const [theme, setTheme] = useState("");
  const [vibe, setVibe] = useState("Professional");
  const [batchSize, setBatchSize] = useState(10);

  const handleThemeChange = (val: string) => {
    setTheme(val);
    onThemeChange(val);
  };

  return (
    <section className="px-6 py-6 space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_auto_auto] gap-4 items-end">
        <div className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground">Core Theme</label>
          <Input
            placeholder="e.g. AI in Marketing, Leadership, Remote Work..."
            value={theme}
            onChange={(e) => handleThemeChange(e.target.value)}
            className="bg-secondary border-border h-11"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground">Vibe</label>
          <div className="flex gap-2 flex-wrap">
            {VIBES.map((v) => (
              <button
                key={v}
                onClick={() => setVibe(v)}
                className={`px-3 py-2 text-xs font-medium rounded-lg transition-all ${
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
          <label className="text-sm font-medium text-muted-foreground">Batch: {batchSize}</label>
          <input
            type="range"
            min={10}
            max={30}
            value={batchSize}
            onChange={(e) => setBatchSize(Number(e.target.value))}
            className="w-24 accent-primary"
          />
        </div>

        <Button
          onClick={() => onGenerate(theme, vibe, batchSize)}
          disabled={!theme.trim() || isGenerating}
          className="h-11 px-6 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
        >
          <Sparkles className="w-4 h-4 mr-2" />
          {isGenerating ? "Generating..." : "Generate"}
        </Button>
      </div>
    </section>
  );
};

export default InputSection;
