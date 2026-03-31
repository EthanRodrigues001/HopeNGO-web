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

    const [eventsSnap, volunteersSnap, participantsSnap] = await Promise.all([
      adminDb.collection("events").get(),
      adminDb.collection("users").where("role", "==", "volunteer").get(),
      adminDb.collection("users").where("role", "==", "participant").get(),
    ]);

    const events = eventsSnap.docs.map(d => d.data());
    const upcoming = events.filter(e => e.status === "upcoming").length;

    return NextResponse.json({
      events: events.length,
      upcoming,
      volunteers: volunteersSnap.size,
      participants: participantsSnap.size,
    });
  } catch {
    return NextResponse.json({ events: 0, upcoming: 0, volunteers: 0, participants: 0 });
  }
}
