"use server";

import { adminDb, adminAuth } from "@/lib/firebase/admin";
import { cookies } from "next/headers";

function toIso(val: any): string | null {
  if (!val) return null;
  if (typeof val.toDate === "function") return val.toDate().toISOString();
  if (val._seconds) return new Date(val._seconds * 1000).toISOString();
  if (typeof val === "string") return val;
  return null;
}

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
  const assignedEventsSnap = await adminDb
    .collection("events")
    .where("coordinatorId", "==", uid)
    .get();

  const eventIds = assignedEventsSnap.docs.map((d) => d.id);

  // Fetch this coordinator's reports for their events
  const reportsByEvent: Record<string, { imageUrls: string[]; notes: string }> = {};
  if (eventIds.length > 0) {
    const reportsSnap = await adminDb
      .collection("coordinatorReports")
      .where("coordinatorId", "==", uid)
      .get();
    reportsSnap.docs.forEach((doc) => {
      const d = doc.data();
      reportsByEvent[d.eventId] = {
        imageUrls: d.imageUrls || [],
        notes: d.notes || "",
      };
    });
  }

  const assignedEvents = assignedEventsSnap.docs.map((doc) => {
    const data = doc.data();
    const report = reportsByEvent[doc.id];
    return {
      id: doc.id,
      title: data.title ?? null,
      description: data.description ?? null,
      eventType: data.eventType ?? null,
      eventDate: toIso(data.eventDate),
      startTime: data.startTime ?? null,
      endTime: data.endTime ?? null,
      venue: data.venue ?? null,
      city: data.city ?? null,
      state: data.state ?? null,
      bannerImageUrl: data.bannerImageUrl ?? null,
      status: data.status ?? null,
      isPublic: data.isPublic ?? false,
      isRecurring: data.isRecurring ?? false,
      participantCount: data.participantCount ?? 0,
      volunteerCount: data.volunteerCount ?? 0,
      coordinatorId: data.coordinatorId ?? null,
      coordinatorName: data.coordinatorName ?? null,
      createdAt: toIso(data.createdAt),
      // Existing report data (if any)
      reportImageUrls: report?.imageUrls ?? [],
      reportNotes: report?.notes ?? "",
    };
  });

  return JSON.parse(JSON.stringify({ assignedEvents }));
}
