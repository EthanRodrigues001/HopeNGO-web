import { adminDb } from "@/lib/firebase/admin";
import { notFound } from "next/navigation";
import EditEventClient from "./client";

export const dynamic = "force-dynamic";

export default async function AdminEventEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const eventSnap = await adminDb.doc(`events/${id}`).get();
  
  if (!eventSnap.exists) {
    notFound();
  }

  const data = eventSnap.data()!;
  
  // Format dates for hydration
  let evDate = "";
  if (data.eventDate && data.eventDate.toDate) {
    evDate = data.eventDate.toDate().toISOString().split('T')[0];
  } else if (data.eventDate && data.eventDate._seconds) {
    evDate = new Date(data.eventDate._seconds * 1000).toISOString().split('T')[0];
  } else if (typeof data.eventDate === 'string') {
    evDate = data.eventDate.split('T')[0];
  }

  const event = JSON.parse(JSON.stringify({
    id,
    ...data,
    eventDate: evDate,
  }));

  return <EditEventClient event={event} />;
}
