import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trash2, Copy, Loader2, Bookmark, Calendar, Send, Image as ImageIcon, X, Lock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

interface SavedPost {
  id: string;
  post_type: string;
  hook: string;
  body: string;
  cta: string;
  hashtags: string[];
  created_at: string;
}

const MAX_LEN = 3000;

const Dashboard = () => {
  const navigate = useNavigate();
  const { isPro, isLoggedIn } = useUserProfile();
  const [posts, setPosts] = useState<SavedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [drafts, setDrafts] = useState<Record<string, { text: string; image?: string; scheduledAt?: string }>>({});

  useEffect(() => { fetchPosts(); }, []);

  const fetchPosts = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("saved_posts").select("*").order("created_at", { ascending: false });
    if (error) toast.error("Failed to load saved posts");
    else {
      const list = (data as SavedPost[]) || [];
      setPosts(list);
      const next: typeof drafts = {};
      list.forEach(p => {
        next[p.id] = { text: `${p.hook}\n\n${p.body}\n\n${p.cta}\n\n${p.hashtags.join(" ")}`.slice(0, MAX_LEN) };
      });
      setDrafts(next);
    }
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("saved_posts").delete().eq("id", id);
    if (error) toast.error("Failed to delete");
    else { setPosts(p => p.filter(x => x.id !== id)); toast.success("Removed"); }
  };

  const handleCopy = (id: string) => {
    navigator.clipboard.writeText(drafts[id]?.text || "");
    toast.success("Copied — paste it into LinkedIn");
  };

  const handleImage = (id: string, file: File) => {
    const r = new FileReader();
    r.onload = () => setDrafts(d => ({ ...d, [id]: { ...d[id], image: r.result as string } }));
    r.readAsDataURL(file);
  };

  const removeImage = (id: string) =>
    setDrafts(d => { const c = { ...d[id] }; delete c.image; return { ...d, [id]: c }; });

  const handleSchedule = async (id: string) => {
    const d = drafts[id];
    if (!d?.text.trim()) { toast.error("Add some text first"); return; }
    if (!d.scheduledAt) { toast.error("Pick a date & time"); return; }
    if (!isPro) {
      toast.error("Scheduling is a Pro feature");
      navigate("/pricing");
      return;
    }
    const when = new Date(d.scheduledAt).getTime();
    if (when <= Date.now()) { toast.error("Pick a future time"); return; }
    const { error } = await supabase.from("scheduled_linkedin_posts").insert({
      user_id: (await supabase.auth.getUser()).data.user?.id,
      text: d.text,
      image_url: d.image || null,
      scheduled_at: new Date(when).toISOString(),
    });
    if (error) { toast.error(error.message); return; }
    toast.success("Queued for LinkedIn. We'll publish at the scheduled time.");
  };

  if (loading) return <div className="flex items-center justify-center min-h-[50vh]"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;

  if (!isLoggedIn) return (
    <div className="text-center py-16 px-4">
      <p className="text-muted-foreground text-sm">Sign in to see your saved posts feed.</p>
      <Button className="mt-4" onClick={() => navigate("/login")}>Sign In</Button>
    </div>
  );

  return (
    <div className="px-4 sm:px-6 py-6 space-y-5 max-w-2xl mx-auto">
      <div className="text-center space-y-1">
        <h2 className="text-fluid-xl font-bold font-display text-foreground flex items-center justify-center gap-2"><Bookmark className="w-5 h-5 text-primary" />Your Feed</h2>
        <p className="text-fluid-sm text-muted-foreground">Edit, add a photo, schedule — like a real LinkedIn draft queue.</p>
      </div>

      {posts.length === 0 ? (
        <div className="text-center py-16 text-sm text-muted-foreground">No saved posts yet. Bookmark some from the Engine tab.</div>
      ) : (
        <AnimatePresence>
          {posts.map(post => {
            const draft = drafts[post.id] || { text: "" };
            const len = draft.text.length;
            return (
              <motion.div key={post.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96 }} className="glass rounded-3xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-semibold px-2 py-1 rounded-xl bg-primary/20 text-primary">{post.post_type}</span>
                  <button onClick={() => handleDelete(post.id)} className="p-1.5 rounded-xl hover:bg-destructive/20 text-muted-foreground hover:text-destructive press-effect">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <textarea
                  value={draft.text}
                  onChange={e => setDrafts(d => ({ ...d, [post.id]: { ...d[post.id], text: e.target.value.slice(0, MAX_LEN) } }))}
                  rows={6}
                  className="w-full bg-secondary/50 rounded-2xl p-3 text-sm text-foreground outline-none resize-y leading-relaxed"
                  placeholder="Your LinkedIn post…"
                />
                <div className={`text-[10px] text-right ${len > MAX_LEN - 100 ? "text-amber-400" : "text-muted-foreground"}`}>{len}/{MAX_LEN}</div>

                {draft.image && (
                  <div className="relative">
                    <img src={draft.image} alt="" className="w-full max-h-72 object-cover rounded-2xl" />
                    <button onClick={() => removeImage(post.id)} className="absolute top-2 right-2 w-7 h-7 rounded-full bg-background/80 backdrop-blur flex items-center justify-center press-effect">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                <div className="flex flex-wrap items-center gap-2">
                  <label className="cursor-pointer flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl bg-secondary hover:bg-secondary/80 press-effect">
                    <ImageIcon className="w-3.5 h-3.5" />Add photo
                    <input type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleImage(post.id, f); }} />
                  </label>
                  <button onClick={() => handleCopy(post.id)} className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl bg-secondary hover:bg-secondary/80 press-effect">
                    <Copy className="w-3.5 h-3.5" />Copy
                  </button>
                  <div className="flex items-center gap-1.5 text-xs px-2 py-1 rounded-xl bg-secondary">
                    <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                    <input
                      type="datetime-local"
                      value={draft.scheduledAt || ""}
                      onChange={e => setDrafts(d => ({ ...d, [post.id]: { ...d[post.id], scheduledAt: e.target.value } }))}
                      className="bg-transparent outline-none text-xs"
                    />
                  </div>
                  <Button
                    size="sm"
                    onClick={() => handleSchedule(post.id)}
                    className="ml-auto rounded-xl gap-1.5 press-effect"
                  >
                    {isPro ? <Send className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                    Schedule
                  </Button>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      )}
    </div>
  );
};

export default Dashboard;
