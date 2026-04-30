import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

const GOD_MODE_EMAIL = "tanakazinyengere2@gmail.com";

export interface UserProfile {
  isPro: boolean;
  isPremium: boolean;
  isGodMode: boolean;
  isLoggedIn: boolean;
  email: string;
  userId: string;
}

export function useUserProfile() {
  const [profile, setProfile] = useState<UserProfile>({
    isPro: false,
    isPremium: false,
    isGodMode: false,
    isLoggedIn: false,
    email: "",
    userId: "",
  });

  useEffect(() => {
    let profileChannel: ReturnType<typeof supabase.channel> | null = null;

    const syncProfile = async (session: any) => {
      if (!session?.user) {
        setProfile({ isPro: false, isPremium: false, isGodMode: false, isLoggedIn: false, email: "", userId: "" });
        return;
      }

      const email = session.user.email || "";
      const isGodMode = email === GOD_MODE_EMAIL;

      const { data: profileData } = await supabase
        .from("profiles")
        .select("is_pro,is_premium")
        .eq("user_id", session.user.id)
        .maybeSingle();

      const isPremium = Boolean(profileData?.is_premium);
      const isPro = isGodMode || Boolean(profileData?.is_pro) || isPremium;

      setProfile({
        isPro,
        isPremium,
        isGodMode,
        isLoggedIn: true,
        email,
        userId: session.user.id,
      });

      if (profileChannel) {
        profileChannel.unsubscribe();
      }

      profileChannel = supabase
        .channel(`profile-sync-${session.user.id}`)
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "profiles",
            filter: `user_id=eq.${session.user.id}`,
          },
          (payload) => {
            const updated = payload.new as any;
            const nextIsPremium = Boolean(updated?.is_premium);
            const nextIsPro = isGodMode || Boolean(updated?.is_pro) || nextIsPremium;
            setProfile((prev) => ({
              ...prev,
              isPro: nextIsPro,
              isPremium: nextIsPremium,
            }));
          },
        )
        .subscribe();
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      await syncProfile(session);
    });

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      await syncProfile(session);
    });

    return () => {
      subscription.unsubscribe();
      if (profileChannel) {
        profileChannel.unsubscribe();
      }
    };
  }, []);

  return profile;
}
