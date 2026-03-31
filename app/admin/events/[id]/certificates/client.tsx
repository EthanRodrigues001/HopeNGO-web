"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Search, Award, Send, CheckCircle2, Users, Loader2, SendHorizonal } from "lucide-react";

interface Recipient {
  id: string;
  recipientId: string;
  recipientName: string;
  recipientEmail: string;
  role: 'participant' | 'volunteer';
}

interface IssuedCert {
  id: string;
  recipientId: string;
  recipientName: string;
  recipientRole: string;
  certificateNumber: string;
  issuedDate: string | null;
}

interface Props {
  eventId: string;
  participants: Recipient[];
  volunteers: Recipient[];
  issuedCerts: IssuedCert[];
}

export default function EventCertificatesClient({ eventId, participants, volunteers, issuedCerts }: Props) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [sending, setSending] = useState(false);
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("participants");

  const isAlreadyIssued = (recipientId: string, role: string) => {
    return issuedCerts.some(c => c.recipientId === recipientId && c.recipientRole === role);
  };

  const currentList = activeTab === "participants" ? participants : volunteers;
  const currentRole = activeTab === "participants" ? "participant" : "volunteer";

  const filtered = currentList.filter(p => {
    return (p.recipientName?.toLowerCase() || "").includes(search.toLowerCase()) ||
      (p.recipientEmail?.toLowerCase() || "").includes(search.toLowerCase());
  });

  const selectableFiltered = filtered.filter(p => !isAlreadyIssued(p.recipientId, currentRole));
  const allSelected = selectableFiltered.length > 0 && selectableFiltered.every(p => selected.has(p.recipientId));

  const toggleSelect = (uid: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(uid)) next.delete(uid);
      else next.add(uid);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set(selectableFiltered.map(p => p.recipientId)));
    }
  };

  const issueCertificates = async (recipientIds: string[], role: 'participant' | 'volunteer') => {
    try {
      const res = await fetch('/api/certificates/issue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId,
          recipientIds,
          recipientRole: role,
        }),
      });

      if (!res.ok) {
        const err = await res.text();
        throw new Error(err || 'Failed to issue certificates');
      }

      return true;
    } catch (err: any) {
      alert(err.message || 'Error issuing certificates');
      return false;
    }
  };

  const handleSendSingle = async (recipientId: string, role: 'participant' | 'volunteer') => {
    setSendingId(recipientId);
    const ok = await issueCertificates([recipientId], role);
    if (ok) {
      router.refresh();
    }
    setSendingId(null);
  };

  const handleSendAll = async () => {
    const ids = Array.from(selected);
    if (ids.length === 0) {
      alert("Please select at least one recipient");
      return;
    }
    setSending(true);
    const ok = await issueCertificates(ids, currentRole as any);
    if (ok) {
      setSelected(new Set());
      router.refresh();
    }
    setSending(false);
  };

  const totalIssued = issuedCerts.length;
  const participantsCerted = issuedCerts.filter(c => c.recipientRole === 'participant').length;
  const volunteersCerted = issuedCerts.filter(c => c.recipientRole === 'volunteer').length;

  return (
    <div className="space-y-8">
      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-card border-0 ring-1 ring-foreground/[0.04] rounded-[20px] shadow-[0_16px_32px_-12px_rgba(25,28,26,0.03)]">
          <CardContent className="p-8 text-center">
            <div className="text-5xl font-serif text-primary mb-2">{totalIssued}</div>
            <p className="text-[10px] uppercase tracking-widest font-bold text-foreground/40">Total Issued</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-0 ring-1 ring-foreground/[0.04] rounded-[20px] shadow-[0_16px_32px_-12px_rgba(25,28,26,0.03)]">
          <CardContent className="p-8 text-center">
            <div className="text-5xl font-serif text-foreground mb-2">{participantsCerted}<span className="text-xl text-foreground/30 font-sans font-light">/{participants.length}</span></div>
            <p className="text-[10px] uppercase tracking-widest font-bold text-foreground/40">Participants</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-0 ring-1 ring-foreground/[0.04] rounded-[20px] shadow-[0_16px_32px_-12px_rgba(25,28,26,0.03)]">
          <CardContent className="p-8 text-center">
            <div className="text-5xl font-serif text-foreground mb-2">{volunteersCerted}<span className="text-xl text-foreground/30 font-sans font-light">/{volunteers.length}</span></div>
            <p className="text-[10px] uppercase tracking-widest font-bold text-foreground/40">Volunteers</p>
          </CardContent>
        </Card>
      </div>

      {/* Recipient table */}
      <Card className="bg-card shadow-[0_32px_64px_-12px_rgba(25,28,26,0.03)] border-0 ring-1 ring-foreground/[0.03] rounded-[24px]">
        <CardHeader className="p-8 pb-0">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <CardTitle className="text-2xl font-serif text-foreground">Issue Certificates</CardTitle>
            <Button
              onClick={handleSendAll}
              disabled={selected.size === 0 || sending}
              className="h-12 bg-primary hover:bg-primary/90 text-primary-foreground px-6 font-semibold uppercase tracking-[0.12em] text-xs flex gap-2 shadow-none rounded-[8px] transition-all"
            >
              {sending ? <Loader2 size={16} className="animate-spin" /> : <SendHorizonal size={16} />}
              Send to Selected ({selected.size})
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-8 pt-4">
          <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v); setSelected(new Set()); setSearch(""); }}>
            <TabsList className="bg-muted/50 rounded-[8px] p-1 h-12 mb-6">
              <TabsTrigger 
                value="participants" 
                className="flex-1 h-10 rounded-[6px] text-xs uppercase tracking-widest font-bold data-[state=active]:bg-card data-[state=active]:shadow-sm data-[state=active]:text-primary"
              >
                <Users size={14} className="mr-2" /> Participants ({participants.length})
              </TabsTrigger>
              <TabsTrigger 
                value="volunteers" 
                className="flex-1 h-10 rounded-[6px] text-xs uppercase tracking-widest font-bold data-[state=active]:bg-card data-[state=active]:shadow-sm data-[state=active]:text-primary"
              >
                <Award size={14} className="mr-2" /> Volunteers ({volunteers.length})
              </TabsTrigger>
            </TabsList>

            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-[14px] h-4 w-4 text-foreground/40" />
                <Input
                  placeholder="Search by name or email..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-11 h-12 bg-muted/20 border-foreground/10 text-foreground placeholder:text-foreground/40 focus-visible:ring-primary rounded-[8px]"
                />
              </div>
            </div>

            <TabsContent value="participants" className="mt-0">
              {renderTable(filtered, currentRole)}
            </TabsContent>
            <TabsContent value="volunteers" className="mt-0">
              {renderTable(filtered, currentRole)}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Already Issued Certificates */}
      {issuedCerts.length > 0 && (
        <Card className="bg-card shadow-[0_32px_64px_-12px_rgba(25,28,26,0.03)] border-0 ring-1 ring-foreground/[0.03] rounded-[24px]">
          <CardHeader className="p-8 pb-4">
            <CardTitle className="text-2xl font-serif text-foreground">Issued Certificates</CardTitle>
          </CardHeader>
          <CardContent className="p-8 pt-2">
            <div className="rounded-[12px] border border-foreground/[0.05] overflow-x-auto bg-muted/20">
              <Table>
                <TableHeader className="bg-transparent border-b border-foreground/[0.05]">
                  <TableRow className="hover:bg-transparent border-none">
                    <TableHead className="text-[10px] uppercase tracking-widest font-bold text-foreground/50 h-10 px-6">Recipient</TableHead>
                    <TableHead className="text-[10px] uppercase tracking-widest font-bold text-foreground/50 h-10 px-6">Role</TableHead>
                    <TableHead className="text-[10px] uppercase tracking-widest font-bold text-foreground/50 h-10 px-6">Certificate No.</TableHead>
                    <TableHead className="text-[10px] uppercase tracking-widest font-bold text-foreground/50 h-10 px-6">Issued Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {issuedCerts.map((cert, idx) => (
                    <TableRow key={cert.id} className={`${idx !== issuedCerts.length-1 && 'border-b border-foreground/[0.03]'} hover:bg-foreground/[0.02] border-none transition-colors`}>
                      <TableCell className="font-serif font-medium text-foreground px-6 py-4 text-[15px]">{cert.recipientName}</TableCell>
                      <TableCell className="px-6">
                        <Badge variant="outline" className="uppercase tracking-widest text-[9px] font-bold shadow-none rounded-sm border-primary/20 text-primary">
                          {cert.recipientRole}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-foreground/70 font-mono text-xs px-6">{cert.certificateNumber}</TableCell>
                      <TableCell className="text-foreground/60 font-mono text-xs px-6">
                        {cert.issuedDate ? new Date(cert.issuedDate).toLocaleDateString('en-IN') : 'N/A'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );

  function renderTable(list: Recipient[], role: string) {
    return (
      <div className="rounded-[12px] border border-foreground/[0.05] overflow-x-auto bg-muted/20">
        <Table>
          <TableHeader className="bg-transparent border-b border-foreground/[0.05]">
            <TableRow className="hover:bg-transparent border-none">
              <TableHead className="text-[10px] uppercase tracking-widest font-bold text-foreground/50 h-10 px-6 w-12">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={toggleSelectAll}
                  className="h-4 w-4 rounded accent-primary cursor-pointer"
                  disabled={selectableFiltered.length === 0}
                />
              </TableHead>
              <TableHead className="text-[10px] uppercase tracking-widest font-bold text-foreground/50 h-10 px-6">Name</TableHead>
              <TableHead className="text-[10px] uppercase tracking-widest font-bold text-foreground/50 h-10 px-6">Email</TableHead>
              <TableHead className="text-[10px] uppercase tracking-widest font-bold text-foreground/50 h-10 px-6">Status</TableHead>
              <TableHead className="text-[10px] uppercase tracking-widest font-bold text-foreground/50 h-10 px-6 text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {list.length === 0 ? (
              <TableRow className="border-none hover:bg-transparent">
                <TableCell colSpan={5} className="h-32 text-center text-foreground/50 text-sm italic font-serif">
                  {role === "participant" 
                    ? "No attended participants found. Mark attendance first." 
                    : "No approved volunteers found."}
                </TableCell>
              </TableRow>
            ) : (
              list.map((p, idx) => {
                const issued = isAlreadyIssued(p.recipientId, role);
                return (
                  <TableRow key={p.id} className={`${idx !== list.length-1 && 'border-b border-foreground/[0.03]'} hover:bg-foreground/[0.02] border-none transition-colors`}>
                    <TableCell className="px-6 py-4 w-12">
                      <input
                        type="checkbox"
                        checked={selected.has(p.recipientId)}
                        onChange={() => toggleSelect(p.recipientId)}
                        disabled={issued}
                        className="h-4 w-4 rounded accent-primary cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                      />
                    </TableCell>
                    <TableCell className="font-serif font-medium text-foreground px-6 text-[15px]">
                      {p.recipientName || "Unknown"}
                    </TableCell>
                    <TableCell className="text-foreground/70 font-light px-6 text-sm">
                      {p.recipientEmail || "—"}
                    </TableCell>
                    <TableCell className="px-6">
                      {issued ? (
                        <span className="px-2 py-1 rounded-[6px] text-[10px] uppercase tracking-widest font-bold border inline-flex items-center gap-1.5 shadow-none text-primary bg-primary/[0.05] border-primary/20">
                          <CheckCircle2 size={10} /> Issued
                        </span>
                      ) : (
                        <span className="px-2 py-1 rounded-[6px] text-[10px] uppercase tracking-widest font-bold border inline-flex items-center gap-1.5 shadow-none text-amber-600 bg-amber-600/[0.05] border-amber-600/20">
                          Pending
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="px-6 text-right">
                      {issued ? (
                        <span className="text-foreground/40 text-[10px] uppercase tracking-widest font-bold">Already Sent</span>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleSendSingle(p.recipientId, p.role)}
                          disabled={sendingId === p.recipientId}
                          className="h-8 shadow-none bg-primary/[0.04] text-primary hover:bg-primary/10 border-primary/20 text-[10px] uppercase tracking-widest font-bold px-4 rounded-[6px] gap-1.5"
                        >
                          {sendingId === p.recipientId ? (
                            <Loader2 size={12} className="animate-spin" />
                          ) : (
                            <Send size={12} />
                          )}
                          Send
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    );
  }
}
