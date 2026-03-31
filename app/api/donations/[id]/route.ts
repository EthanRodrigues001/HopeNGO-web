import { adminAuth, adminDb } from '@/lib/firebase/admin';
import { cookies } from 'next/headers';
import { FieldValue } from 'firebase-admin/firestore';

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = (await cookies()).get('session')?.value;
    if (!session) return new Response('Unauthorized', { status: 401 });

    const decoded = await adminAuth.verifySessionCookie(session, true);
    const userDoc = await adminDb.doc(`users/${decoded.uid}`).get();
    if (userDoc.data()?.role !== 'admin') {
      return new Response('Forbidden', { status: 403 });
    }

    const body = await req.json();
    const updateData: Record<string, any> = {};

    if (typeof body.isActive === 'boolean') updateData.isActive = body.isActive;
    if (body.title) updateData.title = body.title;
    if (body.description !== undefined) updateData.description = body.description;
    updateData.updatedAt = FieldValue.serverTimestamp();

    await adminDb.doc(`donationLinks/${id}`).update(updateData);

    return Response.json({ success: true });
  } catch (err: any) {
    console.error('Donation link update error:', err);
    return new Response('Internal Server Error', { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = (await cookies()).get('session')?.value;
    if (!session) return new Response('Unauthorized', { status: 401 });

    const decoded = await adminAuth.verifySessionCookie(session, true);
    const userDoc = await adminDb.doc(`users/${decoded.uid}`).get();
    if (userDoc.data()?.role !== 'admin') {
      return new Response('Forbidden', { status: 403 });
    }

    await adminDb.doc(`donationLinks/${id}`).delete();
    return Response.json({ success: true });
  } catch (err: any) {
    console.error('Donation link delete error:', err);
    return new Response('Internal Server Error', { status: 500 });
  }
}
