import { adminAuth, adminDb } from "@/lib/firebase/admin";
import { cookies } from "next/headers";
import { EventsGrid } from "@/components/events/EventsGrid";

export const dynamic = "force-dynamic";

export default async function EventsPage() {
  const eventsSnap = await adminDb
    .collection("events")
    .orderBy("createdAt", "desc")
    .get();

  const events = eventsSnap.docs.map((doc) => {
    const data = doc.data();
    const rawDate = data.eventDate;
    const eventDate = rawDate?.toDate?.()
      ? rawDate.toDate().toISOString()
      : rawDate?._seconds
      ? new Date(rawDate._seconds * 1000).toISOString()
      : typeof rawDate === "string"
      ? rawDate
      : null;

    return {
      id: doc.id,
      title: data.title ?? null,
      description: data.description ?? null,
      eventType: data.eventType ?? null,
      city: data.city ?? null,
      startTime: data.startTime ?? null,
      endTime: data.endTime ?? null,
      bannerImageUrl: data.bannerImageUrl ?? null,
      volunteerRegistrationOpen: data.volunteerRegistrationOpen ?? false,
      maxParticipants: data.maxParticipants ?? null,
      maxVolunteers: data.maxVolunteers ?? null,
      participantCount: data.participantCount ?? 0,
      volunteerCount: data.volunteerCount ?? 0,
      totalDonations: data.totalDonations ?? 0,
      donationCount: data.donationCount ?? 0,
      status: data.status ?? "draft",
      eventDate,
    };
  });

  let role: string | null = null;
  let registeredSet = new Set<string>();

  const cookieStore = await cookies();
  const session = cookieStore.get("session")?.value;
  if (session) {
    try {
      const decoded = await adminAuth.verifySessionCookie(session, true);
      const userSnap = await adminDb.doc(`users/${decoded.uid}`).get();
      role = userSnap.data()?.role ?? null;

      if (role === "volunteer") {
        const snaps = await adminDb
          .collection("volunteerApplications")
          .where("volunteerId", "==", decoded.uid)
          .get();
        snaps.docs.forEach((d) => registeredSet.add(d.data().eventId));
      }
    } catch {
      // invalid or expired session — treat as logged out
    }
  }

  return (
    <div className="min-h-screen bg-background p-8 lg:p-16 text-foreground font-sans">
      <header className="mb-20 text-center max-w-2xl mx-auto">
        <p className="text-[11px] uppercase tracking-[0.1em] font-bold text-primary mb-3">
          Field Operations
        </p>
        <h1 className="text-5xl lg:text-6xl font-serif font-medium tracking-tight text-foreground mb-6">
          Upcoming Events
        </h1>
        <p className="text-foreground/60 text-lg font-light leading-relaxed">
          Join hands with HopeNGO and step into the community network. Browse active
          campaigns or check future assignments.
        </p>
      </header>

      {events.length === 0 ? (
        <div className="text-center p-16 rounded-[20px] bg-muted/30 max-w-3xl mx-auto">
          <h3 className="font-serif text-2xl mb-2 text-foreground">No Ongoing Events</h3>
          <p className="text-foreground/60 font-light">
            The field log is currently empty. Check back later for new engagements.
          </p>
        </div>
      ) : (
        <EventsGrid
          events={events}
          role={role}
          registeredEventIds={Array.from(registeredSet)}
        />
      )}
    </div>
  );
}
