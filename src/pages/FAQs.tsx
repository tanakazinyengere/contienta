import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

const faqData = [
  {
    q: "What is ClippedIn?",
    a: "ClippedIn is an AI-powered LinkedIn growth tool. It generates high-quality posts and analyzes your profile's Social Selling Index (SSI) to give you actionable tips for improvement.",
  },
  {
    q: "How does the SSI score work?",
    a: "We use LinkedIn's verified Social Selling Index methodology to estimate your score across 4 pillars: Professional Brand, Finding People, Engaging with Insights, and Building Relationships. For your exact score, visit linkedin.com/sales/ssi.",
  },
  {
    q: "How many posts can I generate?",
    a: "You can generate up to 50 LinkedIn posts in a single batch. Each post comes with a hook, body, CTA, and 6+ hashtags optimized for reach.",
  },
  {
    q: "Is my data safe?",
    a: "Yes. We use encrypted connections, Row-Level Security on all database tables, and never share your data with third parties. Your generated content belongs to you.",
  },
  {
    q: "Can I save posts for later?",
    a: "Absolutely! Click the bookmark icon on any generated post to save it to your Dashboard. You can copy or delete saved posts anytime.",
  },
  {
    q: "What does Pro include?",
    a: "Pro members get unlimited post generation, chart exports, advanced SSI analytics with Industry & Network rankings, and priority support.",
  },
  {
    q: "How do I contact support?",
    a: "Email us at clippedin.app@gmail.com or use the Contact page. We aim to respond within 24 hours.",
  },
];

const FAQs = () => {
  const navigate = useNavigate();
  const [open, setOpen] = useState<number | null>(0);

  return (
    <div className="min-h-screen px-4 sm:px-8 py-8 max-w-3xl mx-auto space-y-8">
      <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="gap-1.5 press-effect">
        <ArrowLeft className="w-4 h-4" /> Back
      </Button>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ type: "spring", bounce: 0.15 }} className="space-y-6">
        <h1 className="text-fluid-2xl font-extrabold font-display text-gradient">Frequently Asked Questions</h1>

        <div className="space-y-3">
          {faqData.map((faq, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05, type: "spring", bounce: 0.15 }}
              className="glass rounded-3xl overflow-hidden"
            >
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="w-full flex items-center justify-between p-5 text-left press-effect"
              >
                <span className="text-fluid-sm font-semibold text-foreground pr-4">{faq.q}</span>
                <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform flex-shrink-0 ${open === i ? "rotate-180" : ""}`} />
              </button>
              {open === i && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  className="px-5 pb-5"
                >
                  <p className="text-fluid-sm text-muted-foreground leading-relaxed">{faq.a}</p>
                </motion.div>
              )}
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};

export default FAQs;
