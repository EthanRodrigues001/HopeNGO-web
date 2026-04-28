import { adminAuth, adminDb } from "@/lib/firebase/admin";
import { cookies } from "next/headers";
import { FieldValue } from "firebase-admin/firestore";
import { NextResponse } from "next/server";

// POST /api/events/[id]/coordinator-report
// Coordinator submits image URLs + notes for an event report
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: eventId } = await params;
    const session = (await cookies()).get("session")?.value;
    if (!session) return new NextResponse("Unauthorized", { status: 401 });

    const decoded = await adminAuth.verifySessionCookie(session, true);
    const userSnap = await adminDb.doc(`users/${decoded.uid}`).get();
    const user = userSnap.data();

    // Only admin or the assigned coordinator for this event
    if (user?.role !== "admin" && user?.role !== "event_coordinator") {
      return new NextResponse("Forbidden", { status: 403 });
    }

    // If coordinator — verify they are assigned to this specific event
    if (user?.role === "event_coordinator") {
      const eventSnap = await adminDb.doc(`events/${eventId}`).get();
      if (!eventSnap.exists) return new NextResponse("Not found", { status: 404 });
      if (eventSnap.data()?.coordinatorId !== decoded.uid) {
        return new NextResponse("Forbidden: Not assigned to this event", { status: 403 });
      }
    }

    const body = await req.json();
    const { imageUrls, notes } = body as { imageUrls: string[]; notes?: string };

    if (!imageUrls || !Array.isArray(imageUrls) || imageUrls.length === 0) {
      return new NextResponse("imageUrls array is required", { status: 400 });
    }

    // Upsert: one report per coordinator per event
    const existing = await adminDb
      .collection("coordinatorReports")
      .where("eventId", "==", eventId)
      .where("coordinatorId", "==", decoded.uid)
      .limit(1)
      .get();

    if (!existing.empty) {
      await existing.docs[0].ref.update({
        imageUrls,
        notes: notes || "",
        updatedAt: FieldValue.serverTimestamp(),
      });
    } else {
      await adminDb.collection("coordinatorReports").add({
        eventId,
        coordinatorId: decoded.uid,
        coordinatorName: user?.fullName || "",
        imageUrls,
        notes: notes || "",
        submittedAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("coordinator-report POST error:", err);
    return new NextResponse(err.message || "Internal Server Error", { status: 500 });
  }
}

// GET /api/events/[id]/coordinator-report
// Fetch coordinator reports for an event (admin use)
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: eventId } = await params;
    const session = (await cookies()).get("session")?.value;
    if (!session) return new NextResponse("Unauthorized", { status: 401 });

    const decoded = await adminAuth.verifySessionCookie(session, true);
    const userSnap = await adminDb.doc(`users/${decoded.uid}`).get();
    const role = userSnap.data()?.role;

    if (role !== "admin" && role !== "event_coordinator") {
      return new NextResponse("Forbidden", { status: 403 });
    }

    const snap = await adminDb
      .collection("coordinatorReports")
      .where("eventId", "==", eventId)
      .get();

    const reports = snap.docs.map((doc) => {
      const d = doc.data();
      return {
        id: doc.id,
        eventId: d.eventId,
        coordinatorId: d.coordinatorId,
        coordinatorName: d.coordinatorName,
        imageUrls: d.imageUrls || [],
        notes: d.notes || "",
        submittedAt: d.submittedAt?.toDate?.()?.toISOString() || null,
        updatedAt: d.updatedAt?.toDate?.()?.toISOString() || null,
      };
    });

    return NextResponse.json(reports);
  } catch (err: any) {
    return new NextResponse(err.message, { status: 500 });
  }
}
