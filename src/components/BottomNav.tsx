import { motion } from "framer-motion";
import { Search, Map, Sparkles, MessageCircle, LayoutGrid } from "lucide-react";

export type AppTabId = "profile" | "reef" | "engine" | "clippie" | "dashboard";

interface BottomNavProps {
  active: AppTabId;
  onChange: (id: AppTabId) => void;
}

const TABS: { id: AppTabId; label: string; Icon: typeof Search }[] = [
  { id: "profile", label: "Profile", Icon: Search },
  { id: "reef", label: "Reef", Icon: Map },
  { id: "engine", label: "Batch", Icon: Sparkles },
  { id: "clippie", label: "Clippie", Icon: MessageCircle },
  { id: "dashboard", label: "Feed", Icon: LayoutGrid },
];

const BottomNav = ({ active, onChange }: BottomNavProps) => (
  <nav className="fixed bottom-0 inset-x-0 z-40 border-t border-border bg-background/80 backdrop-blur-xl" style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
    <div className="max-w-2xl mx-auto grid grid-cols-5">
      {TABS.map(({ id, label, Icon }) => {
        const isActive = id === active;
        return (
          <button key={id} onClick={() => onChange(id)} className="relative flex flex-col items-center justify-center gap-1 py-2.5 press-effect min-h-[56px]" aria-label={label}>
            {isActive && <motion.span layoutId="bottomActive" className="absolute top-0 h-0.5 w-10 bg-primary rounded-full" transition={{ type: "spring", bounce: 0.2, duration: 0.35 }} />}
            <Icon className={`w-5 h-5 transition-colors ${isActive ? "text-primary" : "text-muted-foreground"}`} />
            <span className={`text-[10px] font-medium transition-colors ${isActive ? "text-primary" : "text-muted-foreground"}`}>{label}</span>
          </button>
        );
      })}
    </div>
  </nav>
);

export default BottomNav;
