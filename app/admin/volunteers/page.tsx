import { adminDb } from "@/lib/firebase/admin";
import VolunteersClient from "./client";


export const dynamic = "force-dynamic";

export default async function AdminVolunteersPage() {
  // Fetch all volunteers
  const usersSnap = await adminDb
    .collection("users")
    .where("role", "==", "volunteer")
    .orderBy("createdAt", "desc")
    .get();

  const volunteers = JSON.parse(JSON.stringify(usersSnap.docs.map(doc => {
    const data = doc.data();
    return {
      uid: doc.id,
      ...data,
      createdAt: data.createdAt?.toDate?.()?.toISOString() || null,
      updatedAt: data.updatedAt?.toDate?.()?.toISOString() || null,
    };
  })));

  // Fetch pending volunteer applications
  const pendingAppsSnap = await adminDb
    .collection("volunteerApplications")
    .where("status", "==", "pending")
    .get();

  const pendingApps = JSON.parse(JSON.stringify(pendingAppsSnap.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      volunteerId: data.volunteerId,
      volunteerName: data.volunteerName,
      eventId: data.eventId,
      appliedAt: data.appliedAt?.toDate?.()?.toISOString() || null,
    };
  })));

  return (
    <div className="p-8 lg:p-16 text-foreground max-w-7xl">
      <header className="mb-16">
        <p className="text-[11px] uppercase tracking-[0.12em] font-bold text-primary/70 mb-3">
          Personnel
        </p>
        <h1 className="text-5xl font-serif tracking-tight text-foreground mb-4">
          Manage Operatives
        </h1>
        <p className="text-foreground/60 font-light max-w-lg leading-relaxed">
          Review volunteer dossiers, approve accounts, and manage field assignments.
        </p>
      </header>
      <VolunteersClient initialVolunteers={volunteers} initialApplications={pendingApps} />
    </div>
  );
}
