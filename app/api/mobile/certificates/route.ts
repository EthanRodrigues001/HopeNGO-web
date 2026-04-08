import { adminAuth, adminDb } from '@/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';
import { getBaseUrl } from '@/lib/utils/base-url';

const corsHeaders = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

/**
 * Mobile-compatible certificate issue endpoint.
 * Uses Bearer token auth instead of session cookies.
 */
export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });
    }

    const idToken = authHeader.split('Bearer ')[1];
    const decoded = await adminAuth.verifyIdToken(idToken);
    
    const userDoc = await adminDb.doc(`users/${decoded.uid}`).get();
    if (userDoc.data()?.role !== 'admin') {
      return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: corsHeaders });
    }

    const { eventId, recipientIds, recipientRole } = await req.json();

    if (!Array.isArray(recipientIds) || recipientIds.length === 0) {
      return new Response(JSON.stringify({ error: 'No recipients provided' }), { status: 400, headers: corsHeaders });
    }

    const eventSnap = await adminDb.doc(`events/${eventId}`).get();
    if (!eventSnap.exists) {
      return new Response(JSON.stringify({ error: 'Event not found' }), { status: 404, headers: corsHeaders });
    }
    const event = eventSnap.data()!;

    const batch = adminDb.batch();
    const APP_URL = getBaseUrl();
    const year = new Date().getFullYear();
    const shortEventId = eventId.slice(0, 6).toUpperCase();

    const certsQuery = await adminDb.collection('certificates')
      .where('eventId', '==', eventId)
      .get();
    
    let currentSeq = certsQuery.size;

    for (const uid of recipientIds) {
      const uSnap = await adminDb.doc(`users/${uid}`).get();
      const uData = uSnap.data();
      if (!uData) continue;

      currentSeq++;
      const seqStr = String(currentSeq).padStart(4, '0');
      const certificateNumber = `HOPE-${year}-${shortEventId}-${seqStr}`;
      
      const certRef = adminDb.collection('certificates').doc();
      batch.set(certRef, {
        certificateNumber,
        eventId,
        eventTitle: event.title,
        eventDate: event.eventDate,
        recipientId: uid,
        recipientName: uData.fullName || 'Participant',
        recipientRole,
        issuedDate: FieldValue.serverTimestamp(),
        issuedBy: decoded.uid,
        isVisible: true,
        qrVerifyUrl: `${APP_URL}/verify/${certificateNumber}`,
      });
    }

    await batch.commit();
    return new Response(JSON.stringify({ success: true, count: recipientIds.length }), { status: 200, headers: corsHeaders });
  } catch (err: any) {
    console.error('Mobile certificate issue error:', err);
    return new Response(JSON.stringify({ error: err.message || 'Internal Server Error' }), { status: 500, headers: corsHeaders });
  }
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders });
}
