import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, TrendingUp, Target, MessageSquare, Users, ChevronDown, ChevronUp, Lightbulb, ExternalLink, Heart, Info, Upload, X, CheckCircle2, AlertCircle, RotateCw, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useUserProfile } from "@/hooks/useUserProfile";
import { resizeImageToDataUrl } from "@/lib/imageResize";

interface PillarScore {
  name: string;
  key: string;
  score: number | null;
  confidence: "high" | "low" | "unreadable";
  maxScore: number;
  icon: React.ReactNode;
  description: string;
  suggestions: string[];
  details: string;
}

interface SSIResult {
  totalScore: number | null;
  level: string;
  levelDescription: string;
  pillars: PillarScore[];
  overallSuggestions: string[];
  quickWins: string[];
  kindWords: string[];
  profileHandle: string;
}

interface UploadSlot { id: string; file: File; previewUrl: string; status: "pending" | "analyzing" | "done" | "failed"; error?: string; partial?: any; }

const getLevelInfo = (score: number | null) => {
  if (score == null) return { level: "Upload your SSI screenshot", description: "We'll read it and coach you.", emoji: "📷" };
  if (score >= 70) return { level: "Top-Tier", description: "Top 10% — you're a LinkedIn powerhouse!", emoji: "🏆" };
  if (score >= 50) return { level: "Good Performer", description: "Above average. A few tweaks and you're elite.", emoji: "📈" };
  if (score >= 30) return { level: "Average", description: "You're blending in. Let's make you stand out.", emoji: "⚡" };
  return { level: "Getting Started", description: "Big room for growth — follow the tips below.", emoji: "🚀" };
};

const ScoreRing = ({ score, maxScore, size = 56 }: { score: number | null; maxScore: number; size?: number }) => {
  const pct = score == null ? 0 : (score / maxScore) * 100;
  const r = (size - 8) / 2;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} stroke="hsl(var(--muted))" strokeWidth="4" fill="none" />
        <circle cx={size / 2} cy={size / 2} r={r} stroke="hsl(var(--primary))" strokeWidth="4" fill="none" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c - (pct / 100) * c} className="transition-all duration-700" />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-xs font-bold text-foreground">{score == null ? "—" : `${score}/${maxScore}`}</span>
      </div>
    </div>
  );
};

