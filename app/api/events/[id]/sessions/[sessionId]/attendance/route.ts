import { adminAuth, adminDb } from "@/lib/firebase/admin";
import { cookies } from "next/headers";
import { FieldValue } from "firebase-admin/firestore";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string, sessionId: string }> }) {
  try {
    const session = (await cookies()).get('session')?.value;
    if (!session) return new Response('Unauthorized', { status: 401 });
    
    const decoded = await adminAuth.verifySessionCookie(session, true);
    const userDoc = await adminDb.doc(`users/${decoded.uid}`).get();
    
    const { id: eventId, sessionId } = await params;
    const eventSnap = await adminDb.doc(`events/${eventId}`).get();
    
    // Verify admin OR assigned coordinator
    const isCoordinator = eventSnap.data()?.coordinatorId === decoded.uid;
    const isAdmin = userDoc.data()?.role === 'admin';
    
    if (!isAdmin && !isCoordinator) {
      return new Response('Forbidden', { status: 403 });
    }

    const { registrationId, status, recordType } = await req.json();

    if (!registrationId || !['attended', 'absent'].includes(status)) {
      return new Response('Invalid request payload', { status: 400 });
    }

    const collectionName = 'volunteerApplications';
    const regRef = adminDb.doc(`${collectionName}/${registrationId}`);
    
    // Check if the session is closed
    const sessionDoc = await adminDb.doc(`eventSessions/${sessionId}`).get();
    if (sessionDoc.data()?.attendanceClosed) {
      return new Response('Session attendance is closed', { status: 400 });
    }

    // Need to handle incrementing or decrementing `sessionsAttended`
    // First safely get the current registration doc
    const regDoc = await regRef.get();
    if (!regDoc.exists) {
      return new Response('Registration not found', { status: 404 });
    }
    const regData = regDoc.data()!;
    const previousStatus = regData.sessionAttendance?.[sessionId];

    let updateData: any = {
      [`sessionAttendance.${sessionId}`]: status,
      attendanceMarkedAt: FieldValue.serverTimestamp(),
      attendanceMarkedBy: decoded.uid,
    };

    // calculate increment
    if (status === 'attended' && previousStatus !== 'attended') {
      updateData.sessionsAttended = FieldValue.increment(1);
    } else if (status === 'absent' && previousStatus === 'attended') {
      // downgrade from attended to absent
      updateData.sessionsAttended = FieldValue.increment(-1);
    }

    await regRef.update(updateData);

    return Response.json({ status: 'ok' });
  } catch (error: any) {
    console.error('Error marking session attendance:', error);
    return new Response(error.message || 'Internal Server Error', { status: 500 });
  }
}
