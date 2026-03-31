import { adminAuth, adminDb } from '@/lib/firebase/admin';
import { cookies } from 'next/headers';
import { FieldValue } from 'firebase-admin/firestore';

export async function GET() {
  try {
    const session = (await cookies()).get('session')?.value;
    if (!session) return new Response('Unauthorized', { status: 401 });

    const decoded = await adminAuth.verifySessionCookie(session, true);
    const userDoc = await adminDb.doc(`users/${decoded.uid}`).get();
    if (userDoc.data()?.role !== 'admin') {
      return new Response('Forbidden', { status: 403 });
    }

    const snap = await adminDb
      .collection('donationLinks')
      .orderBy('createdAt', 'desc')
      .get();

    const links = snap.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || null,
        updatedAt: data.updatedAt?.toDate?.()?.toISOString() || null,
      };
    });

    return Response.json({ links });
  } catch (err: any) {
    console.error('Donation links GET error:', err);
    return new Response('Internal Server Error', { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = (await cookies()).get('session')?.value;
    if (!session) return new Response('Unauthorized', { status: 401 });

    const decoded = await adminAuth.verifySessionCookie(session, true);
    const userDoc = await adminDb.doc(`users/${decoded.uid}`).get();
    if (userDoc.data()?.role !== 'admin') {
      return new Response('Forbidden', { status: 403 });
    }

    const body = await req.json();
    const {
      title,
      description,
      type, // 'one-time' | 'recurring'
      amount, // for one-time: fixed amount (nullable = custom)
      minAmount, // for recurring: range start
      maxAmount, // for recurring: range end
      suggestedAmounts, // optional array of ₹ amounts
      currency,
    } = body;

    if (!title || !type) {
      return Response.json({ error: 'Title and type are required' }, { status: 400 });
    }

    if (type === 'recurring' && (!minAmount || !maxAmount)) {
      return Response.json({ error: 'Min and max amounts required for recurring' }, { status: 400 });
    }

    const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const linkId = adminDb.collection('donationLinks').doc().id;

    const donationLink = {
      title,
      description: description || '',
      type,
      amount: amount || null,
      minAmount: minAmount || null,
      maxAmount: maxAmount || null,
      suggestedAmounts: suggestedAmounts || [],
      currency: currency || 'INR',
      linkId,
      url: `${APP_URL}/donate/${linkId}`,
      isActive: true,
      totalCollected: 0,
      totalDonations: 0,
      createdBy: decoded.uid,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    };

    await adminDb.collection('donationLinks').doc(linkId).set(donationLink);

    return Response.json({
      success: true,
      link: {
        ...donationLink,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        id: linkId,
      },
    });
  } catch (err: any) {
    console.error('Donation link creation error:', err);
    return new Response('Internal Server Error', { status: 500 });
  }
}
