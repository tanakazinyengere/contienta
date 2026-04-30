import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Heart, Sparkles, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";

const About = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen px-4 sm:px-8 py-8 max-w-3xl mx-auto space-y-8">
      <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="gap-1.5 press-effect">
        <ArrowLeft className="w-4 h-4" /> Back
      </Button>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ type: "spring", bounce: 0.15 }} className="space-y-6">
        <h1 className="text-fluid-2xl font-extrabold font-display text-gradient">About ClippedIn</h1>

        <div className="glass rounded-3xl p-6 sm:p-8 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-primary/15 flex items-center justify-center text-primary">
              <Sparkles className="w-5 h-5" />
            </div>
            <h2 className="text-fluid-lg font-bold font-display text-foreground">Our Mission</h2>
          </div>
          <p className="text-fluid-sm text-muted-foreground leading-relaxed">
            ClippedIn was built to help professionals grow their LinkedIn presence without spending hours crafting posts. 
            We combine AI content generation with Social Selling Index analysis to give you a complete LinkedIn growth toolkit.
          </p>
        </div>

        <div className="glass rounded-3xl p-6 sm:p-8 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 flex items-center justify-center text-emerald-400">
              <TrendingUp className="w-5 h-5" />
            </div>
            <h2 className="text-fluid-lg font-bold font-display text-foreground">What We Do</h2>
          </div>
          <ul className="space-y-2 text-fluid-sm text-muted-foreground">
            <li>• Generate up to 50 LinkedIn posts in a single batch</li>
            <li>• Analyze your profile's SSI score with personalized tips</li>
            <li>• Save your best content for later publishing</li>
            <li>• Get actionable quick wins to improve your LinkedIn presence</li>
          </ul>
        </div>

        <div className="glass rounded-3xl p-6 sm:p-8 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-500/15 flex items-center justify-center text-rose-400">
              <Heart className="w-5 h-5" />
            </div>
            <h2 className="text-fluid-lg font-bold font-display text-foreground">The Creator</h2>
          </div>
          <p className="text-fluid-sm text-muted-foreground leading-relaxed">
            Built with care by <a href="https://linkfly.to/tanksnash" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-medium">Tanaka Zinyengere</a> — 
            a developer passionate about helping professionals unlock their full potential on LinkedIn.
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default About;
