import { adminAuth, adminDb } from '@/lib/firebase/admin';
import { cookies } from 'next/headers';
import { FieldValue } from 'firebase-admin/firestore';

export async function PATCH(req: Request, context: any) {
  try {
    const session = (await cookies()).get('session')?.value;
    if (!session) return new Response('Unauthorized', { status: 401 });
    
    const decoded = await adminAuth.verifySessionCookie(session, true);
    const userDoc = await adminDb.doc(`users/${decoded.uid}`).get();
    
    if (userDoc.data()?.role !== 'admin') {
      return new Response('Forbidden', { status: 403 });
    }

    const { id } = await context.params;
    const { status, adminNotes, attendance } = await req.json();

    if (status && !['approved', 'rejected', 'pending'].includes(status)) {
      return new Response('Invalid status', { status: 400 });
    }

    const payload: any = {
      reviewedAt: FieldValue.serverTimestamp(),
      reviewedBy: decoded.uid,
    };
    
    if (status !== undefined) payload.status = status;
    if (adminNotes !== undefined) payload.adminNotes = adminNotes;
    if (attendance !== undefined) payload.attendance = attendance;

    await adminDb.doc(`volunteerApplications/${id}`).update(payload);

    return Response.json({ success: true, status });
  } catch (err: any) {
    console.error("Application review error:", err);
    return new Response('Internal Server Error', { status: 500 });
  }
}
