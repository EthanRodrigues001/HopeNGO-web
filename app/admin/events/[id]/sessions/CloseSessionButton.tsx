"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Lock } from "lucide-react";

export default function CloseSessionButton({ eventId, sessionId, sessionNumber }: { eventId: string, sessionId: string, sessionNumber: number }) {
  const [loading, setLoading] = useState(false);

  const handleClose = async () => {
    if (!confirm(`Are you sure you want to close Session ${sessionNumber}? This will lock attendance and potentially issue certificates if this is the final session.`)) {
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/events/${eventId}/sessions/${sessionId}/close`, {
        method: "PATCH",
      });

      if (!res.ok) {
        throw new Error(await res.text() || "Failed to close session");
      }
      
      window.location.reload();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button 
      onClick={handleClose} 
      disabled={loading} 
      className="h-10 bg-primary hover:bg-primary/90 text-primary-foreground shadow-none rounded-[8px] text-xs uppercase tracking-widest font-bold flex items-center gap-2"
    >
      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
      Close Session
    </Button>
  );
}
