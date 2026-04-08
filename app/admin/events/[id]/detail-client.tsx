"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserCog, Loader2, CheckCircle2 } from "lucide-react";

interface Coordinator {
  uid: string;
  fullName: string;
  email: string;
}

export default function EventDetailClient({
  eventId,
  currentCoordinatorId,
  currentCoordinatorName,
  coordinators,
}: {
  eventId: string;
  currentCoordinatorId: string | null;
  currentCoordinatorName: string | null;
  coordinators: Coordinator[];
}) {
  const [selected, setSelected] = useState<string>(currentCoordinatorId || "");
  const [assignedName, setAssignedName] = useState<string | null>(currentCoordinatorName);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleAssign = async () => {
    if (!selected) return;
    setLoading(true);
    setSuccess(false);
    try {
      const res = await fetch(`/api/events/${eventId}/assign-coordinator`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ coordinatorId: selected }),
      });
      if (res.ok) {
        const data = await res.json();
        setAssignedName(data.coordinatorName || coordinators.find(c => c.uid === selected)?.fullName || null);
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="bg-card shadow-[0_16px_32px_-12px_rgba(25,28,26,0.03)] border-0 ring-1 ring-foreground/[0.04] rounded-[24px] flex flex-col">
      <CardHeader className="p-8 pb-4">
        <CardTitle className="text-[12px] font-bold uppercase tracking-[0.1em] text-foreground/60 flex items-center gap-2">
          <UserCog className="text-violet-600/70" strokeWidth={1.5} size={18} /> Assigned Coordinator
        </CardTitle>
      </CardHeader>
      <CardContent className="px-8 pb-8 flex flex-col gap-4">
        {assignedName && (
          <div className="flex items-center gap-3 py-3 px-4 rounded-[10px] bg-violet-600/5 border border-violet-600/10">
            <div className="size-8 rounded-full bg-violet-600/10 flex items-center justify-center text-violet-600 text-xs font-bold">
              {assignedName.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1">
              <p className="font-medium text-foreground text-sm">{assignedName}</p>
              <p className="text-[10px] text-foreground/50 uppercase tracking-widest font-bold">Currently Assigned</p>
            </div>
            <CheckCircle2 size={16} className="text-violet-600" />
          </div>
        )}

        <div className="flex flex-col gap-3">
          <label className="text-[10px] uppercase tracking-widest font-bold text-foreground/50">
            {assignedName ? "Reassign Coordinator" : "Select Coordinator"}
          </label>
          <Select value={selected} onValueChange={(val: any) => setSelected(val || "")}>
            <SelectTrigger className="h-12 bg-muted/20 border-foreground/10 text-foreground focus:ring-primary rounded-[8px]">
              <SelectValue placeholder="Choose a coordinator..." />
            </SelectTrigger>
            <SelectContent className="bg-card border-foreground/10 rounded-[8px] p-1 shadow-lg">
              {coordinators.map((c) => (
                <SelectItem key={c.uid} value={c.uid}>
                  {c.fullName} ({c.email})
                </SelectItem>
              ))}
              {coordinators.length === 0 && (
                <div className="px-3 py-2 text-sm text-foreground/50 italic">No approved coordinators available</div>
              )}
            </SelectContent>
          </Select>
        </div>

        <Button
          onClick={handleAssign}
          disabled={!selected || loading}
          className="h-12 bg-primary hover:bg-primary/90 text-primary-foreground shadow-none rounded-[8px] font-bold text-xs uppercase tracking-widest transition-all w-full"
        >
          {loading ? (
            <><Loader2 className="size-4 animate-spin mr-2" /> Assigning...</>
          ) : success ? (
            <><CheckCircle2 className="size-4 mr-2" /> Assigned!</>
          ) : (
            "Assign Coordinator"
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
