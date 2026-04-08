import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, FileText, CheckCircle, Activity } from "lucide-react";

interface EventStatsCardProps {
  stats: {
    participants: number;
    volunteers: number;
    certificates: number;
    status: string;
  };
}

export function EventStatsCard({ stats }: EventStatsCardProps) {
  const items = [
    { label: "Participants", value: stats.participants, icon: Users, color: "text-blue-600" },
    { label: "Volunteers", value: stats.volunteers, icon: Users, color: "text-green-600" },
    { label: "Certificates", value: stats.certificates, icon: FileText, color: "text-orange-500" },
    { label: "Status", value: stats.status, icon: Activity, color: "text-primary", isText: true },
  ];

  return (
    <Card className="bg-card shadow-[0_32px_64px_-12px_rgba(25,28,26,0.03)] border-0 ring-0 rounded-[20px] mb-8">
      <CardHeader className="pb-2 border-b border-border/40">
        <CardTitle className="text-sm font-semibold tracking-wide uppercase text-foreground/50">
          Event Overview
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="grid grid-cols-2 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-border/40">
          {items.map((it, idx) => (
            <div key={idx} className="p-6 flex flex-col items-center justify-center text-center">
              <div className={`p-3 rounded-full bg-muted/50 mb-3 ${it.color}`}>
                <it.icon size={20} strokeWidth={1.5} />
              </div>
              <div className="text-2xl font-serif text-foreground mb-1">
                {it.isText ? <span className="capitalize">{it.value}</span> : it.value || 0}
              </div>
              <div className="text-[10px] uppercase tracking-[0.12em] font-bold text-foreground/40">
                {it.label}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
