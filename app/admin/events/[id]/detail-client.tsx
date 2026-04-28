"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserCog, Loader2, CheckCircle2, Pencil } from "lucide-react";

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
  const [changing, setChanging] = useState(false); // allow reassign if explicitly toggled

  const handleAssign = async () => {
    if (!selected) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/events/${eventId}/assign-coordinator`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ coordinatorId: selected }),
      });
      if (res.ok) {
        const data = await res.json();
        setAssignedName(
          data.coordinatorName ||
            coordinators.find((c) => c.uid === selected)?.fullName ||
            null
        );
        setChanging(false);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="bg-card border-0 ring-1 ring-foreground/[0.05] rounded-2xl shadow-sm">
      <CardHeader className="p-6 pb-3">
        <CardTitle className="text-[11px] font-bold uppercase tracking-[0.1em] text-foreground/60 flex items-center gap-2">
          <UserCog className="text-violet-600/70" strokeWidth={1.5} size={15} />
          Assigned Coordinator
        </CardTitle>
      </CardHeader>
      <CardContent className="px-6 pb-6 flex flex-col gap-3">
        {/* Assigned state */}
        {assignedName && !changing ? (
          <>
            <div className="flex items-center gap-3 py-3 px-4 rounded-xl bg-violet-600/5 border border-violet-600/10">
              <div className="size-8 rounded-full bg-violet-600/10 flex items-center justify-center text-violet-600 text-xs font-bold shrink-0">
                {assignedName.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground text-sm truncate">{assignedName}</p>
                <p className="text-[10px] text-foreground/50 uppercase tracking-widest font-bold">Assigned</p>
              </div>
              <CheckCircle2 size={15} className="text-violet-600 shrink-0" />
            </div>
            <button
              onClick={() => setChanging(true)}
              className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-foreground/40 hover:text-foreground/70 transition-colors w-fit"
            >
              <Pencil size={10} /> Change coordinator
            </button>
          </>
        ) : (
          /* Unassigned or changing state */
          <>
            {changing && (
              <p className="text-[11px] text-amber-600 font-medium bg-amber-600/5 border border-amber-600/10 rounded-lg px-3 py-2">
                Reassigning will replace the current coordinator.
              </p>
            )}
            <div className="flex flex-col gap-2">
              <label className="text-[10px] uppercase tracking-widest font-bold text-foreground/50">
                {changing ? "Select New Coordinator" : "Select Coordinator"}
              </label>
              <Select value={selected} onValueChange={(val: any) => setSelected(val || "")}>
                <SelectTrigger className="h-10 bg-muted/20 border-foreground/10 text-foreground focus:ring-primary rounded-[8px] text-sm">
                  <SelectValue placeholder="Choose a coordinator..." />
                </SelectTrigger>
                <SelectContent className="bg-card border-foreground/10 rounded-[8px] p-1 shadow-lg">
                  {coordinators.map((c) => (
                    <SelectItem key={c.uid} value={c.uid}>
                      {c.fullName} ({c.email})
                    </SelectItem>
                  ))}
                  {coordinators.length === 0 && (
                    <div className="px-3 py-2 text-sm text-foreground/50 italic">
                      No approved coordinators available
                    </div>
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              {changing && (
                <Button
                  variant="outline"
                  onClick={() => { setChanging(false); setSelected(currentCoordinatorId || ""); }}
                  className="flex-1 h-9 border-foreground/10 text-foreground/60 hover:bg-muted text-xs uppercase tracking-widest font-bold shadow-none rounded-lg"
                >
                  Cancel
                </Button>
              )}
              <Button
                onClick={handleAssign}
                disabled={!selected || loading}
                className="flex-1 h-9 bg-primary hover:bg-primary/90 text-primary-foreground shadow-none rounded-lg font-bold text-xs uppercase tracking-widest transition-all"
              >
                {loading ? (
                  <><Loader2 className="size-3 animate-spin mr-1.5" /> Assigning...</>
                ) : (
                  changing ? "Confirm Reassign" : "Assign Coordinator"
                )}
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
