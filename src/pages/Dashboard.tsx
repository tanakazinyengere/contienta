import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trash2, Copy, Loader2, Bookmark } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface SavedPost {
  id: string;
  post_type: string;
  hook: string;
  body: string;
  cta: string;
  hashtags: string[];
  created_at: string;
}

const Dashboard = () => {
  const [posts, setPosts] = useState<SavedPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("saved_posts")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      toast.error("Failed to load saved posts");
    } else {
      setPosts((data as SavedPost[]) || []);
    }
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("saved_posts").delete().eq("id", id);
    if (error) {
      toast.error("Failed to delete");
    } else {
      setPosts((prev) => prev.filter((p) => p.id !== id));
      toast.success("Post removed");
    }
  };

  const handleCopy = (post: SavedPost) => {
    const text = `${post.hook}\n\n${post.body}\n\n${post.cta}\n\n${post.hashtags.join(" ")}`;
    navigator.clipboard.writeText(text);
    toast.success("Copied!");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 py-6 space-y-6">
      <div className="text-center space-y-2 max-w-xl mx-auto">
        <h2 className="text-fluid-xl font-bold font-display text-foreground flex items-center justify-center gap-2">
          <Bookmark className="w-5 h-5 text-primary" />
          Saved Posts
        </h2>
        <p className="text-fluid-sm text-muted-foreground">
          Your saved LinkedIn posts. Copy and publish anytime.
        </p>
      </div>

      {posts.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-muted-foreground text-sm">No saved posts yet. Generate content and hit the bookmark icon to save.</p>
        </div>
      ) : (
        <div className="columns-1 sm:columns-2 lg:columns-3 gap-4 max-w-5xl mx-auto">
          <AnimatePresence>
            {posts.map((post, i) => (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ delay: i * 0.03, type: "spring", bounce: 0.15 }}
                className="glass rounded-3xl p-5 space-y-3 break-inside-avoid mb-4 hover:glow-border transition-all"
              >
                <div className="flex items-start justify-between">
                  <span className="text-[10px] font-semibold px-2 py-1 rounded-xl bg-primary/20 text-primary">
                    {post.post_type}
                  </span>
                  <div className="flex gap-1">
                    <button onClick={() => handleCopy(post)} className="p-1.5 rounded-xl hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors press-effect">
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => handleDelete(post.id)} className="p-1.5 rounded-xl hover:bg-destructive/20 text-muted-foreground hover:text-destructive transition-colors press-effect">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <p className="text-sm font-bold text-foreground leading-snug">{post.hook}</p>
                <p className="text-xs text-muted-foreground leading-relaxed line-clamp-4 whitespace-pre-line">{post.body}</p>
                <p className="text-xs text-primary font-medium">{post.cta}</p>
                <div className="flex flex-wrap gap-1">
                  {post.hashtags.map((tag) => (
                    <span key={tag} className="text-[10px] text-muted-foreground">{tag}</span>
                  ))}
                </div>
                <p className="text-[9px] text-muted-foreground">
                  {new Date(post.created_at).toLocaleDateString()}
                </p>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
