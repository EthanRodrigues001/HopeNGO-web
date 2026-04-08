import { adminAuth, adminDb } from '@/lib/firebase/admin';
import { cookies } from 'next/headers';
import { FieldValue } from 'firebase-admin/firestore';

export async function POST(req: Request) {
  try {
    const session = (await cookies()).get('session')?.value;
    if (!session) return new Response('Unauthorized', { status: 401 });
    
    const decoded = await adminAuth.verifySessionCookie(session, true);
    const userDoc = await adminDb.doc(`users/${decoded.uid}`).get();
    
    if (userDoc.data()?.role !== 'admin') {
      return new Response('Forbidden', { status: 403 });
    }

    const { eventId, recipientIds, recipientRole } = await req.json();

    if (!Array.isArray(recipientIds) || recipientIds.length === 0) {
      return new Response('No recipients provided', { status: 400 });
    }

    // Get Event details
    const eventSnap = await adminDb.doc(`events/${eventId}`).get();
    if (!eventSnap.exists) return new Response('Event not found', { status: 404 });
    const event = eventSnap.data()!;

    // Process certificates
    const batch = adminDb.batch();
    const { getBaseUrl } = require('@/lib/utils/base-url');
    const { generateCertNumber } = require('@/lib/utils/cert-number');
    const APP_URL = getBaseUrl();
    
    // To get sequence safely without runTransaction on each, we can query the max existing,
    // though in a heavy concurrent environment it's better to use transactions.
    const certsQuery = await adminDb.collection('certificates')
      .where('eventId', '==', eventId)
      .get();
    
    let currentSeq = certsQuery.size;

    for (let uOpt of recipientIds) {
      let recipientId = null;
      let recipientName = "Participant";
      let recipientEmail = "";
      
      // If the item is just a string UID (volunteer/admin)
      if (typeof uOpt === "string") {
        recipientId = uOpt;
        const uSnap = await adminDb.doc(`users/${recipientId}`).get();
        const uData = uSnap.data();
        if (uData) {
          recipientName = uData.fullName || "Participant";
          recipientEmail = uData.email || "";
        }
      } else if (typeof uOpt === "object" && uOpt !== null) {
        // For public participants passed as objects: { name, email }
        recipientName = uOpt.name || "Participant";
        recipientEmail = uOpt.email || "";
      }

      currentSeq++;
      const certificateNumber = generateCertNumber(eventId, currentSeq);
      
      const certRef = adminDb.collection('certificates').doc();
      batch.set(certRef, {
        certificateNumber,
        eventId,
        eventTitle: event.title,
        eventDate: event.eventDate,
        recipientId, // will be null for public participants
        recipientName,
        recipientEmail,
        recipientRole,
        issuedDate: FieldValue.serverTimestamp(),
        issuedBy: decoded.uid,
        isAutoIssued: false,
        isVisible: true,
        qrVerifyUrl: `${APP_URL}/verify/${certificateNumber}`
      });
    }

    await batch.commit();
    return Response.json({ success: true, count: recipientIds.length });
  } catch (err: any) {
    console.error("Certificate issue error:", err);
    return new Response('Internal Server Error', { status: 500 });
  }
}
