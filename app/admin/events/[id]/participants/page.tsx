import { adminDb } from "@/lib/firebase/admin";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import EventParticipantsClient from "./client";

export const dynamic = "force-dynamic";

export default async function AdminEventParticipantsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const [eventSnap, regsSnap] = await Promise.all([
    adminDb.doc(`events/${id}`).get(),
    adminDb.collection('participantRegistrations').where('eventId', '==', id).get()
  ]);

  if (!eventSnap.exists) {
    notFound();
  }

  const event = JSON.parse(JSON.stringify({ id, ...eventSnap.data() }));
  
  // Format dates
  const participants = JSON.parse(JSON.stringify(regsSnap.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      registeredAt: data.registeredAt?.toDate?.()?.toISOString() || null,
    };
  })));

  return (
    <div className="min-h-screen bg-background">
      <div className="p-8 lg:p-16 text-foreground max-w-7xl mx-auto">
        <div className="flex flex-col mb-12">
          <Link href={`/admin/events/${id}`} className="inline-flex w-fit items-center text-foreground/50 hover:text-foreground text-xs uppercase tracking-widest font-bold mb-6 transition-colors">
            <ArrowLeft size={14} className="mr-2" /> Return to Intel
          </Link>
          <p className="text-[11px] uppercase tracking-[0.1em] font-bold text-foreground/50 mb-3">Civilian Roster</p>
          <h1 className="text-5xl font-serif text-foreground tracking-tight">{event.title}</h1>
        </div>
        <EventParticipantsClient eventId={id} initialParticipants={participants} />
      </div>
    </div>
  );
}
