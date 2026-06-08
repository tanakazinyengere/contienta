import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface CreditState {
  tier: string;
  bonus_remaining: number;
  daily_remaining: number;
  monthly_remaining: number;
  unlimited_until: string | null;
  total: number;
  loading: boolean;
}

const empty: CreditState = {
  tier: "free", bonus_remaining: 0, daily_remaining: 0, monthly_remaining: 0,
  unlimited_until: null, total: 0, loading: true,
};

export function useCredits() {
  const [state, setState] = useState<CreditState>(empty);

  const refresh = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setState({ ...empty, loading: false }); return; }
    const { data } = await supabase
      .from("user_credits")
      .select("tier, bonus_remaining, daily_remaining, monthly_remaining, unlimited_until")
      .eq("user_id", user.id)
      .maybeSingle();
    if (data) {
      setState({
        tier: data.tier,
        bonus_remaining: data.bonus_remaining,
        daily_remaining: data.daily_remaining,
        monthly_remaining: data.monthly_remaining,
        unlimited_until: data.unlimited_until,
        total: data.bonus_remaining + data.daily_remaining + data.monthly_remaining,
        loading: false,
      });
    } else {
      setState({ ...empty, loading: false });
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  return { ...state, refresh };
}
