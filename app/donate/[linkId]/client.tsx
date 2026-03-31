"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Heart, Loader2, CheckCircle2, IndianRupee, ArrowLeft, RefreshCw } from "lucide-react";
import Link from "next/link";

interface DonateLink {
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
}

interface Props {
  link: DonateLink;
}

export default function DonateClient({ link }: Props) {
  const [donorName, setDonorName] = useState("");
  const [donorEmail, setDonorEmail] = useState("");
  const [donorPhone, setDonorPhone] = useState("");
  const [amount, setAmount] = useState<string>(link.amount ? String(link.amount) : "");
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);
  const [txnId, setTxnId] = useState("");
  const [error, setError] = useState("");

  const isRecurring = link.type === "recurring";

  const handleSubmit = async () => {
    setError("");

    if (!donorName.trim()) { setError("Please enter your name"); return; }
    if (!donorEmail.trim()) { setError("Please enter your email"); return; }
    if (!amount || Number(amount) <= 0) { setError("Please enter a valid amount"); return; }

    if (isRecurring && link.minAmount && link.maxAmount) {
      if (Number(amount) < link.minAmount || Number(amount) > link.maxAmount) {
        setError(`Amount must be between ₹${link.minAmount.toLocaleString("en-IN")} and ₹${link.maxAmount.toLocaleString("en-IN")}`);
        return;
      }
    }

    setProcessing(true);
    try {
      const res = await fetch("/api/donations/pay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          linkId: link.linkId,
          donorName: donorName.trim(),
          donorEmail: donorEmail.trim(),
          donorPhone: donorPhone.trim(),
          amount: Number(amount),
          isRecurring,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Payment failed");
      }

      const data = await res.json();
      setTxnId(data.transactionId);
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || "Payment processing failed. Please try again.");
    } finally {
      setProcessing(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6 font-sans">
        <div className="max-w-md w-full text-center">
          <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-8">
            <CheckCircle2 size={48} className="text-primary" />
          </div>
          <h1 className="text-4xl font-serif text-foreground mb-4">Thank You!</h1>
          <p className="text-foreground/60 font-light leading-relaxed mb-6">
            Your {isRecurring ? "monthly recurring" : "one-time"} donation of{" "}
            <span className="text-foreground font-medium">₹{Number(amount).toLocaleString("en-IN")}</span>{" "}
            to <span className="text-foreground font-medium">{link.title}</span> has been processed successfully.
          </p>
          <Card className="bg-muted/30 border-0 rounded-[16px] mb-8">
            <CardContent className="p-6">
              <p className="text-[10px] uppercase tracking-widest font-bold text-foreground/40 mb-2">Transaction ID</p>
              <p className="font-mono text-sm text-foreground/70">{txnId}</p>
            </CardContent>
          </Card>
          <p className="text-foreground/40 text-xs italic mb-8">
            This is a simulated payment. No real transaction was processed.
          </p>
          <Link href="/">
            <Button variant="outline" className="h-12 rounded-[8px] shadow-none border-foreground/10 gap-2 uppercase tracking-widest text-xs font-bold">
              <ArrowLeft size={14} /> Back to Home
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6 font-sans">
      <div className="max-w-lg w-full">
        {/* Header */}
        <div className="text-center mb-10">
          <Link href="/" className="inline-flex items-center gap-2 text-foreground/40 hover:text-foreground text-xs uppercase tracking-widest font-bold mb-8 transition-colors">
            <ArrowLeft size={14} /> Back to HopeNGO
          </Link>
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <Heart size={28} className="text-primary" />
          </div>
          <h1 className="text-4xl font-serif text-foreground mb-3">{link.title}</h1>
          {link.description && (
            <p className="text-foreground/50 font-light leading-relaxed max-w-sm mx-auto">{link.description}</p>
          )}
          <div className="mt-4">
            <Badge
              variant="outline"
              className={`uppercase tracking-widest text-[9px] font-bold shadow-none rounded-sm ${
                isRecurring
                  ? "border-cyan-600/20 text-cyan-600 bg-cyan-600/[0.05]"
                  : "border-primary/20 text-primary bg-primary/[0.05]"
              }`}
            >
              {isRecurring ? (
                <><RefreshCw size={10} className="mr-1" /> Monthly Recurring</>
              ) : (
                "One-Time Donation"
              )}
            </Badge>
          </div>
        </div>

        {/* Simulated Payment Banner */}
        <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/30 rounded-[12px] px-5 py-3 text-center mb-8">
          <p className="text-[11px] text-amber-700 dark:text-amber-400 font-semibold uppercase tracking-wide">
            ⚠ Simulated Payment — No real charges will be applied
          </p>
        </div>

        {/* Payment Card */}
        <Card className="bg-card border-0 ring-1 ring-foreground/[0.06] rounded-[24px] shadow-[0_32px_64px_-12px_rgba(25,28,26,0.06)]">
          <CardContent className="p-8 space-y-6">
            {/* Amount Selection */}
            <div>
              <label className="text-[10px] uppercase tracking-widest font-bold text-foreground/50 mb-3 block">
                {isRecurring ? `Monthly Amount (₹${link.minAmount?.toLocaleString("en-IN")} – ₹${link.maxAmount?.toLocaleString("en-IN")})` : "Donation Amount (₹)"}
              </label>

              {/* Suggested amounts */}
              {link.suggestedAmounts.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {link.suggestedAmounts.map((amt) => (
                    <button
                      key={amt}
                      onClick={() => setAmount(String(amt))}
                      className={`px-4 py-2 rounded-[8px] text-sm font-semibold transition-all border ${
                        amount === String(amt)
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-muted/30 text-foreground/70 border-foreground/10 hover:border-primary/30 hover:bg-primary/[0.05]"
                      }`}
                    >
                      ₹{amt.toLocaleString("en-IN")}
                    </button>
                  ))}
                </div>
              )}

              <div className="relative">
                <span className="absolute left-4 top-[14px] text-foreground/50 font-medium">₹</span>
                <Input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder={link.amount ? String(link.amount) : "Enter amount"}
                  className="pl-9 h-14 bg-muted/20 border-foreground/10 rounded-[10px] text-lg font-medium"
                  min={link.minAmount || 1}
                  max={link.maxAmount || undefined}
                />
              </div>
            </div>

            <div className="h-px bg-foreground/[0.05]" />

            {/* Donor Details */}
            <div>
              <label className="text-[10px] uppercase tracking-widest font-bold text-foreground/50 mb-2 block">Full Name *</label>
              <Input
                value={donorName}
                onChange={(e) => setDonorName(e.target.value)}
                placeholder="Enter your full name"
                className="h-12 bg-muted/20 border-foreground/10 rounded-[8px]"
              />
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-widest font-bold text-foreground/50 mb-2 block">Email Address *</label>
              <Input
                type="email"
                value={donorEmail}
                onChange={(e) => setDonorEmail(e.target.value)}
                placeholder="you@example.com"
                className="h-12 bg-muted/20 border-foreground/10 rounded-[8px]"
              />
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-widest font-bold text-foreground/50 mb-2 block">
                Phone <span className="text-foreground/30">— optional</span>
              </label>
              <Input
                value={donorPhone}
                onChange={(e) => setDonorPhone(e.target.value)}
                placeholder="+91 XXXXX XXXXX"
                className="h-12 bg-muted/20 border-foreground/10 rounded-[8px]"
              />
            </div>

            {error && (
              <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/30 rounded-[8px] px-4 py-3 text-red-600 dark:text-red-400 text-sm">
                {error}
              </div>
            )}

            <Button
              onClick={handleSubmit}
              disabled={processing}
              className="w-full h-14 bg-primary hover:bg-primary/90 text-primary-foreground font-bold uppercase tracking-widest text-xs shadow-none rounded-[10px] gap-3 transition-all"
            >
              {processing ? (
                <><Loader2 size={18} className="animate-spin" /> Processing...</>
              ) : (
                <>
                  <Heart size={16} />
                  {isRecurring ? "Start Monthly Donation" : "Donate"}{" "}
                  {amount ? `₹${Number(amount).toLocaleString("en-IN")}` : ""}
                </>
              )}
            </Button>

            <p className="text-center text-foreground/30 text-[10px] uppercase tracking-widest font-bold mt-2">
              Secure • Simulated • HopeNGO
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
