"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle2, XCircle, Search, Clock, Save, Trash2 } from "lucide-react";

export default function EventVolunteersClient({ eventId, initialVolunteers }: { eventId: string, initialVolunteers: any[] }) {
  const router = useRouter();
  const [volunteers, setVolunteers] = useState(initialVolunteers);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [updating, setUpdating] = useState<string | null>(null);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'text-primary bg-primary/[0.05] border-primary/20';
      case 'rejected': return 'text-red-600 bg-red-600/[0.05] border-red-600/20';
      case 'pending': return 'text-amber-600 bg-amber-600/[0.05] border-amber-600/20';
      case 'cancelled': return 'text-foreground/50 bg-foreground/[0.05] border-foreground/10';
      default: return 'text-foreground/50 bg-foreground/[0.05] border-foreground/10';
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    setUpdating(id);
    try {
      const app = volunteers.find(v => v.id === id);
      const res = await fetch(`/api/volunteer-applications/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus, adminNotes: app?.adminNotes || "" }),
      });

      if (!res.ok) throw new Error("Failed to update status");
      
      setVolunteers(volunteers.map(v => v.id === id ? { ...v, status: newStatus } : v));
      router.refresh();
    } catch (err) {
      alert("Error updating status");
    } finally {
      setUpdating(null);
    }
  };

  const handleNotesChange = async (id: string, notes: string) => {
    setVolunteers(volunteers.map(v => v.id === id ? { ...v, adminNotes: notes } : v));
  };

  const saveNotes = async (id: string) => {
    setUpdating(id);
    try {
      const app = volunteers.find(v => v.id === id);
      const res = await fetch(`/api/volunteer-applications/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: app?.status, adminNotes: app?.adminNotes || "" }),
      });

      if (!res.ok) throw new Error("Failed to save notes");
      
      router.refresh();
      alert("Notes saved successfully");
    } catch (err) {
      alert("Error saving notes");
    } finally {
      setUpdating(null);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to permanently delete the application from ${name}?`)) return;

    setUpdating(id);
    try {
      const res = await fetch(`/api/volunteer-applications/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to delete application");

      setVolunteers(volunteers.filter(v => v.id !== id));
      router.refresh();
    } catch (err) {
      alert("Error deleting application.");
    } finally {
      setUpdating(null);
    }
  };

  const filtered = volunteers.filter(v => {
    const matchesSearch = (v.volunteerName?.toLowerCase() || "").includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || v.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <Card className="bg-card shadow-[0_32px_64px_-12px_rgba(25,28,26,0.03)] border-0 ring-1 ring-foreground/[0.03] rounded-[24px]">
      <CardContent className="p-8">
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-[14px] h-4 w-4 text-foreground/40" />
            <Input 
              placeholder="Search operatives by name..." 
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
                <SelectItem value="all">All Applications</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="rounded-[12px] border border-foreground/[0.05] overflow-x-auto bg-muted/20">
          <Table>
            <TableHeader className="bg-transparent border-b border-foreground/[0.05]">
              <TableRow className="hover:bg-transparent border-none">
                <TableHead className="text-[10px] uppercase tracking-widest font-bold text-foreground/50 h-10 px-6">Name</TableHead>
                <TableHead className="text-[10px] uppercase tracking-widest font-bold text-foreground/50 h-10 px-6">Date</TableHead>
                <TableHead className="text-[10px] uppercase tracking-widest font-bold text-foreground/50 h-10 px-6">Status</TableHead>
                <TableHead className="text-[10px] uppercase tracking-widest font-bold text-foreground/50 h-10 px-6">Clearance</TableHead>
                <TableHead className="text-[10px] uppercase tracking-widest font-bold text-foreground/50 h-10 px-6">Directives</TableHead>
                <TableHead className="px-6"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow className="border-none hover:bg-transparent">
                  <TableCell colSpan={6} className="h-32 text-center text-foreground/50 text-sm italic font-serif">
                    No matching volunteer applications found.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((v, idx) => (
                  <TableRow key={v.id} className={`${idx !== filtered.length-1 && 'border-b border-foreground/[0.03]'} hover:bg-foreground/[0.02] border-none transition-colors`}>
                    <TableCell className="font-serif font-medium text-foreground px-6 py-4 text-[15px]">
                      {v.volunteerName || "Unknown"}
                    </TableCell>
                    <TableCell className="text-foreground/70 font-mono text-xs px-6">
                      {v.appliedAt ? new Date(v.appliedAt).toLocaleDateString() : 'N/A'}
                    </TableCell>
                    <TableCell className="px-6">
                      <span className={`px-2 py-1 rounded-[6px] text-[10px] uppercase tracking-widest font-bold border inline-flex items-center gap-1.5 shadow-none ${getStatusColor(v.status)}`}>
                        {v.status === 'approved' ? <CheckCircle2 size={10}/> : v.status === 'rejected' ? <XCircle size={10}/> : <Clock size={10}/>}
                        {v.status}
                      </span>
                    </TableCell>
                    <TableCell className="px-6">
                      {updating === v.id ? (
                        <div className="text-foreground/50 text-[10px] uppercase tracking-widest font-bold h-8 flex items-center">Auth...</div>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="h-8 shadow-none bg-primary/[0.04] text-primary hover:bg-primary/10 border-primary/20 text-[10px] uppercase tracking-widest font-bold px-3 rounded-[6px]"
                            onClick={() => handleStatusChange(v.id, "approved")}
                            disabled={v.status === "approved" || v.status === "cancelled"}
                          >
                            Approve
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="h-8 shadow-none bg-red-600/5 hover:bg-red-600/10 text-red-600 border-red-600/10 text-[10px] uppercase tracking-widest font-bold px-3 rounded-[6px]"
                            onClick={() => handleStatusChange(v.id, "rejected")}
                            disabled={v.status === "rejected" || v.status === "cancelled"}
                          >
                            Reject
                          </Button>
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="px-6">
                      <div className="flex items-center gap-2 max-w-[200px]">
                        <Input 
                          value={v.adminNotes || ""} 
                          onChange={(e) => handleNotesChange(v.id, e.target.value)}
                          placeholder="Task notes..." 
                          className="h-8 text-xs bg-muted/40 border-foreground/10 text-foreground focus-visible:ring-primary rounded-[6px]"
                        />
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          className="h-8 w-8 text-foreground/40 hover:text-primary hover:bg-primary/10 rounded-full flex-shrink-0"
                          onClick={() => saveNotes(v.id)}
                          disabled={updating === v.id}
                        >
                          <Save size={14} />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell className="text-right px-6">
                       <Button 
                          size="icon" 
                          variant="ghost" 
                          className="h-8 w-8 text-foreground/40 hover:text-red-600 hover:bg-red-50 rounded-full"
                          onClick={() => handleDelete(v.id, v.volunteerName || 'Unknown')}
                          disabled={updating === v.id}
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
