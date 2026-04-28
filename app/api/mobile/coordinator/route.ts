import { adminAuth, adminDb } from '@/lib/firebase/admin';

const corsHeaders = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

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
      return new Response('Unauthorized', { status: 401, headers: corsHeaders });
    }

    const idToken = authHeader.split('Bearer ')[1];
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const uid = decodedToken.uid;

    // Verify coordinator role
    const userDoc = await adminDb.doc(`users/${uid}`).get();
    const userData = userDoc.data() || {};
    if (userData.role !== 'event_coordinator') {
      return new Response('Forbidden', { status: 403, headers: corsHeaders });
    }

    // Fetch events assigned to this coordinator
    const eventsSnap = await adminDb
      .collection('events')
      .where('coordinatorId', '==', uid)
      .get();

    const events = eventsSnap.docs.map((d) => sanitize(d.data(), d.id));
    const eventIds = eventsSnap.docs.map((d) => d.id);

    if (eventIds.length === 0) {
      return new Response(
        JSON.stringify({ user: sanitize({ id: uid, ...userData }), events: [], sessions: [], volunteers: [] }),
        { status: 200, headers: corsHeaders }
      );
    }

    // Fetch sessions for those events (in batches of 30 max for Firestore 'in' queries)
    let sessions: any[] = [];
    for (let i = 0; i < eventIds.length; i += 30) {
      const chunk = eventIds.slice(i, i + 30);
      const sessSnap = await adminDb
        .collection('eventSessions')
        .where('eventId', 'in', chunk)
        .orderBy('date', 'asc')
        .get();
      sessions.push(...sessSnap.docs.map((d) => sanitize(d.data(), d.id)));
    }

    // Fetch volunteer applications for those events
    let volunteers: any[] = [];
    for (let i = 0; i < eventIds.length; i += 30) {
      const chunk = eventIds.slice(i, i + 30);
      const volSnap = await adminDb
        .collection('volunteerApplications')
        .where('eventId', 'in', chunk)
        .where('status', '==', 'approved')
        .get();
      volunteers.push(...volSnap.docs.map((d) => sanitize(d.data(), d.id)));
    }

    const body = JSON.stringify({
      user: sanitize({ id: uid, ...userData }),
      events,
      sessions,
      volunteers,
    });

    return new Response(body, { status: 200, headers: corsHeaders });
  } catch (error: any) {
    console.error('Coordinator Mobile API Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: corsHeaders,
    });
  }
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders });
}
