import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { cookies } from "next/headers";
import { adminAuth, adminDb } from "@/lib/firebase/admin";
import { VolunteerApplyButton } from "@/components/events/RegisterButtons";

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
        : typeof rawDate === 'string' ? rawDate : null;
    return {
      id: doc.id,
      ...data,
      eventDate,
    };
  });

  let role = null;
  let registeredSet = new Set<string>();
  const cookieStore = await cookies();
  const session = cookieStore.get("session")?.value;
  if (session) {
    try {
      const decoded = await adminAuth.verifySessionCookie(session, true);
      const userSnap = await adminDb.doc(`users/${decoded.uid}`).get();
      role = userSnap.data()?.role;
      
   if (role === 'volunteer') {
         const snaps = await adminDb.collection("volunteerApplications").where("volunteerId", "==", decoded.uid).get();
         snaps.docs.forEach(doc => registeredSet.add(doc.data().eventId));
      }
    } catch (e) {
      // invalid session
    }
  }

  return (
    <div className="min-h-screen bg-background p-8 lg:p-16 text-foreground font-sans">
      <header className="mb-20 text-center max-w-2xl mx-auto">
        <p className="text-[11px] uppercase tracking-[0.1em] font-bold text-primary mb-3">Field Operations</p>
        <h1 className="text-5xl lg:text-6xl font-serif font-medium tracking-tight text-foreground mb-6">Upcoming Events</h1>
        <p className="text-foreground/60 text-lg font-light leading-relaxed">Join hands with HopeNGO and step into the community network. Browse active campaigns or check future assignments.</p>
      </header>

      {events.length === 0 ? (
        <div className="text-center p-16 rounded-[20px] bg-muted/30 max-w-3xl mx-auto">
          <h3 className="font-serif text-2xl mb-2 text-foreground">No Ongoing Events</h3>
          <p className="text-foreground/60 font-light">The field log is currently empty. Check back later for new engagements.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-10 max-w-7xl mx-auto">
          {events.map((event: any) => (
            <Card key={event.id} className="bg-card border-0 ring-0 overflow-hidden shadow-[0_32px_64px_-12px_rgba(25,28,26,0.03)] hover:shadow-[0_32px_64px_-12px_rgba(25,28,26,0.06)] transition-all flex flex-col rounded-[20px]">
              {event.bannerImageUrl ? (
                <div className="h-56 overflow-hidden bg-muted">
                  <img src={event.bannerImageUrl} alt={event.title} className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="h-56 bg-muted/40 flex items-center justify-center">
                  <span className="text-6xl">🖼</span>
                </div>
              )}
              <CardHeader className="p-8 pb-4">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-primary bg-primary/10 px-3 py-1.5 rounded-full">
                    {event.eventType || "Event"}
                  </span>
                  <span className="text-xs font-semibold text-foreground/50 uppercase tracking-wider">{event.eventDate ? new Date(event.eventDate).toLocaleDateString('en-US', {month: 'short', day: 'numeric', year: 'numeric'}) : 'TBD'}</span>
                </div>
                <CardTitle className="text-2xl font-serif font-medium tracking-tight text-foreground leading-[1.2] mb-1 line-clamp-2">{event.title}</CardTitle>
                <div className="text-sm font-light text-foreground/60">
                  {event.startTime} - {event.endTime} | {event.city}
                </div>
              </CardHeader>
              <CardContent className="px-8 flex-1">
                <p className="text-foreground/70 text-sm font-light leading-relaxed line-clamp-3 mb-6">{event.description}</p>
                <div className="pt-4 bg-muted/20 -mx-8 px-8 py-4 rounded-none flex flex-col gap-3 text-[13px] font-light">
                  <div className="flex justify-between items-center">
                    <span className="text-foreground/50">Participants</span>
                    <span className="text-foreground font-medium">{event.participantCount || 0} / {event.maxParticipants || '∞'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-foreground/50">Volunteers</span>
                    <span className="text-foreground font-medium">{event.volunteerCount || 0} / {event.maxVolunteers || '∞'}</span>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="p-8 pt-0 mt-4">
                {!role ? (
                  <Link href={`/events/${event.id}`} className="w-full">
                    <Button variant="outline" className="w-full h-12 text-sm uppercase tracking-widest font-semibold text-foreground border-foreground/10 hover:bg-foreground/5 shadow-none rounded-[8px]">View Details</Button>
                  </Link>
                ) : role === 'volunteer' ? (
                  <VolunteerApplyButton eventId={event.id} disabled={!event.volunteerRegistrationOpen} isRegistered={registeredSet.has(event.id)} />
                ) : (
                  <Link href={`/admin/events/${event.id}`} className="w-full">
                    <Button variant="secondary" className="w-full h-12 text-sm uppercase tracking-widest font-semibold bg-muted hover:bg-muted/80 text-foreground shadow-none rounded-[8px]">Manage Event</Button>
                  </Link>
                )}
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
