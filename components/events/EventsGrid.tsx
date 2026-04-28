"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart, IndianRupee } from "lucide-react";
import { VolunteerApplyButton } from "@/components/events/RegisterButtons";
import { EventDonateModal } from "@/components/events/EventDonateModal";

interface Event {
  id: string;
  title: string | null;
  description: string | null;
  eventType: string | null;
  city: string | null;
  startTime: string | null;
  endTime: string | null;
  bannerImageUrl: string | null;
  volunteerRegistrationOpen: boolean;
  maxParticipants: number | null;
  maxVolunteers: number | null;
  participantCount: number;
  volunteerCount: number;
  totalDonations: number;
  donationCount: number;
  status: string;
  eventDate: string | null;
}

interface Props {
  events: Event[];
  role: string | null;
  registeredEventIds: string[];
}

export function EventsGrid({ events, role, registeredEventIds }: Props) {
  const registeredSet = new Set(registeredEventIds);
  const [donatingEventId, setDonatingEventId] = useState<string | null>(null);
  const [donatingEventTitle, setDonatingEventTitle] = useState("");

  const openDonate = (id: string, title: string) => {
    setDonatingEventId(id);
    setDonatingEventTitle(title);
  };
  const closeDonate = () => setDonatingEventId(null);

  return (
    <>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-10 max-w-7xl mx-auto">
        {events.map((event) => (
          <Card
            key={event.id}
            className="bg-card border-0 ring-0 overflow-hidden shadow-[0_32px_64px_-12px_rgba(25,28,26,0.03)] hover:shadow-[0_32px_64px_-12px_rgba(25,28,26,0.06)] transition-all flex flex-col rounded-[20px]"
          >
            {/* Banner */}
            {event.bannerImageUrl ? (
              <div className="h-56 overflow-hidden bg-muted">
                <img src={event.bannerImageUrl} alt={event.title ?? ""} className="w-full h-full object-cover" />
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
                <span className="text-xs font-semibold text-foreground/50 uppercase tracking-wider">
                  {event.eventDate
                    ? new Date(event.eventDate).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })
                    : "TBD"}
                </span>
              </div>
              <CardTitle className="text-2xl font-serif font-medium tracking-tight text-foreground leading-[1.2] mb-1 line-clamp-2">
                {event.title}
              </CardTitle>
              <div className="text-sm font-light text-foreground/60">
                {event.startTime} - {event.endTime} | {event.city}
              </div>
            </CardHeader>

            <CardContent className="px-8 flex-1">
              <p className="text-foreground/70 text-sm font-light leading-relaxed line-clamp-3 mb-6">
                {event.description}
              </p>

              {/* Stats */}
              <div className="pt-4 bg-muted/20 -mx-8 px-8 py-4 rounded-none flex flex-col gap-3 text-[13px] font-light">
                <div className="flex justify-between items-center">
                  <span className="text-foreground/50">Volunteers</span>
                  <span className="text-foreground font-medium">
                    {event.volunteerCount || 0} / {event.maxVolunteers || "∞"}
                  </span>
                </div>

                {/* Donations raised */}
                {event.totalDonations > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-foreground/50 flex items-center gap-1">
                      <Heart size={11} className="text-primary/60" /> Raised
                    </span>
                    <span className="text-primary font-semibold text-sm">
                      ₹{event.totalDonations.toLocaleString("en-IN")}
                      <span className="text-foreground/35 font-normal text-xs ml-1">
                        ({event.donationCount} donor{event.donationCount !== 1 ? "s" : ""})
                      </span>
                    </span>
                  </div>
                )}
              </div>
            </CardContent>

            <CardFooter className="p-8 pt-0 mt-4 flex flex-col gap-3">
              {/* Primary action */}
              {!role ? (
                <Link href={`/events/${event.id}`} className="w-full">
                  <Button
                    variant="outline"
                    className="w-full h-12 text-sm uppercase tracking-widest font-semibold text-foreground border-foreground/10 hover:bg-foreground/5 shadow-none rounded-[8px]"
                  >
                    View Details
                  </Button>
                </Link>
              ) : role === "volunteer" ? (
                <VolunteerApplyButton
                  eventId={event.id}
                  disabled={!event.volunteerRegistrationOpen}
                  isRegistered={registeredSet.has(event.id)}
                />
              ) : (
                <Link href={`/admin/events/${event.id}`} className="w-full">
                  <Button
                    variant="secondary"
                    className="w-full h-12 text-sm uppercase tracking-widest font-semibold bg-muted hover:bg-muted/80 text-foreground shadow-none rounded-[8px]"
                  >
                    Manage Event
                  </Button>
                </Link>
              )}

              {/* Donate button — always visible */}
              {role !== "admin" && role !== "event_coordinator" && (
                <Button
                  variant="outline"
                  onClick={() => openDonate(event.id, event.title ?? "This Event")}
                  className="w-full h-10 text-[11px] uppercase tracking-widest font-bold border-primary/20 text-primary hover:bg-primary/5 shadow-none rounded-[8px] gap-2 transition-colors"
                >
                  <Heart size={13} />
                  Donate to this Event
                </Button>
              )}
            </CardFooter>
          </Card>
        ))}
      </div>

      {/* Donate Modal */}
      {donatingEventId && (
        <EventDonateModal
          eventId={donatingEventId}
          eventTitle={donatingEventTitle}
          onClose={closeDonate}
        />
      )}
    </>
  );
}
