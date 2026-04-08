"use server";

import { adminAuth, adminDb } from "@/lib/firebase/admin";
import { cookies } from "next/headers";

export async function getVolunteerDashboardData() {
  const session = (await cookies()).get("session")?.value;
  if (!session) return { applications: [], availableEvents: [] };
  
  try {
    const decoded = await adminAuth.verifySessionCookie(session, true);
    const uid = decoded.uid;

    const appSnap = await adminDb.collection("volunteerApplications")
      .where("volunteerId", "==", uid).get();
      
    const userApps = appSnap.docs.map(d => ({id: d.id, ...d.data()}));
    const appliedEventIds = userApps.map((a:any) => a.eventId);

    const eventsSnap = await adminDb.collection("events")
      .where("volunteerRegistrationOpen", "==", true).get();
    
    const availableEvents = eventsSnap.docs
      .map(d => {
        const data = d.data();
        const rawDate = data.eventDate;
        return {
          id: d.id,
          ...data,
          eventDate: rawDate?.toDate?.() ? rawDate.toDate().toISOString()
            : rawDate?._seconds ? new Date(rawDate._seconds * 1000).toISOString()
            : typeof rawDate === 'string' ? rawDate : null,
        };
      })
      .filter((e:any) => !appliedEventIds.includes(e.id));

    const certsSnap = await adminDb.collection("certificates")
      .where("recipientId", "==", uid).get();
      
    const certificates = certsSnap.docs.map(d => ({id: d.id, ...d.data()}));

    // parse JSON to destroy server Timestamp object references
    return JSON.parse(JSON.stringify({ applications: userApps, availableEvents, certificates }));
  } catch(e) {
    return JSON.parse(JSON.stringify({ applications: [], availableEvents: [], certificates: [] }));
  }
}
