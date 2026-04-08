import { adminDb, adminAuth } from "@/lib/firebase/admin";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, MapPin, Clock, CalendarIcon } from "lucide-react";
import { cookies } from "next/headers";
import { VolunteerApplyButton } from "@/components/events/RegisterButtons";
import { PublicRegistrationForm } from "./registration-form";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function EventPublicPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const eventSnap = await adminDb.doc(`events/${id}`).get();
  
  if (!eventSnap.exists) {
    notFound();
  }

  const eventData = eventSnap.data()!;
  
  // Safely convert Firestore Timestamp to ISO string
  const rawDate = eventData.eventDate;
  const eventDateStr = rawDate?.toDate?.() 
    ? rawDate.toDate().toISOString()
    : rawDate?._seconds 
      ? new Date(rawDate._seconds * 1000).toISOString()
      : typeof rawDate === 'string' ? rawDate : null;
  
  let role = null;
  let isRegistered = false;
  const cookieStore = await cookies();
  const session = cookieStore.get("session")?.value;
  
  if (session) {
    try {
      const decoded = await adminAuth.verifySessionCookie(session, true);
      const userSnap = await adminDb.doc(`users/${decoded.uid}`).get();
      role = userSnap.data()?.role;
      if (role === 'volunteer') {
        const appSnap = await adminDb.collection("volunteerApplications")
          .where("volunteerId", "==", decoded.uid)
          .where("eventId", "==", id).get();
        isRegistered = !appSnap.empty;
      }
    } catch (e) {
      // invalid session
    }
  }

  return (
    <div className="min-h-screen bg-background font-sans">
      <div className="max-w-6xl mx-auto px-6 lg:px-16 pt-12 pb-24">
        
        <Link href="/events" className="inline-flex w-fit items-center text-foreground/50 hover:text-foreground text-[10px] uppercase tracking-[0.15em] font-bold mb-12 transition-colors">
          <ArrowLeft size={14} className="mr-2" /> Back to Archive
        </Link>
        
        <div className="grid lg:grid-cols-12 gap-16 items-start">
          
          <main className="lg:col-span-8 flex flex-col">
            <p className="text-[11px] uppercase tracking-[0.1em] font-bold text-primary mb-4 flex items-center gap-3">
               <span className="block w-4 h-[1px] bg-primary"></span>
               {eventData.eventType || "Operation"}
            </p>
            <h1 className="text-5xl md:text-6xl font-serif tracking-tight text-foreground mb-8 leading-[1.1]">{eventData.title}</h1>
            
            <div className="flex flex-wrap gap-6 border-y border-foreground/[0.05] py-6 mb-12 text-sm font-light text-foreground/70">
              <div className="flex items-center gap-2">
                <CalendarIcon className="w-4 h-4 text-foreground/40" />
                <span>{eventDateStr ? new Date(eventDateStr).toLocaleDateString('en-US', {month: 'long', day: 'numeric', year: 'numeric'}) : 'Date TBD'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-foreground/40" />
                <span>{eventData.startTime} - {eventData.endTime}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-foreground/40" />
                <span>{eventData.city}, {eventData.state}</span>
              </div>
            </div>

            <div className="prose prose-neutral prose-lg text-foreground/80 font-light leading-relaxed mb-16 max-w-none">
              <p className="whitespace-pre-wrap">{eventData.description}</p>
            </div>
            
            {(role === 'volunteer' && eventData.volunteerInstructions) && (
              <div className="p-8 bg-cyan-600/5 border border-cyan-600/10 rounded-[16px] mb-8">
                <h4 className="text-sm uppercase tracking-widest font-bold text-cyan-700 mb-4">Classified Operative Intel</h4>
                <p className="whitespace-pre-wrap font-mono text-[13px] leading-relaxed text-cyan-900/80">{eventData.volunteerInstructions}</p>
              </div>
            )}
          </main>

          <aside className="lg:col-span-4 flex flex-col gap-8 sticky top-24">
            {eventData.bannerImageUrl ? (
               <div className="w-full aspect-[4/3] rounded-[24px] overflow-hidden bg-muted/40 shadow-[0_32px_64px_-12px_rgba(25,28,26,0.06)] relative isolate">
                 <div className="absolute inset-0 bg-primary/5 mix-blend-multiply" />
                 <img src={eventData.bannerImageUrl} alt={eventData.title} className="w-full h-full object-cover" />
               </div>
            ) : (
               <div className="w-full aspect-[4/3] rounded-[24px] bg-muted/20 border border-foreground/[0.05] flex items-center justify-center">
                 <span className="text-6xl grayscale opacity-20">🖼</span>
               </div>
            )}
            
            <div className="p-8 bg-card rounded-[24px] border-0 ring-1 ring-foreground/[0.04] shadow-[0_32px_64px_-12px_rgba(25,28,26,0.04)] text-center flex flex-col gap-4">
               <h3 className="font-serif text-2xl font-medium tracking-tight border-b border-foreground/[0.05] pb-4">Take Action</h3>
               
               <div className="pt-2 flex flex-col gap-4 w-full">
                 {(role === 'admin' || role === 'event_coordinator') ? (
                    <Link href={`/admin/events/${id}`} className="w-full">
                      <Button variant="secondary" className="w-full h-12 text-xs uppercase tracking-widest font-bold bg-muted hover:bg-muted/80 text-foreground shadow-none rounded-[8px]">Operation Panel</Button>
                    </Link>
                 ) : role === 'volunteer' ? (
                    <VolunteerApplyButton eventId={id} disabled={!eventData.volunteerRegistrationOpen} isRegistered={isRegistered} />
                 ) : (
                    <>
                      <PublicRegistrationForm 
                        eventId={id} 
                        isFull={eventData.maxParticipants && eventData.participantCount >= eventData.maxParticipants} 
                        isClosed={!eventData.participantRegistrationOpen} 
                      />
                      <div className="mt-4 pt-4 border-t border-foreground/[0.05] text-center">
                        <p className="text-xs text-foreground/50 mb-3">Want to join our operative team?</p>
                        <Link href="/login" className="w-full">
                          <Button variant="outline" className="w-full h-11 text-xs uppercase tracking-widest font-bold text-foreground border-foreground/10 hover:bg-foreground/5 shadow-none rounded-[8px]">Sign In as Volunteer</Button>
                        </Link>
                      </div>
                    </>
                 )}
               </div>
            </div>
          </aside>

        </div>
      </div>
    </div>
  );
}
