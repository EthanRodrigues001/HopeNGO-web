import { adminDb } from "@/lib/firebase/admin";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import EventCertificatesClient from "./client";

export const dynamic = "force-dynamic";

export default async function AdminEventCertificatesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const [eventSnap, regsSnap, volsSnap, certsSnap] = await Promise.all([
    adminDb.doc(`events/${id}`).get(),
    adminDb.collection('participantRegistrations').where('eventId', '==', id).get(),
    adminDb.collection('volunteerApplications').where('eventId', '==', id).where('status', '==', 'approved').get(),
    adminDb.collection('certificates').where('eventId', '==', id).get(),
  ]);

  if (!eventSnap.exists) {
    notFound();
  }

  const event = JSON.parse(JSON.stringify({ id, ...eventSnap.data() }));
  
  const participants = JSON.parse(JSON.stringify(regsSnap.docs
    .filter(doc => doc.data().status === 'attended')
    .map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        recipientId: data.participantId,
        recipientName: data.participantName,
        recipientEmail: data.participantEmail,
        role: 'participant' as const,
      };
    })
  ));

  const volunteers = JSON.parse(JSON.stringify(volsSnap.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      recipientId: data.volunteerId,
      recipientName: data.volunteerName,
      recipientEmail: '',
      role: 'volunteer' as const,
    };
  })));

  const issuedCerts = JSON.parse(JSON.stringify(certsSnap.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      recipientId: data.recipientId,
      recipientName: data.recipientName,
      recipientRole: data.recipientRole,
      certificateNumber: data.certificateNumber,
      issuedDate: data.issuedDate?.toDate?.()?.toISOString() || null,
    };
  })));

  return (
    <div className="min-h-screen bg-background">
      <div className="p-8 lg:p-16 text-foreground max-w-7xl mx-auto">
        <div className="flex flex-col mb-12">
          <Link href={`/admin/events/${id}`} className="inline-flex w-fit items-center text-foreground/50 hover:text-foreground text-xs uppercase tracking-widest font-bold mb-6 transition-colors">
            <ArrowLeft size={14} className="mr-2" /> Return to Intel
          </Link>
          <p className="text-[11px] uppercase tracking-[0.1em] font-bold text-foreground/50 mb-3">Certificate Issuance</p>
          <h1 className="text-5xl font-serif text-foreground tracking-tight">{event.title}</h1>
        </div>
        <EventCertificatesClient 
          eventId={id} 
          participants={participants} 
          volunteers={volunteers}
          issuedCerts={issuedCerts}
        />
      </div>
    </div>
  );
}
