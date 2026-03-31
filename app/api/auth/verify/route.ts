import { adminAuth, adminDb } from '@/lib/firebase/admin';
import { cookies } from 'next/headers';

export async function GET() {
  const session = (await cookies()).get('session')?.value;
  if (!session) return new Response('Unauthorized', { status: 401 });

  try {
    const decoded = await adminAuth.verifySessionCookie(session, true);
    const userDoc = await adminDb.doc(`users/${decoded.uid}`).get();
    const role = userDoc.data()?.role;
    return Response.json({ role });
  } catch (error) {
    return new Response('Unauthorized', { status: 401 });
  }
}
