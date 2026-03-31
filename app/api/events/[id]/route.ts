import { adminDb, adminAuth } from '@/lib/firebase/admin';
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

    // Don't update immutable fields
    delete updates.id;

    await adminDb.doc(`events/${id}`).update(updates);
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
