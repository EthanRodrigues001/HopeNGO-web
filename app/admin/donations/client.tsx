"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  PlusCircle, Link as LinkIcon, Copy, Check, Loader2,
  ExternalLink, ToggleLeft, ToggleRight, Trash2, IndianRupee,
  Search, ArrowUpDown, RefreshCw, TrendingUp, Wallet, Users
} from "lucide-react";

interface DonationLink {
  id: string;
  title: string;
  description: string;
  type: "one-time" | "recurring";
  amount: number | null;
  minAmount: number | null;
  maxAmount: number | null;
  suggestedAmounts: number[];
  currency: string;
  linkId: string;
  url: string;
  isActive: boolean;
  totalCollected: number;
  totalDonations: number;
  createdAt: string | null;
  updatedAt: string | null;
}

interface Donation {
  id: string;
  linkId: string;
  donationLinkTitle: string;
  donorName: string;
  donorEmail: string;
  donorPhone: string;
  amount: number;
  currency: string;
  type: string;
  transactionId: string;
  status: string;
  createdAt: string | null;
}

interface Props {
  initialLinks: DonationLink[];
  initialDonations: Donation[];
}

export default function DonationsClient({ initialLinks, initialDonations }: Props) {
  const router = useRouter();
  const [links, setLinks] = useState<DonationLink[]>(initialLinks);
  const [donations] = useState<Donation[]>(initialDonations);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [linkSearch, setLinkSearch] = useState("");
  const [donationSearch, setDonationSearch] = useState("");

  // Form state
  const [form, setForm] = useState({
    title: "",
    description: "",
    type: "one-time" as "one-time" | "recurring",
    amount: "",
    minAmount: "",
    maxAmount: "",
    suggestedAmounts: "",
  });

  const resetForm = () => {
    setForm({
      title: "",
      description: "",
      type: "one-time",
      amount: "",
      minAmount: "",
      maxAmount: "",
      suggestedAmounts: "",
    });
  };

  const handleCreate = async () => {
    if (!form.title.trim()) {
      alert("Please enter a title for the donation link.");
      return;
    }
    if (form.type === "recurring" && (!form.minAmount || !form.maxAmount)) {
      alert("Please set min and max amounts for recurring donations.");
      return;
    }
    if (form.type === "recurring" && Number(form.minAmount) >= Number(form.maxAmount)) {
      alert("Min amount must be less than max amount.");
      return;
    }

    setCreating(true);
    try {
      const res = await fetch("/api/donations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title.trim(),
          description: form.description.trim(),
          type: form.type,
          amount: form.type === "one-time" && form.amount ? Number(form.amount) : null,
          minAmount: form.type === "recurring" ? Number(form.minAmount) : null,
          maxAmount: form.type === "recurring" ? Number(form.maxAmount) : null,
          suggestedAmounts: form.suggestedAmounts
            ? form.suggestedAmounts.split(",").map(s => Number(s.trim())).filter(Boolean)
            : [],
          currency: "INR",
        }),
      });

      if (!res.ok) throw new Error("Failed to create donation link");

      const data = await res.json();
      if (data.link) {
        setLinks(prev => [data.link, ...prev]);
      }
      resetForm();
      setShowCreate(false);
      router.refresh();
    } catch (err: any) {
      alert(err.message || "Error creating donation link");
    } finally {
      setCreating(false);
    }
  };

  const handleCopy = (url: string, id: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleToggle = async (linkId: string, currentActive: boolean) => {
    setTogglingId(linkId);
    try {
      const res = await fetch(`/api/donations/${linkId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !currentActive }),
      });
      if (!res.ok) throw new Error("Failed to toggle");
      setLinks(prev => prev.map(l => l.id === linkId ? { ...l, isActive: !currentActive } : l));
    } catch (err: any) {
      alert(err.message || "Error toggling link");
    } finally {
      setTogglingId(null);
    }
  };

  const handleDelete = async (linkId: string, title: string) => {
    if (!window.confirm(`Delete "${title}"? This cannot be undone.`)) return;
    setDeletingId(linkId);
    try {
      const res = await fetch(`/api/donations/${linkId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      setLinks(prev => prev.filter(l => l.id !== linkId));
    } catch (err: any) {
      alert(err.message || "Error deleting link");
    } finally {
      setDeletingId(null);
    }
  };

  const filteredLinks = links.filter(l =>
    l.title.toLowerCase().includes(linkSearch.toLowerCase()) ||
    l.description?.toLowerCase().includes(linkSearch.toLowerCase())
  );

  const filteredDonations = donations.filter(d =>
    d.donorName?.toLowerCase().includes(donationSearch.toLowerCase()) ||
    d.donorEmail?.toLowerCase().includes(donationSearch.toLowerCase()) ||
    d.transactionId?.toLowerCase().includes(donationSearch.toLowerCase())
  );

  const totalCollected = links.reduce((sum, l) => sum + (l.totalCollected || 0), 0);
  const totalDonationsCount = links.reduce((sum, l) => sum + (l.totalDonations || 0), 0);
  const activeLinks = links.filter(l => l.isActive).length;

  return (
    <div className="space-y-8">
      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-card border-0 ring-1 ring-foreground/[0.04] rounded-[20px] shadow-[0_16px_32px_-12px_rgba(25,28,26,0.03)]">
          <CardContent className="p-8 text-center">
            <div className="text-4xl font-serif text-primary mb-2">₹{totalCollected.toLocaleString("en-IN")}</div>
            <p className="text-[10px] uppercase tracking-widest font-bold text-foreground/40 flex items-center justify-center gap-1">
              <TrendingUp size={12} /> Total Collected
            </p>
          </CardContent>
        </Card>
        <Card className="bg-card border-0 ring-1 ring-foreground/[0.04] rounded-[20px] shadow-[0_16px_32px_-12px_rgba(25,28,26,0.03)]">
          <CardContent className="p-8 text-center">
            <div className="text-4xl font-serif text-foreground mb-2">{totalDonationsCount}</div>
            <p className="text-[10px] uppercase tracking-widest font-bold text-foreground/40 flex items-center justify-center gap-1">
              <Users size={12} /> Total Donations
            </p>
          </CardContent>
        </Card>
        <Card className="bg-card border-0 ring-1 ring-foreground/[0.04] rounded-[20px] shadow-[0_16px_32px_-12px_rgba(25,28,26,0.03)]">
          <CardContent className="p-8 text-center">
            <div className="text-4xl font-serif text-foreground mb-2">{links.length}</div>
            <p className="text-[10px] uppercase tracking-widest font-bold text-foreground/40 flex items-center justify-center gap-1">
              <LinkIcon size={12} /> Total Links
            </p>
          </CardContent>
        </Card>
        <Card className="bg-card border-0 ring-1 ring-foreground/[0.04] rounded-[20px] shadow-[0_16px_32px_-12px_rgba(25,28,26,0.03)]">
          <CardContent className="p-8 text-center">
            <div className="text-4xl font-serif text-primary mb-2">{activeLinks}</div>
            <p className="text-[10px] uppercase tracking-widest font-bold text-foreground/40 flex items-center justify-center gap-1">
              <Wallet size={12} /> Active Links
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Donation Links Table */}
      <Card className="bg-card shadow-[0_32px_64px_-12px_rgba(25,28,26,0.03)] border-0 ring-1 ring-foreground/[0.03] rounded-[24px]">
        <CardHeader className="p-8 pb-0">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <CardTitle className="text-2xl font-serif text-foreground">Generated Links</CardTitle>
            <Dialog open={showCreate} onOpenChange={setShowCreate}>
              <DialogTrigger className="h-12 bg-primary hover:bg-primary/90 text-primary-foreground px-6 font-semibold uppercase tracking-[0.12em] text-xs flex items-center justify-center gap-2 shadow-none rounded-[8px] transition-all">
                <PlusCircle size={16} />
                New Donation Link
              </DialogTrigger>
              <DialogContent className="bg-card border-foreground/10 rounded-[20px] max-w-lg p-0 overflow-hidden">
                <DialogHeader className="p-8 pb-4 border-b border-foreground/[0.05]">
                  <DialogTitle className="text-2xl font-serif text-foreground">Create Donation Link</DialogTitle>
                </DialogHeader>
                <div className="p-8 pt-6 space-y-5">
                  <div>
                    <label className="text-[10px] uppercase tracking-widest font-bold text-foreground/50 mb-2 block">Title *</label>
                    <Input
                      value={form.title}
                      onChange={e => setForm({ ...form, title: e.target.value })}
                      placeholder="e.g., Winter Relief Fund"
                      className="h-12 bg-muted/20 border-foreground/10 rounded-[8px]"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase tracking-widest font-bold text-foreground/50 mb-2 block">Description</label>
                    <Input
                      value={form.description}
                      onChange={e => setForm({ ...form, description: e.target.value })}
                      placeholder="Brief description of the cause..."
                      className="h-12 bg-muted/20 border-foreground/10 rounded-[8px]"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase tracking-widest font-bold text-foreground/50 mb-2 block">Donation Type *</label>
                    <Select value={form.type} onValueChange={(v: any) => setForm({ ...form, type: v })}>
                      <SelectTrigger className="h-12 bg-muted/20 border-foreground/10 rounded-[8px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-card border-foreground/10 rounded-[8px]">
                        <SelectItem value="one-time">One-Time Donation</SelectItem>
                        <SelectItem value="recurring">Monthly Recurring</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {form.type === "one-time" && (
                    <div>
                      <label className="text-[10px] uppercase tracking-widest font-bold text-foreground/50 mb-2 block">
                        Fixed Amount (₹) <span className="text-foreground/30">— leave blank for custom</span>
                      </label>
                      <Input
                        type="number"
                        value={form.amount}
                        onChange={e => setForm({ ...form, amount: e.target.value })}
                        placeholder="e.g., 500"
                        className="h-12 bg-muted/20 border-foreground/10 rounded-[8px]"
                      />
                    </div>
                  )}
                  {form.type === "recurring" && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-[10px] uppercase tracking-widest font-bold text-foreground/50 mb-2 block">Min Amount (₹) *</label>
                        <Input
                          type="number"
                          value={form.minAmount}
                          onChange={e => setForm({ ...form, minAmount: e.target.value })}
                          placeholder="100"
                          className="h-12 bg-muted/20 border-foreground/10 rounded-[8px]"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] uppercase tracking-widest font-bold text-foreground/50 mb-2 block">Max Amount (₹) *</label>
                        <Input
                          type="number"
                          value={form.maxAmount}
                          onChange={e => setForm({ ...form, maxAmount: e.target.value })}
                          placeholder="10000"
                          className="h-12 bg-muted/20 border-foreground/10 rounded-[8px]"
                        />
                      </div>
                    </div>
                  )}
                  <div>
                    <label className="text-[10px] uppercase tracking-widest font-bold text-foreground/50 mb-2 block">
                      Suggested Amounts <span className="text-foreground/30">— comma separated</span>
                    </label>
                    <Input
                      value={form.suggestedAmounts}
                      onChange={e => setForm({ ...form, suggestedAmounts: e.target.value })}
                      placeholder="100, 500, 1000, 5000"
                      className="h-12 bg-muted/20 border-foreground/10 rounded-[8px]"
                    />
                  </div>
                  <Button
                    onClick={handleCreate}
                    disabled={creating}
                    className="w-full h-14 bg-primary hover:bg-primary/90 text-primary-foreground font-bold uppercase tracking-widest text-xs shadow-none rounded-[8px] gap-2 mt-2"
                  >
                    {creating ? <Loader2 size={16} className="animate-spin" /> : <PlusCircle size={16} />}
                    Generate Link
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent className="p-8 pt-4">
          <div className="relative mb-6">
            <Search className="absolute left-4 top-[14px] h-4 w-4 text-foreground/40" />
            <Input
              placeholder="Search links by title..."
              value={linkSearch}
              onChange={e => setLinkSearch(e.target.value)}
              className="pl-11 h-12 bg-muted/20 border-foreground/10 text-foreground placeholder:text-foreground/40 focus-visible:ring-primary rounded-[8px]"
            />
          </div>

          <div className="rounded-[12px] border border-foreground/[0.05] overflow-x-auto bg-muted/20">
            <Table>
              <TableHeader className="bg-transparent border-b border-foreground/[0.05]">
                <TableRow className="hover:bg-transparent border-none">
                  <TableHead className="text-[10px] uppercase tracking-widest font-bold text-foreground/50 h-10 px-6">Title</TableHead>
                  <TableHead className="text-[10px] uppercase tracking-widest font-bold text-foreground/50 h-10 px-6">Type</TableHead>
                  <TableHead className="text-[10px] uppercase tracking-widest font-bold text-foreground/50 h-10 px-6">Amount</TableHead>
                  <TableHead className="text-[10px] uppercase tracking-widest font-bold text-foreground/50 h-10 px-6">Collected</TableHead>
                  <TableHead className="text-[10px] uppercase tracking-widest font-bold text-foreground/50 h-10 px-6">Donors</TableHead>
                  <TableHead className="text-[10px] uppercase tracking-widest font-bold text-foreground/50 h-10 px-6">Status</TableHead>
                  <TableHead className="text-[10px] uppercase tracking-widest font-bold text-foreground/50 h-10 px-6 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLinks.length === 0 ? (
                  <TableRow className="border-none hover:bg-transparent">
                    <TableCell colSpan={7} className="h-32 text-center text-foreground/50 text-sm italic font-serif">
                      No donation links created yet. Click &quot;New Donation Link&quot; to get started.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredLinks.map((link, idx) => (
                    <TableRow key={link.id} className={`${idx !== filteredLinks.length - 1 && "border-b border-foreground/[0.03]"} hover:bg-foreground/[0.02] border-none transition-colors`}>
                      <TableCell className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          <span className="font-serif font-medium text-foreground text-[15px]">{link.title}</span>
                          {link.description && (
                            <span className="text-foreground/40 text-xs font-light line-clamp-1">{link.description}</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="px-6">
                        <Badge
                          variant="outline"
                          className={`uppercase tracking-widest text-[9px] font-bold shadow-none rounded-sm ${
                            link.type === "recurring"
                              ? "border-cyan-600/20 text-cyan-600 bg-cyan-600/[0.05]"
                              : "border-primary/20 text-primary bg-primary/[0.05]"
                          }`}
                        >
                          {link.type === "recurring" ? "Monthly" : "One-Time"}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-6 text-foreground/70 text-sm">
                        {link.type === "recurring" ? (
                          <span>₹{link.minAmount?.toLocaleString("en-IN")} – ₹{link.maxAmount?.toLocaleString("en-IN")}</span>
                        ) : link.amount ? (
                          <span>₹{link.amount.toLocaleString("en-IN")}</span>
                        ) : (
                          <span className="text-foreground/40 italic">Custom</span>
                        )}
                      </TableCell>
                      <TableCell className="px-6 font-medium text-foreground">
                        ₹{(link.totalCollected || 0).toLocaleString("en-IN")}
                      </TableCell>
                      <TableCell className="px-6 text-foreground/70 text-sm">
                        {link.totalDonations || 0}
                      </TableCell>
                      <TableCell className="px-6">
                        <span
                          className={`px-2 py-1 rounded-[6px] text-[10px] uppercase tracking-widest font-bold border inline-flex items-center gap-1.5 shadow-none ${
                            link.isActive
                              ? "text-primary bg-primary/[0.05] border-primary/20"
                              : "text-foreground/40 bg-foreground/[0.03] border-foreground/10"
                          }`}
                        >
                          {link.isActive ? "Active" : "Inactive"}
                        </span>
                      </TableCell>
                      <TableCell className="px-6">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleCopy(link.url, link.id)}
                            className="h-8 shadow-none bg-primary/[0.04] text-primary hover:bg-primary/10 border-primary/20 text-[10px] uppercase tracking-widest font-bold px-3 rounded-[6px] gap-1.5"
                          >
                            {copiedId === link.id ? <Check size={12} /> : <Copy size={12} />}
                            {copiedId === link.id ? "Copied!" : "Copy"}
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleToggle(link.id, link.isActive)}
                            disabled={togglingId === link.id}
                            className="h-8 w-8 rounded-full text-foreground/40 hover:text-foreground hover:bg-muted"
                            title={link.isActive ? "Deactivate" : "Activate"}
                          >
                            {togglingId === link.id ? (
                              <Loader2 size={14} className="animate-spin" />
                            ) : link.isActive ? (
                              <ToggleRight size={16} className="text-primary" />
                            ) : (
                              <ToggleLeft size={16} />
                            )}
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleDelete(link.id, link.title)}
                            disabled={deletingId === link.id}
                            className="h-8 w-8 rounded-full text-foreground/40 hover:text-red-600 hover:bg-red-50"
                          >
                            {deletingId === link.id ? (
                              <Loader2 size={14} className="animate-spin" />
                            ) : (
                              <Trash2 size={14} />
                            )}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Recent Donations Log */}
      <Card className="bg-card shadow-[0_32px_64px_-12px_rgba(25,28,26,0.03)] border-0 ring-1 ring-foreground/[0.03] rounded-[24px]">
        <CardHeader className="p-8 pb-4">
          <CardTitle className="text-2xl font-serif text-foreground">Recent Donations</CardTitle>
        </CardHeader>
        <CardContent className="p-8 pt-2">
          <div className="relative mb-6">
            <Search className="absolute left-4 top-[14px] h-4 w-4 text-foreground/40" />
            <Input
              placeholder="Search by donor name, email, or transaction ID..."
              value={donationSearch}
              onChange={e => setDonationSearch(e.target.value)}
              className="pl-11 h-12 bg-muted/20 border-foreground/10 text-foreground placeholder:text-foreground/40 focus-visible:ring-primary rounded-[8px]"
            />
          </div>

          <div className="rounded-[12px] border border-foreground/[0.05] overflow-x-auto bg-muted/20">
            <Table>
              <TableHeader className="bg-transparent border-b border-foreground/[0.05]">
                <TableRow className="hover:bg-transparent border-none">
                  <TableHead className="text-[10px] uppercase tracking-widest font-bold text-foreground/50 h-10 px-6">Donor</TableHead>
                  <TableHead className="text-[10px] uppercase tracking-widest font-bold text-foreground/50 h-10 px-6">Campaign</TableHead>
                  <TableHead className="text-[10px] uppercase tracking-widest font-bold text-foreground/50 h-10 px-6">Amount</TableHead>
                  <TableHead className="text-[10px] uppercase tracking-widest font-bold text-foreground/50 h-10 px-6">Type</TableHead>
                  <TableHead className="text-[10px] uppercase tracking-widest font-bold text-foreground/50 h-10 px-6">Transaction</TableHead>
                  <TableHead className="text-[10px] uppercase tracking-widest font-bold text-foreground/50 h-10 px-6">Date</TableHead>
                  <TableHead className="text-[10px] uppercase tracking-widest font-bold text-foreground/50 h-10 px-6">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDonations.length === 0 ? (
                  <TableRow className="border-none hover:bg-transparent">
                    <TableCell colSpan={7} className="h-32 text-center text-foreground/50 text-sm italic font-serif">
                      No donations received yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredDonations.map((d, idx) => (
                    <TableRow key={d.id} className={`${idx !== filteredDonations.length - 1 && "border-b border-foreground/[0.03]"} hover:bg-foreground/[0.02] border-none transition-colors`}>
                      <TableCell className="px-6 py-4">
                        <div className="flex flex-col gap-0.5">
                          <span className="font-serif font-medium text-foreground text-[15px]">{d.donorName}</span>
                          <span className="text-foreground/40 text-xs">{d.donorEmail}</span>
                        </div>
                      </TableCell>
                      <TableCell className="px-6 text-foreground/70 text-sm">{d.donationLinkTitle}</TableCell>
                      <TableCell className="px-6 font-medium text-foreground">₹{d.amount.toLocaleString("en-IN")}</TableCell>
                      <TableCell className="px-6">
                        <Badge
                          variant="outline"
                          className={`uppercase tracking-widest text-[9px] font-bold shadow-none rounded-sm ${
                            d.type === "recurring"
                              ? "border-cyan-600/20 text-cyan-600"
                              : "border-primary/20 text-primary"
                          }`}
                        >
                          {d.type}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-6 font-mono text-xs text-foreground/60">{d.transactionId}</TableCell>
                      <TableCell className="px-6 text-foreground/60 text-xs">
                        {d.createdAt ? new Date(d.createdAt).toLocaleDateString("en-IN", {
                          day: "numeric", month: "short", year: "numeric"
                        }) : "N/A"}
                      </TableCell>
                      <TableCell className="px-6">
                        <span className={`px-2 py-1 rounded-[6px] text-[10px] uppercase tracking-widest font-bold border inline-flex items-center gap-1.5 shadow-none ${
                          d.status === "success"
                            ? "text-primary bg-primary/[0.05] border-primary/20"
                            : "text-red-600 bg-red-600/[0.05] border-red-600/20"
                        }`}>
                          {d.status}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
