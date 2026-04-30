import { LogOut, User, LogIn, Heart } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import ThemeToggle from "./ThemeToggle";

interface HeaderProps {
  user?: any;
  onSignOut?: () => void;
  onLogin?: () => void;
}

const Header = ({ user, onSignOut, onLogin }: HeaderProps) => {
  const navigate = useNavigate();

  return (
    <header className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-border">
      <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate("/")}>
        <div className="w-11 h-11 rounded-2xl bg-primary flex items-center justify-center">
          <span className="text-primary-foreground font-display font-black text-2xl leading-none">C.</span>
        </div>
        <h1 className="text-xl sm:text-2xl font-black font-display tracking-tight text-gradient brand-logo">
          ClippedIn
        </h1>
      </div>

      {/* Nav links (desktop) */}
      <nav className="hidden md:flex items-center gap-4 text-sm text-muted-foreground">
        <button onClick={() => navigate("/about")} className="hover:text-foreground transition-colors">About</button>
        <button onClick={() => navigate("/pricing")} className="hover:text-foreground transition-colors">Pricing</button>
        <button onClick={() => navigate("/faqs")} className="hover:text-foreground transition-colors">FAQs</button>
        <button onClick={() => navigate("/contact")} className="hover:text-foreground transition-colors">Contact</button>
      </nav>

      <div className="flex items-center gap-2">
        <ThemeToggle />
        <button
          onClick={() => navigate("/pricing")}
          className="p-2 rounded-xl hover:bg-secondary text-rose-400 hover:text-rose-300 transition-colors press-effect"
          title="Support the Mission"
        >
          <Heart className="w-4 h-4" />
        </button>
        {user ? (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-secondary text-xs">
              <User className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-foreground hidden sm:inline truncate max-w-[120px]">
                {user.email}
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onSignOut}
              className="text-muted-foreground hover:text-foreground h-8"
            >
              <LogOut className="w-3.5 h-3.5" />
            </Button>
          </div>
        ) : (
          <Button
            variant="outline"
            size="sm"
            onClick={onLogin}
            className="h-8 text-xs gap-1.5"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Sign In</span>
          </Button>
        )}
      </div>
    </header>
  );
};

export default Header;
