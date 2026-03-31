import { adminAuth, adminDb } from '@/lib/firebase/admin';
import { cookies } from 'next/headers';

export async function DELETE(req: Request, context: any) {
  try {
    const session = (await cookies()).get('session')?.value;
    if (!session) return new Response('Unauthorized', { status: 401 });
    
    const decoded = await adminAuth.verifySessionCookie(session, true);
    const userDoc = await adminDb.doc(`users/${decoded.uid}`).get();
    
    if (userDoc.data()?.role !== 'admin') {
      return new Response('Forbidden', { status: 403 });
    }

    const { uid } = await context.params;

    // Delete volunteer account
    await adminAuth.deleteUser(uid);
    await adminDb.doc(`users/${uid}`).delete();

    return Response.json({ success: true });
  } catch (err: any) {
    console.error("Admin user rejection error:", err);
    return new Response('Internal Server Error', { status: 500 });
  }
}
