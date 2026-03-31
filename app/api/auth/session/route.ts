import { adminAuth, adminDb } from '@/lib/firebase/admin';
import { cookies } from 'next/headers';

export async function POST(req: Request) {
  const { idToken } = await req.json();
  const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5 days

  // Verify and find role
  const decodedToken = await adminAuth.verifyIdToken(idToken);
  const userSnap = await adminDb.doc(`users/${decodedToken.uid}`).get();
  const profile = userSnap.data();

  const sessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn });

  (await cookies()).set('session', sessionCookie, {
    maxAge: expiresIn,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
  });

  return Response.json({ status: 'ok', profile });
}

export async function DELETE() {
  (await cookies()).delete('session');
  return Response.json({ status: 'ok' });
}
