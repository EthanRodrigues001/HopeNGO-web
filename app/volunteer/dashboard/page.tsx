"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase/client";
import { Briefcase, Flag, Award, ArrowRight, Download, Loader2, Search, ExternalLink } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getVolunteerDashboardData } from "./actions";

export default function VolunteerDashboard() {
  const [loading, setLoading] = useState(true);
  const [applications, setApplications] = useState<any[]>([]);
  const [availableEvents, setAvailableEvents] = useState<any[]>([]);
  const [certificates, setCertificates] = useState<any[]>([]);
  const router = useRouter();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const data = await getVolunteerDashboardData();
        setApplications(data.applications);
        setAvailableEvents(data.availableEvents);
        setCertificates(data.certificates || []);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    });
    return () => unsub();
  }, []);

  return (
    <div className="p-8 lg:p-16 text-foreground max-w-7xl">
      <header className="mb-16">
        <p className="text-[11px] uppercase tracking-[0.12em] font-bold text-primary/70 mb-3">
          Operative Station
        </p>
        <h1 className="text-5xl font-serif tracking-tight text-foreground mb-4">
          Volunteer Feed
        </h1>
        <p className="text-foreground/60 font-light max-w-lg leading-relaxed">
          View your field assignments, application statuses, and apply for new operations.
        </p>
      </header>

      {loading ? (
        <div className="p-20 flex justify-center items-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="flex flex-col gap-16">

          {/* My Assignments Section */}
          <section>
            <div className="mb-8 flex items-center justify-between">
              <h2 className="text-2xl font-serif text-foreground flex items-center gap-3">
                <Briefcase className="text-primary/70" size={20} strokeWidth={1.5} />
                Active Assignments
              </h2>
              <Badge variant="secondary" className="shadow-none">
                {applications.length}
              </Badge>
            </div>

            {applications.length === 0 ? (
              <div className="p-12 rounded-[20px] bg-muted/30 flex flex-col items-center justify-center text-center">
                <Briefcase className="w-10 h-10 text-primary/30 mb-4" strokeWidth={1} />
                <h3 className="font-serif text-xl mb-2 text-foreground">No Assignments</h3>
                <p className="text-sm text-foreground/50 font-light max-w-sm">
                  Your application log is empty. Browse available directives below to join the field.
                </p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {applications.map((app) => (
                  <Card
                    key={app.id}
                    className="bg-card shadow-[0_32px_64px_-12px_rgba(25,28,26,0.03)] border-0 ring-0 rounded-[20px] flex flex-col"
                  >
                    <CardHeader className="p-8 pb-4">
                      <Badge
                        variant={
                          app.status === "approved"
                            ? "default"
                            : app.status === "rejected"
                            ? "destructive"
                            : "outline"
                        }
                        className="w-fit text-[9px] uppercase tracking-[0.12em] font-bold shadow-none rounded-sm mb-4"
                      >
                        {app.status || "Pending"}
                      </Badge>
                      <CardTitle className="text-xl font-serif font-medium leading-[1.3]">
                        Operation ID:{" "}
                        <span className="font-sans font-mono text-sm bg-muted px-2 py-1 rounded ml-2">
                          {app.eventId.substring(0, 8)}
                        </span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="px-8 pb-8 flex-1 font-light text-sm text-foreground/60">
                      Dispatched on:{" "}
                      {app.appliedAt
                        ? new Date(
                            app.appliedAt._seconds
                              ? app.appliedAt._seconds * 1000
                              : app.appliedAt
                          ).toLocaleDateString()
                        : "Recent"}
                    </CardContent>
                    <CardFooter className="p-8 pt-0">
                      <Link href={`/events/${app.eventId}`} className="w-full">
                        <Button
                          variant="outline"
                          className="w-full text-xs uppercase tracking-[0.12em] font-bold shadow-none rounded-[8px] h-12 border-foreground/[0.08] hover:bg-muted gap-2"
                        >
                          <Search size={14} /> Review Intel
                        </Button>
                      </Link>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </section>

          {/* Certificates Section */}
          <section>
            <div className="mb-8 flex items-center justify-between">
              <h2 className="text-2xl font-serif text-foreground flex items-center gap-3">
                <Award className="text-primary/70" size={20} strokeWidth={1.5} />
                My Certificates
              </h2>
              <div className="flex items-center gap-3">
                <Badge variant="secondary" className="shadow-none">
                  {certificates.length}
                </Badge>
                <Link href="/volunteer/certificates" className="text-[11px] uppercase tracking-[0.10em] font-bold text-primary hover:text-primary/70 transition-colors flex items-center gap-1">
                  View All <ExternalLink size={11} />
                </Link>
              </div>
            </div>

            {certificates.length === 0 ? (
              <div className="p-10 rounded-[20px] bg-muted/20 flex flex-col items-center justify-center text-center gap-3">
                <Award className="w-8 h-8 text-primary/20" strokeWidth={1} />
                <p className="text-sm text-foreground/50 font-light">
                  No certificates yet. They appear here once admin marks your attendance.
                </p>
                <Link href="/volunteer/certificates" className="text-xs text-primary font-semibold hover:underline">
                  Go to My Certificates →
                </Link>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {certificates.slice(0, 3).map((cert: any) => (
                  <Card key={cert.id} className="bg-card shadow-[0_32px_64px_-12px_rgba(25,28,26,0.03)] border-0 ring-1 ring-primary/20 rounded-[20px] bg-gradient-to-br from-card to-primary/5 flex flex-col p-8 text-foreground gap-4">
                    <div>
                      <p className="text-[10px] uppercase tracking-widest font-bold text-primary mb-2">Certificate of Service</p>
                      <h3 className="text-lg font-serif leading-[1.3] mb-1">{cert.eventTitle}</h3>
                      <p className="text-xs font-light text-foreground/50 font-mono">{cert.certificateNumber}</p>
                    </div>
                    <div className="flex gap-2 mt-auto">
                      <a href={`/api/certificates/${cert.id}/download`} download className="flex-1">
                        <Button className="w-full h-9 bg-primary hover:bg-primary/90 text-primary-foreground text-[10px] uppercase tracking-[0.12em] font-bold shadow-none rounded-[8px] gap-1.5">
                          <Download size={12} /> PDF
                        </Button>
                      </a>
                      {cert.qrVerifyUrl && (
                        <a href={cert.qrVerifyUrl} target="_blank" rel="noopener noreferrer">
                          <Button variant="outline" size="icon" className="h-9 w-9 shadow-none rounded-[8px] border-primary/20 hover:bg-primary/5 text-foreground/50">
                            <ExternalLink size={12} />
                          </Button>
                        </a>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </section>

          {/* Available Operations Section */}
          <section>
            <div className="mb-8 flex items-center justify-between">
              <h2 className="text-2xl font-serif text-foreground flex items-center gap-3">
                <Flag className="text-primary/60" size={20} strokeWidth={1.5} />
                Pending Call to Action
              </h2>
            </div>

            {availableEvents.length === 0 ? (
              <div className="p-10 rounded-[20px] bg-muted/20 flex flex-col items-center justify-center text-center">
                <p className="text-sm text-foreground/50 font-light italic">
                  No public field operations require operatives at this moment.
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
                        <div className="absolute inset-0 bg-gradient-to-t from-background/90 to-transparent" />
                      </div>
                    )}
                    <CardHeader className={`p-8 pb-4 relative z-10 ${event.bannerImageUrl ? "-mt-8" : ""}`}>
                      <div className="flex gap-2 mb-3">
                        <span className="text-[9px] uppercase tracking-[0.12em] font-bold bg-accent text-accent-foreground px-2 py-1 rounded-sm">
                          Logistics Needed
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
                          Volunteer <ArrowRight size={14} />
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
