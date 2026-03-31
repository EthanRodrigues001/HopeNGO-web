import { adminAuth, adminDb } from '@/lib/firebase/admin';

export async function POST(req: Request) {
  // NOTE: This route should be disabled or deleted in production!
  if (process.env.NODE_ENV === 'production') {
    return new Response('Not available in production', { status: 403 });
  }

  try {
    const { email } = await req.json();

    if (!email) {
      return new Response('Email is required', { status: 400 });
    }

    // Get user by email
    const user = await adminAuth.getUserByEmail(email);
    
    // Update firestore document to "admin"
    await adminDb.doc(`users/${user.uid}`).update({
      role: 'admin',
      isApproved: true
    });

    return Response.json({ success: true, message: `Successfully promoted ${email} to admin!` });
  } catch (err: any) {
    console.error("Promote to admin error:", err);
    return new Response(err.message || 'Internal Server Error', { status: 500 });
  }
}
