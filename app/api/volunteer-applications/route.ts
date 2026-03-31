import { adminAuth, adminDb } from '@/lib/firebase/admin';
import { cookies } from 'next/headers';
import { FieldValue } from 'firebase-admin/firestore';

export async function POST(req: Request) {
  try {
    const session = (await cookies()).get('session')?.value;
    if (!session) return new Response('Unauthorized', { status: 401 });
    
    const decoded = await adminAuth.verifySessionCookie(session, true);
    const volunteerId = decoded.uid;
    
    const userDoc = await adminDb.doc(`users/${volunteerId}`).get();
    const userData = userDoc.data();
    if (!userData || userData.role !== 'volunteer') {
      return new Response('Forbidden: Only volunteers can apply', { status: 403 });
    }
    
    const volunteerName = userData.fullName || "Unknown";
    const { eventId } = await req.json();

    await adminDb.runTransaction(async (tx) => {
      const eventRef = adminDb.doc(`events/${eventId}`);
      const eventSnap = await tx.get(eventRef);
      const event = eventSnap.data()!;

      if (!event.volunteerRegistrationOpen) throw new Error('REGISTRATION_CLOSED');
      if (event.maxVolunteers && event.volunteerCount >= event.maxVolunteers) {
        throw new Error('EVENT_FULL');
      }

      // Check duplicate
      const existingQuery = await adminDb.collection('volunteerApplications')
        .where('eventId', '==', eventId)
        .where('volunteerId', '==', volunteerId)
        .where('status', '!=', 'cancelled')
        .limit(1)
        .get();

      if (!existingQuery.empty) throw new Error('ALREADY_APPLIED');

      const appRef = adminDb.collection('volunteerApplications').doc();
      tx.set(appRef, {
        eventId,
        volunteerId,
        volunteerName,
        appliedAt: FieldValue.serverTimestamp(),
        status: 'pending',
        reviewedAt: null,
        reviewedBy: null,
        adminNotes: '',
      });
      
      // Update event volunteering counts
      const newCount = event.volunteerCount + 1;
      const autoClose = event.maxVolunteers ? newCount >= event.maxVolunteers : false;
      
      tx.update(eventRef, {
        volunteerCount: FieldValue.increment(1),
        ...(autoClose && { volunteerRegistrationOpen: false }),
        updatedAt: FieldValue.serverTimestamp(),
      });
    });

    return Response.json({ status: 'pending' });
  } catch (err: any) {
    console.error("Volunteer application error", err);
    const msg = err.message;
    if (msg === 'REGISTRATION_CLOSED') return Response.json({ error: 'Volunteer registration is closed' }, { status: 400 });
    if (msg === 'EVENT_FULL')          return Response.json({ error: 'Volunteer slots are full' }, { status: 400 });
    if (msg === 'ALREADY_APPLIED')     return Response.json({ error: 'Already applied' }, { status: 400 });
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
