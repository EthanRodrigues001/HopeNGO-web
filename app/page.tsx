import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, ArrowUpRight } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col font-sans">


      {/* Hero Section - The Living Curator */}
      <main className="flex-1 flex flex-col relative w-full pt-20 pb-32 px-8 lg:px-16 container mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 lg:gap-8 items-start">
          
          <div className="lg:col-span-7 flex flex-col pt-12 animate-in fade-in slide-in-from-bottom-8 duration-1000">
            <p className="text-[13px] uppercase tracking-[0.1em] font-semibold text-primary mb-8 flex items-center gap-4">
              <span className="block w-8 h-[1px] bg-primary"></span>
              A Digital Monograph
            </p>
            
            <h1 className="text-6xl md:text-8xl font-serif tracking-[-0.03em] leading-[0.95] text-foreground mb-10 text-balance">
              Preserving <br />
              <span className="text-foreground/50 italic font-medium">community</span> <br />
              vitality.
            </h1>
            
            <p className="text-lg md:text-xl text-foreground/80 max-w-[28rem] leading-relaxed font-sans font-light mb-12">
              We curate opportunities aimed at sustainable growth, focusing on high-impact interventions over momentary gestures. Step into the archive of action.
            </p>
            
            <div className="flex items-center gap-8">
              <Link href="/events">
                <Button size="lg" className="h-14 px-8 text-base shadow-none hover:bg-primary/95 transition-all">
                  Explore Interventions
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/donate" className="group flex items-center gap-2 text-foreground font-medium underline underline-offset-[6px] decoration-primary/40 hover:decoration-primary decoration-2 transition-all">
                Make a Donation
                <ArrowUpRight className="h-4 w-4 text-primary group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>
          </div>

          <div className="lg:col-span-5 relative w-full aspect-[4/5] rounded-[24px] rounded-br-[8px] overflow-hidden bg-muted animate-in fade-in slide-in-from-right-8 duration-1000 delay-200 isolation-isolate">
            {/* Generous negative space surrounding the editorial image block */}
            <div className="absolute inset-0 bg-primary/5 mix-blend-multiply pointer-events-none" />
            <img 
              src="https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?q=80&w=2670&auto=format&fit=crop" 
              alt="Volunteers in action" 
              className="w-full h-full object-cover object-center"
            />
            {/* Glass label acting as metadata tag */}
            <div className="absolute bottom-6 left-6 right-6 backdrop-blur-xl bg-background/80 p-6 rounded-xl border border-foreground/[0.05]">
              <p className="font-serif italic text-lg text-foreground mb-1">Vol. IV — Field Preservation</p>
              <p className="text-sm text-foreground/70 uppercase tracking-widest font-semibold text-[11px]">Archived October 2025</p>
            </div>
          </div>

        </div>

        {/* Secondary Content Block - Asymmetrical Tonal Layers */}
        <div className="mt-40 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-12">
          <div className="bg-card rounded-2xl rounded-tl-[8px] p-10 flex flex-col justify-between aspect-square border-0 ring-1 ring-foreground/5 shadow-[0_32px_64px_-12px_rgba(25,28,26,0.04)]">
            <h3 className="font-serif text-3xl font-medium tracking-tight">Active Chapters</h3>
            <p className="text-foreground/70 font-light text-base leading-relaxed mt-4 flex-1">
              Engage with our ongoing initiatives. The archive lives through continual participation.
            </p>
            <div className="mt-8 flex justify-end">
              <div className="h-12 w-12 rounded-full border border-foreground/10 flex items-center justify-center text-foreground hover:bg-foreground hover:text-background transition-colors cursor-pointer">
                <ArrowRight className="h-5 w-5" />
              </div>
            </div>
          </div>

          <div className="bg-muted rounded-[24px] p-10 flex flex-col justify-between aspect-[4/3] lg:aspect-square border-0 relative overflow-hidden group">
            <div className="absolute inset-0 bg-primary opacity-0 group-hover:opacity-5 transition-opacity duration-500" />
            <div className="relative z-10 block">
              <span className="text-[11px] uppercase tracking-[0.1em] font-bold text-foreground/50 mb-6 block">Resource</span>
              <h3 className="font-serif text-3xl font-medium tracking-tight mb-4">The Volunteer Monograph</h3>
              <p className="text-foreground/70 font-light text-base leading-relaxed">
                Documentation and guidelines for our field operatives and community builders.
              </p>
            </div>
            <Link href="/register" className="relative z-10 mt-auto text-primary font-medium underline underline-offset-[6px] decoration-primary/40 hover:decoration-primary decoration-2 w-fit">
              Request access
            </Link>
          </div>
          
          <div className="hidden lg:flex flex-col justify-end p-8 bg-muted/20 rounded-[20px]">
            <p className="font-serif italic text-2xl text-foreground/60 leading-snug">
              "To plant a tree is to believe in tomorrow."
            </p>
            <p className="text-xs uppercase tracking-widest text-foreground/40 font-bold mt-6">
              — Archival Note 003
            </p>
          </div>
        </div>
      </main>
      
      {/* Editorial footer */}
      <footer className="py-12 bg-muted/40">
        <div className="container mx-auto px-8 lg:px-16 flex flex-col md:flex-row justify-between items-start md:items-end gap-8">
          <div>
            <span className="font-serif font-semibold text-2xl tracking-tight text-foreground block mb-4">
              Hope<span className="font-normal italic">NGO</span>
            </span>
            <p className="text-sm text-foreground/50 max-w-xs leading-relaxed">
              Curating sustainable interventions. A digital archive of living community impact.
            </p>
          </div>
          <p className="text-xs text-foreground/40 uppercase tracking-[0.05em] font-semibold">
            &copy; {new Date().getFullYear()} HopeNGO. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
