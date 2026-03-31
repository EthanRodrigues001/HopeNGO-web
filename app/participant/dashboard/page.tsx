"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase/client";
import { Calendar, Ticket, ArrowRight, Loader2, Award, Download, ExternalLink } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getParticipantDashboardData } from "./actions";

export default function ParticipantDashboard() {
  const [loading, setLoading] = useState(true);
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [availableEvents, setAvailableEvents] = useState<any[]>([]);
  const [certificates, setCertificates] = useState<any[]>([]);
  const router = useRouter();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push("/login");
        return;
      }

      try {
        const data = await getParticipantDashboardData();
        setRegistrations(data.registrations);
        setAvailableEvents(data.availableEvents);
        setCertificates(data.certificates || []);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    });
    return () => unsub();
  }, [router]);

  return (
    <div className="p-8 lg:p-16 text-foreground max-w-7xl">
      <header className="mb-16">
        <p className="text-[11px] uppercase tracking-[0.12em] font-bold text-foreground/40 mb-3">
          Community Portal
        </p>
        <h1 className="text-5xl font-serif tracking-tight text-foreground mb-4">
          Participant Record
        </h1>
        <p className="text-foreground/60 font-light max-w-lg leading-relaxed">
          Track your event presence, register for new operations, and download official certificates here.
        </p>
      </header>

      {loading ? (
        <div className="p-20 flex justify-center items-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="flex flex-col gap-16">

          {/* Certificates Section */}
          {certificates.length > 0 && (
            <section>
              <div className="mb-8 flex items-center justify-between">
                <h2 className="text-2xl font-serif text-foreground flex items-center gap-3">
                  <Award className="text-amber-600/70" size={20} strokeWidth={1.5} />
                  My Certificates
                </h2>
                <Badge variant="secondary" className="shadow-none">
                  {certificates.length}
                </Badge>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {certificates.map((cert) => (
                  <Card
                    key={cert.id}
                    className="bg-card shadow-[0_32px_64px_-12px_rgba(25,28,26,0.03)] border-0 ring-1 ring-foreground/[0.04] rounded-[20px] flex flex-col group hover:shadow-[0_32px_64px_-12px_rgba(25,28,26,0.06)] transition-all"
                  >
                    <CardHeader className="p-8 pb-4">
                      <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 rounded-[12px] bg-amber-600/10 flex items-center justify-center">
                          <Award className="text-amber-600" size={24} strokeWidth={1.5} />
                        </div>
                        <Badge
                          variant="outline"
                          className="uppercase tracking-widest text-[9px] font-bold shadow-none rounded-sm border-primary/20 text-primary bg-primary/[0.05]"
                        >
                          {cert.recipientRole === "volunteer" ? "Volunteering" : "Participation"}
                        </Badge>
                      </div>
                      <CardTitle className="text-xl font-serif font-medium leading-[1.2] line-clamp-2">
                        {cert.eventTitle}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="px-8 pb-4 flex-1">
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between text-foreground/50 font-light">
                          <span>Certificate No.</span>
                          <span className="font-mono text-xs text-foreground/70">{cert.certificateNumber}</span>
                        </div>
                        <div className="flex justify-between text-foreground/50 font-light">
                          <span>Event Date</span>
                          <span className="text-foreground/70">
                            {cert.eventDate
                              ? new Date(cert.eventDate).toLocaleDateString("en-IN", {
                                  day: "numeric", month: "short", year: "numeric",
                                })
                              : "N/A"}
                          </span>
                        </div>
                        <div className="flex justify-between text-foreground/50 font-light">
                          <span>Issued</span>
                          <span className="text-foreground/70">
                            {cert.issuedDate
                              ? new Date(cert.issuedDate).toLocaleDateString("en-IN", {
                                  day: "numeric", month: "short", year: "numeric",
                                })
                              : "N/A"}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="p-8 pt-4 flex gap-3">
                      <a
                        href={`/api/certificates/${cert.id}/download`}
                        download
                        className="flex-1"
                      >
                        <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground h-12 shadow-none rounded-[8px] text-xs font-bold uppercase tracking-[0.12em] gap-2">
                          <Download size={14} /> Download PDF
                        </Button>
                      </a>
                      {cert.qrVerifyUrl && (
                        <a
                          href={cert.qrVerifyUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Button
                            variant="outline"
                            className="h-12 shadow-none rounded-[8px] border-foreground/[0.08] hover:bg-muted px-4"
                          >
                            <ExternalLink size={14} />
                          </Button>
                        </a>
                      )}
                    </CardFooter>
                  </Card>
                ))}
              </div>
            </section>
          )}

          {/* My Tickets Section */}
          <section>
            <div className="mb-8 flex items-center justify-between">
              <h2 className="text-2xl font-serif text-foreground flex items-center gap-3">
                <Ticket className="text-primary/70" size={20} strokeWidth={1.5} />
                Active Tickets
              </h2>
              <Badge variant="secondary" className="shadow-none">
                {registrations.length}
              </Badge>
            </div>

            {registrations.length === 0 ? (
              <div className="p-12 rounded-[20px] bg-muted/30 flex flex-col items-center justify-center text-center">
                <Calendar className="w-10 h-10 text-primary/30 mb-4" strokeWidth={1} />
                <h3 className="font-serif text-xl mb-2 text-foreground">No Registrations Found</h3>
                <p className="text-sm text-foreground/50 font-light max-w-sm">
                  You haven&apos;t reserved a seat for any upcoming events. Browse available events below.
                </p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {registrations.map((reg) => (
                  <Card
                    key={reg.id}
                    className="bg-card shadow-[0_32px_64px_-12px_rgba(25,28,26,0.03)] border-0 ring-0 rounded-[20px]"
                  >
                    <CardHeader className="p-8 pb-4">
                      <Badge
                        variant="default"
                        className="w-fit text-[9px] uppercase tracking-[0.12em] font-bold shadow-none rounded-sm mb-4"
                      >
                        {reg.status || "Registered"}
                      </Badge>
                      <CardTitle className="text-xl font-serif font-medium leading-[1.3]">
                        Event ID:{" "}
                        <span className="font-sans font-mono text-sm bg-muted px-2 py-1 rounded ml-2">
                          {reg.eventId.substring(0, 8)}
                        </span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="px-8 pb-8 font-light text-sm text-foreground/60">
                      Reserved on:{" "}
                      {reg.registrationDate
                        ? new Date(
                            reg.registrationDate._seconds
                              ? reg.registrationDate._seconds * 1000
                              : reg.registrationDate
                          ).toLocaleDateString()
                        : "Recent"}
                    </CardContent>
                    <CardFooter className="p-8 pt-0">
                      <Link href={`/events/${reg.eventId}`} className="w-full">
                        <Button
                          variant="outline"
                          className="w-full text-xs uppercase tracking-[0.12em] font-bold shadow-none rounded-[8px] h-12 border-foreground/[0.08] hover:bg-muted"
                        >
                          View Event Details
                        </Button>
                      </Link>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </section>

          {/* Available Events Section */}
          <section>
            <div className="mb-8 flex items-center justify-between">
              <h2 className="text-2xl font-serif text-foreground flex items-center gap-3">
                <Calendar className="text-primary/70" size={20} strokeWidth={1.5} />
                Open Operations
              </h2>
            </div>

            {availableEvents.length === 0 ? (
              <div className="p-10 rounded-[20px] bg-muted/20 flex flex-col items-center justify-center text-center">
                <p className="text-sm text-foreground/50 font-light italic">
                  No public events are currently accepting registrations.
                </p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {availableEvents.map((event) => (
                  <Card
                    key={event.id}
                    className="bg-muted/30 shadow-none hover:shadow-[0_32px_64px_-12px_rgba(25,28,26,0.05)] hover:bg-card border-0 ring-0 transition-all rounded-[20px] flex flex-col group"
                  >
                    {event.bannerImageUrl && (
                      <div className="h-40 w-full overflow-hidden relative rounded-t-[20px]">
                        <img
                          src={event.bannerImageUrl}
                          alt={event.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
                      </div>
                    )}
                    <CardHeader className={`p-8 pb-4 relative z-10 ${event.bannerImageUrl ? "-mt-8" : ""}`}>
                      <div className="flex gap-2 mb-3">
                        <span className="text-[9px] uppercase tracking-[0.12em] font-bold bg-primary text-primary-foreground px-2 py-1 rounded-sm">
                          {event.eventType}
                        </span>
                      </div>
                      <CardTitle className="text-xl font-serif font-medium leading-[1.2] line-clamp-2">
                        {event.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="px-8 pb-4 flex-1">
                      <p className="text-xs font-light text-foreground/50 mb-2">
                        {new Date(event.eventDate).toLocaleDateString()} • {event.city}
                      </p>
                      <p className="text-sm text-foreground/70 line-clamp-2">{event.description}</p>
                    </CardContent>
                    <CardFooter className="p-8 pt-0">
                      <Link href={`/events/${event.id}`} className="w-full">
                        <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground h-12 shadow-none rounded-[8px] text-xs font-bold uppercase tracking-[0.12em] gap-2">
                          Reserve Seat <ArrowRight size={14} />
                        </Button>
                      </Link>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
