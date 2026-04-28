import { adminDb } from '@/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';

const corsHeaders = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
};

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: eventId } = await params;
    const { donorName, donorEmail, donorPhone, amount, message } = await req.json();

    if (!donorName?.trim() || !donorEmail?.trim() || !amount || Number(amount) <= 0) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Verify event exists
    const eventSnap = await adminDb.doc(`events/${eventId}`).get();
    if (!eventSnap.exists) {
      return Response.json({ error: 'Event not found' }, { status: 404 });
    }
    const event = eventSnap.data()!;

    // Simulate payment (replace with Razorpay/Stripe in production)
    await new Promise((r) => setTimeout(r, 1200));
    const txnId = `TXN-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

    // Record donation
    await adminDb.collection('donations').add({
      eventId,
      eventTitle: event.title,
      donorName: donorName.trim(),
      donorEmail: donorEmail.trim().toLowerCase(),
      donorPhone: donorPhone?.trim() || '',
      amount: Number(amount),
      currency: 'INR',
      type: 'one-time',
      transactionId: txnId,
      message: message?.trim() || null,
      status: 'success',
      paymentMethod: 'simulated',
      createdAt: FieldValue.serverTimestamp(),
    });

    // Update event donation total
    await adminDb.doc(`events/${eventId}`).update({
      totalDonations: FieldValue.increment(Number(amount)),
      donationCount: FieldValue.increment(1),
    });

    return Response.json({ success: true, transactionId: txnId });
  } catch (err: any) {
    console.error('Event donation error:', err);
    return Response.json({ error: 'Internal Server Error' }, { status: 500, headers: corsHeaders });
  }
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders });
}
