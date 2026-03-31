"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, CheckCircle2, UserX, Clock, Trash2 } from "lucide-react";

export default function EventParticipantsClient({ eventId, initialParticipants }: { eventId: string, initialParticipants: any[] }) {
  const router = useRouter();
  const [participants, setParticipants] = useState(initialParticipants);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [updating, setUpdating] = useState<string | null>(null);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'attended': return 'text-primary bg-primary/[0.05] border-primary/20';
      case 'absent': return 'text-red-600 bg-red-600/[0.05] border-red-600/20';
      case 'registered': return 'text-amber-600 bg-amber-600/[0.05] border-amber-600/20';
      case 'cancelled': return 'text-foreground/50 bg-foreground/[0.05] border-foreground/10';
      default: return 'text-foreground/50 bg-foreground/[0.05] border-foreground/10';
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    setUpdating(id);
    try {
      const res = await fetch(`/api/registrations/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) throw new Error("Failed to update attendance");
      
      setParticipants(participants.map(p => p.id === id ? { ...p, status: newStatus } : p));
      router.refresh();
    } catch (err) {
      alert("Error updating attendance");
    } finally {
      setUpdating(null);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to permanently delete the registration for ${name}?`)) return;

    setUpdating(id);
    try {
      const res = await fetch(`/api/registrations/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to delete registration");

      setParticipants(participants.filter(p => p.id !== id));
      router.refresh();
    } catch (err) {
      alert("Error deleting registration.");
    } finally {
      setUpdating(null);
    }
  };

  const filtered = participants.filter(p => {
    const matchesSearch = 
      (p.participantName?.toLowerCase() || "").includes(search.toLowerCase()) || 
      (p.participantEmail?.toLowerCase() || "").includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <Card className="bg-card shadow-[0_32px_64px_-12px_rgba(25,28,26,0.03)] border-0 ring-1 ring-foreground/[0.03] rounded-[24px]">
      <CardContent className="p-8">
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-[14px] h-4 w-4 text-foreground/40" />
            <Input 
              placeholder="Search participants by name or email..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-11 h-12 bg-muted/20 border-foreground/10 text-foreground placeholder:text-foreground/40 focus-visible:ring-primary rounded-[8px]"
            />
          </div>
          <div className="w-full md:w-56">
            <Select value={statusFilter} onValueChange={(val: any) => setStatusFilter(val || "all")}>
              <SelectTrigger className="h-12 bg-muted/20 border-foreground/10 text-foreground focus:ring-primary rounded-[8px]">
                <SelectValue placeholder="Filter by Status" />
              </SelectTrigger>
              <SelectContent className="bg-card border-foreground/10 rounded-[8px] p-1 shadow-lg">
                <SelectItem value="all">All Registrations</SelectItem>
                <SelectItem value="registered">Registered</SelectItem>
                <SelectItem value="attended">Attended</SelectItem>
                <SelectItem value="absent">Absent</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="rounded-[12px] border border-foreground/[0.05] overflow-x-auto bg-muted/20">
          <Table>
            <TableHeader className="bg-transparent border-b border-foreground/[0.05]">
              <TableRow className="hover:bg-transparent border-none">
                <TableHead className="text-[10px] uppercase tracking-widest font-bold text-foreground/50 h-10 px-6">Participant Name</TableHead>
                <TableHead className="text-[10px] uppercase tracking-widest font-bold text-foreground/50 h-10 px-6">Email Address</TableHead>
                <TableHead className="text-[10px] uppercase tracking-widest font-bold text-foreground/50 h-10 px-6">Reg. Date</TableHead>
                <TableHead className="text-[10px] uppercase tracking-widest font-bold text-foreground/50 h-10 px-6">Status</TableHead>
                <TableHead className="text-[10px] uppercase tracking-widest font-bold text-foreground/50 h-10 px-6">Mark Attendance</TableHead>
                <TableHead className="px-6"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow className="border-none hover:bg-transparent">
                  <TableCell colSpan={6} className="h-32 text-center text-foreground/50 text-sm italic font-serif">
                    No participants match your query.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((p, idx) => (
                  <TableRow key={p.id} className={`${idx !== filtered.length-1 && 'border-b border-foreground/[0.03]'} hover:bg-foreground/[0.02] border-none transition-colors`}>
                    <TableCell className="font-serif font-medium text-foreground px-6 py-4 text-[15px]">
                      {p.participantName || "Unknown"}
                    </TableCell>
                    <TableCell className="text-foreground/70 font-light px-6 text-sm">
                      {p.participantEmail || "N/A"}
                    </TableCell>
                    <TableCell className="text-foreground/60 font-mono text-xs px-6">
                      {p.registeredAt ? new Date(p.registeredAt).toLocaleDateString() : 'N/A'}
                    </TableCell>
                    <TableCell className="px-6">
                      <span className={`px-2 py-1 rounded-[6px] text-[10px] uppercase tracking-widest font-bold border inline-flex items-center gap-1.5 shadow-none ${getStatusColor(p.status)}`}>
                        {p.status === 'attended' ? <CheckCircle2 size={10}/> : p.status === 'absent' ? <UserX size={10}/> : <Clock size={10}/>}
                        {p.status}
                      </span>
                    </TableCell>
                    <TableCell className="px-6">
                      {updating === p.id ? (
                        <div className="text-foreground/50 text-[10px] uppercase tracking-widest font-bold h-8 flex items-center">Saving...</div>
                      ) : (
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="h-8 shadow-none bg-primary/[0.04] text-primary hover:bg-primary/10 border-primary/20 text-[10px] uppercase tracking-widest font-bold px-3 rounded-[6px]"
                            onClick={() => handleStatusChange(p.id, "attended")}
                            disabled={p.status === "attended" || p.status === "cancelled"}
                          >
                            Attended
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="h-8 shadow-none bg-muted hover:bg-muted/80 text-foreground/70 border-foreground/10 text-[10px] uppercase tracking-widest font-bold px-3 rounded-[6px]"
                            onClick={() => handleStatusChange(p.id, "absent")}
                            disabled={p.status === "absent" || p.status === "cancelled"}
                          >
                            Absent
                          </Button>
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-right px-6">
                       <Button 
                          size="icon" 
                          variant="ghost" 
                          className="h-8 w-8 text-foreground/40 hover:text-red-600 hover:bg-red-50 rounded-full"
                          onClick={() => handleDelete(p.id, p.participantName || 'Unknown')}
                          disabled={updating === p.id}
                        >
                          <Trash2 size={16} />
                        </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
