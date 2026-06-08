import { useEffect, useState, useCallback } from "react";
import { Bell } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";

interface Notif {
  id: string;
  kind: string;
  title: string;
  body: string | null;
  link: string | null;
  read_at: string | null;
  created_at: string;
}

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Notif[]>([]);
  const navigate = useNavigate();

  const load = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(25);
    if (data) setItems(data as Notif[]);
  }, []);

  useEffect(() => {
    load();
    const ch = supabase.channel("notif-bell")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications" }, () => load())
      .subscribe();
    const t = setInterval(load, 60000);
    return () => { supabase.removeChannel(ch); clearInterval(t); };
  }, [load]);

  const unread = items.filter(i => !i.read_at).length;

  const markRead = async (id: string) => {
    await supabase.from("notifications").update({ read_at: new Date().toISOString() }).eq("id", id);
    setItems(prev => prev.map(i => i.id === id ? { ...i, read_at: new Date().toISOString() } : i));
  };

  const open_item = async (n: Notif) => {
    if (!n.read_at) await markRead(n.id);
    setOpen(false);
    // Notifications always open into Messages/Clippie tab inside the app
    const dest = n.link || "/app";
    navigate(dest.includes("tab=") ? dest : `${dest}?tab=clippie`);
  };

  const markAll = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("notifications").update({ read_at: new Date().toISOString() })
      .eq("user_id", user.id).is("read_at", null);
    setItems(prev => prev.map(i => ({ ...i, read_at: i.read_at || new Date().toISOString() })));
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        className="relative w-10 h-10 rounded-full glass flex items-center justify-center press-effect"
        aria-label={`Notifications${unread ? ` (${unread} unread)` : ""}`}
      >
        <Bell className="w-4 h-4 text-foreground" />
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>
      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.96 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 mt-2 w-80 max-h-[420px] overflow-y-auto glass rounded-2xl border border-border shadow-2xl z-50"
            >
              <div className="flex items-center justify-between px-4 py-3 border-b border-border/50 sticky top-0 bg-background/95 backdrop-blur">
                <span className="text-sm font-semibold text-foreground">Notifications</span>
                {unread > 0 && (
                  <button onClick={markAll} className="text-[11px] text-primary hover:underline">Mark all read</button>
                )}
              </div>
              {items.length === 0 ? (
                <p className="px-4 py-8 text-center text-xs text-muted-foreground">No notifications yet.</p>
              ) : items.map(n => (
                <button
                  key={n.id}
                  onClick={() => open_item(n)}
                  className={`w-full text-left px-4 py-3 border-b border-border/30 hover:bg-secondary/40 transition-colors ${!n.read_at ? "bg-primary/5" : ""}`}
                >
                  <div className="flex items-start gap-2">
                    {!n.read_at && <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary shrink-0" />}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-foreground truncate">{n.title}</p>
                      {n.body && <p className="mt-0.5 text-[11px] text-muted-foreground line-clamp-2">{n.body}</p>}
                      <p className="mt-1 text-[10px] text-muted-foreground">{formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}</p>
                    </div>
                  </div>
                </button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
