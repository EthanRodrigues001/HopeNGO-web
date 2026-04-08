import { adminAuth, adminDb } from '@/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    // No auth required - public can submit donations
    
    const {
      donorName,
      donorEmail,
      amount,
      paymentMethod,
      transactionId,
      message,
    } = body;

    if (!donorName || !donorEmail || !amount || !paymentMethod) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    await adminDb.collection('donations').add({
      donorName,
      donorEmail,
      amount: Number(amount),
      currency: 'INR',
      paymentMethod,
      transactionId: transactionId || null,
      message: message || null,
      status: 'pending',
      verifiedBy: null,
      createdAt: FieldValue.serverTimestamp(),
    });

    return Response.json({ status: 'ok' });
  } catch (err: any) {
    console.error('Donation submission error:', err);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const sessionCookie = req.headers.get('cookie')?.split('session=')[1]?.split(';')[0];
    if (!sessionCookie) return new Response('Unauthorized', { status: 401 });

    const decoded = await adminAuth.verifySessionCookie(sessionCookie, true);
    const userDoc = await adminDb.doc(`users/${decoded.uid}`).get();
    if (userDoc.data()?.role !== 'admin') {
      return new Response('Forbidden', { status: 403 });
    }

    const snap = await adminDb
      .collection('donations')
      .orderBy('createdAt', 'desc')
      .get();

    const donations = snap.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || null,
      };
    });

    return Response.json({ donations });
  } catch (err: any) {
    console.error('Donations GET error:', err);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
