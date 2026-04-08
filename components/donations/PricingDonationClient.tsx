"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Heart, Loader2, CheckCircle2, ShieldCheck, CreditCard, Banknote } from "lucide-react";

// The schema is the same as earlier
const schema = z.object({
  donorName: z.string().min(2, "Name must be at least 2 characters"),
  donorEmail: z.string().email("Invalid email address"),
  amount: z.number().min(1, "Amount must be at least ₹1"),
  paymentMethod: z.enum(['upi', 'bank_transfer', 'other']),
  isRecurring: z.boolean().default(false),
  transactionId: z.string().optional(),
  message: z.string().max(300).optional(),
});

type DonationFormValues = z.infer<typeof schema>;

const TIERS = [
  { id: "basic", name: "Supporter", amount: 500, description: "Funds essential daily operations.", icon: Heart },
  { id: "impact", name: "Advocate", amount: 2000, description: "Provides core resources for events.", icon: ShieldCheck },
  { id: "hero", name: "Champion", amount: 5000, description: "Sponsors complete program initiatives.", icon: Banknote },
];

export function PricingDonationClient() {
  const [recurring, setRecurring] = useState(false);
  const [customAmount, setCustomAmount] = useState<string>("");
  const [selectedTier, setSelectedTier] = useState<number | null>(null);
  const [submitStatus, setSubmitStatus] = useState<"idle" | "success" | "error">("idle");
  const [showForm, setShowForm] = useState(false);

  const { register, handleSubmit, formState: { errors, isSubmitting }, reset, setValue, watch } = useForm<DonationFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      paymentMethod: "upi",
      isRecurring: false,
    }
  });

  const handleSelectAmount = (amount: number) => {
    setSelectedTier(amount);
    setCustomAmount("");
    setValue("amount", amount, { shouldValidate: true });
    setShowForm(true);
    // Auto-scroll to form gently
    setTimeout(() => {
      document.getElementById('checkout-form')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleCustomAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setCustomAmount(val);
    setSelectedTier(null);
    if (val && !isNaN(Number(val))) {
      setValue("amount", Number(val), { shouldValidate: true });
    }
  };

  const proceedCustom = () => {
    if (customAmount && Number(customAmount) > 0) {
      setShowForm(true);
      setTimeout(() => {
        document.getElementById('checkout-form')?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  };

  async function onSubmit(data: DonationFormValues) {
    // Inject recurring state
    data.isRecurring = recurring;
    try {
      const res = await fetch("/api/donations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        setSubmitStatus("success");
        setShowForm(false);
        reset();
      } else {
        setSubmitStatus("error");
      }
    } catch {
      setSubmitStatus("error");
    }
  }

  if (submitStatus === "success") {
    return (
      <div className="bg-primary/5 border border-primary/20 rounded-[24px] p-12 text-center shadow-sm max-w-2xl mx-auto">
        <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className="w-10 h-10 text-primary" />
        </div>
        <h2 className="text-3xl font-serif text-foreground mb-4">Thank You!</h2>
        <p className="text-foreground/70 font-light text-lg mb-8">
          We have recorded your {recurring ? "monthly " : ""}donation intent. Your support means the world to our operatives in the field.
        </p>
        <Button 
          onClick={() => {
            setSubmitStatus("idle");
            setSelectedTier(null);
            setCustomAmount("");
          }}
          className="bg-primary text-primary-foreground h-12 px-8 uppercase tracking-widest text-xs font-bold rounded-[8px] shadow-none"
        >
          Return to Dashboard
        </Button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-5xl mx-auto space-y-12">
      
      {/* Toggle */}
      <div className="flex justify-center">
        <div className="bg-muted p-1.5 rounded-full inline-flex">
          <button 
            onClick={() => setRecurring(false)}
            className={`px-6 py-2.5 rounded-full text-sm font-bold uppercase tracking-widest transition-all ${!recurring ? 'bg-background shadow-sm text-primary text-foreground' : 'text-foreground/50 hover:text-foreground'}`}
          >
            One-Time Target
          </button>
          <button 
            onClick={() => setRecurring(true)}
            className={`px-6 py-2.5 rounded-full text-sm font-bold uppercase tracking-widest transition-all flex items-center gap-2 ${recurring ? 'bg-primary shadow-sm text-primary-foreground' : 'text-foreground/50 hover:text-foreground'}`}
          >
            Monthly Pipeline
            {recurring && <Badge className="bg-primary-foreground/20 hover:bg-primary-foreground/30 text-primary-foreground border-none text-[9px] -mr-2">MOCK</Badge>}
          </button>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="grid md:grid-cols-3 gap-6">
        {TIERS.map((tier) => {
          const Icon = tier.icon;
          const isSelected = selectedTier === tier.amount;
          return (
            <Card 
              key={tier.id} 
              className={`relative overflow-hidden cursor-pointer transition-all duration-300 rounded-[24px] border ${isSelected ? 'border-primary ring-1 ring-primary shadow-xl scale-100 bg-primary/[0.02]' : 'border-foreground/10 hover:border-primary/50 hover:shadow-lg bg-card'} flex flex-col`}
              onClick={() => handleSelectAmount(tier.amount)}
            >
              {isSelected && <div className="absolute top-0 right-0 left-0 h-1.5 bg-primary" />}
              <CardHeader className="p-8 pb-4 text-center">
                <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                  <Icon className="w-6 h-6 text-primary" strokeWidth={1.5} />
                </div>
                <CardTitle className="text-xl font-serif text-foreground">{tier.name}</CardTitle>
                <p className="text-foreground/60 text-sm font-light mt-2 h-10">{tier.description}</p>
              </CardHeader>
              <CardContent className="p-8 pt-0 flex-1 flex items-center justify-center border-b border-foreground/[0.03]">
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-light text-foreground/50">₹</span>
                  <span className="text-5xl font-serif font-medium text-foreground">{tier.amount}</span>
                  {recurring && <span className="text-foreground/50 tracking-widest text-xs uppercase font-bold ml-1">/mo</span>}
                </div>
              </CardContent>
              <CardFooter className="p-6 justify-center bg-muted/20">
                <Button 
                  variant={isSelected ? "default" : "outline"}
                  className={`w-full uppercase tracking-widest text-xs font-bold h-12 shadow-none rounded-[12px] ${isSelected ? 'bg-primary text-primary-foreground hover:bg-primary/90' : 'bg-transparent border-foreground/10'}`}
                >
                  {isSelected ? 'Selected' : 'Select Allocation'}
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>

      <div className="max-w-xl mx-auto flex items-center gap-4">
        <div className="h-px bg-foreground/10 flex-1" />
        <span className="text-xs uppercase tracking-widest font-bold text-foreground/30">Or Specify Custom Allocation</span>
        <div className="h-px bg-foreground/10 flex-1" />
      </div>

      <div className="max-w-sm mx-auto flex gap-3">
        <div className="relative flex-1">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-foreground/50 font-serif text-lg">₹</span>
          <Input 
            type="number" 
            placeholder="Custom Amount" 
            className="pl-8 h-14 bg-background border-foreground/10 focus-visible:ring-primary rounded-[12px] text-lg font-serif"
            value={customAmount}
            onChange={handleCustomAmountChange}
          />
        </div>
        <Button 
          onClick={proceedCustom}
          disabled={!customAmount || Number(customAmount) <= 0}
          className="h-14 px-8 uppercase tracking-widest text-xs font-bold rounded-[12px] shadow-none bg-foreground text-background hover:bg-foreground/90"
        >
          Confirm
        </Button>
      </div>

      {showForm && (
        <div id="checkout-form" className="max-w-2xl mx-auto pt-12 animate-in fade-in slide-in-from-bottom-8 duration-700">
          <form onSubmit={handleSubmit(onSubmit)} className="bg-card border border-foreground/10 shadow-[0_32px_64px_-12px_rgba(25,28,26,0.05)] rounded-[24px] overflow-hidden">
            <div className="bg-primary/5 p-8 border-b border-foreground/5 flex justify-between items-center">
               <div>
                 <h3 className="font-serif text-2xl text-foreground">Secure Checkout</h3>
                 <p className="text-foreground/60 text-sm font-light mt-1">Provide your details to complete the record.</p>
               </div>
               <div className="text-right">
                 <p className="text-xs font-bold uppercase tracking-widest text-primary mb-1">Total Payload</p>
                 <p className="font-serif text-3xl font-medium">₹{watch("amount") || 0}</p>
                 {recurring && <p className="text-[10px] uppercase font-bold text-foreground/40 mt-1 tracking-widest">Monthly Mock</p>}
               </div>
            </div>

            <div className="p-8 space-y-6">
              {submitStatus === "error" && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-600 rounded-[12px] text-sm text-center font-medium">
                  Transaction logging failed. Please verify systems.
                </div>
              )}

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest font-bold text-foreground/50">Full Name</label>
                  <Input {...register("donorName")} placeholder="John Doe" className="h-12 bg-background border-foreground/10 focus-visible:ring-primary rounded-[8px]" />
                  {errors.donorName && <p className="text-[11px] text-red-500 font-medium">{errors.donorName.message}</p>}
                </div>

                 <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest font-bold text-foreground/50">Email Link</label>
                  <Input {...register("donorEmail")} type="email" placeholder="john@example.com" className="h-12 bg-background border-foreground/10 focus-visible:ring-primary rounded-[8px]" />
                  {errors.donorEmail && <p className="text-[11px] text-red-500 font-medium">{errors.donorEmail.message}</p>}
                </div>
              </div>

               <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest font-bold text-foreground/50">Mock Payment Verification</label>
                  <div className="flex gap-4">
                    <Select onValueChange={(val) => setValue("paymentMethod", val as any)} defaultValue="upi">
                      <SelectTrigger className="w-[180px] h-12 bg-background border-foreground/10 focus-visible:ring-primary rounded-[8px]">
                        <SelectValue placeholder="Method" />
                      </SelectTrigger>
                      <SelectContent className="bg-card rounded-[12px] shadow-xl border-foreground/10">
                        <SelectItem value="upi">UPI Sandbox</SelectItem>
                        <SelectItem value="bank_transfer">Wire Proxy</SelectItem>
                        <SelectItem value="other">Test Terminal</SelectItem>
                      </SelectContent>
                    </Select>
                    
                    <Input {...register("transactionId")} placeholder="Mock Transaction ID" className="flex-1 h-12 bg-background border-foreground/10 focus-visible:ring-primary rounded-[8px]" />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest font-bold text-foreground/50">Message to the Field</label>
                  <Input {...register("message")} placeholder="Optional briefing note..." className="h-12 bg-background border-foreground/10 focus-visible:ring-primary rounded-[8px]" />
                </div>
            </div>

            <div className="p-8 bg-muted/30 border-t border-foreground/[0.03] flex items-center justify-between">
              <p className="text-xs text-foreground/40 font-light flex items-center gap-2">
                <ShieldCheck size={14} /> End-to-end encrypted protocol
              </p>
              <Button type="submit" disabled={isSubmitting} className="h-12 px-8 bg-primary hover:bg-primary/90 text-primary-foreground shadow-none rounded-[8px] font-bold uppercase tracking-widest text-xs flex items-center gap-2">
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />}
                Authorize Record
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
