"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase/client";
import { ClipboardList, ArrowRight, Loader2, MapPin, Calendar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { getCoordinatorDashboardData } from "./actions";

export default function CoordinatorDashboard() {
  const [loading, setLoading] = useState(true);
  const [assignedEvents, setAssignedEvents] = useState<any[]>([]);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const data = await getCoordinatorDashboardData();
        setAssignedEvents(data.assignedEvents);
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
          Coordinator Hub
        </p>
        <h1 className="text-5xl font-serif tracking-tight text-foreground mb-4">
          Assigned Events
        </h1>
        <p className="text-foreground/60 font-light max-w-lg leading-relaxed">
          Manage your assigned events, track participation, take attendance, and issue certificates.
        </p>
      </header>

      {loading ? (
        <div className="p-20 flex justify-center items-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="flex flex-col gap-16">
          <section>
            <div className="mb-8 flex items-center justify-between">
              <h2 className="text-2xl font-serif text-foreground flex items-center gap-3">
                <ClipboardList className="text-primary/70" size={20} strokeWidth={1.5} />
                My Portfolio
              </h2>
              <Badge variant="secondary" className="shadow-none">
                {assignedEvents.length} Events
              </Badge>
            </div>

            {assignedEvents.length === 0 ? (
              <div className="p-12 rounded-[20px] bg-muted/30 flex flex-col items-center justify-center text-center">
                <ClipboardList className="w-10 h-10 text-primary/30 mb-4" strokeWidth={1} />
                <h3 className="font-serif text-xl mb-2 text-foreground">No Assignments Yet</h3>
                <p className="text-sm text-foreground/50 font-light max-w-sm">
                  You haven't been assigned as a coordinator to any events. Wait for administrators to delegate tasks.
                </p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {assignedEvents.map((event) => (
                  <Card
                    key={event.id}
                    className="bg-card shadow-[0_32px_64px_-12px_rgba(25,28,26,0.03)] border-0 ring-0 rounded-[20px] flex flex-col"
                  >
                    <CardHeader className="p-6 pb-4">
                      <div className="flex justify-between items-start mb-2">
                        <Badge
                          variant={event.status === "completed" ? "default" : "outline"}
                          className="text-[9px] uppercase tracking-[0.12em] font-bold shadow-none rounded-sm"
                        >
                          {event.status || "Upcoming"}
                        </Badge>
                      </div>
                      <CardTitle className="text-xl font-serif font-medium leading-[1.3] line-clamp-2">
                        {event.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="px-6 pb-6 flex-1 font-light text-sm text-foreground/60 space-y-2">
                      <p className="flex items-center gap-2">
                        <Calendar size={14} className="opacity-70" />
                        {new Date(event.eventDate).toLocaleDateString()}
                      </p>
                      <p className="flex items-center gap-2">
                        <MapPin size={14} className="opacity-70" />
                        {event.city}
                      </p>
                    </CardContent>
                    <CardFooter className="p-6 pt-0">
                      <Link href={`/events/${event.id}`} className="w-full">
                        <Button
                          className="w-full bg-primary hover:bg-primary/90 text-[11px] uppercase tracking-[0.12em] font-bold shadow-none rounded-[8px] h-11 gap-2"
                        >
                          Manage Operations <ArrowRight size={14} />
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