const PillarCard = ({ pillar, index, completed, onToggle }: { pillar: PillarScore; index: number; completed: Set<string>; onToggle: (k: string) => void }) => {
  const [expanded, setExpanded] = useState(true);
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + index * 0.05 }} className="glass rounded-2xl p-4 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-primary/20 flex items-center justify-center text-primary shrink-0">{pillar.icon}</div>
          <div className="min-w-0">
            <h4 className="text-sm font-bold text-foreground truncate">{pillar.name}</h4>
            <p className="text-xs text-muted-foreground truncate">{pillar.description}</p>
          </div>
        </div>
        <ScoreRing score={pillar.score} maxScore={pillar.maxScore} />
      </div>
      {pillar.confidence !== "high" && (
        <p className="text-[10px] text-amber-500 flex items-center gap-1"><AlertCircle className="w-3 h-3" />Couldn't read this clearly — upload a sharper crop.</p>
      )}
      <p className="text-xs text-muted-foreground leading-relaxed">{pillar.details}</p>
      <button onClick={() => setExpanded(!expanded)} className="flex items-center gap-1 text-xs text-primary font-medium press-effect">
        <Lightbulb className="w-3.5 h-3.5" />{expanded ? "Hide" : "Show"} Suggestions {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
      </button>
      <AnimatePresence>
        {expanded && (
          <motion.ul initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="space-y-1.5 overflow-hidden">
            {pillar.suggestions.map((s, i) => {
              const key = `${pillar.key}:${i}`;
              const done = completed.has(key);
              return (
                <li key={i} className="flex items-start gap-2 text-xs">
                  <input type="checkbox" checked={done} onChange={() => onToggle(key)} className="mt-0.5 accent-primary cursor-pointer" />
                  <span className={done ? "text-muted-foreground line-through" : "text-muted-foreground"}>{s}</span>
                </li>
              );
            })}
          </motion.ul>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

const ProfileTester = () => {
  const user = useUserProfile();
  const [profileUrl, setProfileUrl] = useState("");
  const [slots, setSlots] = useState<UploadSlot[]>([]);
  const [merged, setMerged] = useState<SSIResult | null>(null);
  const [completed, setCompleted] = useState<Set<string>>(new Set());
  const [healthId, setHealthId] = useState<string | null>(null);

  // Load saved health row when URL changes.
  useEffect(() => {
    if (!user.isLoggedIn || !profileUrl.trim()) return;
    const handle = setTimeout(async () => {
      const { data } = await supabase
        .from("profile_health")
        .select("id, measured_score, projected_score, completed_suggestions")
        .eq("user_id", user.userId)
        .eq("profile_url", profileUrl.trim())
        .maybeSingle();
      if (data) {
        setHealthId(data.id);
        const list = Array.isArray(data.completed_suggestions) ? data.completed_suggestions as string[] : [];
        setCompleted(new Set(list));
        toast.success(`Loaded saved progress (measured ${data.measured_score} / projected ${data.projected_score})`);
      } else {
        setHealthId(null);
        setCompleted(new Set());
      }
    }, 400);
    return () => clearTimeout(handle);
  }, [profileUrl, user.isLoggedIn, user.userId]);

  const projectedBoost = Math.min(completed.size * 2, 30); // +2 per action, cap 30
  const projectedScore = merged?.totalScore != null ? Math.min(100, merged.totalScore + projectedBoost) : null;

  const persistHealth = useCallback(async (measured: number | null, projected: number | null, completedSet: Set<string>) => {
    if (!user.isLoggedIn || !profileUrl.trim()) return;
    const row = {
      user_id: user.userId,
      profile_url: profileUrl.trim(),
      measured_score: measured ?? 0,
      projected_score: projected ?? measured ?? 0,
      completed_suggestions: Array.from(completedSet),
      updated_at: new Date().toISOString(),
    };
    if (healthId) {
      await supabase.from("profile_health").update(row).eq("id", healthId);
    } else {
      const { data } = await supabase.from("profile_health").insert(row).select("id").maybeSingle();
      if (data?.id) setHealthId(data.id);
    }
  }, [user, profileUrl, healthId]);

  const toggleSuggestion = (key: string) => {
    setCompleted(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      const proj = merged?.totalScore != null ? Math.min(100, merged.totalScore + Math.min(next.size * 2, 30)) : null;
      persistHealth(merged?.totalScore ?? null, proj, next);
      return next;
    });
  };

  const handleFiles = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const accepted = Array.from(files).filter(f => f.type.startsWith("image/")).slice(0, 4);
    if (accepted.length === 0) { toast.error("Please upload image files"); return; }

    const newSlots: UploadSlot[] = accepted.map(f => ({
      id: `slot-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      file: f,
      previewUrl: URL.createObjectURL(f),
      status: "pending",
    }));
    setSlots(prev => [...prev, ...newSlots].slice(0, 4));
    for (const slot of newSlots) {
      analyzeSlot(slot);
    }
  }, []);

  const analyzeSlot = async (slot: UploadSlot) => {
    setSlots(prev => prev.map(s => s.id === slot.id ? { ...s, status: "analyzing", error: undefined } : s));
    try {
      const dataUrl = await resizeImageToDataUrl(slot.file, 1600, 0.85);
      const { data, error } = await supabase.functions.invoke("analyze-ssi-screenshot", { body: { imageBase64: dataUrl } });
      if (error) throw new Error(error.message || "Network error");
      if (data?.error) throw new Error(data.error);
      setSlots(curr => {
        const all = curr.map(s => s.id === slot.id ? { ...s, status: "done" as const, partial: data } : s);
        mergeIntoResult(all);
        return all;
      });
    } catch (e: any) {
      const msg = e?.message || "Failed";
      setSlots(prev => prev.map(s => s.id === slot.id ? { ...s, status: "failed", error: msg.slice(0, 120) } : s));
      toast.error(`Screenshot failed: ${msg.slice(0, 80)}`);
    }
  };

  const retrySlot = (id: string) => {
    const slot = slots.find(s => s.id === id);
    if (slot) analyzeSlot(slot);
  };

  const mergeIntoResult = (allSlots: UploadSlot[]) => {
    const done = allSlots.filter(s => s.status === "done" && s.partial);
    if (done.length === 0) { setMerged(null); return; }
    const pick = (key: string) => {
      let best: any = null;
      for (const s of done) {
        const p = s.partial.pillars?.[key];
        if (!p) continue;
        if (!best) { best = p; continue; }
        const rank = (c: string) => c === "high" ? 3 : c === "low" ? 2 : 1;
        if (rank(p.confidence) > rank(best.confidence)) best = p;
      }
      return best || { score: null, confidence: "unreadable", details: "", suggestions: [] };
    };
    const pb = pick("professionalBrand");
    const fp = pick("findPeople");
    const ei = pick("engageInsights");
    const br = pick("buildRelationships");
    const pillars: PillarScore[] = [
      { key: "professionalBrand", name: "Professional Brand", score: pb.score, confidence: pb.confidence, maxScore: 25, icon: <Target className="w-4 h-4" />, description: "How you show up", suggestions: pb.suggestions || [], details: pb.details || "" },
      { key: "findPeople", name: "Find the Right People", score: fp.score, confidence: fp.confidence, maxScore: 25, icon: <Users className="w-4 h-4" />, description: "Network quality", suggestions: fp.suggestions || [], details: fp.details || "" },
      { key: "engageInsights", name: "Engage with Insights", score: ei.score, confidence: ei.confidence, maxScore: 25, icon: <MessageSquare className="w-4 h-4" />, description: "Content & comments", suggestions: ei.suggestions || [], details: ei.details || "" },
      { key: "buildRelationships", name: "Build Relationships", score: br.score, confidence: br.confidence, maxScore: 25, icon: <TrendingUp className="w-4 h-4" />, description: "Nurturing connections", suggestions: br.suggestions || [], details: br.details || "" },
    ];
    const overallFromShot = done.find(s => s.partial.overallScore != null && s.partial.overallConfidence === "high")?.partial.overallScore;
    const sumReadable = pillars.reduce((acc, p) => p.score != null ? acc + p.score : acc, 0);
    const allReadable = pillars.every(p => p.score != null);
    const total = overallFromShot ?? (allReadable ? sumReadable : null);
    const info = getLevelInfo(total);
    const latest = done[done.length - 1].partial;
    const result: SSIResult = {
      totalScore: total,
      level: info.level,
      levelDescription: info.description,
      pillars,
      overallSuggestions: latest.overallSuggestions || [],
      quickWins: latest.quickWins || [],
      kindWords: latest.kindWords || [],
      profileHandle: latest.profileHandle || "you",
    };
    setMerged(result);
    if (total != null) {
      const proj = Math.min(100, total + Math.min(completed.size * 2, 30));
      persistHealth(total, proj, completed);
    }
  };

  const removeSlot = (id: string) => {
    setSlots(prev => {
      const next = prev.filter(s => s.id !== id);
      mergeIntoResult(next);
      return next;
    });
  };

  const openMySSI = () => {
    window.open("https://www.linkedin.com/sales/ssi", "_blank", "noopener,noreferrer");
    toast.info("LinkedIn will open your own SSI page. Screenshot it and upload here.");
  };

  return (
    <div className="space-y-6">
      <section className="px-4 sm:px-6 py-6 space-y-4">
        <div className="text-center space-y-2 max-w-xl mx-auto">
          <h2 className="text-xl sm:text-2xl font-bold font-display text-foreground">🔍 Profile Tester</h2>
          <p className="text-sm text-muted-foreground">Your <span className="text-primary font-medium">real</span> Social Selling Index, read straight from the LinkedIn page.</p>
        </div>

        <div className="max-w-xl mx-auto glass rounded-2xl p-4 space-y-3">
          <p className="text-xs font-bold text-foreground uppercase tracking-wider">Step 1 · Your profile</p>
          <Input
            placeholder="linkedin.com/in/yourname (we save your progress here)"
            value={profileUrl}
            onChange={e => setProfileUrl(e.target.value)}
            className="bg-secondary border-border h-10"
          />
          <Button variant="outline" onClick={openMySSI} className="w-full h-10 rounded-xl press-effect">
            <ExternalLink className="w-4 h-4 mr-2" />Open my SSI page on LinkedIn
          </Button>
          <p className="text-[10px] text-muted-foreground flex items-start gap-1"><Info className="w-3 h-3 mt-0.5 shrink-0" />LinkedIn only shows the SSI of the account you're logged into. We can't analyse anyone else's profile from a URL.</p>
        </div>

        <div className="max-w-xl mx-auto glass rounded-2xl p-4 space-y-3">
          <p className="text-xs font-bold text-foreground uppercase tracking-wider">Step 2 · Upload screenshots</p>
          <p className="text-xs text-muted-foreground">Drop 1–4 screenshots (overall view + each pillar tab for max accuracy). We resize them automatically.</p>
          <label className="block">
            <input type="file" accept="image/*" multiple className="hidden" onChange={e => { handleFiles(e.target.files); e.target.value = ""; }} />
            <div className="border-2 border-dashed border-border rounded-xl p-5 text-center cursor-pointer hover:border-primary transition-colors press-effect">
              <Upload className="w-6 h-6 mx-auto text-primary mb-1.5" />
              <p className="text-xs font-medium text-foreground">Pick or drop screenshots</p>
              <p className="text-[10px] text-muted-foreground">Up to 4 images · analysed in parallel</p>
            </div>
          </label>

          {slots.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {slots.map(s => (
                <div key={s.id} className="relative group">
                  <img src={s.previewUrl} alt="" className="w-full h-24 object-cover rounded-xl" />
                  <div className="absolute inset-0 rounded-xl flex flex-col items-center justify-center bg-black/40 gap-1">
                    {s.status === "analyzing" && <><Loader2 className="w-5 h-5 text-white animate-spin" /><span className="text-[10px] text-white">Analyzing…</span></>}
                    {s.status === "done" && <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
                    {s.status === "failed" && (
                      <>
                        <AlertCircle className="w-5 h-5 text-rose-400" />
                        <button onClick={() => retrySlot(s.id)} className="text-[10px] text-white bg-rose-500/80 px-2 py-0.5 rounded-full press-effect flex items-center gap-1">
                          <RotateCw className="w-3 h-3" />Retry
                        </button>
                      </>
                    )}
                  </div>
                  <button onClick={() => removeSlot(s.id)} className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-background border border-border text-muted-foreground hover:text-destructive flex items-center justify-center press-effect">
                    <X className="w-3 h-3" />
                  </button>
                  {s.status === "failed" && s.error && (
                    <p className="absolute -bottom-5 left-0 right-0 text-[9px] text-rose-400 text-center truncate" title={s.error}>{s.error}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <AnimatePresence>
        {merged && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="px-4 sm:px-6 pb-8 space-y-5">
            <div className="glass rounded-3xl p-5 max-w-xl mx-auto text-center space-y-2">
              <p className="text-xs text-muted-foreground">Overall SSI</p>
              <p className="text-5xl font-extrabold text-gradient">{merged.totalScore == null ? "—" : merged.totalScore}<span className="text-lg text-muted-foreground">/100</span></p>
              {projectedScore != null && projectedScore > (merged.totalScore ?? 0) && (
                <p className="text-xs text-primary font-medium">📈 Projected after suggestions: <span className="font-bold">{projectedScore}</span></p>
              )}
              <p className="text-sm font-semibold text-foreground">{getLevelInfo(merged.totalScore).emoji} {merged.level}</p>
              <p className="text-xs text-muted-foreground">{merged.levelDescription}</p>
              {user.isLoggedIn && profileUrl && (
                <p className="text-[10px] text-muted-foreground flex items-center justify-center gap-1 pt-1"><Save className="w-3 h-3" />Progress saved automatically</p>
              )}
            </div>

            {merged.kindWords.length > 0 && (
              <div className="glass rounded-2xl p-5 space-y-2 max-w-xl mx-auto border border-emerald-500/20">
                <h3 className="text-sm font-bold text-foreground flex items-center gap-2"><Heart className="w-4 h-4 text-emerald-400" />Kind Words</h3>
                <ul className="space-y-1.5">
                  {merged.kindWords.map((s, i) => <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground"><span className="text-emerald-400 mt-0.5">✓</span>{s}</li>)}
                </ul>
              </div>
            )}

            <div className="grid sm:grid-cols-2 gap-3 max-w-3xl mx-auto">
              {merged.pillars.map((p, i) => <PillarCard key={p.key} pillar={p} index={i} completed={completed} onToggle={toggleSuggestion} />)}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ProfileTester;
