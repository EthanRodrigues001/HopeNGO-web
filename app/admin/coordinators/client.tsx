"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, CheckCircle, XCircle } from "lucide-react";

export default function CoordinatorsClient({ initialCoordinators }: { initialCoordinators: any[] }) {
  const [coordinators, setCoordinators] = useState(initialCoordinators);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);

  const handleApprove = async (uid: string) => {
    setLoadingAction(`approve-${uid}`);
    try {
      const res = await fetch(`/api/admin/users/${uid}/approve`, { method: "PATCH" });
      if (res.ok) {
        setCoordinators(prev => prev.map(v => v.uid === uid ? { ...v, isApproved: true } : v));
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
        setCoordinators(prev => prev.map(v => v.uid === uid ? { ...v, isActive: false } : v));
      }
    } finally {
      setLoadingAction(null);
    }
  };

  return (
    <div className="bg-card shadow-[0_32px_64px_-12px_rgba(25,28,26,0.03)] border-0 ring-0 rounded-[20px] overflow-hidden">
      <Table>
        <TableHeader className="bg-muted/30">
          <TableRow className="border-border/50 hover:bg-transparent">
            <TableHead className="font-serif font-medium text-foreground py-5 px-6">Name</TableHead>
            <TableHead className="font-serif font-medium text-foreground py-5">Contact</TableHead>
            <TableHead className="font-serif font-medium text-foreground py-5">Location</TableHead>
            <TableHead className="font-serif font-medium text-foreground py-5">Status</TableHead>
            <TableHead className="font-serif font-medium text-foreground text-right py-5 px-6">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {coordinators.map((c) => (
            <TableRow key={c.uid} className="border-border/50 hover:bg-muted/20 transition-colors group">
              <TableCell className="py-5 px-6">
                <div className="font-medium text-foreground">{c.fullName}</div>
                <div className="text-xs text-foreground/50 opacity-0 group-hover:opacity-100 transition-opacity">
                  {c.uid.substring(0, 8)}
                </div>
              </TableCell>
              <TableCell className="py-5">
                <div className="text-sm">{c.email}</div>
                <div className="text-xs text-foreground/60">{c.phone}</div>
              </TableCell>
              <TableCell className="text-sm text-foreground/70 py-5">
                {c.city}, {c.state}
              </TableCell>
              <TableCell className="py-5">
                <div className="flex flex-col gap-1.5 items-start">
                  {!c.isApproved ? (
                    <Badge variant="outline" className="text-primary border-primary/20 bg-primary/5 uppercase tracking-[0.1em] text-[10px]">
                      Pending Approval
                    </Badge>
                  ) : (
                    <Badge variant="default" className="bg-primary/10 text-primary hover:bg-primary/20 uppercase tracking-[0.1em] text-[10px] shadow-none">
                      Approved
                    </Badge>
                  )}
                  {!c.isActive && (
                    <Badge variant="destructive" className="uppercase tracking-[0.1em] text-[10px] shadow-none">
                      Inactive
                    </Badge>
                  )}
                </div>
              </TableCell>
              <TableCell className="text-right py-5 px-6">
                <div className="flex items-center justify-end gap-2">
                  {!c.isApproved && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleApprove(c.uid)}
                      disabled={!!loadingAction}
                      className="h-8 border-green-500/20 text-green-600 hover:bg-green-50 hover:text-green-700 uppercase font-bold tracking-wider text-[10px] shadow-none"
                    >
                      {loadingAction === `approve-${c.uid}` ? <Loader2 className="h-3 w-3 animate-spin mr-1.5" /> : <CheckCircle className="h-3 w-3 mr-1.5" />}
                      Approve
                    </Button>
                  )}
                  {c.isActive && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeactivate(c.uid)}
                      disabled={!!loadingAction}
                      className="h-8 border-destructive/20 text-destructive hover:bg-destructive/10 uppercase font-bold tracking-wider text-[10px] shadow-none"
                    >
                      {loadingAction === `deactivate-${c.uid}` ? <Loader2 className="h-3 w-3 animate-spin mr-1.5" /> : <XCircle className="h-3 w-3 mr-1.5" />}
                      Deactivate
                    </Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
          {coordinators.length === 0 && (
            <TableRow>
              <TableCell colSpan={5} className="py-12 text-center text-foreground/50 font-light italic">
                No coordinators found in the archive.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
