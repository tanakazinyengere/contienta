import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Mail, Loader2, ArrowRight, AlertTriangle, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";

interface OAuthBlock {
  title: string;
  message: string;
  steps: string[];
}

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [oauthBlock, setOauthBlock] = useState<OAuthBlock | null>(null);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => { if (session) navigate("/app"); });
    supabase.auth.getSession().then(({ data: { session } }) => { if (session) navigate("/app"); });
    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) { toast.error("Fill in email and password"); return; }
    if (password.length < 6) { toast.error("Password must be at least 6 characters"); return; }
    setIsLoading(true);
    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({ email: email.trim(), password, options: { emailRedirectTo: `${window.location.origin}/app` } });
        if (error) throw error;
        toast.success("Check your inbox to confirm your email — then sign in.");
        setIsSignUp(false);
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (error) {
          if (error.message?.toLowerCase().includes("invalid")) toast.error("Wrong email or password. Try again, or sign up if you're new.");
          else if (error.message?.toLowerCase().includes("confirm")) toast.error("Confirm your email first — check your inbox.");
          else toast.error(error.message);
          return;
        }
        toast.success("Welcome back");
      }
    } catch (err: any) {
      toast.error(err.message || "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setOauthBlock(null);
    setIsGoogleLoading(true);
    try {
      const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: `${window.location.origin}/app` });
      if (result.error) {
        const m = (result.error.message || "").toLowerCase();
        if (m.includes("blocked") || m.includes("not_approved") || m.includes("not approved") || m.includes("pending") || m.includes("403") || m.includes("disabled") || m.includes("unsupported provider")) {
          setOauthBlock({
            title: "Google sign-in not approved yet",
            message: "Google needs to approve token minting for ClippedIn before this works.",
            steps: [
              "Use email & password to sign in below — it works right now.",
              "We'll enable Google sign-in the moment approval comes through (usually 1–3 days).",
              "If you already had a Google account here, your data is safe — log in with that email and reset your password.",
            ],
          });
        } else {
          toast.error(`Google sign-in failed: ${result.error.message || "try again"}`);
        }
      }
    } catch (err: any) {
      toast.error(err.message || "Google sign-in failed");
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-background">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center mx-auto">
            <span className="text-primary-foreground font-display font-black text-xl">C</span>
          </div>
          <h1 className="text-2xl font-bold font-display text-foreground">ClippedIn</h1>
          <p className="text-sm text-muted-foreground">{isSignUp ? "Create your account" : "Welcome back"}</p>
        </div>

        {oauthBlock && (
          <div className="glass border border-amber-500/30 rounded-2xl p-4 space-y-2">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
              <div className="space-y-1">
                <p className="text-sm font-semibold text-foreground">{oauthBlock.title}</p>
                <p className="text-xs text-muted-foreground">{oauthBlock.message}</p>
              </div>
            </div>
            <ul className="text-xs text-muted-foreground space-y-1 ml-6 list-disc">
              {oauthBlock.steps.map((s, i) => <li key={i}>{s}</li>)}
            </ul>
            <button onClick={() => setOauthBlock(null)} className="text-[11px] text-primary hover:underline ml-6 press-effect">Dismiss</button>
          </div>
        )}

        <Button variant="outline" onClick={handleGoogleLogin} disabled={isGoogleLoading} className="w-full h-12 glass border-border text-foreground font-medium">
          {isGoogleLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : (
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
          )}
          Continue with Google
        </Button>

        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-border" /><span className="text-xs text-muted-foreground">or</span><div className="flex-1 h-px bg-border" />
        </div>

        <form onSubmit={handleEmailAuth} className="space-y-3">
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} className="pl-10 h-11 bg-secondary border-border" autoComplete="email" />
          </div>
          <Input type="password" placeholder="Password (6+ characters)" value={password} onChange={e => setPassword(e.target.value)} className="h-11 bg-secondary border-border" autoComplete={isSignUp ? "new-password" : "current-password"} />
          <Button type="submit" disabled={isLoading} className="w-full h-11 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold">
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : (<>{isSignUp ? "Sign Up" : "Sign In"}<ArrowRight className="w-4 h-4 ml-2" /></>)}
          </Button>
        </form>

        <p className="text-center text-xs text-muted-foreground">
          {isSignUp ? "Already have an account?" : "New here?"}{" "}
          <button onClick={() => setIsSignUp(!isSignUp)} className="text-primary hover:underline font-medium">
            {isSignUp ? "Sign In" : "Sign Up"}
          </button>
        </p>

        <button onClick={() => navigate("/app")} className="w-full text-center text-xs text-muted-foreground hover:text-foreground transition-colors">
          Continue without an account <ExternalLink className="w-3 h-3 inline ml-0.5" />
        </button>
      </motion.div>
    </div>
  );
};

export default Login;
