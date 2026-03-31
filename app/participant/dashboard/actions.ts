"use server";

import { adminAuth, adminDb } from "@/lib/firebase/admin";
import { cookies } from "next/headers";

export async function getParticipantDashboardData() {
  const session = (await cookies()).get("session")?.value;
  if (!session) return { registrations: [], availableEvents: [], certificates: [] };
  
  try {
    const decoded = await adminAuth.verifySessionCookie(session, true);
    const uid = decoded.uid;

    const [regsSnap, certsSnap, eventsSnap] = await Promise.all([
      adminDb.collection("participantRegistrations")
        .where("participantId", "==", uid).get(),
      adminDb.collection("certificates")
        .where("recipientId", "==", uid)
        .where("isVisible", "==", true).get(),
      adminDb.collection("events")
        .where("participantRegistrationOpen", "==", true).get(),
    ]);
      
    const userRegs = regsSnap.docs.map(d => ({id: d.id, ...d.data()}));
    const registeredEventIds = userRegs.map((r:any) => r.eventId);

    const availableEvents = eventsSnap.docs
      .map(d => ({id: d.id, ...d.data()}))
      .filter((e:any) => !registeredEventIds.includes(e.id));

    const certificates = certsSnap.docs.map(d => {
      const data = d.data();
      return {
        id: d.id,
        ...data,
        issuedDate: data.issuedDate?.toDate?.()?.toISOString() || null,
        eventDate: data.eventDate?.toDate?.()?.toISOString() || null,
      };
    });

    // parse JSON to destroy server Timestamp object references
    return JSON.parse(JSON.stringify({ registrations: userRegs, availableEvents, certificates }));
  } catch(e) {
    return JSON.parse(JSON.stringify({ registrations: [], availableEvents: [], certificates: [] }));
  }
}
