import { adminAuth, adminDb } from '@/lib/firebase/admin';
import { cookies } from 'next/headers';
import { FieldValue } from 'firebase-admin/firestore';

export async function PATCH(req: Request, context: any) {
  try {
    const session = (await cookies()).get('session')?.value;
    if (!session) return new Response('Unauthorized', { status: 401 });
    
    const decoded = await adminAuth.verifySessionCookie(session, true);
    const userDoc = await adminDb.doc(`users/${decoded.uid}`).get();
    
    if (userDoc.data()?.role !== 'admin') {
      return new Response('Forbidden', { status: 403 });
    }

    const { id: eventId } = await context.params;
    const { coordinatorId } = await req.json();

    if (!coordinatorId) {
      return new Response('Missing coordinatorId', { status: 400 });
    }

    // Fetch the coordinator to get their name
    const coordinatorSnap = await adminDb.doc(`users/${coordinatorId}`).get();
    const coordinator = coordinatorSnap.data();

    if (!coordinator || coordinator.role !== 'event_coordinator' || !coordinator.isApproved) {
      return Response.json({ error: 'Invalid or unapproved coordinator' }, { status: 400 });
    }

    await adminDb.doc(`events/${eventId}`).update({
      coordinatorId,
      coordinatorName: coordinator.fullName,
      updatedAt: FieldValue.serverTimestamp(),
    });

    return Response.json({ success: true, coordinatorName: coordinator.fullName });
  } catch (err: any) {
    console.error("Assign coordinator error:", err);
    return new Response('Internal Server Error', { status: 500 });
  }
}
