import { adminAuth, adminDb } from '@/lib/firebase/admin';
import { cookies } from 'next/headers';
import { FieldValue } from 'firebase-admin/firestore';

export async function PATCH(req: Request, context: any) {
  try {
    const session = (await cookies()).get('session')?.value;
    if (!session) return new Response('Unauthorized', { status: 401 });
    
    const decoded = await adminAuth.verifySessionCookie(session, true);
    const userDoc = await adminDb.doc(`users/${decoded.uid}`).get();
    
    if (userDoc.data()?.role !== 'admin') {
      return new Response('Forbidden', { status: 403 });
    }

    const { id } = await context.params;
    const { status, adminNotes, attendance } = await req.json();

    if (status && !['approved', 'rejected', 'pending'].includes(status)) {
      return new Response('Invalid status', { status: 400 });
    }

    const payload: any = {
      reviewedAt: FieldValue.serverTimestamp(),
      reviewedBy: decoded.uid,
    };
    
    if (status !== undefined) payload.status = status;
    if (adminNotes !== undefined) payload.adminNotes = adminNotes;
    if (attendance !== undefined) payload.attendance = attendance;

    await adminDb.doc(`volunteerApplications/${id}`).update(payload);

    // Auto-issue certificate if marked attended (for one-off events)
    if (attendance === 'attended') {
      const appRef = adminDb.doc(`volunteerApplications/${id}`);
      const appSnap = await appRef.get();
      const appData = appSnap.data();
      
      if (appData) {
        const eventSnap = await adminDb.doc(`events/${appData.eventId}`).get();
        const event = eventSnap.data();
        
        // Recurring events are handled by the session close API, handle non-recurring here
        if (event && !event.isRecurring) {
          const certsQuery = await adminDb.collection('certificates')
            .where('eventId', '==', appData.eventId)
            .where('recipientId', '==', appData.volunteerId)
            .get();
            
          if (certsQuery.empty) {
            const { generateCertNumber } = require('@/lib/utils/cert-number');
            const { getBaseUrl } = require('@/lib/utils/base-url');
            
            const allCerts = await adminDb.collection('certificates')
              .where('eventId', '==', appData.eventId)
              .get();
              
            const currentSeq = allCerts.size + 1;
            const certificateNumber = generateCertNumber(appData.eventId, currentSeq);
            
            await adminDb.collection('certificates').doc().set({
              certificateNumber,
              eventId: appData.eventId,
              eventTitle: event.title,
              eventDate: event.eventDate,
              recipientId: appData.volunteerId || null,
              recipientEmail: appData.volunteerEmail || null,
              recipientName: appData.volunteerName || 'Operative',
              recipientRole: 'volunteer',
              issuedDate: FieldValue.serverTimestamp(),
              issuedBy: decoded.uid,
              isAutoIssued: true,
              isVisible: true,
              qrVerifyUrl: `${getBaseUrl()}/verify/${certificateNumber}`,
            });
            
            console.log(`[Auto-Issue] Issued certificate ${certificateNumber} to ${appData.volunteerEmail}`);
          }
        }
      }
    }

    return Response.json({ success: true, status });
  } catch (err: any) {
    console.error("Application review error:", err);
    return new Response('Internal Server Error', { status: 500 });
  }
}
