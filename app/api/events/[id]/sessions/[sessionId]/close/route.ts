import { adminAuth, adminDb } from "@/lib/firebase/admin";
import { cookies } from "next/headers";
import { FieldValue } from "firebase-admin/firestore";
import { checkAndAutoIssueCertificates } from "@/lib/utils/auto-issue-certs";

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

    const sessionRef = adminDb.doc(`eventSessions/${sessionId}`);
    await sessionRef.update({
      attendanceClosed: true,
      updatedAt: FieldValue.serverTimestamp(),
    });

    // Auto-issue certificates if this is the final session 
    // and all sessions are now closed.
    await checkAndAutoIssueCertificates(eventId);

    return Response.json({ status: 'ok' });
  } catch (error: any) {
    console.error('Error closing session:', error);
    return new Response(error.message || 'Internal Server Error', { status: 500 });
  }
}
