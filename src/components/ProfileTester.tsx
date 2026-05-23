import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link2, Play, Loader2, TrendingUp, Target, MessageSquare, Users, ChevronDown, ChevronUp, Lightbulb, ExternalLink, Zap, Heart, Info, Sparkles, Upload, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useUserProfile } from "@/hooks/useUserProfile";

interface PillarScore {
  name: string;
  score: number;
  maxScore: number;
  icon: React.ReactNode;
  description: string;
  suggestions: string[];
  details: string;
}

interface SSIResult {
  totalScore: number;
  level: string;
  levelDescription: string;
  pillars: PillarScore[];
  overallSuggestions: string[];
  quickWins: string[];
  kindWords: string[];
  profileUrl: string;
  profileHandle: string;
}

const getLevelInfo = (score: number): { level: string; description: string; color: string; emoji: string } => {
  if (score >= 70) return { level: "Top-Tier", description: "Top 10% — You're a LinkedIn powerhouse!", color: "text-emerald-400", emoji: "🏆" };
  if (score >= 50) return { level: "Good Performer", description: "Above average. A few tweaks and you'll be elite.", color: "text-primary", emoji: "📈" };
  if (score >= 30) return { level: "Average", description: "You're blending in. Let's make you stand out.", color: "text-amber-400", emoji: "⚡" };
  return { level: "Getting Started", description: "Big room for growth — follow the tips below!", color: "text-rose-400", emoji: "🚀" };
};

const ScoreRing = ({ score, maxScore, size = 80 }: { score: number; maxScore: number; size?: number }) => {
  const percentage = (score / maxScore) * 100;
  const radius = (size - 8) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} stroke="hsl(var(--muted))" strokeWidth="4" fill="none" />
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          stroke="hsl(var(--primary))" strokeWidth="4" fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-sm font-bold text-foreground">{score}/{maxScore}</span>
      </div>
    </div>
  );
};

