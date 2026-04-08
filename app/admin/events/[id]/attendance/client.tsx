"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Loader2 } from "lucide-react";

export default function EventAttendanceClient({ eventId, event, initialVolunteers }: { eventId: string, event: any, initialVolunteers: any[] }) {
  const router = useRouter();
  const [volunteers, setVolunteers] = useState(initialVolunteers);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [updating, setUpdating] = useState<string | null>(null);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'attended': return 'text-primary bg-primary/[0.05] border-primary/20';
      case 'absent': return 'text-red-600 bg-red-600/[0.05] border-red-600/20';
      default: return 'text-amber-600 bg-amber-600/[0.05] border-amber-600/20';
    }
  };

  const handleAttendanceChange = async (id: string, newAttendance: string) => {
    setUpdating(id);
    try {
      const app = volunteers.find(v => v.id === id);
      const res = await fetch(`/api/volunteer-applications/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ attendance: newAttendance, status: app.status }),
      });

      if (!res.ok) throw new Error("Failed to update attendance");
      
      setVolunteers(volunteers.map(v => v.id === id ? { ...v, attendance: newAttendance } : v));
      router.refresh();
    } catch (err) {
      alert("Error updating attendance");
    } finally {
      setUpdating(null);
    }
  };

  const filtered = volunteers.filter(v => {
    const matchesSearch = (v.volunteerName?.toLowerCase() || "").includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || v.attendance === statusFilter || (statusFilter === 'unmarked' && !v.attendance);
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
                <SelectItem value="all">All Operatives</SelectItem>
                <SelectItem value="attended">Attended</SelectItem>
                <SelectItem value="absent">Absent</SelectItem>
                <SelectItem value="unmarked">Unmarked</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="border border-foreground/[0.05] rounded-[16px] overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow className="border-foreground/[0.05] hover:bg-transparent">
                <TableHead className="font-bold text-xs uppercase tracking-widest text-foreground/50 h-14">Operative</TableHead>
                <TableHead className="font-bold text-xs uppercase tracking-widest text-foreground/50 h-14">Identity Link</TableHead>
                <TableHead className="font-bold text-xs uppercase tracking-widest text-foreground/50 h-14">Current Marking</TableHead>
                <TableHead className="text-right font-bold text-xs uppercase tracking-widest text-foreground/50 h-14 pr-8">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={4} className="h-32 text-center text-foreground/40 font-light">
                    No approved operatives found matching the filters.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((v) => {
                  const displayStatus = v.attendance || 'unmarked';
                  return (
                    <TableRow key={v.id} className="border-foreground/[0.05] hover:bg-muted/20 transition-colors group">
                      <TableCell className="py-4">
                        <span className="font-medium text-foreground">{v.volunteerName || "Unknown"}</span>
                      </TableCell>
                      <TableCell className="py-4">
                        <p className="text-xs text-foreground/70">{v.volunteerEmail}</p>
                      </TableCell>
                      <TableCell className="py-4">
                        <div className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border ${getStatusColor(displayStatus)}`}>
                          {displayStatus}
                        </div>
                      </TableCell>
                      <TableCell className="py-4 text-right pr-6">
                        <div className="flex items-center justify-end gap-2">
                           <Button
                             onClick={() => handleAttendanceChange(v.id, "attended")}
                             disabled={updating === v.id || v.attendance === "attended"}
                             variant="outline"
                             className={`h-8 text-[10px] uppercase tracking-widest font-bold shadow-none rounded-[8px] ${v.attendance === 'attended' ? 'bg-primary text-primary-foreground border-primary' : 'border-foreground/10 hover:bg-muted'}`}
                           >
                             {updating === v.id ? <Loader2 className="w-3 h-3 animate-spin"/> : "Present"}
                           </Button>
                           <Button
                             onClick={() => handleAttendanceChange(v.id, "absent")}
                             disabled={updating === v.id || v.attendance === "absent"}
                             variant="outline"
                             className={`h-8 text-[10px] uppercase tracking-widest font-bold shadow-none rounded-[8px] ${v.attendance === 'absent' ? 'bg-red-600 text-white border-red-600' : 'border-foreground/10 hover:bg-muted'}`}
                           >
                             {updating === v.id ? <Loader2 className="w-3 h-3 animate-spin"/> : "Absent"}
                           </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
