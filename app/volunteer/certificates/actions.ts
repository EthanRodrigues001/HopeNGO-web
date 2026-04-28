"use server";

import { adminAuth, adminDb } from "@/lib/firebase/admin";
import { cookies } from "next/headers";

export async function getVolunteerCertificates() {
  const session = (await cookies()).get("session")?.value;
  if (!session) return { certificates: [] };

  try {
    const decoded = await adminAuth.verifySessionCookie(session, true);
    const uid = decoded.uid;

    const certsSnap = await adminDb
      .collection("certificates")
      .where("recipientId", "==", uid)
      .where("isVisible", "==", true)
      .get();

    const certificates = certsSnap.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        certificateNumber: data.certificateNumber ?? null,
        eventTitle: data.eventTitle ?? null,
        recipientName: data.recipientName ?? null,
        recipientRole: data.recipientRole ?? null,
        qrVerifyUrl: data.qrVerifyUrl ?? null,
        isVisible: data.isVisible ?? false,
        isAutoIssued: data.isAutoIssued ?? false,
        eventDate: data.eventDate?.toDate?.()?.toISOString() ?? null,
        issuedDate: data.issuedDate?.toDate?.()?.toISOString() ?? null,
      };
    });

    // Sort newest first
    certificates.sort((a, b) => {
      if (!a.issuedDate) return 1;
      if (!b.issuedDate) return -1;
      return new Date(b.issuedDate).getTime() - new Date(a.issuedDate).getTime();
    });

    return JSON.parse(JSON.stringify({ certificates }));
  } catch {
    return { certificates: [] };
  }
}