const PillarCard = ({ pillar, index }: { pillar: PillarScore; index: number }) => {
  const [expanded, setExpanded] = useState(true);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 + index * 0.1 }}
      className="glass rounded-xl p-4 sm:p-5 space-y-3 hover:glow-border transition-all duration-300"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary/20 flex items-center justify-center text-primary">
            {pillar.icon}
          </div>
          <div>
            <h4 className="text-sm font-bold text-foreground">{pillar.name}</h4>
            <p className="text-xs text-muted-foreground">{pillar.description}</p>
          </div>
        </div>
        <ScoreRing score={pillar.score} maxScore={pillar.maxScore} size={56} />
      </div>

      <p className="text-xs text-muted-foreground leading-relaxed">{pillar.details}</p>

      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-1 text-xs text-primary font-medium hover:text-primary/80 transition-colors"
      >
        <Lightbulb className="w-3.5 h-3.5" />
        {expanded ? "Hide" : "Show"} Suggestions
        {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.ul
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="space-y-2 overflow-hidden"
          >
            {pillar.suggestions.map((s, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                <span className="text-primary mt-0.5">→</span>
                <span>{s}</span>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

const ProfileTester = () => {
  const [profileUrl, setProfileUrl] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isAnalyzingScreenshot, setIsAnalyzingScreenshot] = useState(false);
  const [result, setResult] = useState<SSIResult | null>(null);
  const { isPremium } = useUserProfile();

  const buildResultFromAI = (data: any, fallbackUrl: string, fallbackHandle: string) => {
    const pillars: PillarScore[] = [
      { name: "Professional Brand", score: data.pillars.professionalBrand.score, maxScore: 25, icon: <Target className="w-4 h-4" />, description: "How you show up on LinkedIn", suggestions: data.pillars.professionalBrand.suggestions, details: data.pillars.professionalBrand.details },
      { name: "Find the Right People", score: data.pillars.findPeople.score, maxScore: 25, icon: <Users className="w-4 h-4" />, description: "Your network quality & targeting", suggestions: data.pillars.findPeople.suggestions, details: data.pillars.findPeople.details },
      { name: "Engage with Insights", score: data.pillars.engageInsights.score, maxScore: 25, icon: <MessageSquare className="w-4 h-4" />, description: "Your content & comment game", suggestions: data.pillars.engageInsights.suggestions, details: data.pillars.engageInsights.details },
      { name: "Build Relationships", score: data.pillars.buildRelationships.score, maxScore: 25, icon: <TrendingUp className="w-4 h-4" />, description: "How well you nurture connections", suggestions: data.pillars.buildRelationships.suggestions, details: data.pillars.buildRelationships.details },
    ];
    const totalScore = pillars.reduce((sum, p) => sum + p.score, 0);
    const levelInfo = getLevelInfo(totalScore);
    setResult({
      totalScore,
      level: levelInfo.level,
      levelDescription: levelInfo.description,
      pillars,
      overallSuggestions: data.overallSuggestions || [],
      quickWins: data.quickWins || [],
      kindWords: data.kindWords || [],
      profileUrl: fallbackUrl,
      profileHandle: data.profileHandle || fallbackHandle,
    });
  };

  const handleScreenshot = useCallback(async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }
    setIsAnalyzingScreenshot(true);
    setResult(null);
    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      const { data, error } = await supabase.functions.invoke("analyze-ssi-screenshot", {
        body: { imageBase64: base64 },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      buildResultFromAI(data, "uploaded-screenshot", "you");
      toast.success("Screenshot analyzed!");
    } catch (err: any) {
      console.error("Screenshot analysis failed:", err);
      toast.error(err.message || "Failed to analyze screenshot");
    } finally {
      setIsAnalyzingScreenshot(false);
    }
  }, []);

  const handleAnalyze = useCallback(async () => {
    let trimmed = profileUrl.trim();
    if (!trimmed) {
      toast.error("Please enter a LinkedIn profile URL");
      return;
    }

    if (!trimmed.startsWith("http")) {
      trimmed = "https://" + trimmed;
    }

    if (!trimmed.includes("linkedin.com/in/")) {
      toast.error("Please enter a valid LinkedIn profile URL (e.g., linkedin.com/in/yourname)");
      return;
    }

    setIsAnalyzing(true);
    setResult(null);

    try {
      const { data, error } = await supabase.functions.invoke("analyze-linkedin-profile", {
        body: { profileUrl: trimmed },
      });

      if (error) throw error;

      const pillars: PillarScore[] = [
        {
          name: "Professional Brand",
          score: data.pillars.professionalBrand.score,
          maxScore: 25,
          icon: <Target className="w-4 h-4" />,
          description: "How you show up on LinkedIn",
          suggestions: data.pillars.professionalBrand.suggestions,
          details: data.pillars.professionalBrand.details,
        },
        {
          name: "Find the Right People",
          score: data.pillars.findPeople.score,
          maxScore: 25,
          icon: <Users className="w-4 h-4" />,
          description: "Your network quality & targeting",
          suggestions: data.pillars.findPeople.suggestions,
          details: data.pillars.findPeople.details,
        },
        {
          name: "Engage with Insights",
          score: data.pillars.engageInsights.score,
          maxScore: 25,
          icon: <MessageSquare className="w-4 h-4" />,
          description: "Your content & comment game",
          suggestions: data.pillars.engageInsights.suggestions,
          details: data.pillars.engageInsights.details,
        },
        {
          name: "Build Relationships",
          score: data.pillars.buildRelationships.score,
          maxScore: 25,
          icon: <TrendingUp className="w-4 h-4" />,
          description: "How well you nurture connections",
          suggestions: data.pillars.buildRelationships.suggestions,
          details: data.pillars.buildRelationships.details,
        },
      ];

      const totalScore = pillars.reduce((sum, p) => sum + p.score, 0);
      const levelInfo = getLevelInfo(totalScore);

      const handleMatch = trimmed.match(/linkedin\.com\/in\/([^\/\?]+)/);
      const handle = handleMatch ? handleMatch[1] : "";

      setResult({
        totalScore,
        level: levelInfo.level,
        levelDescription: levelInfo.description,
        pillars,
        overallSuggestions: data.overallSuggestions || [],
        quickWins: data.quickWins || [],
        kindWords: data.kindWords || [],
        profileUrl: trimmed,
        profileHandle: data.profileHandle || handle,
      });
    } catch (err: any) {
      console.error("Analysis failed:", err);
      toast.error(err.message || "Failed to connect to the analysis engine. Is the local server running?");
    } finally {
      setIsAnalyzing(false);
    }
  }, [profileUrl]);

  return (
    <div className="space-y-6">
      {/* Input Section */}
      <section className="px-4 sm:px-6 py-6 space-y-4">
        <div className="text-center space-y-2 max-w-xl mx-auto">
          <h2 className="text-xl sm:text-2xl font-bold font-display text-foreground">
            🔍 Profile Tester
          </h2>
          <p className="text-sm text-muted-foreground">
            Paste your LinkedIn URL and get a personalized{" "}
            <span className="text-primary font-medium">Social Selling Index (SSI)</span> analysis with actionable tips.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 max-w-xl mx-auto">
          <div className="relative flex-1">
            <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="linkedin.com/in/yourname"
              value={profileUrl}
              onChange={(e) => setProfileUrl(e.target.value)}
              className="bg-secondary border-border h-11 pl-10"
              onKeyDown={(e) => e.key === "Enter" && handleAnalyze()}
            />
          </div>
          <Button
            onClick={handleAnalyze}
            disabled={isAnalyzing || !profileUrl.trim()}
            className="h-11 px-6 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold min-w-[120px]"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Play className="w-4 h-4 mr-2" />
                Start
              </>
            )}
          </Button>
        </div>
      </section>

      {/* Results */}
      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="px-4 sm:px-6 pb-8 space-y-6"
          >
            {/* Profile Preview - Link Card */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="glass rounded-xl p-4 flex items-center gap-3 max-w-xl mx-auto hover:glow-border transition-all"
            >
              <div className="w-12 h-12 rounded-full bg-[#0A66C2] flex items-center justify-center text-white font-bold text-lg">
                {result.profileHandle.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">@{result.profileHandle}</p>
                <a
                  href={result.profileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-primary hover:underline flex items-center gap-1"
                >
                  View on LinkedIn <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <div className="flex-shrink-0 bg-[#0A66C2]/10 rounded-lg p-2">
                <svg className="w-6 h-6 text-[#0A66C2]" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                </svg>
              </div>
            </motion.div>

            {/* Kind Words - Praise Section */}
            {result.kindWords.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="glass rounded-xl p-5 space-y-3 border border-emerald-500/20"
              >
                <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <Heart className="w-4 h-4 text-emerald-400" />
                  Kind Words — What You're Doing Great
                </h3>
                <ul className="space-y-2">
                  {result.kindWords.map((s, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                      <span className="text-emerald-400 font-bold mt-0.5">✓</span>
                      <span>{s}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            )}

            {/* Quick Actions */}
            {result.quickWins.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="glass rounded-xl p-5 space-y-3 glow-border"
              >
                <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-400" />
                  Quick Actions — Do These Right Now (Under 5 min)
                </h3>
                <ul className="space-y-2">
                  {result.quickWins.map((s, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                      <span className="text-amber-400 font-bold mt-0.5">⚡</span>
                      <span>{s}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            )}

            {/* Overall Score */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="glass rounded-2xl p-6 sm:p-8 text-center space-y-4 glow-border"
            >
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                Your SSI Score
              </h3>
              <div className="flex justify-center">
                <ScoreRing score={result.totalScore} maxScore={100} size={120} />
              </div>
              <div>
                <p className={`text-lg font-bold font-display ${getLevelInfo(result.totalScore).color}`}>
                  {getLevelInfo(result.totalScore).emoji} {result.level}
                </p>
                <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">
                  {result.levelDescription}
                </p>
              </div>

              {/* SSI Verification Badge */}
              <div className="flex items-center justify-center gap-2 mt-3 text-[10px] text-muted-foreground bg-secondary/50 rounded-lg px-3 py-2 max-w-sm mx-auto">
                <Info className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                <span>
                  This score is an AI estimation using LinkedIn's verified SSI methodology. Check your{" "}
                  <a href="https://www.linkedin.com/sales/ssi" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                    official SSI score
                  </a>{" "}
                  for exact results.
                </span>
              </div>
            </motion.div>

            {/* Pillars Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {result.pillars.map((pillar, idx) => (
                <PillarCard key={pillar.name} pillar={pillar} index={idx} />
              ))}
            </div>

            {/* Overall Suggestions */}
            {result.overallSuggestions.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="glass rounded-xl p-5 space-y-3"
              >
                <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <Lightbulb className="w-4 h-4 text-primary" />
                  Strategic Improvement Tips
                </h3>
                <ul className="space-y-2">
                  {result.overallSuggestions.slice(0, isPremium ? result.overallSuggestions.length : 1).map((s, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                      <span className="text-primary font-bold mt-0.5">{i + 1}.</span>
                      <span>{s}</span>
                    </li>
                  ))}
                  {!isPremium && result.overallSuggestions.length > 1 && (
                    <li className="relative">
                      <div className="flex items-start gap-2 text-xs text-muted-foreground blur-sm">
                        <span className="text-primary font-bold mt-0.5">2.</span>
                        <span>{result.overallSuggestions[1]}</span>
                      </div>
                      <div className="flex items-start gap-2 text-xs text-muted-foreground blur-sm">
                        <span className="text-primary font-bold mt-0.5">3.</span>
                        <span>{result.overallSuggestions[2]}</span>
                      </div>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Button
                          size="sm"
                          onClick={() => window.open('https://checkout.revolut.com/pay/cbba696a-b4cb-4e9e-8801-19de36ea961e', '_blank')}
                          className="bg-primary hover:bg-primary/90 text-xs px-3 py-1 h-8"
                        >
                          Reveal with Platinum
                        </Button>
                      </div>
                    </li>
                  )}
                </ul>
              </motion.div>
            )}

            {/* Create Content CTA */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="text-center"
            >
              <p className="text-xs text-muted-foreground mb-2">Ready to improve your content game?</p>
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() => {
                  toast.info("Switch to the Content Engine tab to create posts!");
                }}
              >
                <Sparkles className="w-3.5 h-3.5" />
                Create Content with AI
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ProfileTester;
