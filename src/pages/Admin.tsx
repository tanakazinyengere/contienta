import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowUp, ArrowDown, Users, Crown, FileText, MessageSquare, Activity, TrendingUp } from "lucide-react";
import { useUserProfile } from "@/hooks/useUserProfile";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { pricingPlans } from "@/lib/pricingPlans";
import { toast } from "sonner";
import NoIndex from "@/components/NoIndex";

const GOD_MODE_EMAIL = "tanakazinyengere2@gmail.com";

interface Trend { value: number; previous: number; delta: number; }
interface Metrics {
  users: number; premium: number; saved: number; conversionRate: number;
  signups7d: Trend; posts7d: Trend; chats7d: Trend; waitlist: number;
}
interface ActivityItem { kind: "signup" | "save" | "chat" | "schedule"; at: string; label: string; }

const Admin = () => {
  const profile = useUserProfile();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [grantEmail, setGrantEmail] = useState("");
  const [paymentLinks, setPaymentLinks] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const isAdmin = profile.email === GOD_MODE_EMAIL;

  const fetchMetrics = async () => {
    setLoading(true);
    try {
      const now = new Date();
      const sevenAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const fourteenAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString();

      const [
        { count: users },
        { count: premium },
        { count: saved },
        { count: signups7 },
        { count: signupsPrev },
        { count: posts7 },
        { count: postsPrev },
        { count: chats7 },
        { count: chatsPrev },
        { count: waitlist },
        { data: recentSignups },
        { data: recentSaves },
        { data: recentChats },
      ] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("profiles").select("id", { count: "exact", head: true }).eq("is_pro", true),
        supabase.from("saved_posts").select("id", { count: "exact", head: true }),
        supabase.from("profiles").select("id", { count: "exact", head: true }).gte("created_at", sevenAgo),
        supabase.from("profiles").select("id", { count: "exact", head: true }).gte("created_at", fourteenAgo).lt("created_at", sevenAgo),
        supabase.from("saved_posts").select("id", { count: "exact", head: true }).gte("created_at", sevenAgo),
        supabase.from("saved_posts").select("id", { count: "exact", head: true }).gte("created_at", fourteenAgo).lt("created_at", sevenAgo),
        supabase.from("chat_messages").select("id", { count: "exact", head: true }).gte("created_at", sevenAgo),
        supabase.from("chat_messages").select("id", { count: "exact", head: true }).gte("created_at", fourteenAgo).lt("created_at", sevenAgo),
        supabase.from("pro_waitlist").select("id", { count: "exact", head: true }),
        supabase.from("profiles").select("display_name, created_at").order("created_at", { ascending: false }).limit(5),
        supabase.from("saved_posts").select("hook, created_at").order("created_at", { ascending: false }).limit(5),
        supabase.from("chat_messages").select("content, created_at").order("created_at", { ascending: false }).limit(5),
      ]);

      const trend = (curr: number, prev: number): Trend => ({
        value: curr ?? 0,
        previous: prev ?? 0,
        delta: prev > 0 ? Math.round(((curr - prev) / prev) * 100) : (curr > 0 ? 100 : 0),
      });
      const conversionRate = (users ?? 0) > 0 ? Math.round(((premium ?? 0) / (users ?? 1)) * 100) : 0;

      setMetrics({
        users: users ?? 0, premium: premium ?? 0, saved: saved ?? 0, conversionRate,
        signups7d: trend(signups7 ?? 0, signupsPrev ?? 0),
        posts7d: trend(posts7 ?? 0, postsPrev ?? 0),
        chats7d: trend(chats7 ?? 0, chatsPrev ?? 0),
        waitlist: waitlist ?? 0,
      });

      const items: ActivityItem[] = [];
      (recentSignups || []).forEach(r => items.push({ kind: "signup", at: r.created_at, label: `${r.display_name || "New user"} joined` }));
      (recentSaves || []).forEach(r => items.push({ kind: "save", at: r.created_at, label: `Saved post: "${(r.hook || "").slice(0, 50)}"` }));
      (recentChats || []).forEach(r => items.push({ kind: "chat", at: r.created_at, label: `Clippie chat: "${(r.content || "").slice(0, 50)}"` }));
      items.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
      setActivity(items.slice(0, 10));
    } catch (error) {
      console.error(error);
      toast.error("Failed to load admin metrics");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) fetchMetrics();
    const saved = localStorage.getItem("clippedin-payment-links");
    const defaults = pricingPlans.reduce((acc, plan) => { acc[plan.name] = plan.checkoutUrl || ""; return acc; }, {} as Record<string, string>);
    setPaymentLinks(saved ? JSON.parse(saved) : defaults);
  }, [isAdmin]);

  const handleSavePaymentLinks = () => {
    localStorage.setItem("clippedin-payment-links", JSON.stringify(paymentLinks));
    toast.success("Payment links saved.");
  };

  const handleGrantPremium = async () => {
    if (!grantEmail.trim()) { toast.error("Enter a user display name to search."); return; }
    setSaving(true);
    try {
      const { data: matches } = await supabase.from("profiles").select("user_id, display_name").ilike("display_name", `%${grantEmail.trim()}%`).limit(1);
      if (!matches || matches.length === 0) { toast.error("No matching user found."); return; }
      const { error } = await supabase.from("profiles").update({ is_pro: true }).eq("user_id", matches[0].user_id);
      if (error) throw error;
      toast.success("Pro access granted.");
      setGrantEmail("");
      fetchMetrics();
    } catch (err) {
      console.error(err);
      toast.error("Failed to grant Pro");
    } finally { setSaving(false); }
  };

  if (!profile.isLoggedIn) return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8"><NoIndex />
      <div className="glass rounded-3xl p-8 max-w-xl text-center">
        <h1 className="text-2xl font-bold text-foreground">Admin console</h1>
        <p className="mt-4 text-sm text-muted-foreground">Sign in with the admin email to access.</p>
        <Button onClick={() => navigate("/login")} className="mt-6 rounded-2xl bg-primary hover:bg-primary/90">Sign in</Button>
      </div>
    </div>
  );

  if (!isAdmin) return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8"><NoIndex />
      <div className="glass rounded-3xl p-8 max-w-xl text-center">
        <h1 className="text-2xl font-bold text-foreground">Unauthorized</h1>
        <Button onClick={() => navigate("/")} className="mt-6 rounded-2xl bg-primary hover:bg-primary/90">Return home</Button>
      </div>
    </div>
  );

  const TrendTile = ({ icon, label, trend }: { icon: React.ReactNode; label: string; trend: Trend }) => (
    <div className="glass rounded-3xl p-5 space-y-2 border border-border">
      <div className="flex items-center justify-between">
        <p className="text-[10px] uppercase tracking-[0.28em] text-muted-foreground">{label}</p>
        <span className="text-primary">{icon}</span>
      </div>
      <p className="text-3xl font-bold text-foreground">{loading ? "…" : trend.value}</p>
      <div className={`flex items-center gap-1 text-[11px] ${trend.delta >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
        {trend.delta >= 0 ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
        {Math.abs(trend.delta)}% vs prior 7 days
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background px-4 py-10"><NoIndex />
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="glass rounded-3xl border border-border p-6 sm:p-8 shadow-xl">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
            <h1 className="text-3xl font-extrabold font-display text-foreground">Admin Control</h1>
            <p className="text-sm text-muted-foreground">Real-time metrics, premium overrides, and operational tools.</p>
          </motion.div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
            <div className="glass rounded-3xl p-5 space-y-2 border border-border">
              <p className="text-[10px] uppercase tracking-[0.28em] text-muted-foreground">Total users</p>
              <p className="text-3xl font-bold text-foreground">{loading ? "…" : metrics?.users}</p>
            </div>
            <div className="glass rounded-3xl p-5 space-y-2 border border-border">
              <p className="text-[10px] uppercase tracking-[0.28em] text-muted-foreground">Premium</p>
              <p className="text-3xl font-bold text-foreground">{loading ? "…" : metrics?.premium}</p>
            </div>
            <div className="glass rounded-3xl p-5 space-y-2 border border-border">
              <p className="text-[10px] uppercase tracking-[0.28em] text-muted-foreground">Conversion</p>
              <p className="text-3xl font-bold text-foreground">{loading ? "…" : `${metrics?.conversionRate}%`}</p>
            </div>
            <div className="glass rounded-3xl p-5 space-y-2 border border-border">
              <p className="text-[10px] uppercase tracking-[0.28em] text-muted-foreground">Waitlist</p>
              <p className="text-3xl font-bold text-foreground">{loading ? "…" : metrics?.waitlist}</p>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
            {metrics && <>
              <TrendTile icon={<Users className="w-4 h-4" />} label="Signups · 7d" trend={metrics.signups7d} />
              <TrendTile icon={<FileText className="w-4 h-4" />} label="Saved posts · 7d" trend={metrics.posts7d} />
              <TrendTile icon={<MessageSquare className="w-4 h-4" />} label="Clippie chats · 7d" trend={metrics.chats7d} />
            </>}
          </div>

          {/* Latest activity */}
          <div className="mt-8 glass rounded-3xl border border-border p-5">
            <div className="flex items-center gap-2 mb-3">
              <Activity className="w-4 h-4 text-primary" />
              <h2 className="text-base font-bold text-foreground">Latest activity</h2>
            </div>
            {activity.length === 0 ? (
              <p className="text-xs text-muted-foreground">No recent activity yet.</p>
            ) : (
              <ul className="space-y-2">
                {activity.map((a, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs">
                    <span className={`mt-1 w-1.5 h-1.5 rounded-full shrink-0 ${a.kind === "signup" ? "bg-emerald-400" : a.kind === "save" ? "bg-primary" : a.kind === "chat" ? "bg-accent" : "bg-muted-foreground"}`} />
                    <span className="text-foreground flex-1">{a.label}</span>
                    <span className="text-muted-foreground">{new Date(a.at).toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="mt-6 glass rounded-3xl border border-border p-5">
            <h2 className="text-base font-bold text-foreground">Grant Premium Access</h2>
            <p className="text-xs text-muted-foreground">Search by display name and grant Pro instantly.</p>
            <div className="mt-3 flex flex-col sm:flex-row gap-2">
              <input
                value={grantEmail} onChange={e => setGrantEmail(e.target.value)}
                placeholder="Display name fragment"
                className="flex-1 rounded-2xl border border-border bg-secondary px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <Button onClick={handleGrantPremium} disabled={saving} className="rounded-2xl bg-primary hover:bg-primary/90">
                {saving ? "Granting…" : "Grant Pro"}
              </Button>
            </div>
          </div>

          <div className="mt-6 glass rounded-3xl border border-border p-5">
            <div className="flex items-center justify-between gap-4 mb-3">
              <div>
                <h2 className="text-base font-bold text-foreground">Payment links</h2>
                <p className="text-xs text-muted-foreground">Update checkout URLs per tier.</p>
              </div>
              <Button onClick={handleSavePaymentLinks} className="rounded-2xl bg-primary hover:bg-primary/90">Save links</Button>
            </div>
            <div className="space-y-3">
              {pricingPlans.filter(plan => plan.name !== "BASIC").map(plan => (
                <div key={plan.name} className="space-y-1">
                  <p className="text-xs font-semibold text-foreground">{plan.displayName} <span className="text-muted-foreground font-normal">· {plan.price}</span></p>
                  <input
                    value={paymentLinks[plan.name] || ""}
                    onChange={e => setPaymentLinks(prev => ({ ...prev, [plan.name]: e.target.value }))}
                    placeholder="Checkout URL"
                    className="w-full rounded-2xl border border-border bg-secondary px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Admin;
