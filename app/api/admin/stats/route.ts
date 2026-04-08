import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { adminAuth, adminDb } from "@/lib/firebase/admin";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const session = cookieStore.get("session")?.value;
    if (!session) {
      return NextResponse.json({ events: 0, upcoming: 0, volunteers: 0, participants: 0 });
    }

    const decoded = await adminAuth.verifySessionCookie(session, true);
    const userSnap = await adminDb.doc(`users/${decoded.uid}`).get();
    if (userSnap.data()?.role !== "admin") {
      return NextResponse.json({ events: 0, upcoming: 0, volunteers: 0, participants: 0 });
    }

    const [eventsSnap, volunteersSnap, coordsSnap, donationsSnap] = await Promise.all([
      adminDb.collection("events").get(),
      adminDb.collection("users").where("role", "==", "volunteer").get(),
      adminDb.collection("users").where("role", "==", "event_coordinator").get(),
      adminDb.collection("donations").get(),
    ]);

    const events = eventsSnap.docs.map(d => d.data());
    const upcoming = events.filter(e => e.status === "upcoming").length;
    const totalDonations = donationsSnap.docs.reduce((acc, doc) => acc + (doc.data().amount || 0), 0);

    return NextResponse.json({
      events: events.length,
      upcoming,
      volunteers: volunteersSnap.size,
      coordinators: coordsSnap.size,
      totalDonations,
    });
  } catch {
    return NextResponse.json({ events: 0, upcoming: 0, volunteers: 0, coordinators: 0, totalDonations: 0 });
  }
}
