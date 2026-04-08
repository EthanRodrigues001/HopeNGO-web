import { adminDb } from "@/lib/firebase/admin";
import { FieldValue } from "firebase-admin/firestore";
import { getBaseUrl } from "./base-url";

export async function checkAndAutoIssueCertificates(eventId: string) {
  console.log(`[Auto-Issue] Checking event ${eventId}`);
  
  const eventSnap = await adminDb.doc(`events/${eventId}`).get();
  const event = eventSnap.data();
  if (!event || !event.isRecurring) return;

  const sessionsSnap = await adminDb.collection("eventSessions").where("eventId", "==", eventId).get();
  const allSessionsCount = sessionsSnap.size;
  
  if (allSessionsCount === 0) return;
  
  const closedSessions = sessionsSnap.docs.filter(d => d.data().attendanceClosed).length;
  
  if (closedSessions < allSessionsCount) {
    console.log(`[Auto-Issue] Not all sessions closed yet (${closedSessions}/${allSessionsCount})`);
    return;
  }
  
  // Minimum attendance required to get a certificate
  // We can default to 75% or just "all" (100%). Let's say 100% for now or > 0.
  // Actually, we can use 75%: Math.ceil(allSessionsCount * 0.75)
  const minAttendanceRequired = Math.ceil(allSessionsCount * 0.75);

  const volsSnap = await adminDb.collection("volunteerApplications")
    .where("eventId", "==", eventId)
    .where("sessionsAttended", ">=", minAttendanceRequired)
    .get();

  if (volsSnap.empty) {
    console.log(`[Auto-Issue] No eligible operatives found for ${eventId}`);
    return;
  }

  // Find users who already have certificates for this event to avoid duplicates
  const existingCertsSnap = await adminDb.collection('certificates')
    .where('eventId', '==', eventId)
    .get();
    
  const usersWithCerts = new Set(existingCertsSnap.docs.map(doc => doc.data().recipientId || doc.data().recipientEmail));

  let currentSeq = existingCertsSnap.size;
  const batch = adminDb.batch();
  const year = new Date().getFullYear();
  const shortEventId = eventId.slice(0, 6).toUpperCase();
  const APP_URL = getBaseUrl();
  let issueCount = 0;

  const processRecord = (regData: any) => {
    // Determine ID key based on volunteer
    const idKey = regData.volunteerId || regData.volunteerEmail;
    if (!idKey || usersWithCerts.has(idKey)) return;

    currentSeq++;
    const seqStr = String(currentSeq).padStart(4, '0');
    const certificateNumber = `HOPE-${year}-${shortEventId}-${seqStr}`;
    
    const certRef = adminDb.collection('certificates').doc();
    batch.set(certRef, {
      certificateNumber,
      eventId,
      eventTitle: event.title,
      eventDate: event.eventDate,
      recipientId: regData.volunteerId || null,
      recipientEmail: regData.volunteerEmail || null,
      recipientName: regData.volunteerName || 'Operative',
      recipientRole: 'volunteer',
      issuedDate: FieldValue.serverTimestamp(),
      issuedBy: 'SYSTEM_AUTO',
      isVisible: true,
      qrVerifyUrl: `${APP_URL}/verify/${certificateNumber}`,
    });
    console.log(`[Auto-Issue] Queued certificate for ${idKey} (${certificateNumber})`);
    usersWithCerts.add(idKey);
    issueCount++;
  };

  volsSnap.docs.forEach(doc => processRecord(doc.data()));


  if (issueCount > 0) {
    await batch.commit();
    console.log(`[Auto-Issue] Successfully issued ${issueCount} certificates for event ${eventId}`);
  } else {
    console.log(`[Auto-Issue] No new certificates to issue (all eligible already have one)`);
  }
}
