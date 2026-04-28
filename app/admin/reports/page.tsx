import { adminDb } from "@/lib/firebase/admin";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Download, Activity, Award, Image, CheckCircle2, Clock } from "lucide-react";

export const dynamic = "force-dynamic";

function formatFirestoreDate(dateVal: any): string | null {
  if (!dateVal) return null;
  if (dateVal._seconds) return new Date(dateVal._seconds * 1000).toISOString();
  if (dateVal.seconds) return new Date(dateVal.seconds * 1000).toISOString();
  if (typeof dateVal === "string") return dateVal;
  if (dateVal.toDate) return dateVal.toDate().toISOString();
  return null;
}

export default async function AdminReportsPage() {
  const eventsSnap = await adminDb.collection("events").orderBy("createdAt", "desc").get();
  const events = eventsSnap.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
    eventDate: formatFirestoreDate((doc.data() as any).eventDate),
  })) as any[];

  // Fetch all coordinator reports indexed by eventId
  const crSnap = await adminDb.collection("coordinatorReports").get();
  const coordinatorReportsByEvent: Record<string, any[]> = {};
  crSnap.docs.forEach((doc) => {
    const d = doc.data();
    if (!coordinatorReportsByEvent[d.eventId]) coordinatorReportsByEvent[d.eventId] = [];
    coordinatorReportsByEvent[d.eventId].push({
      id: doc.id,
      coordinatorName: d.coordinatorName || "Coordinator",
      imageUrls: d.imageUrls || [],
      notes: d.notes || "",
      updatedAt: formatFirestoreDate(d.updatedAt),
    });
  });

  const totalWithReport = events.filter((e) => (coordinatorReportsByEvent[e.id]?.length || 0) > 0).length;

  return (
    <div className="p-6 lg:p-10 text-foreground max-w-7xl">
      <header className="mb-10">
        <p className="text-[11px] uppercase tracking-[0.12em] font-bold text-primary/70 mb-2">Intelligence</p>
        <h1 className="text-4xl font-serif tracking-tight text-foreground mb-3">Reports & Ledgers</h1>
        <p className="text-foreground/60 font-light max-w-lg leading-relaxed text-sm">
          View auto-generated PDF reports and coordinator-submitted field reports for all events.
        </p>
      </header>

      {/* Stats */}
      <div className="grid md:grid-cols-3 gap-4 mb-10">
        <Card className="bg-muted/30 border-0 ring-0 shadow-none rounded-2xl">
          <CardContent className="p-6">
            <p className="text-[10px] font-bold text-foreground/40 uppercase tracking-[0.12em] flex items-center gap-2 mb-2">
              <FileText size={14} className="text-primary/70" /> Total Events
            </p>
            <div className="text-4xl font-serif text-foreground">{events.length}</div>
          </CardContent>
        </Card>
        <Card className="bg-muted/30 border-0 ring-0 shadow-none rounded-2xl">
          <CardContent className="p-6">
            <p className="text-[10px] font-bold text-foreground/40 uppercase tracking-[0.12em] flex items-center gap-2 mb-2">
              <CheckCircle2 size={14} className="text-primary/60" /> Field Reports Submitted
            </p>
            <div className="text-4xl font-serif text-foreground">{totalWithReport}</div>
          </CardContent>
        </Card>
        <Card className="bg-muted/30 border-0 ring-0 shadow-none rounded-2xl">
          <CardContent className="p-6">
            <p className="text-[10px] font-bold text-foreground/40 uppercase tracking-[0.12em] flex items-center gap-2 mb-2">
              <Clock size={14} className="text-amber-600/70" /> Awaiting Reports
            </p>
            <div className="text-4xl font-serif text-foreground">{events.length - totalWithReport}</div>
          </CardContent>
        </Card>
      </div>

      <h2 className="text-xl font-serif text-foreground tracking-tight mb-5">All Event Reports</h2>

      {events.length === 0 ? (
        <div className="text-center p-14 rounded-2xl bg-muted/20 flex flex-col items-center">
          <p className="text-foreground/50 font-light text-sm italic">No events in the system yet.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {events.map((event) => {
            const crList = coordinatorReportsByEvent[event.id] || [];
            const hasFieldReport = crList.length > 0;
            const totalImages = crList.reduce((sum: number, cr: any) => sum + cr.imageUrls.length, 0);

            return (
              <Card
                key={event.id}
                className="bg-card border-0 ring-1 ring-foreground/[0.05] flex flex-col hover:shadow-md transition-all rounded-2xl"
              >
                <CardHeader className="p-6 pb-3">
                  <div className="flex justify-between items-start mb-2 gap-2">
                    <Badge
                      variant={event.status === "completed" ? "default" : "secondary"}
                      className="uppercase tracking-[0.12em] text-[9px] font-bold px-2 py-0.5 shadow-none rounded-sm shrink-0"
                    >
                      {event.status}
                    </Badge>
                    {hasFieldReport ? (
                      <span className="flex items-center gap-1 text-[10px] font-bold text-primary uppercase tracking-widest shrink-0">
                        <CheckCircle2 size={11} /> Field Report
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-[10px] font-bold text-amber-600 uppercase tracking-widest shrink-0">
                        <Clock size={11} /> Pending
                      </span>
                    )}
                  </div>
                  <CardTitle className="text-base font-serif font-medium text-foreground line-clamp-2 leading-[1.3]">
                    {event.title}
                  </CardTitle>
                  <p className="text-xs text-foreground/40 font-light mt-1">
                    {event.eventDate ? new Date(event.eventDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—"}
                  </p>
                </CardHeader>

                <CardContent className="px-6 pb-4 flex-1">
                  <div className="flex flex-col gap-2 text-xs text-foreground/60">
                    <div className="flex justify-between">
                      <span>Volunteers</span>
                      <span className="font-medium text-foreground">{event.volunteerCount || 0}</span>
                    </div>
                    {hasFieldReport && (
                      <div className="flex justify-between">
                        <span className="flex items-center gap-1"><Image size={11} /> Field Images</span>
                        <span className="font-medium text-foreground">{totalImages}</span>
                      </div>
                    )}
                  </div>
                </CardContent>

                <CardFooter className="p-6 pt-3 flex flex-col gap-2">
                  <Link href={`/api/events/${event.id}/report`} target="_blank" className="w-full">
                    <Button
                      variant="outline"
                      className="w-full border-foreground/[0.08] hover:bg-muted text-foreground h-9 text-xs font-semibold uppercase tracking-[0.12em] gap-2 shadow-none rounded-lg"
                    >
                      <Download size={13} /> Download PDF
                    </Button>
                  </Link>
                  <Link href={`/admin/events/${event.id}?tab=report`} className="w-full">
                    <Button
                      variant="ghost"
                      className="w-full text-foreground/50 hover:text-foreground h-9 text-xs font-semibold uppercase tracking-[0.12em] gap-2 shadow-none rounded-lg"
                    >
                      <FileText size={13} /> View Full Report
                    </Button>
                  </Link>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
