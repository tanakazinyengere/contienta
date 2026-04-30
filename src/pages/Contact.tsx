import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Mail, Phone, Globe, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { toast } from "sonner";

const Contact = () => {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !message.trim()) {
      toast.error("Please fill in all fields");
      return;
    }
    // Open mailto
    window.location.href = `mailto:clippedin.app@gmail.com?subject=ClippedIn Feedback from ${encodeURIComponent(name)}&body=${encodeURIComponent(message)}%0A%0AFrom: ${encodeURIComponent(email)}`;
    toast.success("Opening your email client...");
  };

  return (
    <div className="min-h-screen px-4 sm:px-8 py-8 max-w-3xl mx-auto space-y-8">
      <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="gap-1.5 press-effect">
        <ArrowLeft className="w-4 h-4" /> Back
      </Button>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ type: "spring", bounce: 0.15 }} className="space-y-6">
        <h1 className="text-fluid-2xl font-extrabold font-display text-gradient">Get in Touch</h1>

        {/* Contact cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { icon: <Mail className="w-5 h-5" />, label: "Email", value: "clippedin.app@gmail.com", href: "mailto:clippedin.app@gmail.com" },
            { icon: <Phone className="w-5 h-5" />, label: "Phone", value: "+371 25 404 366", href: "tel:+37125404366" },
            { icon: <Globe className="w-5 h-5" />, label: "Creator", value: "Tanaka Zinyengere", href: "https://linkfly.to/tanksnash" },
          ].map((item) => (
            <a
              key={item.label}
              href={item.href}
              target={item.href.startsWith("http") ? "_blank" : undefined}
              rel="noopener noreferrer"
              className="glass rounded-3xl p-5 text-center space-y-2 hover:glow-border transition-all press-effect block"
            >
              <div className="w-10 h-10 rounded-2xl bg-primary/15 flex items-center justify-center text-primary mx-auto">
                {item.icon}
              </div>
              <p className="text-xs text-muted-foreground">{item.label}</p>
              <p className="text-fluid-sm font-semibold text-foreground break-all">{item.value}</p>
            </a>
          ))}
        </div>

        {/* Contact form */}
        <form onSubmit={handleSubmit} className="glass rounded-3xl p-6 sm:p-8 space-y-4">
          <h2 className="text-fluid-lg font-bold font-display text-foreground">Send a Message</h2>
          <Input placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} className="bg-secondary border-border rounded-2xl h-11" />
          <Input placeholder="Your email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="bg-secondary border-border rounded-2xl h-11" />
          <textarea
            placeholder="Your message or suggestion..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="w-full min-h-[120px] rounded-2xl bg-secondary border border-border p-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
          />
          <Button type="submit" className="rounded-2xl bg-primary hover:bg-primary/90 press-effect gap-2 w-full sm:w-auto">
            <Send className="w-4 h-4" /> Send Message
          </Button>
        </form>
      </motion.div>
    </div>
  );
};

export default Contact;
