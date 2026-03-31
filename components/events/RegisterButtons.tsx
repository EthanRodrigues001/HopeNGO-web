"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Loader2 } from "lucide-react";

export function ParticipantRegisterButton({ eventId, disabled, isRegistered = false }: { eventId: string, disabled: boolean, isRegistered?: boolean }) {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<"idle"|"success"|"error">(isRegistered ? "success" : "idle");
  const [message, setMessage] = useState("");

  const handleRegister = async () => {
    setLoading(true);
    setStatus("idle");
    try {
      const res = await fetch("/api/registrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to register");
      setStatus("success");
      setMessage("Seat Reserved!");
      window.location.reload();
    } catch (err: any) {
      setStatus("error");
      setMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (isRegistered || status === "success") {
    return (
      <div className="w-full bg-primary/5 border border-primary/20 h-12 rounded-[8px] flex items-center justify-center gap-2 text-primary font-bold text-xs uppercase tracking-widest">
        <CheckCircle2 size={16} /> Reserved Document
      </div>
    );
  }

  return (
    <div className="w-full flex justify-center items-center flex-col gap-2">
      <Button 
        onClick={handleRegister} 
        disabled={disabled || loading}
        className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground shadow-none rounded-[8px] text-xs font-bold uppercase tracking-widest gap-2"
      >
        {loading ? <Loader2 className="animate-spin w-4 h-4" /> : disabled ? "Logistics Closed" : "Reserve Seat"}
      </Button>
      {message && <p className={`text-[10px] uppercase font-bold tracking-widest mt-1 ${status === "error" ? "text-red-600" : "text-primary"}`}>{message}</p>}
    </div>
  );
}

export function VolunteerApplyButton({ eventId, disabled, isRegistered = false }: { eventId: string, disabled: boolean, isRegistered?: boolean }) {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<"idle"|"success"|"error">(isRegistered ? "success" : "idle");
  const [message, setMessage] = useState("");

  const handleApply = async () => {
    setLoading(true);
    setStatus("idle");
    try {
      const res = await fetch("/api/volunteer-applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to apply");
      setStatus("success");
      setMessage("Application Submitted!");
      window.location.reload();
    } catch (err: any) {
      setStatus("error");
      setMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (isRegistered || status === "success") {
    return (
      <div className="w-full bg-cyan-600/5 border border-cyan-600/20 h-12 rounded-[8px] flex items-center justify-center gap-2 text-cyan-700 font-bold text-xs uppercase tracking-widest">
        <CheckCircle2 size={16} /> Dispatched
      </div>
    );
  }

  return (
    <div className="w-full flex justify-center items-center flex-col gap-2">
      <Button 
        onClick={handleApply} 
        disabled={disabled || loading}
        className="w-full h-12 bg-cyan-600 hover:bg-cyan-700 text-white shadow-none rounded-[8px] text-xs font-bold uppercase tracking-widest gap-2"
      >
        {loading ? <Loader2 className="animate-spin w-4 h-4" /> : disabled ? "Volunteers Closed" : "Volunteer Directive"}
      </Button>
      {message && <p className={`text-[10px] uppercase font-bold tracking-widest mt-1 ${status === "error" ? "text-red-600" : "text-cyan-600"}`}>{message}</p>}
    </div>
  );
}
