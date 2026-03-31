import { adminAuth, adminDb } from '@/lib/firebase/admin';
import { cookies } from 'next/headers';
import { FieldValue } from 'firebase-admin/firestore';

export async function POST(req: Request) {
  try {
    const session = (await cookies()).get('session')?.value;
    if (!session) return new Response('Unauthorized', { status: 401 });
    
    const decoded = await adminAuth.verifySessionCookie(session, true);
    const userDoc = await adminDb.doc(`users/${decoded.uid}`).get();
    
    if (userDoc.data()?.role !== 'admin') {
      return new Response('Forbidden', { status: 403 });
    }

    const body = await req.json();

    const ref = await adminDb.collection('events').add({
      ...body,
      participantCount: 0,
      volunteerCount: 0,
      createdBy: decoded.uid,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    return Response.json({ id: ref.id });
  } catch (error) {
    console.error('Error creating event:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}
