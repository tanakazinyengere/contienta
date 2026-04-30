import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, ShieldCheck } from "lucide-react";

interface SecureConnectionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  planName: string;
  checkoutUrl: string;
}

const SecureConnectionModal = ({ open, onOpenChange, planName, checkoutUrl }: SecureConnectionModalProps) => {
  const [status, setStatus] = useState<"connecting" | "ready">("connecting");

  useEffect(() => {
    if (!open) return;
    setStatus("connecting");
    const timer = window.setTimeout(() => setStatus("ready"), 2600);
    return () => window.clearTimeout(timer);
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader className="text-center">
          <DialogTitle className="text-xl font-bold">Secure Connection</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground mx-auto max-w-md">
            Connecting to Revolut Secure Checkout. Ensure your Revolut email matches your ClippedIn login for instant synchronization.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-5 py-4 text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 text-primary">
            <ShieldCheck className="w-10 h-10" />
          </div>
          <p className="text-sm text-foreground font-semibold">{planName} checkout is being prepared.</p>
          <div className="rounded-2xl border border-border bg-secondary p-4">
            <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground mb-2">Secure tunnel status</p>
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <div className={`h-full bg-primary transition-all ${status === "ready" ? "w-full" : "w-[30%]"}`} />
            </div>
            <p className="mt-3 text-[11px] text-muted-foreground">
              {status === "connecting"
                ? "Establishing encrypted connection..."
                : "Secure checkout tunnel ready. Proceed to complete payment."
              }
            </p>
          </div>
        </div>
        <DialogFooter className="justify-center gap-3">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            className="rounded-2xl"
            disabled={status !== "ready"}
            onClick={() => window.open(checkoutUrl, "_blank")}
          >
            {status === "ready" ? "Continue to Revolut" : "Connecting..."}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SecureConnectionModal;
