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
      .map(d => ({id: d.id, ...d.data()}))
      .filter((e:any) => !appliedEventIds.includes(e.id));

    // parse JSON to destroy server Timestamp object references
    return JSON.parse(JSON.stringify({ applications: userApps, availableEvents }));
  } catch(e) {
    return JSON.parse(JSON.stringify({ applications: [], availableEvents: [] }));
  }
}
