"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, CheckCircle, XCircle, UserX } from "lucide-react";

interface Volunteer {
  uid: string;
  fullName: string;
  email: string;
  phone: string;
  city: string;
  state: string;
  occupation: string;
  isApproved: boolean;
  isActive: boolean;
  createdAt: string | null;
}

interface Application {
  id: string;
  volunteerId: string;
  volunteerName: string;
  eventId: string;
  appliedAt: string | null;
}

export default function VolunteersClient({
  initialVolunteers,
  initialApplications,
}: {
  initialVolunteers: Volunteer[];
  initialApplications: Application[];
}) {
  const [volunteers, setVolunteers] = useState(initialVolunteers);
  const [applications, setApplications] = useState(initialApplications);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);

  const handleApprove = async (uid: string) => {
    setLoadingAction(`approve-${uid}`);
    try {
      const res = await fetch(`/api/admin/users/${uid}/approve`, { method: "PATCH" });
      if (res.ok) {
        setVolunteers(prev => prev.map(v => v.uid === uid ? { ...v, isApproved: true } : v));
      }
    } finally {
      setLoadingAction(null);
    }
  };

  const handleReject = async (uid: string) => {
    setLoadingAction(`reject-${uid}`);
    try {
      const res = await fetch(`/api/admin/users/${uid}/reject`, { method: "DELETE" });
      if (res.ok) {
        setVolunteers(prev => prev.filter(v => v.uid !== uid));
      }
    } finally {
      setLoadingAction(null);
    }
  };

  const handleDeactivate = async (uid: string) => {
    setLoadingAction(`deactivate-${uid}`);
    try {
      const res = await fetch(`/api/admin/users/${uid}/deactivate`, { method: "PATCH" });
      if (res.ok) {
        setVolunteers(prev => prev.map(v => v.uid === uid ? { ...v, isActive: false } : v));
      }
    } finally {
      setLoadingAction(null);
    }
  };

  const handleAppApprove = async (id: string) => {
    setLoadingAction(`app-approve-${id}`);
    try {
      const res = await fetch(`/api/volunteer-applications/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "approved" }),
      });
      if (res.ok) {
        setApplications(prev => prev.filter(a => a.id !== id));
      }
    } finally {
      setLoadingAction(null);
    }
  };

  const handleAppReject = async (id: string) => {
    setLoadingAction(`app-reject-${id}`);
    try {
      const res = await fetch(`/api/volunteer-applications/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "rejected" }),
      });
      if (res.ok) {
        setApplications(prev => prev.filter(a => a.id !== id));
      }
    } finally {
      setLoadingAction(null);
    }
  };

  return (
    <Tabs defaultValue="accounts" className="flex-col">
      <TabsList className="mb-8">
        <TabsTrigger value="accounts">
          All Volunteers
          <Badge variant="secondary" className="ml-2 shadow-none rounded-sm px-1.5 min-w-[20px] justify-center">
            {volunteers.length}
          </Badge>
        </TabsTrigger>
        <TabsTrigger value="applications">
          Field Apps
          <Badge variant="secondary" className="ml-2 shadow-none rounded-sm px-1.5 min-w-[20px] justify-center">
            {applications.length}
          </Badge>
        </TabsTrigger>
      </TabsList>

      {/* Accounts Tab — Table */}
      <TabsContent value="accounts">
        <div className="bg-card shadow-[0_32px_64px_-12px_rgba(25,28,26,0.03)] border-0 ring-0 rounded-[20px] overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow className="border-border/50 hover:bg-transparent">
                <TableHead className="font-serif font-medium text-foreground py-5 px-6">Name</TableHead>
                <TableHead className="font-serif font-medium text-foreground py-5">Contact</TableHead>
                <TableHead className="font-serif font-medium text-foreground py-5">Location</TableHead>
                <TableHead className="font-serif font-medium text-foreground py-5">Expertise</TableHead>
                <TableHead className="font-serif font-medium text-foreground py-5">Status</TableHead>
                <TableHead className="font-serif font-medium text-foreground text-right py-5 px-6">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {volunteers.map((v) => (
                <TableRow key={v.uid} className="border-border/50 hover:bg-muted/20 transition-colors group">
                  <TableCell className="py-5 px-6">
                    <div className="font-medium text-foreground">{v.fullName}</div>
                    <div className="text-xs text-foreground/50 opacity-0 group-hover:opacity-100 transition-opacity">
                      {v.uid.substring(0, 8)}
                    </div>
                  </TableCell>
                  <TableCell className="py-5">
                    <div className="text-sm">{v.email}</div>
                    <div className="text-xs text-foreground/60">{v.phone}</div>
                  </TableCell>
                  <TableCell className="text-sm text-foreground/70 py-5">
                    {v.city}, {v.state}
                  </TableCell>
                  <TableCell className="text-sm text-foreground/70 py-5">
                    {v.occupation || "—"}
                  </TableCell>
                  <TableCell className="py-5">
                    <div className="flex flex-col gap-1.5 items-start">
                      {!v.isApproved ? (
                        <Badge variant="outline" className="text-primary border-primary/20 bg-primary/5 uppercase tracking-[0.1em] text-[10px]">
                          Pending Approval
                        </Badge>
                      ) : (
                        <Badge variant="default" className="bg-primary/10 text-primary hover:bg-primary/20 uppercase tracking-[0.1em] text-[10px] shadow-none">
                          Approved
                        </Badge>
                      )}
                      {!v.isActive && (
                        <Badge variant="destructive" className="uppercase tracking-[0.1em] text-[10px] shadow-none">
                          Inactive
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right py-5 px-6">
                    <div className="flex items-center justify-end gap-2">
                      {!v.isApproved && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleApprove(v.uid)}
                            disabled={!!loadingAction}
                            className="h-8 border-green-500/20 text-green-600 hover:bg-green-50 hover:text-green-700 uppercase font-bold tracking-wider text-[10px] shadow-none"
                          >
                            {loadingAction === `approve-${v.uid}` ? <Loader2 className="size-3 animate-spin mr-1.5" /> : <CheckCircle className="size-3 mr-1.5" />}
                            Approve
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleReject(v.uid)}
                            disabled={!!loadingAction}
                            className="h-8 border-destructive/20 text-destructive hover:bg-destructive/10 uppercase font-bold tracking-wider text-[10px] shadow-none"
                          >
                            {loadingAction === `reject-${v.uid}` ? <Loader2 className="size-3 animate-spin mr-1.5" /> : <XCircle className="size-3 mr-1.5" />}
                            Reject
                          </Button>
                        </>
                      )}
                      {v.isApproved && v.isActive && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeactivate(v.uid)}
                          disabled={!!loadingAction}
                          className="h-8 border-destructive/20 text-destructive hover:bg-destructive/10 uppercase font-bold tracking-wider text-[10px] shadow-none"
                        >
                          {loadingAction === `deactivate-${v.uid}` ? <Loader2 className="size-3 animate-spin mr-1.5" /> : <UserX className="size-3 mr-1.5" />}
                          Deactivate
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {volunteers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="py-12 text-center text-foreground/50 font-light italic">
                    No volunteers found in the archive.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </TabsContent>

      {/* Applications Tab — Table */}
      <TabsContent value="applications">
        <div className="bg-card shadow-[0_32px_64px_-12px_rgba(25,28,26,0.03)] border-0 ring-0 rounded-[20px] overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow className="border-border/50 hover:bg-transparent">
                <TableHead className="font-serif font-medium text-foreground py-5 px-6">Volunteer</TableHead>
                <TableHead className="font-serif font-medium text-foreground py-5">Event ID</TableHead>
                <TableHead className="font-serif font-medium text-foreground py-5">Applied</TableHead>
                <TableHead className="font-serif font-medium text-foreground text-right py-5 px-6">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {applications.map((app) => (
                <TableRow key={app.id} className="border-border/50 hover:bg-muted/20 transition-colors group">
                  <TableCell className="py-5 px-6">
                    <div className="font-medium text-foreground">{app.volunteerName}</div>
                    <div className="text-xs text-foreground/50 opacity-0 group-hover:opacity-100 transition-opacity">
                      {app.id.substring(0, 8)}
                    </div>
                  </TableCell>
                  <TableCell className="py-5">
                    <span className="font-mono text-sm bg-muted/40 px-2 py-0.5 rounded">
                      {app.eventId.substring(0, 12)}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm text-foreground/70 py-5">
                    {app.appliedAt
                      ? new Date(app.appliedAt).toLocaleDateString("en-IN", {
                          day: "numeric", month: "short", year: "numeric",
                        })
                      : "Recent"}
                  </TableCell>
                  <TableCell className="text-right py-5 px-6">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleAppApprove(app.id)}
                        disabled={!!loadingAction}
                        className="h-8 border-green-500/20 text-green-600 hover:bg-green-50 hover:text-green-700 uppercase font-bold tracking-wider text-[10px] shadow-none"
                      >
                        {loadingAction === `app-approve-${app.id}` ? <Loader2 className="size-3 animate-spin mr-1.5" /> : <CheckCircle className="size-3 mr-1.5" />}
                        Authorize
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleAppReject(app.id)}
                        disabled={!!loadingAction}
                        className="h-8 border-foreground/[0.08] hover:bg-muted uppercase font-bold tracking-wider text-[10px] shadow-none"
                      >
                        {loadingAction === `app-reject-${app.id}` ? <Loader2 className="size-3 animate-spin mr-1.5" /> : <XCircle className="size-3 mr-1.5" />}
                        Decline
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {applications.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="py-12 text-center text-foreground/50 font-light italic">
                    No pending field applications.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </TabsContent>
    </Tabs>
  );
}
