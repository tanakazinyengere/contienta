import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Send, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";

type Msg = { role: "user" | "assistant"; content: string };

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/clippie-chat`;

const Clippie = () => {
  const [messages, setMessages] = useState<Msg[]>([
    { role: "assistant", content: "Hi, I'm Clippie 👋\n\nAsk me anything about your LinkedIn — profile tweaks, post ideas, hook formulas, or what to write next." },
  ]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const feedRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    feedRef.current?.scrollTo({ top: feedRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const send = async () => {
    const text = input.trim();
    if (!text || busy) return;
    setInput("");
    const next: Msg[] = [...messages, { role: "user", content: text }, { role: "assistant", content: "" }];
    setMessages(next);
    setBusy(true);
    try {
      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
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
    <div className="flex flex-col h-[calc(100vh-200px)] max-w-3xl mx-auto w-full px-3">
      <div ref={feedRef} className="flex-1 overflow-y-auto py-4 space-y-3">
        {messages.map((m, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.18 }}
            className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div className={`max-w-[85%] rounded-3xl px-4 py-3 text-sm whitespace-pre-wrap leading-relaxed ${
              m.role === "user"
                ? "bg-primary text-primary-foreground rounded-br-md"
                : "glass text-foreground rounded-bl-md"
            }`}>
              {m.content || <span className="inline-flex gap-1"><span className="w-1.5 h-1.5 bg-current rounded-full animate-bounce" /><span className="w-1.5 h-1.5 bg-current rounded-full animate-bounce" style={{ animationDelay: "0.15s" }} /><span className="w-1.5 h-1.5 bg-current rounded-full animate-bounce" style={{ animationDelay: "0.3s" }} /></span>}
            </div>
          </motion.div>
        ))}
      </div>
      <div className="sticky bottom-0 pb-2">
        <div className="glass rounded-3xl p-2 flex items-end gap-2 focus-within:glow-border transition-shadow">
          <Sparkles className="w-4 h-4 text-primary ml-2 mb-2.5 shrink-0" />
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
            placeholder="Ask Clippie anything…"
            rows={1}
            className="flex-1 bg-transparent resize-none text-sm py-2 outline-none placeholder:text-muted-foreground max-h-32"
          />
          <button
            onClick={send}
            disabled={busy || !input.trim()}
            className="w-9 h-9 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center disabled:opacity-40 press-effect shrink-0"
          >
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Clippie;
