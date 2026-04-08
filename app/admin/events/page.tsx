import { adminDb } from "@/lib/firebase/admin";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PlusCircle, Calendar as CalendarIcon, MapPin, Users, Ticket, ArrowRight } from "lucide-react";

export const dynamic = "force-dynamic";

function formatFirestoreDate(dateVal: any): string | null {
  if (!dateVal) return null;
  if (dateVal._seconds) return new Date(dateVal._seconds * 1000).toISOString();
  if (dateVal.seconds) return new Date(dateVal.seconds * 1000).toISOString();
  if (dateVal.toDate) return dateVal.toDate().toISOString();
  if (typeof dateVal === 'string') return dateVal;
  return null;
}

export default async function AdminEventsPage() {
  const eventsSnap = await adminDb
    .collection("events")
    .orderBy("createdAt", "desc")
    .get();

  const events = eventsSnap.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      eventDate: formatFirestoreDate(data.eventDate),
    };
  }) as any[];

  return (
    <div className="p-8 lg:p-16 text-foreground max-w-7xl">
      <header className="mb-16 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <p className="text-[11px] uppercase tracking-[0.12em] font-bold text-primary/70 mb-3">
            Field Operations
          </p>
          <h1 className="text-5xl font-serif tracking-tight text-foreground mb-4">
            Manage Events
          </h1>
          <p className="text-foreground/60 font-light max-w-lg leading-relaxed">
            Create, edit, and oversee all your NGO campaigns from the archive.
          </p>
        </div>
        <Link href="/admin/events/new">
          <Button className="h-12 shadow-none rounded-[8px] bg-primary hover:bg-primary/90 text-primary-foreground px-6 font-semibold uppercase tracking-[0.12em] text-xs flex gap-2 transition-all">
            <PlusCircle size={16} />
            New Event
          </Button>
        </Link>
      </header>

      {events.length === 0 ? (
        <div className="text-center p-16 rounded-[20px] bg-muted/30 max-w-3xl mx-auto flex flex-col items-center">
          <CalendarIcon size={48} className="text-primary/30 mb-4" strokeWidth={1} />
          <h3 className="font-serif text-2xl mb-2 text-foreground">Archive Empty</h3>
          <p className="text-sm text-foreground/50 font-light mb-8">
            You haven&apos;t initiated any field operations yet.
          </p>
          <Link href="/admin/events/new">
            <Button
              variant="outline"
              className="h-12 uppercase tracking-[0.12em] font-semibold text-xs border-foreground/[0.08] shadow-none rounded-[8px]"
            >
              Create your first event
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {events.map((event) => (
            <Card
              key={event.id}
              className="bg-card border-0 ring-0 overflow-hidden shadow-[0_32px_64px_-12px_rgba(25,28,26,0.03)] hover:shadow-[0_32px_64px_-12px_rgba(25,28,26,0.06)] transition-all flex flex-col rounded-[20px] group"
            >
              {event.bannerImageUrl ? (
                <div className="h-48 overflow-hidden bg-muted relative">
                  <img
                    src={event.bannerImageUrl}
                    alt={event.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute top-4 right-4 z-20">
                    <Badge
                      variant={
                        event.status === "upcoming"
                          ? "default"
                          : event.status === "ongoing"
                          ? "secondary"
                          : "outline"
                      }
                      className="uppercase tracking-[0.12em] text-[9px] font-bold px-2 py-1 shadow-none rounded-sm"
                    >
                      {event.status}
                    </Badge>
                  </div>
                </div>
              ) : (
                <div className="h-48 bg-muted/40 flex items-center justify-center relative">
                  <span className="text-6xl opacity-20">🖼</span>
                </div>
              )}

              <CardHeader className="p-8 pb-4">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-primary bg-primary/10 px-3 py-1.5 rounded-full">
                    {event.eventType || "Event"}
                  </span>
                </div>
                <CardTitle className="text-2xl font-serif font-medium tracking-tight text-foreground leading-[1.2] mb-1 line-clamp-2">
                  {event.title}
                </CardTitle>
              </CardHeader>

              <CardContent className="px-8 pb-4 flex-1 flex flex-col">
                <div className="flex flex-col gap-3 flex-1 mb-8">
                  <div className="flex items-center text-[13px] font-light text-foreground/50 gap-3">
                    <CalendarIcon size={14} className="text-primary/50" />
                    <span>
                      {new Date(event.eventDate).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}{" "}
                      • {event.startTime} - {event.endTime}
                    </span>
                  </div>
                  <div className="flex items-center text-[13px] font-light text-foreground/50 gap-3">
                    <MapPin size={14} className="text-primary/50" />
                    <span className="line-clamp-1">
                      {event.venue}, {event.city}
                    </span>
                  </div>
                </div>

                <div className="pt-6 bg-muted/30 -mx-8 px-8 pb-4 rounded-b-none grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-[10px] text-foreground/40 font-bold uppercase tracking-[0.12em] mb-1 flex items-center gap-1.5">
                      <Ticket size={12} className="opacity-70" /> Presence
                    </div>
                    <div className="text-base text-foreground font-medium">
                      {event.participantCount || 0}{" "}
                      <span className="text-sm text-foreground/40 font-light">
                        / {event.maxParticipants || "∞"}
                      </span>
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-foreground/40 font-bold uppercase tracking-[0.12em] mb-1 flex items-center gap-1.5">
                      <Users size={12} className="opacity-70" /> Ops
                    </div>
                    <div className="text-base text-foreground font-medium">
                      {event.volunteerCount || 0}{" "}
                      <span className="text-sm text-foreground/40 font-light">
                        / {event.maxVolunteers || "∞"}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>

              <CardFooter className="p-8 pt-4">
                <Link href={`/admin/events/${event.id}`} className="w-full">
                  <Button
                    variant="secondary"
                    className="w-full h-12 bg-muted hover:bg-muted/80 text-foreground text-xs uppercase tracking-[0.12em] font-semibold shadow-none rounded-[8px] flex items-center justify-center group-hover:bg-primary/[0.06] transition-all"
                  >
                    Manage Details{" "}
                    <ArrowRight
                      size={14}
                      className="ml-2 group-hover:translate-x-1 duration-300"
                    />
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
