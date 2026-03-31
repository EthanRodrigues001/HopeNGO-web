import { adminDb } from '@/lib/firebase/admin';

export const dynamic = "force-dynamic";

interface Props { params: Promise<{ certNumber: string }> }

export default async function VerifyPage(props: Props) {
  const { certNumber } = await props.params;

  const snap = await adminDb.collection('certificates')
    .where('certificateNumber', '==', certNumber)
    .where('isVisible', '==', true)
    .limit(1)
    .get();

  if (snap.empty) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-950 text-neutral-50 px-4">
        <div className="text-center p-8 bg-neutral-900 border border-neutral-800 rounded-xl shadow-2xl max-w-sm w-full">
          <div className="text-6xl mb-4">❌</div>
          <h1 className="text-xl font-bold text-red-400">Certificate Not Found</h1>
          <p className="text-neutral-400 mt-2 text-sm">This certificate number is invalid or has been revoked.</p>
          <p className="text-xs text-neutral-600 mt-6 font-mono border-t border-neutral-800 pt-4">Ref: {certNumber}</p>
        </div>
      </div>
    );
  }

  const cert = snap.docs[0].data();
  
  let evtDateObj = new Date();
  if (cert.eventDate && cert.eventDate.toDate) evtDateObj = cert.eventDate.toDate();
  else if (typeof cert.eventDate === 'string') evtDateObj = new Date(cert.eventDate);

  const eventDate = evtDateObj.toLocaleDateString('en-IN', {
    day: 'numeric', month: 'long', year: 'numeric',
  });

  let issDateObj = new Date();
  if (cert.issuedDate && cert.issuedDate.toDate) issDateObj = cert.issuedDate.toDate();

  const issuedDate = issDateObj.toLocaleDateString('en-IN', {
    day: 'numeric', month: 'long', year: 'numeric',
  });
  
  const roleVerb = cert.recipientRole === 'volunteer' ? 'volunteered at' : 'participated in';
  const roleLabel = cert.recipientRole === 'volunteer' ? 'VOLUNTEERING' : 'PARTICIPATION';

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-50 flex flex-col items-center justify-center p-6 gap-6">

      <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400
                      rounded-full px-5 py-2 text-sm font-medium shadow-sm shadow-emerald-500/10">
        <span className="text-emerald-500">✔</span>
        Verified Certificate — Issued by HopeNGO
      </div>

      <div className="bg-neutral-900 rounded-2xl shadow-2xl shadow-emerald-900/20 border border-emerald-500/50
                      w-full max-w-3xl px-8 py-10 md:px-12 md:py-12 flex flex-col items-center text-center relative overflow-hidden">
        
        {/* Subtle glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-emerald-500/5 rounded-full blur-[80px] -z-10" />

        <h1 className="text-3xl font-black tracking-widest text-emerald-400 uppercase drop-shadow">HopeNGO</h1>
        <p className="text-xs tracking-[0.3em] text-neutral-500 uppercase mt-1">
          Certificate of {roleLabel}
        </p>

        <div className="my-6 h-px bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent w-full" />

        <p className="text-neutral-400 text-sm">This is to certify that</p>
        <h2 className="text-4xl md:text-5xl font-bold text-neutral-50 mt-3 mb-2 tracking-tight">{cert.recipientName}</h2>
        <p className="text-neutral-400 text-sm mt-2">has successfully {roleVerb}</p>
        <h3 className="text-2xl font-semibold text-emerald-300 mt-3">{cert.eventTitle}</h3>
        <p className="text-neutral-500 text-sm mt-2 font-medium">Held on {eventDate}</p>

        <div className="my-8 h-px bg-neutral-800 w-full" />

        <div className="flex flex-col md:flex-row justify-between w-full items-center gap-6 text-xs text-neutral-400">
          <div className="text-center md:text-left">
            <p className="font-medium text-neutral-500 mb-1">Certificate No.</p>
            <p className="font-mono text-neutral-300 bg-neutral-950 px-2 py-1 rounded inline-block border border-neutral-800">{cert.certificateNumber}</p>
          </div>
          <div className="text-center">
            <p className="font-medium text-neutral-500 mb-1">Issued On</p>
            <p className="text-neutral-300 font-medium">{issuedDate}</p>
          </div>
          <div className="text-center md:text-right">
            <p className="font-medium text-neutral-500 mb-1">Issued By</p>
            <p className="text-emerald-400 font-bold uppercase tracking-wider">HopeNGO</p>
          </div>
        </div>
      </div>

      <a
        href={`/api/certificates/${snap.docs[0].id}/download`}
        className="bg-emerald-500 hover:bg-emerald-600 text-neutral-950 font-semibold
                   px-8 py-3 rounded-full shadow-lg shadow-emerald-500/20 transition-all hover:scale-105 text-sm"
        download
      >
        ↓ Download PDF Variant
      </a>

      <p className="text-xs text-neutral-500 max-w-sm text-center">
        This page is publicly accessible via the QR code on the original certificate and serves as cryptographic verification.
      </p>
    </div>
  );
}
