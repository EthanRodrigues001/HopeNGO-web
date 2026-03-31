import { adminDb } from "@/lib/firebase/admin";
import { notFound } from "next/navigation";
import DonateClient from "./client";

export const dynamic = "force-dynamic";

export default async function DonatePage({ params }: { params: Promise<{ linkId: string }> }) {
  const { linkId } = await params;

  const linkSnap = await adminDb.doc(`donationLinks/${linkId}`).get();

  if (!linkSnap.exists) {
    notFound();
  }

  const data = linkSnap.data()!;
  if (!data.isActive) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background font-sans">
        <div className="text-center p-12 max-w-md">
          <div className="w-20 h-20 mx-auto mb-6 bg-muted rounded-full flex items-center justify-center">
            <span className="text-3xl">💜</span>
          </div>
          <h1 className="text-3xl font-serif text-foreground mb-3">Link Inactive</h1>
          <p className="text-foreground/50 font-light leading-relaxed">
            This donation link is no longer accepting contributions.
            Please contact the organization for more information.
          </p>
        </div>
      </div>
    );
  }

  const link = {
    id: linkSnap.id,
    title: data.title,
    description: data.description || "",
    type: data.type,
    amount: data.amount || null,
    minAmount: data.minAmount || null,
    maxAmount: data.maxAmount || null,
    suggestedAmounts: data.suggestedAmounts || [],
    currency: data.currency || "INR",
    linkId: data.linkId,
  };

  return <DonateClient link={link} />;
}
