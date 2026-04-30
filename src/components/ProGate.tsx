import { motion } from "framer-motion";
import { Crown, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useState } from "react";

interface ProGateProps {
  onClose?: () => void;
}

const ProGate = ({ onClose }: ProGateProps) => {
  const [joining, setJoining] = useState(false);

  const handleJoinWaitlist = async () => {
    setJoining(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Please sign in first");
        return;
      }

      const { error } = await supabase.from("pro_waitlist").insert({
        user_id: session.user.id,
        email: session.user.email || "",
      });

      if (error) {
        if (error.code === "23505") {
          toast.info("You're already on the waitlist! We'll notify you when Pro launches.");
        } else {
          throw error;
        }
      } else {
        toast.success("You're on the Pro waitlist! We'll email you when it's ready.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to join waitlist");
    } finally {
      setJoining(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass rounded-3xl p-6 sm:p-8 text-center space-y-4 glow-border max-w-md mx-auto"
    >
      <div className="w-14 h-14 rounded-2xl bg-primary/20 flex items-center justify-center mx-auto">
        <Crown className="w-7 h-7 text-primary" />
      </div>
      <h3 className="text-fluid-lg font-bold font-display text-foreground">
        Unlock All Posts with Pro
      </h3>
      <p className="text-fluid-sm text-muted-foreground">
        Free users can view 5 posts per generation. Upgrade to Pro for unlimited posts, 
        chart exports, and advanced SSI analytics.
      </p>
      <div className="flex flex-col gap-2">
        <Button
          onClick={handleJoinWaitlist}
          disabled={joining}
          className="w-full rounded-2xl bg-primary hover:bg-primary/90 h-11 press-effect gap-2"
        >
          <Lock className="w-4 h-4" />
          {joining ? "Joining..." : "Join Pro Waitlist — $9/mo"}
        </Button>
        {onClose && (
          <Button variant="ghost" size="sm" onClick={onClose} className="text-muted-foreground">
            Maybe later
          </Button>
        )}
      </div>
      <p className="text-[10px] text-muted-foreground">
        Payment integration coming soon. We'll notify you when it's live.
      </p>
    </motion.div>
  );
};

export default ProGate;
