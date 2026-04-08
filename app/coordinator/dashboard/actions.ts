"use server";

import { adminDb, adminAuth } from "@/lib/firebase/admin";
import { cookies } from "next/headers";

export async function getCoordinatorDashboardData() {
  const session = (await cookies()).get("session")?.value;
  if (!session) throw new Error("Unauthorized");

  const decoded = await adminAuth.verifySessionCookie(session, true);
  const uid = decoded.uid;

  // Verify Role
  const userSnap = await adminDb.doc(`users/${uid}`).get();
  if (userSnap.data()?.role !== "event_coordinator") {
    throw new Error("Forbidden");
  }

  // Get Events Assigned to this Coordinator
  const assignedEventsSnap = await adminDb.collection("events")
    .where("coordinatorId", "==", uid)
    .get();
    
  const assignedEvents = assignedEventsSnap.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    eventDate: doc.data().eventDate?.toDate?.()?.toISOString() || null,
  }));

  return { assignedEvents };
}
