import { adminDb } from "@/lib/firebase/admin";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ClipboardCheck } from "lucide-react";
import EventAttendanceClient from "./client";

export const dynamic = "force-dynamic";

export default async function EventAttendancePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const eventSnap = await adminDb.doc(`events/${id}`).get();
  if (!eventSnap.exists) {
    notFound();
  }
  const event = eventSnap.data()!;

  // Fetch approved volunteers
  const volsSnap = await adminDb
    .collection("volunteerApplications")
    .where("eventId", "==", id)
    .where("status", "==", "approved")
    .get();

  const volunteers = JSON.parse(JSON.stringify(volsSnap.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }))));

  return (
    <div className="min-h-screen bg-background font-sans p-8 lg:p-16 text-foreground">
      <div className="max-w-7xl mx-auto">
        <div className="mb-12">
          <Link href={`/admin/events/${id}`} className="inline-flex items-center text-xs uppercase tracking-[0.1em] font-bold text-foreground/50 hover:text-primary transition-colors mb-6">
            <ArrowLeft size={16} className="mr-2" /> Back to Event
          </Link>
          <div className="flex items-center gap-4 mb-3">
             <p className="text-[11px] uppercase tracking-[0.1em] font-bold text-primary">Operative Attendance</p>
          </div>
          <h1 className="text-4xl font-serif text-foreground tracking-tight mb-2">
            {event.title}
          </h1>
          <p className="text-foreground/60 text-sm font-light">
            Mark attendance for all approved operatives. Once finalised, this logs their participation.
          </p>
        </div>

        <EventAttendanceClient eventId={id} event={JSON.parse(JSON.stringify(event))} initialVolunteers={volunteers} />
      </div>
    </div>
  );
}
