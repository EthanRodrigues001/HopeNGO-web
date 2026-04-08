"use client";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { Clock } from "lucide-react";

export default function PendingApproval() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 font-sans">
      <div className="max-w-md w-full text-center space-y-6 animate-in fade-in zoom-in-95 duration-700 bg-card p-10 rounded-[24px] rounded-tl-[8px] border-0 ring-1 ring-foreground/[0.03] shadow-[0_32px_64px_-12px_rgba(25,28,26,0.02)]">
        <div className="mx-auto bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mb-6">
          <Clock className="w-8 h-8 text-primary" strokeWidth={1.5} />
        </div>
        <h1 className="text-4xl font-serif font-medium text-foreground tracking-tight leading-tight">Application<br />Received</h1>
        <p className="text-foreground/70 font-light leading-relaxed">
          Your account is currently under review by the NGO's administration. You will be notified once your account access is approved.
        </p>
        <Button onClick={() => router.push("/")} className="mt-8 w-full h-14 bg-muted text-foreground hover:bg-muted/80 shadow-none hover:shadow-none text-sm uppercase tracking-widest font-semibold transition-all">
          Return to Archive
        </Button>
      </div>
    </div>
  );
}
