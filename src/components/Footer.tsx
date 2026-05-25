import { Link } from "react-router-dom";

const Footer = () => (
  <footer className="border-t border-border px-4 sm:px-8 py-8 mt-auto">
    <div className="max-w-5xl mx-auto space-y-4 text-xs text-muted-foreground">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-display font-bold text-xs">C</span>
          </div>
          <span>© {new Date().getFullYear()} Snashco LLC. All rights reserved.</span>
        </div>
        <div className="flex items-center gap-4 flex-wrap">
          <Link to="/about" className="hover:text-foreground transition-colors">About</Link>
          <Link to="/faqs" className="hover:text-foreground transition-colors">FAQs</Link>
          <Link to="/pricing" className="hover:text-foreground transition-colors">Pricing</Link>
          <Link to="/contact" className="hover:text-foreground transition-colors">Contact</Link>
        </div>
      </div>
      <div className="flex items-center gap-3 flex-wrap text-[11px] opacity-80">
        <Link to="/terms" className="hover:text-foreground">Terms</Link>
        <span>·</span>
        <Link to="/privacy" className="hover:text-foreground">Privacy</Link>
        <span>·</span>
        <Link to="/cookies" className="hover:text-foreground">Cookies</Link>
        <span>·</span>
        <Link to="/refunds" className="hover:text-foreground">Refunds</Link>
        <span>·</span>
        <Link to="/dmca" className="hover:text-foreground">DMCA</Link>
        <span>·</span>
        <Link to="/acceptable-use" className="hover:text-foreground">Acceptable Use</Link>
        <span className="opacity-60 ml-auto">Snashco LLC · Bulawayo, Zimbabwe · tanksnash@gmail.com</span>
      </div>
    </div>
  </footer>
);

export default Footer;
