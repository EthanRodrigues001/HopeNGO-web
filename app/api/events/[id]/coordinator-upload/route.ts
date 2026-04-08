import { adminAuth, adminDb } from '@/lib/firebase/admin';
import { cookies } from 'next/headers';
import { FieldValue } from 'firebase-admin/firestore';

export async function POST(req: Request, context: any) {
  try {
    const session = (await cookies()).get('session')?.value;
    if (!session) return new Response('Unauthorized', { status: 401 });
    
    const decoded = await adminAuth.verifySessionCookie(session, true);
    const userDoc = await adminDb.doc(`users/${decoded.uid}`).get();
    const userRole = userDoc.data()?.role;
    
    // Both Admin and the specific Coordinator can upload documents
    if (userRole !== 'admin' && userRole !== 'event_coordinator') {
      return new Response('Forbidden', { status: 403 });
    }

    const { id: eventId } = await context.params;
    
    // If coordinator, verify they are assigned to this event
    if (userRole === 'event_coordinator') {
        const eventSnap = await adminDb.doc(`events/${eventId}`).get();
        if (eventSnap.data()?.assignedCoordinator !== decoded.uid) {
            return new Response('Forbidden: Not assigned to this event', { status: 403 });
        }
    }

    const formData = await req.formData();
    const file = formData.get("file") as File;
    const type = formData.get("type") as string; // 'attendance' or 'report'
    
    if (!file || !type) return new Response('Missing body segments', { status: 400 });

    // Since this requires Firebase Storage integration which we want to simulate or simplify here
    // In actual implementation, we would upload `file` to a storage bucket, then get the URL
    // For this prototype, we'll store a placeholder URL in Firestore.
    // E.g., `gs://bucket/events/${eventId}/${type}_${Date.now()}.pdf`
    
    const fakeFileUrl = `https://storage.googleapis.com/hopengo-docs/events/${eventId}/${type}_${Date.now()}_${file.name}`;

    const updateData: any = { updatedAt: FieldValue.serverTimestamp() };
    if (type === 'attendance') {
        updateData.attendanceSheetUrl = fakeFileUrl;
    } else if (type === 'report') {
        updateData.finalReportUrl = fakeFileUrl;
    }

    await adminDb.doc(`events/${eventId}`).update(updateData);

    return Response.json({ success: true, url: fakeFileUrl });
  } catch (err: any) {
    console.error("Upload document error:", err);
    return new Response('Internal Server Error', { status: 500 });
  }
}
