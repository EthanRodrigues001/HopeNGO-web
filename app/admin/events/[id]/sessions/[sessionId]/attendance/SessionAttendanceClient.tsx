"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

export default function SessionAttendanceClient({ 
  eventId, 
  sessionId, 
  registrations,
  isClosed
}: { 
  eventId: string, 
  sessionId: string, 
  registrations: any[],
  isClosed: boolean
}) {
  const [regs, setRegs] = useState(registrations);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const markAttendance = async (regId: string, status: "attended" | "absent", recordType: string) => {
    if (isClosed) return;
    
    setLoadingId(regId);
    try {
      const res = await fetch(`/api/events/${eventId}/sessions/${sessionId}/attendance`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ registrationId: regId, status, recordType }),
      });

      if (!res.ok) throw new Error(await res.text() || "Failed");

      setRegs(prev => prev.map(r => 
        r.id === regId ? { 
          ...r, 
          sessionAttendance: {
            ...(r.sessionAttendance || {}),
            [sessionId]: status
          }
        } : r
      ));
    } catch (e: any) {
      alert(e.message);
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      {regs.map((reg) => {
        const currentStatus = reg.sessionAttendance?.[sessionId];
        return (
           <div key={reg.id} className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-card ring-1 ring-foreground/[0.04] rounded-[16px] shadow-sm">
             <div>
               <div className="flex items-center gap-2 mb-1">
                 <span className="font-medium text-foreground relative">
                   {reg.fullName}
                 </span>
                 <Badge variant="outline" className={`text-[9px] uppercase tracking-widest shadow-none pointer-events-none ${reg.recordType === 'volunteer' ? 'bg-primary/5 text-primary border-primary/20' : ''}`}>
                   {reg.recordType}
                 </Badge>
                 <Badge variant="outline" className="text-[9px] uppercase tracking-widest shadow-none pointer-events-none">
                   Sessions: {reg.sessionsAttended || 0}
                 </Badge>
               </div>
               <p className="text-xs text-foreground/50">{reg.email} • {reg.phone}</p>
             </div>
             
             <div className="mt-4 md:mt-0 flex items-center gap-2">
               {isClosed ? (
                  <Badge variant={currentStatus === "attended" ? "default" : currentStatus === "absent" ? "destructive" : "secondary"}>
                    {currentStatus ? currentStatus.toUpperCase() : "NO RECORD"}
                  </Badge>
               ) : (
                 <>
                   <Button
                     onClick={() => markAttendance(reg.id, "attended", reg.recordType)}
                     disabled={loadingId === reg.id}
                     variant={currentStatus === "attended" ? "default" : "outline"}
                     className={`h-9 text-[10px] uppercase tracking-widest font-bold shadow-none rounded-[8px] ${currentStatus === "attended" ? "bg-emerald-600 hover:bg-emerald-700" : ""}`}
                   >
                     {loadingId === reg.id ? <Loader2 className="w-3 h-3 animate-spin"/> : "Attended"}
                   </Button>
                   <Button
                     onClick={() => markAttendance(reg.id, "absent", reg.recordType)}
                     disabled={loadingId === reg.id}
                     variant={currentStatus === "absent" ? "destructive" : "outline"}
                     className={`h-9 text-[10px] uppercase tracking-widest font-bold shadow-none rounded-[8px] ${currentStatus === "absent" ? "" : "border-foreground/10"}`}
                   >
                     {loadingId === reg.id ? <Loader2 className="w-3 h-3 animate-spin"/> : "Absent"}
                   </Button>
                 </>
               )}
             </div>
           </div>
        );
      })}
    </div>
  );
}
