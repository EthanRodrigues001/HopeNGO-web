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

    // Convert eventDate to a proper Date for Firestore Timestamp storage
    if (body.eventDate) {
      body.eventDate = new Date(body.eventDate);
    }

    const ref = await adminDb.collection('events').add({
      ...body,
      participantCount: 0,
      volunteerCount: 0,
      coordinatorId: null,
      coordinatorName: null,
      createdBy: decoded.uid,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    if (body.isRecurring && body.sessionDates && body.sessionDates.length > 0) {
      const batch = adminDb.batch();
      
      body.sessionDates.forEach((dateString: string, index: number) => {
        const sessionRef = adminDb.collection('eventSessions').doc();
        batch.set(sessionRef, {
          eventId: ref.id,
          sessionNumber: index + 1,
          sessionDate: new Date(dateString),
          attendanceOpen: false,
          attendanceClosed: false,
          createdAt: FieldValue.serverTimestamp(),
        });
      });
      
      await batch.commit();
    }

    return Response.json({ id: ref.id });
  } catch (error) {
    console.error('Error creating event:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}
