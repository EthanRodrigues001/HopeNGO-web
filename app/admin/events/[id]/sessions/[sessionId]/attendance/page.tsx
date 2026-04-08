import { adminDb } from "@/lib/firebase/admin";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Clock } from "lucide-react";
import SessionAttendanceClient from "./SessionAttendanceClient";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

export default async function SessionAttendancePage({ params }: { params: Promise<{ id: string, sessionId: string }> }) {
  const { id, sessionId } = await params;

  const [eventSnap, sessionSnap, volsSnap] = await Promise.all([
    adminDb.doc(`events/${id}`).get(),
    adminDb.doc(`eventSessions/${sessionId}`).get(),
    adminDb.collection("volunteerApplications").where("eventId", "==", id).where("status", "==", "approved").get(),
  ]);

  if (!eventSnap.exists || !sessionSnap.exists) {
    notFound();
  }

  const event = eventSnap.data()!;
  const sessionData = sessionSnap.data()!;

  const registrations = volsSnap.docs.map(doc => ({
    id: doc.id,
    recordType: "volunteer",
    fullName: doc.data().volunteerName,
    email: doc.data().volunteerEmail,
    phone: doc.data().volunteerPhone,
    sessionsAttended: doc.data().sessionsAttended || 0,
    sessionAttendance: doc.data().sessionAttendance || {},
    ...doc.data()
  }));

  return (
    <div className="min-h-screen bg-background font-sans p-8 lg:p-16 text-foreground">
      <div className="max-w-4xl mx-auto">
        <div className="mb-12">
          <Link href={`/admin/events/${id}/sessions`} className="inline-flex items-center text-xs uppercase tracking-[0.1em] font-bold text-foreground/50 hover:text-primary transition-colors mb-6">
            <ArrowLeft size={16} className="mr-2" /> Back to Sessions Pipeline
          </Link>
          <div className="flex items-center gap-4 mb-3">
             <p className="text-[11px] uppercase tracking-[0.1em] font-bold text-primary">Session {sessionData.sessionNumber} Attendance</p>
             {sessionData.attendanceClosed && (
                <Badge variant="secondary" className="uppercase tracking-widest text-[9px] font-bold">Closed Session</Badge>
             )}
          </div>
          <h1 className="text-4xl font-serif text-foreground tracking-tight mb-2">
            {event.title}
          </h1>
          <p className="text-foreground/60 text-sm font-light flex items-center gap-2">
            <Clock size={14} className="opacity-70"/>
            Scheduled for: {sessionData.sessionDate?.toDate?.() ? sessionData.sessionDate.toDate().toLocaleDateString() : "Unknown"}
          </p>
        </div>

        {registrations.length === 0 ? (
          <div className="text-center p-16 rounded-[20px] bg-muted/30">
            <h3 className="font-serif text-2xl mb-2 text-foreground">No Approved Operatives</h3>
            <p className="text-foreground/60 font-light text-sm">No operatives have been approved for this event yet.</p>
          </div>
        ) : (
          <SessionAttendanceClient 
            eventId={id} 
            sessionId={sessionId} 
            registrations={JSON.parse(JSON.stringify(registrations))} 
            isClosed={!!sessionData.attendanceClosed}
          />
        )}
      </div>
    </div>
  );
}
