import { adminDb } from "@/lib/firebase/admin";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Ticket, Users, FileText, CheckCircle2, LockIcon, Award, UserCog, ClipboardCheck } from "lucide-react";
import EventActionsClient from "./actions";
import EventDetailClient from "./detail-client";

export const dynamic = "force-dynamic";

function formatFirestoreDate(dateVal: any): string | null {
  if (!dateVal) return null;
  if (dateVal._seconds) return new Date(dateVal._seconds * 1000).toISOString();
  if (dateVal.seconds) return new Date(dateVal.seconds * 1000).toISOString();
  if (typeof dateVal === 'string') return dateVal;
  if (dateVal.toDate) return dateVal.toDate().toISOString();
  return null;
}

export default async function AdminEventDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const eventSnap = await adminDb.doc(`events/${id}`).get();
  if (!eventSnap.exists) {
    notFound();
  }

  const rawEvent = eventSnap.data()!;
  const eventDate = formatFirestoreDate(rawEvent.eventDate);

  const event = JSON.parse(JSON.stringify({
    id,
    ...rawEvent,
    eventDate,
    createdAt: formatFirestoreDate(rawEvent.createdAt),
    updatedAt: formatFirestoreDate(rawEvent.updatedAt),
  }));

  // Fetch applied/accepted volunteers for this event
  const volsSnap = await adminDb
    .collection("volunteerApplications")
    .where("eventId", "==", id)
    .where("status", "in", ["pending", "approved"])
    .get();

  const volunteers = JSON.parse(JSON.stringify(volsSnap.docs.map(doc => {
    const d = doc.data();
    return {
      id: doc.id,
      volunteerName: d.volunteerName,
      volunteerId: d.volunteerId,
      status: d.status,
      attendance: d.attendance,
      appliedAt: formatFirestoreDate(d.appliedAt),
    };
  })));

  // Compute non-recurring attendance from approved volunteers
  const approvedVolunteers = volunteers.filter((v: any) => v.status === "approved");
  const attendanceSummary = {
    total: approvedVolunteers.length,
    attended: approvedVolunteers.filter((v: any) => v.attendance === "attended").length,
    absent: approvedVolunteers.filter((v: any) => v.attendance === "absent").length,
    registered: approvedVolunteers.filter((v: any) => v.attendance !== "attended" && v.attendance !== "absent").length,
  };

  // Fetch approved coordinators list for assignment
  const coordsSnap = await adminDb
    .collection("users")
    .where("role", "==", "event_coordinator")
    .where("isApproved", "==", true)
    .get();

  const coordinators = JSON.parse(JSON.stringify(coordsSnap.docs.map(doc => ({
    uid: doc.id,
    fullName: doc.data().fullName,
    email: doc.data().email,
  }))));

  return (
    <div className="min-h-screen bg-background font-sans p-8 lg:p-16 text-foreground">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
          <Link href="/admin/events" className="inline-flex items-center text-xs uppercase tracking-[0.1em] font-bold text-foreground/50 hover:text-primary transition-colors">
            <ArrowLeft size={16} className="mr-2" /> Back to Operations
          </Link>
          <EventActionsClient eventId={id} eventTitle={event.title} />
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left column — Event details */}
          <div className="lg:w-2/3 flex flex-col gap-6">
            <Card className="bg-card w-full shadow-[0_32px_64px_-12px_rgba(25,28,26,0.03)] border-0 ring-1 ring-foreground/[0.04] rounded-[24px] overflow-hidden">
              {event.bannerImageUrl && (
                <div className="w-full h-80 bg-muted relative">
                  <img src={event.bannerImageUrl} alt={event.title} className="w-full h-full object-cover" />
                </div>
              )}
              <CardHeader className="p-10 pb-6 border-b border-foreground/[0.03]">
                <div className="flex flex-wrap gap-3 mb-6">
                  <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-primary bg-primary/10 px-3 py-1.5 rounded-full">
                    {event.eventType}
                  </span>
                  <Badge variant={event.status === 'upcoming' ? 'default' : 'secondary'} className="uppercase tracking-widest text-[9px] font-bold px-3 py-1 shadow-none rounded-sm">
                    {event.status}
                  </Badge>
                </div>
                <CardTitle className="text-4xl md:text-5xl font-serif leading-[1.1] font-medium text-foreground tracking-tight mb-2">{event.title}</CardTitle>
                <div className="text-sm font-light uppercase tracking-widest text-foreground/50 mt-4 border-l-2 border-primary pl-4">Operational Briefing</div>
              </CardHeader>
              <CardContent className="px-10 py-8 flex flex-col gap-10">
                <p className="text-foreground/70 text-lg font-light whitespace-pre-line leading-relaxed pb-6 border-b border-foreground/[0.03]">
                  {event.description}
                </p>

                <div className="grid grid-cols-2 gap-8 text-[13px]">
                  <div className="flex flex-col gap-2">
                    <h4 className="font-bold text-foreground/40 uppercase tracking-[0.1em] text-[10px]">Temporal Params</h4>
                    <p className="text-foreground font-medium text-base">
                      {eventDate ? new Date(eventDate).toLocaleDateString('en-US', {month: 'long', day: 'numeric', year: 'numeric'}) : "Date not set"}
                      <br/> <span className="font-light">{event.startTime} - {event.endTime}</span>
                    </p>
                  </div>
                  <div className="flex flex-col gap-2">
                    <h4 className="font-bold text-foreground/40 uppercase tracking-[0.1em] text-[10px]">Logistical Coords</h4>
                    <p className="text-foreground font-medium text-base">{event.venue} <br/> <span className="font-light">{event.city}, {event.state}</span></p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Volunteers Applied / Accepted */}
            <Card className="bg-card shadow-[0_16px_32px_-12px_rgba(25,28,26,0.03)] border-0 ring-1 ring-foreground/[0.04] rounded-[24px]">
              <CardHeader className="p-8 pb-4">
                <CardTitle className="text-[12px] font-bold uppercase tracking-[0.1em] text-foreground/60 flex items-center gap-2">
                  <Users className="text-cyan-600/70" strokeWidth={1.5} size={18} /> Applied & Accepted Volunteers ({volunteers.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="px-8 pb-8">
                {volunteers.length === 0 ? (
                  <p className="text-foreground/50 text-sm font-light italic py-4">No volunteer applications for this event yet.</p>
                ) : (
                  <div className="flex flex-col gap-3">
                    {volunteers.map((v: any) => (
                      <div key={v.id} className="flex items-center justify-between py-3 px-4 rounded-[10px] bg-muted/20 hover:bg-muted/40 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold">
                            {v.volunteerName?.charAt(0)?.toUpperCase() || "?"}
                          </div>
                          <span className="font-medium text-foreground text-sm">{v.volunteerName}</span>
                        </div>
                        <Badge
                          variant={v.status === "approved" ? "default" : "outline"}
                          className={`uppercase tracking-[0.1em] text-[10px] shadow-none ${
                            v.status === "approved"
                              ? "bg-primary/10 text-primary hover:bg-primary/20"
                              : "text-amber-600 border-amber-600/20 bg-amber-600/5"
                          }`}
                        >
                          {v.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
                <Link href={`/admin/events/${id}/volunteers`} className="mt-4 block">
                  <Button variant="outline" className="w-full bg-transparent border-foreground/10 hover:bg-muted text-foreground h-10 uppercase tracking-widest text-xs font-bold shadow-none rounded-[8px]">
                    Manage All Volunteers
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {event.isRecurring ? (
              <Card className="bg-card shadow-[0_16px_32px_-12px_rgba(25,28,26,0.03)] border-0 ring-1 ring-foreground/[0.04] rounded-[24px]">
                <CardHeader className="p-8 pb-4">
                  <CardTitle className="text-[12px] font-bold uppercase tracking-[0.1em] text-foreground/60 flex items-center gap-2">
                    <ClipboardCheck className="text-emerald-600/70" strokeWidth={1.5} size={18} /> Recurring Sessions
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-8 pb-8 flex flex-col gap-4">
                  <p className="text-foreground/60 font-light text-sm mb-2">This is a recurring event. View and manage attendance on a per-session basis.</p>
                  <Link href={`/admin/events/${id}/sessions`}>
                    <Button variant="outline" className="w-full bg-transparent border-foreground/10 hover:bg-muted text-foreground h-10 uppercase tracking-widest text-xs font-bold shadow-none rounded-[8px]">
                      Manage Sessions
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              <Card className="bg-card shadow-[0_16px_32px_-12px_rgba(25,28,26,0.03)] border-0 ring-1 ring-foreground/[0.04] rounded-[24px]">
                <CardHeader className="p-8 pb-4">
                  <CardTitle className="text-[12px] font-bold uppercase tracking-[0.1em] text-foreground/60 flex items-center gap-2">
                    <ClipboardCheck className="text-emerald-600/70" strokeWidth={1.5} size={18} /> Attendance Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-8 pb-8">
                  <div className="grid grid-cols-4 gap-4 mb-6">
                    <div className="bg-muted/30 rounded-[12px] p-4 text-center">
                      <p className="text-2xl font-serif text-foreground">{attendanceSummary.total}</p>
                      <p className="text-[10px] uppercase tracking-widest font-bold text-foreground/50">Total</p>
                    </div>
                    <div className="bg-primary/5 rounded-[12px] p-4 text-center">
                      <p className="text-2xl font-serif text-primary">{attendanceSummary.attended}</p>
                      <p className="text-[10px] uppercase tracking-widest font-bold text-primary/70">Attended</p>
                    </div>
                    <div className="bg-red-600/5 rounded-[12px] p-4 text-center">
                      <p className="text-2xl font-serif text-red-600">{attendanceSummary.absent}</p>
                      <p className="text-[10px] uppercase tracking-widest font-bold text-red-600/70">Absent</p>
                    </div>
                    <div className="bg-amber-600/5 rounded-[12px] p-4 text-center">
                      <p className="text-2xl font-serif text-amber-600">{attendanceSummary.registered}</p>
                      <p className="text-[10px] uppercase tracking-widest font-bold text-amber-600/70">Unmarked</p>
                    </div>
                  </div>
                  <Link href={`/admin/events/${id}/attendance`}>
                    <Button variant="outline" className="w-full bg-transparent border-foreground/10 hover:bg-muted text-foreground h-10 uppercase tracking-widest text-xs font-bold shadow-none rounded-[8px]">
                      Mark Attendance
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right column — Sidebar cards */}
          <div className="lg:w-1/3 flex flex-col gap-8">
            {/* Coordinator Assignment */}
            <EventDetailClient
              eventId={id}
              currentCoordinatorId={event.coordinatorId || null}
              currentCoordinatorName={event.coordinatorName || null}
              coordinators={coordinators}
            />

            {/* Operatives (Volunteers) */}
            <Card className="bg-card shadow-[0_16px_32px_-12px_rgba(25,28,26,0.03)] border-0 ring-1 ring-foreground/[0.04] rounded-[24px] rounded-br-[8px] flex flex-col">
              <CardHeader className="p-8 pb-4">
                <div className="flex justify-between items-center mb-1">
                  <CardTitle className="text-[12px] font-bold uppercase tracking-[0.1em] text-foreground/60 flex items-center gap-2">
                    <Users className="text-cyan-600/70" strokeWidth={1.5} size={18} /> Operatives
                  </CardTitle>
                  <div className="text-xs">
                    {event.volunteerRegistrationOpen ? (
                       <span className="text-primary flex items-center gap-1 font-bold uppercase tracking-widest text-[9px]"><CheckCircle2 size={12}/> Deploying</span>
                    ) : (
                      <span className="text-red-600/70 flex items-center gap-1 font-bold uppercase tracking-widest text-[9px]"><LockIcon size={12}/> Locked</span>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="px-8 pb-8 flex-1">
                <div className="flex justify-between items-end mb-6">
                  <div className="text-6xl font-serif text-foreground leading-none">
                    {event.volunteerCount || 0} <span className="text-xl text-foreground/30 font-sans font-light">/ {event.maxVolunteers || '∞'}</span>
                  </div>
                </div>
                <Link href={`/admin/events/${id}/volunteers`}>
                  <Button variant="outline" className="w-full bg-transparent border-foreground/10 hover:bg-muted text-foreground h-12 uppercase tracking-widest text-xs font-bold shadow-none rounded-[8px]">Command Operatives</Button>
                </Link>
              </CardContent>
            </Card>



            {/* Report */}
            <Card className="bg-muted/40 shadow-none border-0 ring-1 ring-foreground/[0.04] rounded-[24px]">
              <CardContent className="p-8">
                <Link href={`/api/events/${id}/report`}>
                  <Button className="w-full bg-foreground hover:bg-foreground/90 text-background h-14 font-bold tracking-widest text-xs uppercase shadow-none gap-3 rounded-[8px] transition-all">
                    <FileText size={16} /> Emit After-Action Report
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
