import { adminDb } from "@/lib/firebase/admin";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Download, Activity, Award } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminReportsPage() {
  const eventsSnap = await adminDb.collection("events").orderBy("createdAt", "desc").get();

  const events = eventsSnap.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as any[];

  return (
    <div className="p-8 lg:p-16 text-foreground max-w-7xl">
      <header className="mb-16">
        <p className="text-[11px] uppercase tracking-[0.12em] font-bold text-primary/70 mb-3">
          Intelligence
        </p>
        <h1 className="text-5xl font-serif tracking-tight text-foreground mb-4">
          Reports & Ledgers
        </h1>
        <p className="text-foreground/60 font-light max-w-lg leading-relaxed">
          Retrieve post-operations analysis and verify authorized certificates.
        </p>
      </header>

      <div className="grid md:grid-cols-3 gap-6 mb-20 animate-in fade-in slide-in-from-bottom-8 duration-700">
        <Card className="bg-muted/30 border-0 ring-0 shadow-none rounded-[20px]">
          <CardHeader className="pb-2 px-8 pt-8">
            <CardTitle className="text-[10px] font-bold text-foreground/40 uppercase tracking-[0.12em] flex items-center gap-2">
              <FileText size={16} className="text-primary/70" />
              Total Logs
            </CardTitle>
          </CardHeader>
          <CardContent className="px-8 pb-8">
            <div className="text-5xl font-serif text-foreground mt-2">{events.length}</div>
          </CardContent>
        </Card>

        <Card className="bg-muted/30 border-0 ring-0 shadow-none rounded-[20px]">
          <CardHeader className="pb-2 px-8 pt-8">
            <CardTitle className="text-[10px] font-bold text-foreground/40 uppercase tracking-[0.12em] flex items-center gap-2">
              <Award size={16} className="text-primary/60" />
              Badges Sealed
            </CardTitle>
          </CardHeader>
          <CardContent className="px-8 pb-8">
            <div className="text-5xl font-serif text-foreground mt-2">0</div>
          </CardContent>
        </Card>

        <Card className="bg-muted/30 border-0 ring-0 shadow-none rounded-[20px]">
          <CardHeader className="pb-2 px-8 pt-8">
            <CardTitle className="text-[10px] font-bold text-foreground/40 uppercase tracking-[0.12em] flex items-center gap-2">
              <Activity size={16} className="text-accent-foreground/60" />
              Avg Impact
            </CardTitle>
          </CardHeader>
          <CardContent className="px-8 pb-8">
            <div className="text-5xl font-serif text-foreground mt-2">
              --
              <span className="text-2xl text-foreground/40 hidden md:inline-block">%</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <h2 className="text-2xl font-serif text-foreground tracking-tight mb-8">Event Briefings</h2>

      {events.length === 0 ? (
        <div className="text-center p-16 rounded-[20px] bg-muted/20 flex flex-col items-center">
          <p className="text-foreground/50 font-light text-sm italic">
            The reporting vault is empty. No concluded events.
          </p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {events.map((event) => (
            <Card
              key={event.id}
              className="bg-card border-0 ring-0 flex flex-col hover:shadow-[0_32px_64px_-12px_rgba(25,28,26,0.05)] shadow-[0_32px_64px_-12px_rgba(25,28,26,0.02)] transition-all rounded-[20px] group"
            >
              <CardHeader className="p-8">
                <div className="flex justify-between items-start mb-4">
                  <Badge
                    variant={event.status === "completed" ? "default" : "secondary"}
                    className="uppercase tracking-[0.12em] text-[9px] font-bold px-2 py-0.5 shadow-none rounded-sm"
                  >
                    {event.status}
                  </Badge>
                </div>
                <CardTitle className="text-xl font-serif font-medium text-foreground line-clamp-2 leading-[1.3] mb-1">
                  {event.title}
                </CardTitle>
                <CardDescription className="text-xs uppercase tracking-[0.12em] text-foreground/40 font-semibold">
                  {new Date(event.eventDate).toLocaleDateString()}
                </CardDescription>
              </CardHeader>
              <CardContent className="px-8 flex-1 pb-4">
                <div className="flex flex-col gap-4">
                  <div className="flex justify-between items-center text-[13px] font-light">
                    <span className="text-foreground/50">Registered Participants</span>
                    <span className="font-medium text-foreground">{event.participantCount || 0}</span>
                  </div>
                  <div className="flex justify-between items-center text-[13px] font-light bg-muted/30 -mx-8 px-8 py-4 rounded-none">
                    <span className="text-foreground/50">Field Volunteers</span>
                    <span className="font-medium text-foreground">{event.volunteerCount || 0}</span>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="p-8 pt-4">
                <Link href={`/api/events/${event.id}/report`} className="w-full">
                  <Button
                    variant="outline"
                    className="w-full border-foreground/[0.08] hover:bg-muted text-foreground h-12 text-xs font-semibold uppercase tracking-[0.12em] gap-2 shadow-none rounded-[8px]"
                  >
                    <Download size={14} /> Download PDF
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
