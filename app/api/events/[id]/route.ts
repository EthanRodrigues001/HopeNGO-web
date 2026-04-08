import { adminDb, adminAuth } from '@/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
// Update an Event
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const sessionCookie = (await cookies()).get('session')?.value;
    if (!sessionCookie) return new NextResponse('Unauthorized', { status: 401 });

    const decoded = await adminAuth.verifySessionCookie(sessionCookie, true);
    const userDoc = await adminDb.doc(`users/${decoded.uid}`).get();
    
    if (userDoc.data()?.role !== 'admin') {
      return new NextResponse('Forbidden', { status: 403 });
    }

    const updates = await req.json();
    
    // Convert eventDate to Firestore Timestamp if needed
    if (updates.eventDate) {
      updates.eventDate = new Date(updates.eventDate); // The Node Admin SDK accepts JS Dates directly for Timestamps
    }

    // Manage sessionDates generation dynamically if it transitioned to recurring
    let sessionDatesArray: string[] = [];
    if (updates.sessionDates) {
      sessionDatesArray = updates.sessionDates;
      delete updates.sessionDates; // Don't write the array directly to the event root payload unless planned
      delete updates.sessionDatesString;
      delete updates.recurringDays;
      delete updates.recurringStartDate;
      delete updates.recurringEndDate;
    }

    // Don't update immutable fields
    delete updates.id;

    const eventRef = adminDb.doc(`events/${id}`);
    
    const batch = adminDb.batch();
    batch.update(eventRef, updates);

    if (updates.isRecurring && sessionDatesArray.length > 0) {
      // Fetch existing sessions so we don't accidentally duplicate
      const existingSessionsSnap = await adminDb.collection('eventSessions').where('eventId', '==', id).get();
      const existingDates = new Set(
        existingSessionsSnap.docs.map(d => {
          const dt = d.data().sessionDate.toDate();
          return dt.toISOString().split('T')[0];
        })
      );

      sessionDatesArray.forEach((dateStr, index) => {
        if (!existingDates.has(dateStr)) {
          const sessionRef = adminDb.collection('eventSessions').doc();
          batch.set(sessionRef, {
            eventId: id,
            sessionNumber: existingSessionsSnap.docs.length + index + 1, // approximate numbering addition
            sessionDate: new Date(dateStr),
            attendanceOpen: false,
            attendanceClosed: false,
            createdAt: FieldValue.serverTimestamp(),
          });
        }
      });
    }

    await batch.commit();
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return new NextResponse(error.message, { status: 500 });
  }
}

// Delete an Event
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const sessionCookie = (await cookies()).get('session')?.value;
    if (!sessionCookie) return new NextResponse('Unauthorized', { status: 401 });

    const decoded = await adminAuth.verifySessionCookie(sessionCookie, true);
    const userDoc = await adminDb.doc(`users/${decoded.uid}`).get();
    
    if (userDoc.data()?.role !== 'admin') {
      return new NextResponse('Forbidden', { status: 403 });
    }

    // To properly delete an event, we technically should also delete or archive its registrations.
    // However, deleting the event document itself stops it from showing up.
    await adminDb.doc(`events/${id}`).delete();
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return new NextResponse(error.message, { status: 500 });
  }
}
