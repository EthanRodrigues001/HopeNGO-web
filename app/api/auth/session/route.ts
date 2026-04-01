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

  const cookieStore = await cookies();
  cookieStore.set('session', sessionCookie, {
    maxAge: expiresIn / 1000,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
  });
  cookieStore.set('user-role', profile?.role || '', {
    maxAge: expiresIn / 1000,
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
  });

  return Response.json({ status: 'ok', profile });
}

export async function DELETE() {
  const cookieStore = await cookies();
  cookieStore.delete('session');
  cookieStore.delete('user-role');
  return Response.json({ status: 'ok' });
}
