import { NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase/admin';
import { cookies } from 'next/headers';
import { renderToBuffer } from '@json-render/react-pdf';
import type { Spec } from '@json-render/core';

export const dynamic = 'force-dynamic';

export async function GET(req: Request, { params }: { params: Promise<{ certId: string }> }) {
  try {
    const { certId } = await params;

    const certSnap = await adminDb.doc(`certificates/${certId}`).get();
    if (!certSnap.exists) return new Response('Not found', { status: 404 });
    const cert = certSnap.data()!;

    if (!cert.isVisible) {
      let uid: string;
      const authHeader = req.headers.get('authorization');
      if (authHeader?.startsWith('Bearer ')) {
        const decoded = await adminAuth.verifyIdToken(authHeader.split('Bearer ')[1]);
        uid = decoded.uid;
      } else {
        const session = (await cookies()).get('session')?.value;
        if (!session) return new Response('Unauthorized', { status: 401 });
        const decoded = await adminAuth.verifySessionCookie(session, true);
        uid = decoded.uid;
      }

      if (cert.recipientId !== uid) {
        const user = await adminDb.doc(`users/${uid}`).get();
        if (user.data()?.role !== 'admin') return new Response('Forbidden', { status: 403 });
      }
    }

    const roleVerb = cert.recipientRole === 'volunteer' ? 'volunteered at' : 'participated in';
    const roleLabel = cert.recipientRole === 'volunteer' ? 'VOLUNTEERING' : 'PARTICIPATION';

    let evtDateObj = new Date();
    if (cert.eventDate && cert.eventDate.toDate) evtDateObj = cert.eventDate.toDate();
    else if (typeof cert.eventDate === 'string') evtDateObj = new Date(cert.eventDate);
    const eventDate = evtDateObj.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });

    let issDateObj = new Date();
    if (cert.issuedDate && cert.issuedDate.toDate) issDateObj = cert.issuedDate.toDate();
    else if (typeof cert.issuedDate === 'string') issDateObj = new Date(cert.issuedDate);
    const issuedDate = issDateObj.toLocaleDateString('en-IN');

    const spec: Spec = {
      root: 'doc',
      elements: {
        doc: { type: 'Document', props: {}, children: ['page'] },
        page: { type: 'Page', props: { size: 'A4', orientation: 'landscape', style: { backgroundColor: '#fdfbf5', padding: 20 } }, children: ['borderView'] },
        borderView: {
          type: 'View',
          props: { style: { flex: 1, border: '4px solid #0f5238', padding: 30, alignItems: 'center', justifyContent: 'center' } },
          children: ['innerBorderView']
        },
        innerBorderView: {
          type: 'View',
          props: { style: { flex: 1, width: '100%', border: '1px solid #b48e3a', padding: 20, alignItems: 'center', justifyContent: 'center' } },
          children: ['title', 'subtitle', 'divider', 'certifyText', 'recipientName', 'roleText', 'eventTitle', 'dateText', 'footerSpacer', 'footerRow']
        },
        title: { type: 'Heading', props: { text: 'HOPE NGO', level: 'h1', style: { color: '#0f5238', fontSize: 32, fontWeight: 'bold', marginBottom: 8 } }, children: [] },
        subtitle: { type: 'Text', props: { text: `CERTIFICATE OF ${roleLabel}`, style: { color: '#6b7280', letterSpacing: 2, fontSize: 12 } }, children: [] },
        divider: { type: 'Divider', props: { style: { width: '60%', borderBottom: '2px solid #b48e3a', marginVertical: 20 } }, children: [] },
        certifyText: { type: 'Text', props: { text: 'This is to certify that', style: { color: '#4b5563', marginBottom: 16 } }, children: [] },
        recipientName: { type: 'Heading', props: { text: cert.recipientName, level: 'h2', style: { color: '#0f5238', fontSize: 36, fontWeight: 'bold', marginBottom: 16 } }, children: [] },
        roleText: { type: 'Text', props: { text: `has successfully ${roleVerb}`, style: { color: '#4b5563', marginBottom: 16 } }, children: [] },
        eventTitle: { type: 'Heading', props: { text: cert.eventTitle, level: 'h3', style: { color: '#191c1a', fontSize: 24, fontWeight: 'bold', marginBottom: 12 } }, children: [] },
        dateText: { type: 'Text', props: { text: `Held on ${eventDate}`, style: { color: '#9ca3af', fontSize: 14 } }, children: [] },
        footerSpacer: { type: 'Spacer', props: { style: { flexGrow: 1 } }, children: [] },
        footerRow: {
          type: 'Row',
          props: { style: { width: '100%', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 'auto' } },
          children: ['certId', 'issuedText', 'verifyText']
        },
        certId: { type: 'View', props: { style: { flexDirection: 'column', gap: 4 } }, children: ['certIdLabel', 'certIdValue'] },
        certIdLabel: { type: 'Text', props: { text: 'CERTIFICATE NO.', style: { color: '#9ca3af', fontSize: 9, fontWeight: 'bold' } }, children: [] },
        certIdValue: { type: 'Text', props: { text: cert.certificateNumber, style: { color: '#4b5563', fontSize: 10 } }, children: [] },

        issuedText: { type: 'View', props: { style: { flexDirection: 'column', gap: 4, alignItems: 'center' } }, children: ['issuedLabel', 'issuedValue', 'signatureLine', 'signatureLabel'] },
        issuedLabel: { type: 'Text', props: { text: 'ISSUED ON', style: { color: '#9ca3af', fontSize: 9, fontWeight: 'bold' } }, children: [] },
        issuedValue: { type: 'Text', props: { text: issuedDate, style: { color: '#4b5563', fontSize: 10, marginBottom: 12 } }, children: [] },
        signatureLine: { type: 'Divider', props: { style: { width: 120, borderBottom: '1px solid #9ca3af', marginBottom: 4 } }, children: [] },
        signatureLabel: { type: 'Text', props: { text: 'AUTHORIZED SIGNATURE', style: { color: '#9ca3af', fontSize: 8 } }, children: [] },

        verifyText: { type: 'View', props: { style: { flexDirection: 'column', gap: 4, alignItems: 'flex-end' } }, children: ['verifyLabel', 'verifyScan'] },
        verifyLabel: { type: 'Text', props: { text: 'VERIFICATION URL', style: { color: '#9ca3af', fontSize: 9, fontWeight: 'bold' } }, children: [] },
        verifyScan: { type: 'Text', props: { text: cert.qrVerifyUrl || `hopengo.org/verify/${cert.certificateNumber}`, style: { color: '#4b5563', fontSize: 10 } }, children: [] },
      }
    };

    const pdfBuffer = await renderToBuffer(spec);

    return new NextResponse(pdfBuffer as any, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="certificate-${cert.certificateNumber}.pdf"`,
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  } catch (err: any) {
    console.error('Certificate PDF generation error:', err);
    return new Response('Internal Server Error', { status: 500 });
  }
}

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
