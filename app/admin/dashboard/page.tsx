"use client";

import Link from "next/link";
import { ArrowUpRight, Calendar, Users, FileText, Activity, Heart } from "lucide-react";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminDashboard() {
  const [stats, setStats] = useState({ events: 0, upcoming: 0, volunteers: 0, coordinators: 0, totalDonations: 0 });

  useEffect(() => {
    fetch("/api/admin/stats")
      .then(res => res.ok ? res.json() : null)
      .then(data => { if (data) setStats(data); })
      .catch(() => {});
  }, []);

  return (
    <div className="p-8 lg:p-16 text-foreground max-w-6xl">
      <header className="mb-16">
        <p className="text-[11px] uppercase tracking-[0.12em] font-bold text-foreground/40 mb-3">
          HopeNGO Operations
        </p>
        <h1 className="text-5xl font-serif tracking-tight text-foreground mb-4">
          Command Center
        </h1>
        <p className="text-foreground/60 font-light max-w-lg leading-relaxed">
          Oversee the living archive of events, volunteers, and overall community orchestration.
        </p>
      </header>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-6 mb-16">
        {[
          { label: "Total Events", value: stats.events, icon: Calendar, color: "text-primary" },
          { label: "Upcoming", value: stats.upcoming, icon: Activity, color: "text-primary/70" },
          { label: "Volunteers", value: stats.volunteers, icon: Users, color: "text-primary/80" },
          { label: "Coordinators", value: stats.coordinators, icon: Users, color: "text-primary/60" },
          { label: "Donations (₹)", value: `₹${stats.totalDonations.toLocaleString()}`, icon: Heart, color: "text-green-600" },
        ].map((stat) => (
          <Card
            key={stat.label}
            className="bg-muted/30 border-0 ring-0 shadow-none rounded-[20px]"
          >
            <CardHeader className="pb-2 px-6 pt-6">
              <CardTitle className="text-[10px] font-bold text-foreground/40 uppercase tracking-[0.12em] flex items-center gap-2">
                <stat.icon size={14} className={stat.color} strokeWidth={1.5} />
                {stat.label}
              </CardTitle>
            </CardHeader>
            <CardContent className="px-6 pb-6">
              <div className="text-3xl font-serif text-foreground mt-1">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Navigation Cards */}
      <h2 className="text-2xl font-serif text-foreground tracking-tight mb-8">
        Quick Access
      </h2>
      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
        <Link
          href="/admin/events"
          className="group rounded-[20px] bg-card p-10 flex flex-col h-[280px] justify-between ring-0 border-0 shadow-[0_32px_64px_-12px_rgba(25,28,26,0.02)] hover:shadow-[0_32px_64px_-12px_rgba(25,28,26,0.06)] transition-all"
        >
          <div>
            <h3 className="font-serif text-3xl font-medium tracking-tight mb-4">
              Events Vault
            </h3>
            <p className="text-foreground/60 font-light leading-relaxed">
              Manage public engagements, review participation, and initiate new chapters.
            </p>
          </div>
          <ArrowUpRight className="text-primary h-6 w-6 opacity-30 group-hover:opacity-100 group-hover:-translate-y-1 group-hover:translate-x-1 transition-all self-end" />
        </Link>

        <Link
          href="/admin/volunteers"
          className="group rounded-[20px] bg-muted/50 p-10 flex flex-col h-[280px] justify-between ring-0 border-0 hover:bg-muted/70 transition-all"
        >
          <div>
            <h3 className="font-serif text-3xl font-medium tracking-tight mb-4">
              Operatives
            </h3>
            <p className="text-foreground/60 font-light leading-relaxed">
              Verify applications, coordinate volunteers, and curate the team repository.
            </p>
          </div>
          <ArrowUpRight className="text-foreground h-6 w-6 opacity-30 group-hover:opacity-100 group-hover:-translate-y-1 group-hover:translate-x-1 transition-all self-end" />
        </Link>

        <Link
          href="/admin/coordinators"
          className="group rounded-[20px] bg-violet-600/[0.04] p-10 flex flex-col h-[280px] justify-between ring-0 border-0 hover:bg-violet-600/[0.07] transition-all"
        >
          <div>
            <h3 className="font-serif text-3xl font-medium tracking-tight mb-4 text-violet-700">
              Coordinators
            </h3>
            <p className="text-foreground/60 font-light leading-relaxed">
              Approve event coordinators, view their profiles, and manage field leadership.
            </p>
          </div>
          <ArrowUpRight className="text-violet-600 h-6 w-6 opacity-30 group-hover:opacity-100 group-hover:-translate-y-1 group-hover:translate-x-1 transition-all self-end" />
        </Link>

        <Link
          href="/admin/donations"
          className="group rounded-[20px] bg-green-600/[0.04] p-10 flex flex-col h-[280px] justify-between ring-0 border-0 hover:bg-green-600/[0.07] transition-all"
        >
          <div>
            <h3 className="font-serif text-3xl font-medium tracking-tight mb-4 text-green-700">
              Donations
            </h3>
            <p className="text-foreground/60 font-light leading-relaxed">
              Review submitted donations, verify transactions, and track total contributions.
            </p>
          </div>
          <ArrowUpRight className="text-green-600 h-6 w-6 opacity-30 group-hover:opacity-100 group-hover:-translate-y-1 group-hover:translate-x-1 transition-all self-end" />
        </Link>

        <Link
          href="/admin/reports"
          className="group rounded-[20px] bg-primary/[0.04] p-10 flex flex-col h-[280px] justify-between ring-0 border-0 hover:bg-primary/[0.07] transition-all"
        >
          <div>
            <h3 className="font-serif text-3xl font-medium tracking-tight mb-4 text-primary">
              Reports & Certs
            </h3>
            <p className="text-foreground/60 font-light leading-relaxed">
              Publish credentials, generate event manifests, and manage the official documents.
            </p>
          </div>
          <ArrowUpRight className="text-primary h-6 w-6 opacity-30 group-hover:opacity-100 group-hover:-translate-y-1 group-hover:translate-x-1 transition-all self-end" />
        </Link>
      </div>
    </div>
  );
}
