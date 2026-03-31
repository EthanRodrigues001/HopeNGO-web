import { adminDb } from '@/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';

/**
 * Fake payment processing endpoint.
 * Simulates a payment gateway — always succeeds.
 * In production, replace with Razorpay/Stripe integration.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { linkId, donorName, donorEmail, donorPhone, amount, isRecurring } = body;

    if (!linkId || !donorName || !donorEmail || !amount) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Verify donation link exists and is active
    const linkSnap = await adminDb.doc(`donationLinks/${linkId}`).get();
    if (!linkSnap.exists) {
      return Response.json({ error: 'Donation link not found' }, { status: 404 });
    }

    const linkData = linkSnap.data()!;
    if (!linkData.isActive) {
      return Response.json({ error: 'This donation link is no longer active' }, { status: 400 });
    }

    // Validate amount for recurring
    if (linkData.type === 'recurring' && linkData.minAmount && linkData.maxAmount) {
      if (amount < linkData.minAmount || amount > linkData.maxAmount) {
        return Response.json({
          error: `Amount must be between ₹${linkData.minAmount} and ₹${linkData.maxAmount}`,
        }, { status: 400 });
      }
    }

    // Simulate payment processing delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Generate fake transaction ID
    const txnId = `TXN-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

    // Record donation
    const donationRef = adminDb.collection('donations').doc();
    await donationRef.set({
      linkId,
      donationLinkTitle: linkData.title,
      donorName,
      donorEmail,
      donorPhone: donorPhone || '',
      amount: Number(amount),
      currency: linkData.currency || 'INR',
      type: isRecurring ? 'recurring' : 'one-time',
      transactionId: txnId,
      status: 'success', // Fake — always success
      paymentMethod: 'simulated',
      createdAt: FieldValue.serverTimestamp(),
    });

    // Update donation link stats
    await adminDb.doc(`donationLinks/${linkId}`).update({
      totalCollected: FieldValue.increment(Number(amount)),
      totalDonations: FieldValue.increment(1),
      updatedAt: FieldValue.serverTimestamp(),
    });

    return Response.json({
      success: true,
      transactionId: txnId,
      message: 'Payment processed successfully (simulated)',
    });
  } catch (err: any) {
    console.error('Payment error:', err);
    return new Response('Internal Server Error', { status: 500 });
  }
}
