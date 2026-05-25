import { useEffect, useState } from "react";
import { Cookie } from "lucide-react";
import { Button } from "@/components/ui/button";

const KEY = "clippedin-cookie-consent";

const CookieBanner = () => {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (!localStorage.getItem(KEY)) setOpen(true);
  }, []);
  const set = (v: "accepted" | "rejected") => {
    localStorage.setItem(KEY, v);
    setOpen(false);
  };
  if (!open) return null;
  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:max-w-sm z-50 glass rounded-2xl p-4 shadow-2xl border border-border">
      <div className="flex items-start gap-3">
        <Cookie className="w-5 h-5 text-primary mt-0.5 shrink-0" />
        <div className="space-y-2">
          <p className="text-xs text-foreground font-medium">We use cookies for essential features only.</p>
          <p className="text-[11px] text-muted-foreground">No tracking before you accept. See our <a href="/cookies" className="underline">Cookie Policy</a>.</p>
          <div className="flex gap-2">
            <Button size="sm" onClick={() => set("accepted")} className="h-7 px-3 text-xs rounded-xl">Accept</Button>
            <Button size="sm" variant="outline" onClick={() => set("rejected")} className="h-7 px-3 text-xs rounded-xl">Reject</Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CookieBanner;
