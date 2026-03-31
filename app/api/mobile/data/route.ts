import { adminAuth, adminDb } from '@/lib/firebase/admin';

const corsHeaders = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

/**
 * Recursively converts all Firestore Timestamps to ISO strings so the
 * response is JSON-safe.
 */
function sanitize(obj: any, id?: string): any {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj.toDate === 'function') return obj.toDate().toISOString();
  if (Array.isArray(obj)) return obj.map((item) => sanitize(item));
  if (typeof obj === 'object') {
    const clean: any = id ? { id } : {};
    for (const key of Object.keys(obj)) {
      clean[key] = sanitize(obj[key]);
    }
    return clean;
  }
  return obj;
}

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response('Unauthorized', { status: 401 });
    }

    const idToken = authHeader.split('Bearer ')[1];
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const uid = decodedToken.uid;

    // Fetch user profile
    const userDoc = await adminDb.doc(`users/${uid}`).get();
    const userData = userDoc.data() || {};
    const role = userData.role || 'participant';

    // Fetch all events (admin SDK bypasses security rules)
    const eventsSnap = await adminDb.collection('events').orderBy('eventDate', 'desc').get();
    const events = eventsSnap.docs.map((d) => sanitize(d.data(), d.id));

    // Fetch user-specific registrations or applications
    let userEvents: any[] = [];
    if (role === 'volunteer') {
      const snap = await adminDb
        .collection('volunteerApplications')
        .where('volunteerId', '==', uid)
        .orderBy('appliedAt', 'desc')
        .get();
      userEvents = snap.docs.map((d) => sanitize(d.data(), d.id));
    } else if (role === 'participant') {
      const snap = await adminDb
        .collection('participantRegistrations')
        .where('participantId', '==', uid)
        .orderBy('registrationDate', 'desc')
        .get();
      userEvents = snap.docs.map((d) => sanitize(d.data(), d.id));
    }

    // Fetch certificates for this user
    const certsSnap = await adminDb
      .collection('certificates')
      .where('recipientId', '==', uid)
      .get();
    const certificates = certsSnap.docs.map((d) => sanitize(d.data(), d.id));

    // Fetch relevant announcements
    const audiences = role === 'volunteer'
      ? ['all', 'volunteers']
      : role === 'participant'
      ? ['all', 'participants']
      : ['all', 'admins'];

    const annSnap = await adminDb
      .collection('announcements')
      .where('targetAudience', 'in', audiences)
      .orderBy('isPinned', 'desc')
      .orderBy('createdAt', 'desc')
      .limit(20)
      .get();
    const announcements = annSnap.docs.map((d) => sanitize(d.data(), d.id));

    const body = JSON.stringify({
      user: sanitize({ id: uid, ...userData }),
      events,
      userEvents,
      certificates,
      announcements,
    });

    return new Response(body, { status: 200, headers: corsHeaders });
  } catch (error: any) {
    console.error('Mobile API Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: corsHeaders,
    });
  }
}

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: corsHeaders,
  });
}
