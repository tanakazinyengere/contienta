import { useState, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import Header from "@/components/Header";
import ContentEngine from "@/components/ContentEngine";
import ClipCanvas from "@/components/ClipCanvas";
import ProfileTester from "@/components/ProfileTester";
import Dashboard from "@/pages/Dashboard";
import type { ContentCardData } from "@/components/ContentCard";
import { supabase } from "@/integrations/supabase/client";
import { useUserProfile } from "@/hooks/useUserProfile";
import { toast } from "sonner";
import confetti from "canvas-confetti";

const TABS = [
  { id: "profile", label: "Profile Tester", emoji: "🔍" },
  { id: "content", label: "Content Engine", emoji: "⚡" },
  { id: "dashboard", label: "Dashboard", emoji: "📋" },
] as const;

type TabId = typeof TABS[number]["id"];

const Index = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabId>("profile");
  const [cards, setCards] = useState<ContentCardData[]>([]);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [user, setUser] = useState<any>(null);
  const userProfile = useUserProfile();
  const prevIsPro = useRef<boolean>(false);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (prevIsPro.current === false && userProfile.isPro === true) {
      confetti({ particleCount: 120, spread: 90, origin: { y: 0.6 } });
      toast.success("Premium Activated. All features unlocked.");
    }
    prevIsPro.current = userProfile.isPro;
  }, [userProfile.isPro]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    toast.success("Signed out");
  };

  const handleCardsGenerated = useCallback((newCards: ContentCardData[]) => {
    setCards(newCards);
  }, []);

  const handleRegenerate = useCallback((id: string) => {
    setCards((prev) =>
      prev.map((c) => {
        if (c.id !== id) return c;
        return { ...c, id: `card-${Date.now()}-regen` };
      })
    );
  }, []);

  const handleUpdateCard = useCallback((id: string, updates: Partial<ContentCardData>) => {
    setCards((prev) => prev.map((c) => c.id === id ? { ...c, ...updates } : c));
  }, []);

  const handleClearCards = useCallback(() => {
    setCards([]);
  }, []);

  return (
    <div className="min-h-screen flex flex-col overflow-x-hidden">
      <Header
        user={user}
        onSignOut={handleSignOut}
        onLogin={() => navigate("/login")}
      />

      {/* Tab Navigation */}
      <nav className="px-4 sm:px-6 pt-4">
        <div className="flex gap-1 p-1 rounded-3xl glass max-w-lg overflow-x-auto">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                if (tab.id === "dashboard" && !user) {
                  toast.error("Sign in to access your Dashboard");
                  navigate("/login");
                  return;
                }
                setActiveTab(tab.id);
              }}
              className={`relative flex-1 px-3 sm:px-4 py-2.5 rounded-2xl text-sm font-medium transition-all duration-200 whitespace-nowrap press-effect ${
                activeTab === tab.id
                  ? "text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {activeTab === tab.id && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 bg-primary rounded-2xl"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
                />
              )}
              <span className="relative z-10 flex items-center justify-center gap-2">
                <span>{tab.emoji}</span>
                <span className="hidden sm:inline">{tab.label}</span>
              </span>
            </button>
          ))}
        </div>
      </nav>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        {activeTab === "profile" && (
          <motion.div
            key="profile"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.2 }}
            className="flex-1"
          >
            <ProfileTester isPro={userProfile.isPro} />
          </motion.div>
        )}

        {activeTab === "content" && (
          <motion.div
            key="content"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="flex-1"
          >
            <ContentEngine
              onCardsGenerated={handleCardsGenerated}
              isGenerating={isGenerating}
              setIsGenerating={setIsGenerating}
              hasCards={cards.length > 0}
              isPro={userProfile.isPro}
            />

            {cards.length > 0 && (
              <ClipCanvas
                cards={cards}
                selectedImage={selectedImage}
                onRegenerate={handleRegenerate}
                onUpdateCard={handleUpdateCard}
                onClear={handleClearCards}
                isPro={userProfile.isPro}
              />
            )}
          </motion.div>
        )}

        {activeTab === "dashboard" && (
          <motion.div
            key="dashboard"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="flex-1"
          >
            <Dashboard />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <footer className="border-t border-border px-4 sm:px-6 py-6 mt-auto">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-display font-bold text-xs">C.</span>
            </div>
            <span>© {new Date().getFullYear()} ClippedIn. All rights reserved.</span>
          </div>
          <div className="flex items-center gap-4 flex-wrap justify-center">
            <button onClick={() => navigate("/about")} className="hover:text-foreground transition-colors">About</button>
            <button onClick={() => navigate("/faqs")} className="hover:text-foreground transition-colors">FAQs</button>
            <button onClick={() => navigate("/contact")} className="hover:text-foreground transition-colors">Contact</button>
            <button onClick={() => navigate("/pricing")} className="hover:text-foreground transition-colors">Pricing</button>
            <span>Created by{" "}
              <a href="https://linkfly.to/tanksnash" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-medium">
                Tanaka Zinyengere
              </a>
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
