import { adminAuth, adminDb } from '@/lib/firebase/admin';
import { cookies } from 'next/headers';
import { FieldValue } from 'firebase-admin/firestore';

export async function POST(req: Request) {
  try {
    const session = (await cookies()).get('session')?.value;
    if (!session) return new Response('Unauthorized', { status: 401 });
    
    const decoded = await adminAuth.verifySessionCookie(session, true);
    const participantId = decoded.uid;
    
    const userDoc = await adminDb.doc(`users/${participantId}`).get();
    const userData = userDoc.data();
    if (!userData || userData.role !== 'participant') {
      return new Response('Forbidden: Only participants can register', { status: 403 });
    }
    
    const participantName = userData.fullName || "Unknown";
    const participantEmail = userData.email || "";

    const { eventId } = await req.json();

    // Check duplicate outside transaction to avoid Firestore sdk errors
    const existingQuery = await adminDb.collection('participantRegistrations')
      .where('eventId', '==', eventId)
      .where('participantId', '==', participantId)
      .where('status', '!=', 'cancelled')
      .limit(1)
      .get();

    if (!existingQuery.empty) throw new Error('ALREADY_REGISTERED');

    await adminDb.runTransaction(async (tx) => {
      const eventRef = adminDb.doc(`events/${eventId}`);
      const eventSnap = await tx.get(eventRef);
      const event = eventSnap.data()!;

      if (!event.participantRegistrationOpen) throw new Error('REGISTRATION_CLOSED');
      if (event.maxParticipants && event.participantCount >= event.maxParticipants) {
        throw new Error('EVENT_FULL');
      }

      const regRef = adminDb.collection('participantRegistrations').doc();
      tx.set(regRef, {
        eventId,
        participantId,
        participantName,
        participantEmail,
        registrationDate: FieldValue.serverTimestamp(),
        status: 'registered',
        attendanceMarkedAt: null,
        attendanceMarkedBy: null,
        notes: '',
      });

      const newCount = (event.participantCount || 0) + 1;
      const autoClose = event.maxParticipants ? newCount >= event.maxParticipants : false;
      
      tx.update(eventRef, {
        participantCount: FieldValue.increment(1),
        ...(autoClose && { participantRegistrationOpen: false }),
        updatedAt: FieldValue.serverTimestamp(),
      });
    });

    return Response.json({ status: 'registered' });
  } catch (err: any) {
    console.error("Registration error", err);
    const msg = err.message;
    if (msg === 'REGISTRATION_CLOSED') return Response.json({ error: 'Registration is closed' }, { status: 400 });
    if (msg === 'EVENT_FULL')          return Response.json({ error: 'Event is full' }, { status: 400 });
    if (msg === 'ALREADY_REGISTERED') return Response.json({ error: 'Already registered' }, { status: 400 });
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
