"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Heart, Loader2, CheckCircle2, X } from "lucide-react";

const SUGGESTED = [100, 250, 500, 1000, 2500];

interface Props {
  eventId: string;
  eventTitle: string;
  onClose: () => void;
}

export function EventDonateModal({ eventId, eventTitle, onClose }: Props) {
  const [donorName, setDonorName]   = useState("");
  const [donorEmail, setDonorEmail] = useState("");
  const [donorPhone, setDonorPhone] = useState("");
  const [amount, setAmount]         = useState("");
  const [message, setMessage]       = useState("");
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess]       = useState(false);
  const [txnId, setTxnId]           = useState("");
  const [error, setError]           = useState("");

  const handleDonate = async () => {
    setError("");
    if (!donorName.trim()) { setError("Please enter your name"); return; }
    if (!donorEmail.trim()) { setError("Please enter your email"); return; }
    if (!amount || Number(amount) <= 0) { setError("Please enter a valid amount"); return; }

    setProcessing(true);
    try {
      const res = await fetch(`/api/events/${eventId}/donate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          donorName: donorName.trim(),
          donorEmail: donorEmail.trim(),
          donorPhone: donorPhone.trim(),
          amount: Number(amount),
          message: message.trim() || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Donation failed");
      setTxnId(data.transactionId);
      setSuccess(true);
    } catch (e: any) {
      setError(e.message || "Something went wrong. Please try again.");
    } finally {
      setProcessing(false);
    }
  };

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/20 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-card rounded-[24px] shadow-[0_40px_80px_-12px_rgba(25,28,26,0.2)] w-full max-w-md ring-1 ring-foreground/[0.06] overflow-hidden">

        {/* Header */}
        <div className="relative bg-gradient-to-br from-primary/[0.06] to-transparent px-8 pt-8 pb-6 border-b border-foreground/[0.05]">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 w-8 h-8 rounded-full flex items-center justify-center text-foreground/40 hover:text-foreground hover:bg-muted transition-colors"
          >
            <X size={16} />
          </button>
          <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <Heart size={22} className="text-primary" />
          </div>
          <h2 className="text-2xl font-serif text-foreground mb-1">Support This Event</h2>
          <p className="text-sm text-foreground/50 font-light line-clamp-1">{eventTitle}</p>
        </div>

        <div className="p-8">
          {success ? (
            /* Success state */
            <div className="text-center py-4">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-5">
                <CheckCircle2 size={32} className="text-primary" />
              </div>
              <h3 className="text-2xl font-serif text-foreground mb-2">Thank You!</h3>
              <p className="text-foreground/55 font-light text-sm leading-relaxed mb-6">
                Your donation of <strong className="text-foreground">₹{Number(amount).toLocaleString("en-IN")}</strong> towards <em>{eventTitle}</em> has been received.
              </p>
              <div className="bg-muted/40 rounded-[10px] px-4 py-3 mb-6 text-left">
                <p className="text-[10px] uppercase tracking-widest font-bold text-foreground/40 mb-1">Transaction ID</p>
                <p className="font-mono text-xs text-foreground/60">{txnId}</p>
              </div>
              <p className="text-[10px] text-foreground/30 uppercase tracking-wider mb-5">
                Simulated payment — no real charge
              </p>
              <Button
                onClick={onClose}
                className="w-full h-11 bg-primary hover:bg-primary/90 text-primary-foreground font-bold uppercase tracking-widest text-xs shadow-none rounded-[10px]"
              >
                Close
              </Button>
            </div>
          ) : (
            <div className="space-y-5">
              {/* Simulated banner */}
              <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/30 rounded-[8px] px-4 py-2.5 text-center">
                <p className="text-[10px] text-amber-700 dark:text-amber-400 font-semibold uppercase tracking-wide">
                  ⚠ Simulated — no real charges applied
                </p>
              </div>

              {/* Amount */}
              <div>
                <label className="text-[10px] uppercase tracking-widest font-bold text-foreground/50 mb-2.5 block">
                  Donation Amount (₹)
                </label>
                <div className="flex flex-wrap gap-2 mb-2.5">
                  {SUGGESTED.map((s) => (
                    <button
                      key={s}
                      onClick={() => setAmount(String(s))}
                      className={`px-3 py-1.5 rounded-[8px] text-xs font-bold border transition-all ${
                        amount === String(s)
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-muted/30 text-foreground/60 border-foreground/10 hover:border-primary/30 hover:bg-primary/5"
                      }`}
                    >
                      ₹{s.toLocaleString("en-IN")}
                    </button>
                  ))}
                </div>
                <div className="relative">
                  <span className="absolute left-3.5 top-[13px] text-foreground/50 font-medium text-sm">₹</span>
                  <Input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="Other amount"
                    className="pl-8 h-11 bg-muted/20 border-foreground/[0.08] rounded-[8px]"
                    min={1}
                  />
                </div>
              </div>

              <div className="h-px bg-foreground/[0.05]" />

              {/* Details */}
              <div className="space-y-3">
                <div>
                  <label className="text-[10px] uppercase tracking-widest font-bold text-foreground/50 mb-1.5 block">Full Name *</label>
                  <Input value={donorName} onChange={(e) => setDonorName(e.target.value)} placeholder="Your full name" className="h-11 bg-muted/20 border-foreground/[0.08] rounded-[8px]" />
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-widest font-bold text-foreground/50 mb-1.5 block">Email *</label>
                  <Input type="email" value={donorEmail} onChange={(e) => setDonorEmail(e.target.value)} placeholder="you@example.com" className="h-11 bg-muted/20 border-foreground/[0.08] rounded-[8px]" />
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-widest font-bold text-foreground/50 mb-1.5 block">
                    Phone <span className="text-foreground/30 normal-case">— optional</span>
                  </label>
                  <Input value={donorPhone} onChange={(e) => setDonorPhone(e.target.value)} placeholder="+91 XXXXX XXXXX" className="h-11 bg-muted/20 border-foreground/[0.08] rounded-[8px]" />
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-widest font-bold text-foreground/50 mb-1.5 block">
                    Message <span className="text-foreground/30 normal-case">— optional</span>
                  </label>
                  <Input value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Leave a message of support" className="h-11 bg-muted/20 border-foreground/[0.08] rounded-[8px]" />
                </div>
              </div>

              {error && (
                <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800/30 rounded-[8px] px-4 py-2.5 text-red-600 dark:text-red-400 text-sm">
                  {error}
                </div>
              )}

              <Button
                onClick={handleDonate}
                disabled={processing}
                className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-bold uppercase tracking-widest text-xs shadow-none rounded-[10px] gap-2.5 transition-all"
              >
                {processing ? (
                  <><Loader2 size={16} className="animate-spin" /> Processing…</>
                ) : (
                  <><Heart size={15} /> Donate {amount ? `₹${Number(amount).toLocaleString("en-IN")}` : "Now"}</>
                )}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
