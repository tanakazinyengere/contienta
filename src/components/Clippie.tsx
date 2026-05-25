import { useState, useRef, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Send, Loader2, Sparkles, Plus, MessageSquare, Trash2, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import { supabase } from "@/integrations/supabase/client";
import { useUserProfile } from "@/hooks/useUserProfile";

type Msg = { role: "user" | "assistant"; content: string };
type Conv = { id: string; title: string; updated_at: string };

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/clippie-chat`;
const INTRO: Msg = { role: "assistant", content: "Hi, I'm **Clippie** 👋\n\nAsk me anything about your LinkedIn — profile tweaks, post ideas, hook formulas, or what to write next." };

const Clippie = () => {
  const user = useUserProfile();
  const [convs, setConvs] = useState<Conv[]>([]);
  const [activeConv, setActiveConv] = useState<string | null>(null);
  const [messages, setMessages] = useState<Msg[]>([INTRO]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [showScrollDown, setShowScrollDown] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const feedRef = useRef<HTMLDivElement>(null);

  // Load conversations
  useEffect(() => {
    if (!user.isLoggedIn) return;
    supabase.from("chat_conversations").select("id, title, updated_at").eq("user_id", user.userId).order("updated_at", { ascending: false }).then(({ data }) => {
      if (data) setConvs(data);
    });
  }, [user.isLoggedIn, user.userId]);

  // Load active conversation messages
  useEffect(() => {
    if (!activeConv) { setMessages([INTRO]); return; }
    supabase.from("chat_messages").select("role, content").eq("conversation_id", activeConv).order("created_at").then(({ data }) => {
      if (data && data.length) setMessages(data.map(d => ({ role: d.role as any, content: d.content })));
      else setMessages([INTRO]);
    });
  }, [activeConv]);

  // Auto-scroll
  useEffect(() => {
    feedRef.current?.scrollTo({ top: feedRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const onScroll = () => {
    const el = feedRef.current;
    if (!el) return;
    const fromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    setShowScrollDown(fromBottom > 200);
  };

  const ensureConv = useCallback(async (firstUserMsg: string): Promise<string | null> => {
    if (!user.isLoggedIn) return null;
    if (activeConv) return activeConv;
    const title = firstUserMsg.slice(0, 50) || "New chat";
    const { data, error } = await supabase.from("chat_conversations").insert({ user_id: user.userId, title }).select("id, title, updated_at").maybeSingle();
    if (error || !data) return null;
    setConvs(prev => [data, ...prev]);
    setActiveConv(data.id);
    return data.id;
  }, [user, activeConv]);

  const persistMessage = async (convId: string, role: "user" | "assistant", content: string) => {
    if (!user.isLoggedIn) return;
    await supabase.from("chat_messages").insert({ conversation_id: convId, user_id: user.userId, role, content });
    await supabase.from("chat_conversations").update({ updated_at: new Date().toISOString() }).eq("id", convId);
  };

  const newChat = () => {
    setActiveConv(null);
    setMessages([INTRO]);
    setDrawerOpen(false);
  };

  const deleteConv = async (id: string) => {
    await supabase.from("chat_messages").delete().eq("conversation_id", id);
    await supabase.from("chat_conversations").delete().eq("id", id);
    setConvs(prev => prev.filter(c => c.id !== id));
    if (activeConv === id) newChat();
  };

  const send = async () => {
    const text = input.trim();
    if (!text || busy) return;
    setInput("");
    const convId = await ensureConv(text);
    const next: Msg[] = [...messages, { role: "user", content: text }, { role: "assistant", content: "" }];
    setMessages(next);
    setBusy(true);
    if (convId) persistMessage(convId, "user", text);
    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ messages: next.slice(0, -1).map(m => ({ role: m.role, content: m.content })) }),
      });
      if (resp.status === 429) { toast.error("Rate limited. Try again shortly."); throw new Error("rate"); }
      if (resp.status === 402) { toast.error("AI credits exhausted."); throw new Error("credits"); }
      if (!resp.ok || !resp.body) throw new Error("stream failed");

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buf = "", soFar = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        let nl: number;
        while ((nl = buf.indexOf("\n")) !== -1) {
          let line = buf.slice(0, nl);
          buf = buf.slice(nl + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line.startsWith("data: ")) continue;
          const json = line.slice(6).trim();
          if (json === "[DONE]") { buf = ""; break; }
          try {
            const p = JSON.parse(json);
            const delta = p.choices?.[0]?.delta?.content;
            if (delta) {
              soFar += delta;
              setMessages(prev => {
                const copy = [...prev];
                copy[copy.length - 1] = { role: "assistant", content: soFar };
                return copy;
              });
            }
          } catch { buf = line + "\n" + buf; break; }
        }
      }
      if (convId && soFar) persistMessage(convId, "assistant", soFar);
    } catch (e: any) {
      setMessages(prev => {
        const copy = [...prev];
        if (copy[copy.length - 1].content === "") copy.pop();
        return copy;
      });
      if (e?.message !== "rate" && e?.message !== "credits") toast.error("Clippie hit a snag. Try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex h-[calc(100vh-200px)] max-w-5xl mx-auto w-full gap-3">
      {/* Sidebar */}
      <aside className={`${drawerOpen ? "absolute inset-y-0 left-0 z-30 w-64 p-3 bg-background border-r border-border" : "hidden"} md:relative md:block md:w-56 md:bg-transparent md:border-0 md:p-0`}>
        <button onClick={newChat} className="w-full glass rounded-2xl py-2 flex items-center justify-center gap-2 text-sm font-semibold text-foreground press-effect mb-2">
          <Plus className="w-4 h-4" />New chat
        </button>
        <div className="space-y-1 overflow-y-auto max-h-[calc(100%-3rem)]">
          {convs.length === 0 && <p className="text-[11px] text-muted-foreground px-2 py-3">No saved chats yet.</p>}
          {convs.map(c => (
            <div key={c.id} className={`group flex items-center gap-1 rounded-xl px-2 py-1.5 text-xs cursor-pointer ${activeConv === c.id ? "bg-primary/15 text-foreground" : "text-muted-foreground hover:bg-secondary/60"}`}>
              <MessageSquare className="w-3 h-3 shrink-0" />
              <button onClick={() => { setActiveConv(c.id); setDrawerOpen(false); }} className="flex-1 truncate text-left">{c.title || "Untitled"}</button>
              <button onClick={() => deleteConv(c.id)} className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive press-effect"><Trash2 className="w-3 h-3" /></button>
            </div>
          ))}
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col px-3 relative">
        <button onClick={() => setDrawerOpen(true)} className="md:hidden absolute top-1 left-1 z-10 glass rounded-full p-2 text-xs press-effect">
          <MessageSquare className="w-4 h-4 text-foreground" />
        </button>

        <div ref={feedRef} onScroll={onScroll} className="flex-1 overflow-y-auto py-4 space-y-3">
          {messages.map((m, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.18 }} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[85%] rounded-3xl px-4 py-3 text-sm leading-relaxed ${m.role === "user" ? "bg-primary text-primary-foreground rounded-br-md" : "glass text-foreground rounded-bl-md"}`}>
                {m.content
                  ? <div className="prose prose-sm dark:prose-invert max-w-none prose-p:my-1 prose-ul:my-1 prose-li:my-0.5"><ReactMarkdown>{m.content}</ReactMarkdown></div>
                  : <span className="inline-flex gap-1"><span className="w-1.5 h-1.5 bg-current rounded-full animate-bounce" /><span className="w-1.5 h-1.5 bg-current rounded-full animate-bounce" style={{ animationDelay: "0.15s" }} /><span className="w-1.5 h-1.5 bg-current rounded-full animate-bounce" style={{ animationDelay: "0.3s" }} /></span>
                }
              </div>
            </motion.div>
          ))}
        </div>

        {showScrollDown && (
          <button onClick={() => feedRef.current?.scrollTo({ top: feedRef.current.scrollHeight, behavior: "smooth" })} className="absolute bottom-24 left-1/2 -translate-x-1/2 glass rounded-full w-9 h-9 flex items-center justify-center press-effect">
            <ChevronDown className="w-4 h-4 text-foreground" />
          </button>
        )}

        <div className="sticky bottom-0 pb-2">
          <div className="glass rounded-3xl p-2 flex items-end gap-2 focus-within:ring-2 focus-within:ring-primary/40 focus-within:shadow-[0_0_20px_rgba(0,213,255,0.25)] transition-shadow">
            <Sparkles className="w-4 h-4 text-primary ml-2 mb-2.5 shrink-0" />
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
              placeholder="Ask Clippie anything…"
              rows={1}
              className="flex-1 bg-transparent resize-none text-sm py-2 outline-none placeholder:text-muted-foreground max-h-32"
            />
            <button onClick={send} disabled={busy || !input.trim()} className="w-9 h-9 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center disabled:opacity-40 press-effect shrink-0">
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Clippie;
