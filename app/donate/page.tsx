import { PricingDonationClient } from "@/components/donations/PricingDonationClient";
import { Badge } from "@/components/ui/badge";
import { MoveRight } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default function DonationsPage() {
  return (
    <div className="min-h-screen bg-background font-sans text-foreground">
      
      <div className="bg-primary/5 pt-20 pb-20 px-8 relative overflow-hidden border-b border-primary/10">
        <div className="absolute top-0 right-0 p-12 opacity-10 pointer-events-none">
           <div className="w-96 h-96 bg-primary rounded-full blur-[120px]" />
        </div>
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <Badge className="bg-primary/10 text-primary hover:bg-primary/20 shadow-none border-primary/20 mb-6 uppercase tracking-[0.1em] text-[10px] py-1.5 px-3">
             Resource Allocation
          </Badge>
          <h1 className="text-5xl md:text-7xl font-serif text-foreground font-medium tracking-tight mb-6 leading-[1.1]">
            Fuel the Mission. <br /> Empower the Source.
          </h1>
          <p className="text-lg text-foreground/60 max-w-2xl mx-auto font-light leading-relaxed mb-6">
            Logistical requirements across the continent demand steady allocations. Select a deployment tier below to supply our operatives in the field directly.
          </p>
          <Link href="/events" className="inline-flex items-center gap-2 text-xs uppercase tracking-widest font-bold text-foreground/50 hover:text-primary transition-colors">
            Or offer operational support as a volunteer <MoveRight size={14} />
          </Link>
        </div>
      </div>

      <div className="px-8 py-20 bg-background relative z-20">
         <PricingDonationClient />
      </div>
    </div>
  );
}
