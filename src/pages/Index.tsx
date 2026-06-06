import { useState, useCallback, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import NoIndex from "@/components/NoIndex";
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

// All tabs stay mounted; we toggle visibility so background work
// (Clippie streams, Batch generations, Reef saves) keeps running on tab switch.
const TabPane = ({ active, children }: { active: boolean; children: React.ReactNode }) => (
  <div className={active ? "flex-1" : "hidden"} aria-hidden={!active}>{children}</div>
);

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
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => setUser(session?.user ?? null));
    supabase.auth.getSession().then(({ data: { session } }) => setUser(session?.user ?? null));
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (prevIsPro.current === false && userProfile.isPro === true) {
      confetti({ particleCount: 120, spread: 90, origin: { y: 0.6 } });
      toast.success("Premium activated. All features unlocked.");
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
      <NoIndex />
      <Header user={user} onSignOut={handleSignOut} onLogin={() => navigate("/login")} />

      {userProfile.isGodMode && (
        <div className="px-4 sm:px-6 pt-2">
          <button
            onClick={() => navigate("/admin")}
            className="text-[10px] uppercase tracking-wider px-3 py-1 rounded-full bg-accent text-accent-foreground font-bold press-effect"
          >
            God Mode — Open Admin
          </button>
        </div>
      )}

      {isGenerating && activeTab !== "engine" && (
        <div className="fixed top-16 right-4 z-30 glass rounded-full px-3 py-1.5 text-[11px] text-foreground flex items-center gap-1.5 shadow-lg">
          <span className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" />
          Batch generating…
        </div>
      )}

      <TabPane active={activeTab === "profile"}><ProfileTester /></TabPane>
      <TabPane active={activeTab === "reef"}><Reef /></TabPane>
      <TabPane active={activeTab === "engine"}>
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
      </TabPane>
      <TabPane active={activeTab === "clippie"}>
        <div className="px-3 py-4"><Clippie /></div>
      </TabPane>
      <TabPane active={activeTab === "dashboard"}><Dashboard /></TabPane>

      <BottomNav active={activeTab} onChange={handleTabChange} />
    </div>
  );
};

export default Index;
