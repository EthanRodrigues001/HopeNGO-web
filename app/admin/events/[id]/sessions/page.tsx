import { adminDb } from "@/lib/firebase/admin";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { ArrowLeft, CalendarDays, CheckCircle2, Circle } from "lucide-react";
import CloseSessionButton from "./CloseSessionButton";

export const dynamic = "force-dynamic";

function formatFirestoreDate(dateVal: any): string | null {
  if (!dateVal) return null;
  if (dateVal._seconds) return new Date(dateVal._seconds * 1000).toISOString();
  if (dateVal.seconds) return new Date(dateVal.seconds * 1000).toISOString();
  if (typeof dateVal === 'string') return dateVal;
  if (dateVal.toDate) return dateVal.toDate().toISOString();
  return null;
}

export default async function EventSessionsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const eventSnap = await adminDb.doc(`events/${id}`).get();
  if (!eventSnap.exists) {
    notFound();
  }
  const event = eventSnap.data()!;

  if (!event.isRecurring) {
    return (
      <div className="p-16 text-center">
        <h2 className="text-2xl font-serif mb-4">Not a Recurring Event</h2>
        <Link href={`/admin/events/${id}`}>
          <Button variant="outline">Return to Event</Button>
        </Link>
      </div>
    );
  }

  const sessionsSnap = await adminDb
    .collection("eventSessions")
    .where("eventId", "==", id)
    .orderBy("sessionNumber", "asc")
    .get();

  const sessions = sessionsSnap.docs.map(doc => {
    const raw = doc.data();
    return {
      id: doc.id,
      ...raw,
      sessionDate: formatFirestoreDate(raw.sessionDate),
    };
  });

  return (
    <div className="min-h-screen bg-background font-sans p-8 lg:p-16 text-foreground">
      <div className="max-w-4xl mx-auto">
        <div className="mb-12">
          <Link href={`/admin/events/${id}`} className="inline-flex items-center text-xs uppercase tracking-[0.1em] font-bold text-foreground/50 hover:text-primary transition-colors mb-6">
            <ArrowLeft size={16} className="mr-2" /> Back to Event Overview
          </Link>
          <p className="text-[11px] uppercase tracking-[0.1em] font-bold text-primary mb-3">Recurring Operations</p>
          <h1 className="text-4xl md:text-5xl font-serif leading-[1.1] font-medium tracking-tight text-foreground mb-4">
            Sessions Pipeline
          </h1>
          <p className="text-foreground/60 text-lg font-light leading-relaxed">
            Manage individual sessions for <strong className="font-semibold text-foreground">{event.title}</strong>.
            Close sessions to trigger progressive attendance and eventual certificate issuance.
          </p>
        </div>

        <div className="grid gap-6">
          {sessions.map((session: any) => (
            <Card key={session.id} className="bg-card shadow-[0_16px_32px_-12px_rgba(25,28,26,0.03)] border-0 ring-1 ring-foreground/[0.04] rounded-[24px] overflow-hidden">
              <CardHeader className="p-8 pb-4 flex flex-row items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="size-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-serif text-xl border border-primary/20">
                    {session.sessionNumber}
                  </div>
                  <div>
                    <CardTitle className="text-xl font-serif tracking-tight text-foreground">
                      Session {session.sessionNumber}
                    </CardTitle>
                    <p className="text-sm font-light text-foreground/60 mt-1 flex items-center gap-2">
                      <CalendarDays size={14} className="opacity-70" />
                      {session.sessionDate ? new Date(session.sessionDate).toLocaleDateString("en-US", { weekday: 'short', month: 'long', day: 'numeric', year: 'numeric' }) : "TBD"}
                    </p>
                  </div>
                </div>
                <Badge variant={session.attendanceClosed ? "secondary" : "outline"} className={`uppercase tracking-widest text-[9px] font-bold px-3 py-1 shadow-none ${session.attendanceClosed ? "bg-muted text-foreground/50" : "text-emerald-600 bg-emerald-600/5 border-emerald-600/20"}`}>
                  {session.attendanceClosed ? "Closed" : "Active"}
                </Badge>
              </CardHeader>
              <CardFooter className="p-8 pt-4 bg-muted/10 border-t border-foreground/[0.03] flex justify-between items-center">
                <div className="flex items-center gap-2 text-sm text-foreground/60 font-light">
                  {session.attendanceClosed ? (
                    <><CheckCircle2 size={16} className="text-muted-foreground" /> Attendance Finalized</>
                  ) : (
                    <><Circle size={16} className="text-emerald-600/50" /> Waiting for Attendance</>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <Link href={`/admin/events/${id}/sessions/${session.id}/attendance`}>
                    <Button variant={session.attendanceClosed ? "ghost" : "outline"} className="h-10 text-xs uppercase tracking-widest font-bold shadow-none rounded-[8px]">
                      {session.attendanceClosed ? "View Attendance" : "Mark Attendance"}
                    </Button>
                  </Link>
                  {!session.attendanceClosed && (
                    <CloseSessionButton eventId={id} sessionId={session.id} sessionNumber={session.sessionNumber} />
                  )}
                </div>
              </CardFooter>
            </Card>
          ))}
          {sessions.length === 0 && (
             <div className="text-center p-12 bg-muted/30 rounded-[24px]">
               <p className="text-foreground/50 font-light">No sessions found for this event.</p>
             </div>
          )}
        </div>
      </div>
    </div>
  );
}
