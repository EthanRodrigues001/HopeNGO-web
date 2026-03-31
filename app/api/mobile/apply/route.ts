import { adminAuth, adminDb } from '@/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';

const corsHeaders = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });
    }
    const decodedToken = await adminAuth.verifyIdToken(authHeader.split('Bearer ')[1]);
    const uid = decodedToken.uid;

    const userDoc = await adminDb.doc(`users/${uid}`).get();
    const userData = userDoc.data();
    if (!userData || userData.role !== 'volunteer') {
      return new Response(JSON.stringify({ error: 'Only volunteers can apply' }), { status: 403, headers: corsHeaders });
    }
    if (!userData.isApproved) {
      return new Response(JSON.stringify({ error: 'Account not yet approved by admin' }), { status: 403, headers: corsHeaders });
    }

    const { eventId } = await req.json();
    if (!eventId) return new Response(JSON.stringify({ error: 'eventId required' }), { status: 400, headers: corsHeaders });

    // Check event volunteer registration open
    const eventDoc = await adminDb.doc(`events/${eventId}`).get();
    const event = eventDoc.data();
    if (!event?.volunteerRegistrationOpen) {
      return new Response(JSON.stringify({ error: 'Volunteer registration is closed for this event' }), { status: 400, headers: corsHeaders });
    }

    // Check duplicate
    const existing = await adminDb.collection('volunteerApplications')
      .where('eventId', '==', eventId)
      .where('volunteerId', '==', uid)
      .where('status', '!=', 'cancelled')
      .limit(1)
      .get();
    if (!existing.empty) {
      return new Response(JSON.stringify({ error: 'Already applied' }), { status: 400, headers: corsHeaders });
    }

    const appRef = adminDb.collection('volunteerApplications').doc();
    await appRef.set({
      eventId,
      volunteerId: uid,
      volunteerName: userData.fullName || 'Unknown',
      appliedAt: FieldValue.serverTimestamp(),
      status: 'pending',
      reviewedAt: null,
      reviewedBy: null,
      adminNotes: '',
    });

    return new Response(JSON.stringify({ status: 'applied', id: appRef.id }), { status: 200, headers: corsHeaders });
  } catch (err: any) {
    console.error('Volunteer apply error:', err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders });
  }
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders });
}
