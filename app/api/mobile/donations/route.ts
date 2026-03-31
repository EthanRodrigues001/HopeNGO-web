import { adminAuth, adminDb } from '@/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';

const corsHeaders = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response('Unauthorized', { status: 401 });
    }

    const idToken = authHeader.split('Bearer ')[1];
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    
    // Verify admin role
    const userDoc = await adminDb.doc(`users/${decodedToken.uid}`).get();
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

    return new Response(JSON.stringify({ links }), { status: 200, headers: corsHeaders });
  } catch (err: any) {
    console.error('Mobile donations GET error:', err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders });
  }
}

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response('Unauthorized', { status: 401 });
    }

    const idToken = authHeader.split('Bearer ')[1];
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    
    const userDoc = await adminDb.doc(`users/${decodedToken.uid}`).get();
    if (userDoc.data()?.role !== 'admin') {
      return new Response('Forbidden', { status: 403 });
    }

    const body = await req.json();
    const { title, description, type, amount, minAmount, maxAmount, suggestedAmounts, currency } = body;

    if (!title || !type) {
      return new Response(JSON.stringify({ error: 'Title and type are required' }), { status: 400, headers: corsHeaders });
    }

    if (type === 'recurring' && (!minAmount || !maxAmount)) {
      return new Response(JSON.stringify({ error: 'Min and max amounts required for recurring' }), { status: 400, headers: corsHeaders });
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
      createdBy: decodedToken.uid,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    };

    await adminDb.collection('donationLinks').doc(linkId).set(donationLink);

    return new Response(JSON.stringify({
      success: true,
      link: {
        ...donationLink,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        id: linkId,
      },
    }), { status: 200, headers: corsHeaders });
  } catch (err: any) {
    console.error('Mobile donation link creation error:', err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders });
  }
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders });
}
