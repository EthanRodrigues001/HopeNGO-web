import { adminAuth, adminDb } from '@/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';

const corsHeaders = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

async function verifyBearerToken(req: Request) {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) throw new Error('Unauthorized');
  const idToken = authHeader.split('Bearer ')[1];
  return adminAuth.verifyIdToken(idToken);
}

/** POST /api/mobile/register — Participant registers for an event */
export async function POST(req: Request) {
  try {
    const decodedToken = await verifyBearerToken(req);
    const uid = decodedToken.uid;

    const userDoc = await adminDb.doc(`users/${uid}`).get();
    const userData = userDoc.data();
    if (!userData || userData.role !== 'participant') {
      return new Response(JSON.stringify({ error: 'Only participants can register' }), { status: 403, headers: corsHeaders });
    }

    const participantName = userData.fullName || 'Unknown';
    const participantEmail = userData.email || '';
    const { eventId } = await req.json();

    if (!eventId) return new Response(JSON.stringify({ error: 'eventId required' }), { status: 400, headers: corsHeaders });

    // Check duplicate
    const existing = await adminDb.collection('participantRegistrations')
      .where('eventId', '==', eventId)
      .where('participantId', '==', uid)
      .where('status', '!=', 'cancelled')
      .limit(1)
      .get();
    if (!existing.empty) {
      return new Response(JSON.stringify({ error: 'Already registered' }), { status: 400, headers: corsHeaders });
    }

    await adminDb.runTransaction(async (tx) => {
      const eventRef = adminDb.doc(`events/${eventId}`);
      const eventSnap = await tx.get(eventRef);
      const event = eventSnap.data()!;

      if (!event.participantRegistrationOpen) throw new Error('REGISTRATION_CLOSED');
      if (event.maxParticipants && event.participantCount >= event.maxParticipants) throw new Error('EVENT_FULL');

      const regRef = adminDb.collection('participantRegistrations').doc();
      tx.set(regRef, {
        eventId, participantId: uid, participantName, participantEmail,
        registrationDate: FieldValue.serverTimestamp(),
        status: 'registered', attendanceMarkedAt: null, attendanceMarkedBy: null, notes: '',
      });

      const newCount = (event.participantCount || 0) + 1;
      const autoClose = event.maxParticipants ? newCount >= event.maxParticipants : false;
      tx.update(eventRef, {
        participantCount: FieldValue.increment(1),
        ...(autoClose && { participantRegistrationOpen: false }),
        updatedAt: FieldValue.serverTimestamp(),
      });
    });

    return new Response(JSON.stringify({ status: 'registered' }), { status: 200, headers: corsHeaders });
  } catch (err: any) {
    if (err.message === 'REGISTRATION_CLOSED') return new Response(JSON.stringify({ error: 'Registration is closed' }), { status: 400, headers: corsHeaders });
    if (err.message === 'EVENT_FULL') return new Response(JSON.stringify({ error: 'Event is full' }), { status: 400, headers: corsHeaders });
    console.error('Mobile register error:', err);
    return new Response(JSON.stringify({ error: err.message || 'Internal Server Error' }), { status: 500, headers: corsHeaders });
  }
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders });
}
