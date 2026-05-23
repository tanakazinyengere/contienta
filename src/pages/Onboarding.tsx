import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, Linkedin, ArrowRight, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

const steps = [
  "Analyzing headline...",
  "Evaluating engagement metrics...",
  "Benchmarking professional authority...",
];

const tutorialSlides = [
  {
    title: "Content Ideation Studio",
    desc: "Generate high-impact narratives tailored to your industry. Use AI to craft compelling stories that drive engagement and build authority.",
    icon: "✨",
  },
  {
    title: "Brand Performance Audit",
    desc: "Analyze your LinkedIn presence with comprehensive metrics. Get strategic insights to optimize your professional brand.",
    icon: "📊",
  },
  {
    title: "Content Vault",
    desc: "Save, organize, and schedule your narratives. Build a library of strategic content for consistent authority building.",
    icon: "🏆",
  },
];

const Onboarding = () => {
  const navigate = useNavigate();
  const [tutorialStep, setTutorialStep] = useState(0);
  const [showTutorial, setShowTutorial] = useState(false);
  const [started, setStarted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [profileUrl, setProfileUrl] = useState("");

  useEffect(() => {
    if (!started) return;
    const interval = window.setInterval(() => {
      setProgress((value) => {
        if (value >= 100) {
          window.clearInterval(interval);
          return 100;
        }
        return value + 1;
      });
    }, 600);
    return () => window.clearInterval(interval);
  }, [started]);

  const stepLabel = useMemo(() => {
    if (progress < 34) return steps[0];
    if (progress < 67) return steps[1];
    return steps[2];
  }, [progress]);

  const handleStart = () => {
    if (!profileUrl.trim()) return;
    setStarted(true);
    setProgress(2);
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-3xl space-y-8">
        <div className="glass rounded-3xl p-8 border border-border shadow-xl">
          <div className="flex flex-col gap-4 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Linkedin className="w-8 h-8" />
            </div>
            <h1 className="text-3xl font-extrabold font-display">LinkedIn Authority Onboarding</h1>
            <p className="text-sm text-muted-foreground max-w-2xl mx-auto">
              Securely link your profile and let ClippedIn benchmark your presence with a premium onboarding tunnel. Make sure your LinkedIn email matches your ClippedIn login for instant synchronization.
            </p>
          </div>

          {!started ? (
            <div className="mt-8 space-y-4">
              <label className="block text-sm font-medium text-muted-foreground">LinkedIn profile URL</label>
              <div className="flex gap-3 flex-col sm:flex-row">
                <input
                  value={profileUrl}
                  onChange={(e) => setProfileUrl(e.target.value)}
                  placeholder="linkedin.com/in/yourname"
                  className="flex-1 rounded-2xl border border-border bg-secondary px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <Button onClick={handleStart} className="h-12 rounded-2xl bg-primary hover:bg-primary/90">
                  Begin onboarding
                </Button>
              </div>
            </div>
          ) : (
            <div className="mt-8 space-y-6">
              <div className="rounded-3xl bg-secondary p-5 text-left">
                <p className="text-sm text-muted-foreground uppercase tracking-[0.24em] mb-4">Secure authority scan</p>
                <div className="flex items-center justify-between gap-4">
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-foreground">{stepLabel}</p>
                    <p className="text-xs text-muted-foreground">This process is designed to feel premium and accurate. Please wait while we sync your profile metrics.</p>
                  </div>
                  <span className="text-xs text-primary font-semibold">{progress}%</span>
                </div>
                <div className="mt-4 h-2 overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full bg-gradient-to-r from-primary via-primary/80 to-sky-500 transition-all" style={{ width: `${progress}%` }} />
                </div>
              </div>
              {progress >= 100 ? (
                <div className="space-y-4 text-center">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-400">
                    <ShieldCheck className="w-8 h-8" />
                  </div>
                  <h2 className="text-xl font-bold">Connected</h2>
                  <p className="text-sm text-muted-foreground">Your profile is now linked. Let's take a quick tour of ClippedIn's executive features.</p>
                  <Button onClick={() => setShowTutorial(true)} className="w-full rounded-2xl bg-primary hover:bg-primary/90">
                    Start Tutorial <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-3 text-sm text-muted-foreground">
                  <Loader2 className="w-5 h-5 animate-spin text-primary" />
                  <span>Building your professional authority baseline. This feels premium because it is.</span>
                </div>
              )}
            </div>
          )}
        </div>

        {showTutorial && (
          <div className="glass rounded-3xl p-8 border border-border shadow-xl mt-8">
            <div className="text-center space-y-4">
              <h2 className="text-2xl font-bold">Welcome to ClippedIn</h2>
              <p className="text-sm text-muted-foreground">Discover the tools that will transform your LinkedIn presence</p>
            </div>
            <div className="mt-8">
              <div className="text-center space-y-6">
                <div className="text-6xl">{tutorialSlides[tutorialStep].icon}</div>
                <h3 className="text-xl font-bold">{tutorialSlides[tutorialStep].title}</h3>
                <p className="text-sm text-muted-foreground max-w-md mx-auto">{tutorialSlides[tutorialStep].desc}</p>
              </div>
              <div className="flex justify-between items-center mt-8">
                <Button
                  variant="ghost"
                  onClick={() => setTutorialStep(Math.max(0, tutorialStep - 1))}
                  disabled={tutorialStep === 0}
                >
                  Previous
                </Button>
                <div className="flex gap-2">
                  {tutorialSlides.map((_, i) => (
                    <div
                      key={i}
                      className={`w-2 h-2 rounded-full ${i === tutorialStep ? 'bg-primary' : 'bg-muted'}`}
                    />
                  ))}
                </div>
                {tutorialStep < tutorialSlides.length - 1 ? (
                  <Button onClick={() => setTutorialStep(tutorialStep + 1)}>
                    Next
                  </Button>
                ) : (
                  <Button onClick={() => navigate("/app")}>
                    Get Started
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Onboarding;
