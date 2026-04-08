import { adminDb } from "@/lib/firebase/admin";
import CoordinatorsClient from "./client";

export const dynamic = "force-dynamic";

export default async function AdminCoordinatorsPage() {
  const usersSnap = await adminDb
    .collection("users")
    .where("role", "==", "event_coordinator")
    .orderBy("createdAt", "desc")
    .get();

  const coordinators = JSON.parse(JSON.stringify(usersSnap.docs.map(doc => {
    const data = doc.data();
    return {
      uid: doc.id,
      ...data,
      createdAt: data.createdAt?.toDate?.()?.toISOString() || null,
      updatedAt: data.updatedAt?.toDate?.()?.toISOString() || null,
    };
  })));

  return (
    <div className="p-8 lg:p-16 text-foreground max-w-7xl">
      <header className="mb-16">
        <p className="text-[11px] uppercase tracking-[0.12em] font-bold text-primary/70 mb-3">
          Personnel
        </p>
        <h1 className="text-5xl font-serif tracking-tight text-foreground mb-4">
          Event Coordinators
        </h1>
        <p className="text-foreground/60 font-light max-w-lg leading-relaxed">
          Review, approve, and manage Event Coordinators across the HopeNGO network.
        </p>
      </header>
      <CoordinatorsClient initialCoordinators={coordinators} />
    </div>
  );
}
