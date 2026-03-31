import { adminDb } from "@/lib/firebase/admin";
import DonationsClient from "./client";

export const dynamic = "force-dynamic";

export default async function AdminDonationsPage() {
  const linksSnap = await adminDb
    .collection("donationLinks")
    .orderBy("createdAt", "desc")
    .get();

  const links = JSON.parse(JSON.stringify(linksSnap.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      createdAt: data.createdAt?.toDate?.()?.toISOString() || null,
      updatedAt: data.updatedAt?.toDate?.()?.toISOString() || null,
    };
  })));

  // Fetch recent donations
  const donationsSnap = await adminDb
    .collection("donations")
    .orderBy("createdAt", "desc")
    .limit(50)
    .get();

  const donations = JSON.parse(JSON.stringify(donationsSnap.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      createdAt: data.createdAt?.toDate?.()?.toISOString() || null,
    };
  })));

  return (
    <div className="p-8 lg:p-16 text-foreground max-w-7xl">
      <header className="mb-16">
        <p className="text-[11px] uppercase tracking-[0.12em] font-bold text-primary/70 mb-3">
          Fundraising
        </p>
        <h1 className="text-5xl font-serif tracking-tight text-foreground mb-4">
          Donation Links
        </h1>
        <p className="text-foreground/60 font-light max-w-lg leading-relaxed">
          Create and manage donation links for one-time or recurring contributions. Share links with supporters to collect funds.
        </p>
      </header>
      <DonationsClient initialLinks={links} initialDonations={donations} />
    </div>
  );
}
