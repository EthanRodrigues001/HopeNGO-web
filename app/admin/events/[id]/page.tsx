import { adminDb } from "@/lib/firebase/admin";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ArrowLeft, Ticket, Users, FileText, CheckCircle2, LockIcon, Award } from "lucide-react";
import EventActionsClient from "./actions";

export const dynamic = "force-dynamic";

export default async function AdminEventDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const eventSnap = await adminDb.doc(`events/${id}`).get();
  if (!eventSnap.exists) {
    notFound();
  }

  const event = { id, ...eventSnap.data() } as any;

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
          <div className="lg:w-2/3 space-y-6">
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
              <CardContent className="px-10 py-8 space-y-10">
                <p className="text-foreground/70 text-lg font-light whitespace-pre-line leading-relaxed pb-6 border-b border-foreground/[0.03]">
                  {event.description}
                </p>

                <div className="grid grid-cols-2 gap-8 text-[13px]">
                  <div className="flex flex-col gap-2">
                    <h4 className="font-bold text-foreground/40 uppercase tracking-[0.1em] text-[10px]">Temporal Params</h4>
                    <p className="text-foreground font-medium text-base">{new Date(event.eventDate).toLocaleDateString('en-US', {month: 'long', day: 'numeric', year: 'numeric'})} <br/> <span className="font-light">{event.startTime} - {event.endTime}</span></p>
                  </div>
                  <div className="flex flex-col gap-2">
                    <h4 className="font-bold text-foreground/40 uppercase tracking-[0.1em] text-[10px]">Logistical Coords</h4>
                    <p className="text-foreground font-medium text-base">{event.venue} <br/> <span className="font-light">{event.city}, {event.state}</span></p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="lg:w-1/3 space-y-8">
            <Card className="bg-card shadow-[0_16px_32px_-12px_rgba(25,28,26,0.03)] border-0 ring-1 ring-foreground/[0.04] rounded-[24px] rounded-tr-[8px] flex flex-col">
              <CardHeader className="p-8 pb-4">
                <div className="flex justify-between items-center mb-1">
                  <CardTitle className="text-[12px] font-bold uppercase tracking-[0.1em] text-foreground/60 flex items-center gap-2">
                    <Ticket className="text-primary/70" strokeWidth={1.5} size={18} /> Public Access
                  </CardTitle>
                  <div className="text-xs">
                    {event.participantRegistrationOpen ? (
                       <span className="text-primary flex items-center gap-1 font-bold uppercase tracking-widest text-[9px]"><CheckCircle2 size={12}/> Open</span>
                    ) : (
                      <span className="text-red-600/70 flex items-center gap-1 font-bold uppercase tracking-widest text-[9px]"><LockIcon size={12}/> Locked</span>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="px-8 pb-8 flex-1">
                <div className="flex justify-between items-end mb-6">
                  <div className="text-6xl font-serif text-foreground leading-none">
                    {event.participantCount || 0} <span className="text-xl text-foreground/30 font-sans font-light">/ {event.maxParticipants || '∞'}</span>
                  </div>
                </div>
                <Link href={`/admin/events/${id}/participants`}>
                  <Button variant="outline" className="w-full bg-transparent border-foreground/10 hover:bg-muted text-foreground h-12 uppercase tracking-widest text-xs font-bold shadow-none rounded-[8px]">Review Registrants</Button>
                </Link>
              </CardContent>
            </Card>

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

            <Card className="bg-card shadow-[0_16px_32px_-12px_rgba(25,28,26,0.03)] border-0 ring-1 ring-foreground/[0.04] rounded-[24px] flex flex-col">
              <CardHeader className="p-8 pb-4">
                <CardTitle className="text-[12px] font-bold uppercase tracking-[0.1em] text-foreground/60 flex items-center gap-2">
                  <Award className="text-amber-600/70" strokeWidth={1.5} size={18} /> Certificates
                </CardTitle>
              </CardHeader>
              <CardContent className="px-8 pb-8 flex-1">
                <p className="text-foreground/50 text-sm font-light mb-6">
                  Issue and manage certificates for participants and volunteers.
                </p>
                <Link href={`/admin/events/${id}/certificates`}>
                  <Button variant="outline" className="w-full bg-transparent border-foreground/10 hover:bg-muted text-foreground h-12 uppercase tracking-widest text-xs font-bold shadow-none rounded-[8px]">Manage Certificates</Button>
                </Link>
              </CardContent>
            </Card>

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
