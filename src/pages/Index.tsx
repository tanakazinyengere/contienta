import { useState, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import BottomNav, { type AppTabId } from "@/components/BottomNav";
import ContentEngine from "@/components/ContentEngine";
import ClipCanvas from "@/components/ClipCanvas";
import ProfileTester from "@/components/ProfileTester";
import Reef from "@/components/Reef";
import Clippie from "@/components/Clippie";
import Dashboard from "@/pages/Dashboard";
import type { ContentCardData } from "@/components/ContentCard";
import { supabase } from "@/integrations/supabase/client";
import { useUserProfile } from "@/hooks/useUserProfile";
import { toast } from "sonner";
import confetti from "canvas-confetti";

const Index = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<AppTabId>("profile");
  const [cards, setCards] = useState<ContentCardData[]>([]);
  const [selectedImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [user, setUser] = useState<any>(null);
  const userProfile = useUserProfile();
  const prevIsPro = useRef<boolean>(false);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    supabase.auth.getSession().then(({ data: { session } }) => setUser(session?.user ?? null));
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

  const handleCardsGenerated = useCallback((c: ContentCardData[]) => setCards(c), []);
  const handleRegenerate = useCallback((id: string) => setCards(prev => prev.map(c => c.id === id ? { ...c, id: `card-${Date.now()}-regen` } : c)), []);
  const handleUpdateCard = useCallback((id: string, updates: Partial<ContentCardData>) => setCards(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c)), []);
  const handleClearCards = useCallback(() => setCards([]), []);

  const handleTabChange = (id: AppTabId) => {
    const needsAuth: AppTabId[] = ["dashboard", "clippie"];
    if (needsAuth.includes(id) && !user) {
      toast.error("Sign in to use this feature");
      navigate("/login");
      return;
    }
    setActiveTab(id);
  };

  return (
    <div className="min-h-screen flex flex-col overflow-x-hidden pb-20">
      <Header user={user} onSignOut={handleSignOut} onLogin={() => navigate("/login")} />

      {userProfile.isGodMode && (
        <div className="px-4 sm:px-6 pt-2">
          <button
            onClick={() => navigate("/admin")}
            className="text-[10px] uppercase tracking-wider px-3 py-1 rounded-full bg-accent text-accent-foreground font-bold press-effect"
          >
            ⚡ God Mode — Open Admin
          </button>
        </div>
      )}

      <AnimatePresence mode="wait">
        {activeTab === "profile" && (
          <motion.div key="profile" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }} className="flex-1">
            <ProfileTester />
          </motion.div>
        )}
        {activeTab === "reef" && (
          <motion.div key="reef" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }} className="flex-1">
            <Reef />
          </motion.div>
        )}
        {activeTab === "engine" && (
          <motion.div key="engine" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }} className="flex-1">
            <ContentEngine
              onCardsGenerated={handleCardsGenerated}
              isGenerating={isGenerating}
              setIsGenerating={setIsGenerating}
              hasCards={cards.length > 0}
              isPro={userProfile.isPro}
            />
            {cards.length > 0 && (
              <ClipCanvas cards={cards} selectedImage={selectedImage} onRegenerate={handleRegenerate} onUpdateCard={handleUpdateCard} onClear={handleClearCards} isPro={userProfile.isPro} />
            )}
          </motion.div>
        )}
        {activeTab === "clippie" && (
          <motion.div key="clippie" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }} className="flex-1 px-3 py-4">
            <Clippie />
          </motion.div>
        )}
        {activeTab === "dashboard" && (
          <motion.div key="dashboard" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }} className="flex-1">
            <Dashboard />
          </motion.div>
        )}
      </AnimatePresence>

      <BottomNav active={activeTab} onChange={handleTabChange} />
    </div>
  );
};

export default Index;
