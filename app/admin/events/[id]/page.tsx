import { adminDb } from "@/lib/firebase/admin";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ArrowLeft, Users, FileText, CheckCircle2, LockIcon,
  UserCog, ClipboardCheck, Heart, Calendar, MapPin,
  Clock, Ticket, Download
} from "lucide-react";
import EventActionsClient from "./actions";
import EventDetailClient from "./detail-client";
import EventTabsClient from "./tabs-client";

export const dynamic = "force-dynamic";

function formatFirestoreDate(dateVal: any): string | null {
  if (!dateVal) return null;
  if (dateVal._seconds) return new Date(dateVal._seconds * 1000).toISOString();
  if (dateVal.seconds) return new Date(dateVal.seconds * 1000).toISOString();
  if (typeof dateVal === "string") return dateVal;
  if (dateVal.toDate) return dateVal.toDate().toISOString();
  return null;
}

export default async function AdminEventDetailsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { id } = await params;
  const { tab = "overview" } = await searchParams;

  const eventSnap = await adminDb.doc(`events/${id}`).get();
  if (!eventSnap.exists) notFound();

  const rawEvent = eventSnap.data()!;
  const eventDate = formatFirestoreDate(rawEvent.eventDate);

  const event = JSON.parse(
    JSON.stringify({
      id,
      ...rawEvent,
      eventDate,
      createdAt: formatFirestoreDate(rawEvent.createdAt),
      updatedAt: formatFirestoreDate(rawEvent.updatedAt),
    })
  );

  // Fetch volunteers
  const volsSnap = await adminDb
    .collection("volunteerApplications")
    .where("eventId", "==", id)
    .where("status", "in", ["pending", "approved"])
    .get();

  const volunteers = JSON.parse(
    JSON.stringify(
      volsSnap.docs.map((doc) => {
        const d = doc.data();
        return {
          id: doc.id,
          volunteerName: d.volunteerName,
          volunteerId: d.volunteerId,
          volunteerEmail: d.volunteerEmail,
          status: d.status,
          attendance: d.attendance,
          adminNotes: d.adminNotes || "",
          appliedAt: formatFirestoreDate(d.appliedAt),
        };
      })
    )
  );

  const approvedVolunteers = volunteers.filter((v: any) => v.status === "approved");
  const attendanceSummary = {
    total: approvedVolunteers.length,
    attended: approvedVolunteers.filter((v: any) => v.attendance === "attended").length,
    absent: approvedVolunteers.filter((v: any) => v.attendance === "absent").length,
    registered: approvedVolunteers.filter(
      (v: any) => v.attendance !== "attended" && v.attendance !== "absent"
    ).length,
  };

  // Fetch coordinators
  const coordsSnap = await adminDb
    .collection("users")
    .where("role", "==", "event_coordinator")
    .where("isApproved", "==", true)
    .get();

  const coordinators = JSON.parse(
    JSON.stringify(
      coordsSnap.docs.map((doc) => ({
        uid: doc.id,
        fullName: doc.data().fullName,
        email: doc.data().email,
      }))
    )
  );

  // Fetch participants
  const regsSnap = await adminDb
    .collection("participantRegistrations")
    .where("eventId", "==", id)
    .get();

  const participants = JSON.parse(
    JSON.stringify(
      regsSnap.docs.map((doc) => {
        const d = doc.data();
        return {
          id: doc.id,
          ...d,
          registeredAt: formatFirestoreDate(d.registeredAt),
        };
      })
    )
  );

  // Fetch donations
  let donations: any[] = [];
  let totalDonated = 0;
  try {
    const donationsSnap = await adminDb
      .collection("donations")
      .where("eventId", "==", id)
      .orderBy("createdAt", "desc")
      .get();
    donations = JSON.parse(
      JSON.stringify(
        donationsSnap.docs.map((doc) => {
          const d = doc.data();
          return {
            id: doc.id,
            donorName: d.donorName || "Anonymous",
            donorEmail: d.donorEmail || "",
            amount: d.amount || 0,
            transactionId: d.transactionId || "",
            message: d.message || null,
            status: d.status || "pending",
            createdAt: formatFirestoreDate(d.createdAt),
          };
        })
      )
    );
    totalDonated = donations.reduce((sum: number, d: any) => sum + d.amount, 0);
  } catch {
    try {
      const donationsSnap = await adminDb
        .collection("donations")
        .where("eventId", "==", id)
        .get();
      donations = JSON.parse(
        JSON.stringify(
          donationsSnap.docs.map((doc) => {
            const d = doc.data();
            return {
              id: doc.id,
              donorName: d.donorName || "Anonymous",
              donorEmail: d.donorEmail || "",
              amount: d.amount || 0,
              transactionId: d.transactionId || "",
              message: d.message || null,
              status: d.status || "pending",
              createdAt: formatFirestoreDate(d.createdAt),
            };
          })
        )
      );
      totalDonated = donations.reduce((sum: number, d: any) => sum + d.amount, 0);
    } catch { /* ignore */ }
  }

  // Fetch coordinator reports
  let coordinatorReports: any[] = [];
  try {
    const crSnap = await adminDb
      .collection("coordinatorReports")
      .where("eventId", "==", id)
      .get();
    coordinatorReports = JSON.parse(
      JSON.stringify(
        crSnap.docs.map((doc) => {
          const d = doc.data();
          return {
            id: doc.id,
            coordinatorId: d.coordinatorId,
            coordinatorName: d.coordinatorName || "Coordinator",
            imageUrls: d.imageUrls || [],
            notes: d.notes || "",
            submittedAt: formatFirestoreDate(d.submittedAt),
            updatedAt: formatFirestoreDate(d.updatedAt),
          };
        })
      )
    );
  } catch { /* ignore */ }

  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "volunteers", label: `Volunteers (${volunteers.length})` },
    { id: "participants", label: `Participants (${participants.length})` },
    { id: "attendance", label: "Attendance" },
    { id: "donations", label: `Donations (${donations.length})` },
    { id: "report", label: "Report" },
  ];

  return (
    <div className="min-h-screen bg-background font-sans text-foreground">
      <div className="max-w-7xl mx-auto px-6 lg:px-10 py-8">

        {/* Top bar */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <Link
            href="/admin/events"
            className="inline-flex items-center text-xs uppercase tracking-[0.1em] font-bold text-foreground/50 hover:text-primary transition-colors"
          >
            <ArrowLeft size={14} className="mr-2" /> All Events
          </Link>
          <EventActionsClient eventId={id} eventTitle={event.title} />
        </div>

        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-wrap gap-2 mb-3">
            <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-primary bg-primary/10 px-3 py-1 rounded-full">
              {event.eventType}
            </span>
            <Badge
              variant={event.status === "upcoming" ? "default" : "secondary"}
              className="uppercase tracking-widest text-[9px] font-bold px-3 py-1 shadow-none rounded-sm"
            >
              {event.status}
            </Badge>
          </div>
          <h1 className="text-3xl md:text-4xl font-serif tracking-tight text-foreground leading-tight mb-2">
            {event.title}
          </h1>
          <div className="flex flex-wrap items-center gap-4 text-sm text-foreground/50 font-light mt-3">
            <span className="flex items-center gap-1.5">
              <Calendar size={13} className="text-primary/60" />
              {eventDate
                ? new Date(eventDate).toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })
                : "Date not set"}
              {" "}• {event.startTime} – {event.endTime}
            </span>
            <span className="flex items-center gap-1.5">
              <MapPin size={13} className="text-primary/60" />
              {event.venue}, {event.city}
            </span>
          </div>
        </div>

        {/* Tab nav — client for active state highlight */}
        <EventTabsClient tabs={tabs} activeTab={tab} eventId={id} />

        {/* Tab content */}
        <div className="mt-6">

          {/* OVERVIEW */}
          {tab === "overview" && (
            <div className="flex flex-col lg:flex-row gap-6">
              {/* Left */}
              <div className="flex-1 flex flex-col gap-5">
                {/* Banner + Description */}
                <Card className="bg-card border-0 ring-1 ring-foreground/[0.05] rounded-2xl overflow-hidden shadow-sm">
                  {event.bannerImageUrl && (
                    <div className="w-full h-56 bg-muted">
                      <img
                        src={event.bannerImageUrl}
                        alt={event.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <CardContent className="p-6">
                    <div className="grid grid-cols-2 gap-6 mb-5 pb-5 border-b border-foreground/[0.04]">
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-foreground/40 mb-1">Date & Time</p>
                        <p className="text-foreground font-medium text-sm">
                          {eventDate
                            ? new Date(eventDate).toLocaleDateString("en-US", {
                                month: "long",
                                day: "numeric",
                                year: "numeric",
                              })
                            : "—"}
                        </p>
                        <p className="text-foreground/50 text-sm font-light">{event.startTime} – {event.endTime}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-foreground/40 mb-1">Location</p>
                        <p className="text-foreground font-medium text-sm">{event.venue}</p>
                        <p className="text-foreground/50 text-sm font-light">{event.city}, {event.state}</p>
                      </div>
                    </div>
                    <p className="text-foreground/70 text-sm font-light leading-relaxed whitespace-pre-line">
                      {event.description}
                    </p>
                  </CardContent>
                </Card>

                {/* Attendance Summary */}
                {!event.isRecurring ? (
                  <Card className="bg-card border-0 ring-1 ring-foreground/[0.05] rounded-2xl shadow-sm">
                    <CardHeader className="p-6 pb-3">
                      <CardTitle className="text-[11px] font-bold uppercase tracking-[0.1em] text-foreground/60 flex items-center gap-2">
                        <ClipboardCheck className="text-emerald-600/70" strokeWidth={1.5} size={16} />
                        Attendance Summary
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="px-6 pb-6">
                      <div className="grid grid-cols-4 gap-3 mb-4">
                        {[
                          { label: "Total", value: attendanceSummary.total, color: "text-foreground", bg: "bg-muted/40" },
                          { label: "Attended", value: attendanceSummary.attended, color: "text-primary", bg: "bg-primary/5" },
                          { label: "Absent", value: attendanceSummary.absent, color: "text-red-600", bg: "bg-red-600/5" },
                          { label: "Unmarked", value: attendanceSummary.registered, color: "text-amber-600", bg: "bg-amber-600/5" },
                        ].map((item) => (
                          <div key={item.label} className={`${item.bg} rounded-xl p-3 text-center`}>
                            <p className={`text-xl font-serif ${item.color}`}>{item.value}</p>
                            <p className={`text-[9px] uppercase tracking-widest font-bold ${item.color} opacity-70 mt-0.5`}>{item.label}</p>
                          </div>
                        ))}
                      </div>
                      <Link href={`/admin/events/${id}/attendance`}>
                        <Button variant="outline" className="w-full h-9 border-foreground/10 hover:bg-muted text-foreground text-xs uppercase tracking-widest font-bold shadow-none rounded-lg">
                          Mark Attendance
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                ) : (
                  <Card className="bg-card border-0 ring-1 ring-foreground/[0.05] rounded-2xl shadow-sm">
                    <CardContent className="p-6 flex flex-col gap-3">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-foreground/50">Recurring Sessions</p>
                      <p className="text-sm font-light text-foreground/60">This is a recurring event. Manage attendance per session.</p>
                      <Link href={`/admin/events/${id}/sessions`}>
                        <Button variant="outline" className="w-full h-9 border-foreground/10 hover:bg-muted text-foreground text-xs uppercase tracking-widest font-bold shadow-none rounded-lg">
                          Manage Sessions
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Right sidebar */}
              <div className="lg:w-80 flex flex-col gap-5">
                {/* Coordinator */}
                <EventDetailClient
                  eventId={id}
                  currentCoordinatorId={event.coordinatorId || null}
                  currentCoordinatorName={event.coordinatorName || null}
                  coordinators={coordinators}
                />

                {/* Volunteers stat */}
                <Card className="bg-card border-0 ring-1 ring-foreground/[0.05] rounded-2xl shadow-sm">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-foreground/60 flex items-center gap-1.5">
                        <Users className="text-cyan-600/70" strokeWidth={1.5} size={15} /> Operatives
                      </p>
                      {event.volunteerRegistrationOpen ? (
                        <span className="text-primary flex items-center gap-1 font-bold uppercase tracking-widest text-[9px]">
                          <CheckCircle2 size={11} /> Open
                        </span>
                      ) : (
                        <span className="text-red-600/70 flex items-center gap-1 font-bold uppercase tracking-widest text-[9px]">
                          <LockIcon size={11} /> Locked
                        </span>
                      )}
                    </div>
                    <div className="text-4xl font-serif text-foreground leading-none mb-4">
                      {event.volunteerCount || 0}
                      <span className="text-base text-foreground/30 font-sans font-light ml-1">/ {event.maxVolunteers || "∞"}</span>
                    </div>
                    <Link href={`?tab=volunteers`}>
                      <Button variant="outline" className="w-full h-9 border-foreground/10 hover:bg-muted text-foreground text-xs uppercase tracking-widest font-bold shadow-none rounded-lg">
                        Manage Volunteers
                      </Button>
                    </Link>
                  </CardContent>
                </Card>


                {/* Donations quick stat */}
                <Card className="bg-card border-0 ring-1 ring-foreground/[0.05] rounded-2xl shadow-sm">
                  <CardContent className="p-6">
                    <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-foreground/60 flex items-center gap-1.5 mb-3">
                      <Heart className="text-rose-500/70" strokeWidth={1.5} size={15} /> Donations
                    </p>
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div className="bg-rose-500/5 rounded-xl p-3 text-center ring-1 ring-rose-500/10">
                        <p className="text-lg font-serif text-rose-600">₹{totalDonated.toLocaleString("en-IN")}</p>
                        <p className="text-[9px] uppercase tracking-widest font-bold text-rose-600/60 mt-0.5">Raised</p>
                      </div>
                      <div className="bg-muted/40 rounded-xl p-3 text-center">
                        <p className="text-lg font-serif text-foreground">{donations.length}</p>
                        <p className="text-[9px] uppercase tracking-widest font-bold text-foreground/40 mt-0.5">Donors</p>
                      </div>
                    </div>
                    <Link href={`?tab=donations`}>
                      <Button variant="outline" className="w-full h-9 border-foreground/10 hover:bg-muted text-foreground text-xs uppercase tracking-widest font-bold shadow-none rounded-lg">
                        View All Donations
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {/* VOLUNTEERS */}
          {tab === "volunteers" && (
            <div>
              <div className="mb-5 flex items-center justify-between">
                <p className="text-sm text-foreground/50 font-light">{volunteers.length} application{volunteers.length !== 1 ? "s" : ""} total</p>
              </div>
              {/* Import the existing volunteers client inline */}
              <VolunteersTabContent eventId={id} volunteers={volunteers} />
            </div>
          )}

          {/* PARTICIPANTS */}
          {tab === "participants" && (
            <div>
              <div className="mb-5">
                <p className="text-sm text-foreground/50 font-light">{participants.length} registration{participants.length !== 1 ? "s" : ""} total</p>
              </div>
              <ParticipantsTabContent eventId={id} participants={participants} />
            </div>
          )}

          {/* ATTENDANCE */}
          {tab === "attendance" && (
            <div>
              <div className="mb-5">
                <p className="text-sm text-foreground/50 font-light">Mark attendance for {approvedVolunteers.length} approved operative{approvedVolunteers.length !== 1 ? "s" : ""}</p>
              </div>
              <AttendanceTabContent eventId={id} event={event} volunteers={approvedVolunteers} />
            </div>
          )}

          {/* DONATIONS */}
          {tab === "donations" && (
            <div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
                <Card className="bg-rose-500/5 border-0 ring-1 ring-rose-500/10 rounded-2xl">
                  <CardContent className="p-5">
                    <p className="text-2xl font-serif text-rose-600">₹{totalDonated.toLocaleString("en-IN")}</p>
                    <p className="text-[10px] uppercase tracking-widest font-bold text-rose-600/60 mt-1">Total Raised</p>
                  </CardContent>
                </Card>
                <Card className="bg-card border-0 ring-1 ring-foreground/[0.05] rounded-2xl shadow-sm">
                  <CardContent className="p-5">
                    <p className="text-2xl font-serif text-foreground">{donations.length}</p>
                    <p className="text-[10px] uppercase tracking-widest font-bold text-foreground/40 mt-1">Total Donors</p>
                  </CardContent>
                </Card>
                {donations.length > 0 && (
                  <Card className="bg-card border-0 ring-1 ring-foreground/[0.05] rounded-2xl shadow-sm">
                    <CardContent className="p-5">
                      <p className="text-2xl font-serif text-foreground">₹{Math.round(totalDonated / donations.length).toLocaleString("en-IN")}</p>
                      <p className="text-[10px] uppercase tracking-widest font-bold text-foreground/40 mt-1">Avg. Donation</p>
                    </CardContent>
                  </Card>
                )}
              </div>

              {donations.length === 0 ? (
                <div className="text-center py-16 bg-muted/20 rounded-2xl">
                  <Heart size={36} className="text-foreground/20 mx-auto mb-3" strokeWidth={1} />
                  <p className="text-foreground/40 text-sm font-light">No donations received yet.</p>
                </div>
              ) : (
                <Card className="bg-card border-0 ring-1 ring-foreground/[0.05] rounded-2xl shadow-sm overflow-hidden">
                  <div className="divide-y divide-foreground/[0.04]">
                    {donations.map((d: any) => (
                      <div key={d.id} className="flex items-center justify-between px-6 py-4 hover:bg-muted/20 transition-colors">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="size-9 rounded-full bg-rose-500/10 flex items-center justify-center text-rose-600 text-xs font-bold shrink-0">
                            {d.donorName?.charAt(0)?.toUpperCase() || "A"}
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-foreground text-sm truncate">{d.donorName}</p>
                            {d.donorEmail && <p className="text-xs text-foreground/40 truncate">{d.donorEmail}</p>}
                            {d.message && <p className="text-xs text-foreground/50 italic mt-0.5 truncate">"{d.message}"</p>}
                          </div>
                        </div>
                        <div className="text-right shrink-0 ml-4">
                          <p className="text-base font-bold text-rose-600">₹{d.amount.toLocaleString("en-IN")}</p>
                          <p className="text-[11px] text-foreground/40">
                            {d.createdAt ? new Date(d.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—"}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              )}
            </div>
          )}

          {/* REPORT */}
          {tab === "report" && (
            <div className="flex flex-col gap-6">
              {/* Auto-generated PDF */}
              <div className="flex items-center justify-between p-5 bg-muted/30 rounded-2xl">
                <div className="flex items-center gap-3">
                  <div className="size-10 bg-foreground/5 rounded-xl flex items-center justify-center">
                    <FileText size={20} className="text-foreground/50" strokeWidth={1.5} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">Auto-Generated Report</p>
                    <p className="text-xs text-foreground/50 font-light">Event summary · Attendance · Participants · Donations</p>
                  </div>
                </div>
                {coordinatorReports.length > 0 ? (
                  <Link href={`/api/events/${id}/report`} target="_blank">
                    <Button variant="outline" className="h-9 border-foreground/10 hover:bg-muted text-foreground text-xs uppercase tracking-widest font-bold shadow-none rounded-lg gap-1.5">
                      <Download size={13} /> Download PDF
                    </Button>
                  </Link>
                ) : (
                  <Button disabled variant="outline" className="h-9 border-foreground/10 text-foreground text-xs uppercase tracking-widest font-bold shadow-none rounded-lg gap-1.5 opacity-50 cursor-not-allowed">
                    <Download size={13} /> Download PDF
                  </Button>
                )}
              </div>

              {/* Coordinator image submissions */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <h3 className="text-sm font-bold uppercase tracking-widest text-foreground/60">Coordinator Field Report</h3>
                  {coordinatorReports.length > 0 ? (
                    <span className="text-[10px] font-bold uppercase tracking-widest text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                      Submitted
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold uppercase tracking-widest text-amber-600 bg-amber-600/10 px-2 py-0.5 rounded-full">
                      Pending
                    </span>
                  )}
                </div>

                {coordinatorReports.length === 0 ? (
                  <div className="text-center py-12 bg-muted/20 rounded-2xl">
                    <FileText size={32} className="text-foreground/20 mx-auto mb-3" strokeWidth={1} />
                    <p className="text-foreground/40 text-sm font-light">No coordinator report submitted yet.</p>
                    <p className="text-foreground/30 text-xs mt-1">
                      {event.coordinatorName ? `Waiting for ${event.coordinatorName} to submit.` : "Assign a coordinator first."}
                    </p>
                  </div>
                ) : (
                  coordinatorReports.map((cr: any) => (
                    <Card key={cr.id} className="bg-card border-0 ring-1 ring-foreground/[0.05] rounded-2xl shadow-sm mb-4">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <p className="font-semibold text-foreground text-sm">{cr.coordinatorName}</p>
                            <p className="text-xs text-foreground/40">
                              {cr.updatedAt ? `Updated ${new Date(cr.updatedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}` : "Submitted"}
                            </p>
                          </div>
                          <span className="text-[10px] font-bold uppercase tracking-widest text-primary bg-primary/10 px-2 py-1 rounded-full">
                            {cr.imageUrls.length} image{cr.imageUrls.length !== 1 ? "s" : ""}
                          </span>
                        </div>

                        {cr.notes && (
                          <p className="text-sm text-foreground/60 font-light italic bg-muted/30 rounded-lg px-4 py-3 mb-4">
                            "{cr.notes}"
                          </p>
                        )}

                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                          {cr.imageUrls.map((url: string, idx: number) => (
                            <a key={idx} href={url} target="_blank" rel="noopener noreferrer"
                              className="block rounded-xl overflow-hidden bg-muted/40 ring-1 ring-foreground/[0.06] hover:ring-primary/40 transition-all group aspect-video">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={url}
                                alt={`Field photo ${idx + 1}`}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                              />
                            </a>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

// ─── Inline server-renderable tab content components ────────────────────────

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import EventVolunteersClient from "./volunteers/client";
import EventParticipantsClient from "./participants/client";
import EventAttendanceClient from "./attendance/client";

function VolunteersTabContent({ eventId, volunteers }: { eventId: string; volunteers: any[] }) {
  return <EventVolunteersClient eventId={eventId} initialVolunteers={volunteers} />;
}

function ParticipantsTabContent({ eventId, participants }: { eventId: string; participants: any[] }) {
  return <EventParticipantsClient eventId={eventId} initialParticipants={participants} />;
}

function AttendanceTabContent({ eventId, event, volunteers }: { eventId: string; event: any; volunteers: any[] }) {
  return <EventAttendanceClient eventId={eventId} event={event} initialVolunteers={volunteers} />;
}
