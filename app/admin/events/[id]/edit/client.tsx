"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Save } from "lucide-react";
import Link from "next/link";

const schema = z.object({
  title: z.string().min(3),
  description: z.string().min(10),
  eventType: z.string(),
  eventDate: z.string().optional(),
  startTime: z.string(),
  endTime: z.string(),
  venue: z.string(),
  city: z.string(),
  state: z.string(),
  bannerImageUrl: z.string().url(),
  maxVolunteers: z.coerce.number().optional().nullable(),
  volunteerRegistrationOpen: z.boolean(),
  volunteerInstructions: z.string().optional(),
  status: z.string(),
  isRecurring: z.boolean().default(false),
  recurringDays: z.array(z.number()).optional(),
  recurringStartDate: z.string().optional(),
  recurringEndDate: z.string().optional(),
  sessionDatesString: z.string().optional(),
});

type EventForm = z.infer<typeof schema>;

export default function EditEventClient({ event }: { event: any }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<EventForm>({
    resolver: zodResolver(schema) as any,
    defaultValues: {
      title: event.title,
      description: event.description,
      eventType: event.eventType,
      eventDate: event.eventDate,
      startTime: event.startTime,
      endTime: event.endTime,
      venue: event.venue,
      city: event.city,
      state: event.state,
      bannerImageUrl: event.bannerImageUrl,
      maxVolunteers: event.maxVolunteers ?? null,
      volunteerRegistrationOpen: event.volunteerRegistrationOpen ?? false,
      volunteerInstructions: event.volunteerInstructions ?? "",
      status: event.status ?? "upcoming",
      isRecurring: event.isRecurring ?? false,
      recurringDays: [],
      recurringStartDate: "",
      recurringEndDate: "",
      sessionDatesString: "",
    }
  });

  const onSubmit = async (data: EventForm) => {
    setLoading(true);
    setError("");

    try {
      let finalSessionDates: string[] = [];

      if (data.isRecurring) {
        if (data.recurringDays && data.recurringStartDate && data.recurringEndDate) {
          const start = new Date(data.recurringStartDate);
          const end = new Date(data.recurringEndDate);
          if (end < start) throw new Error("End date cannot be before start date.");

          for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
            if (data.recurringDays.includes(d.getDay())) {
              finalSessionDates.push(d.toISOString().split('T')[0]);
            }
          }
        }
        
        if (data.sessionDatesString) {
          const manual = data.sessionDatesString.split(',').map(s => s.trim()).filter(Boolean);
          finalSessionDates = Array.from(new Set([...finalSessionDates, ...manual]));
        }
        
        finalSessionDates.sort();
      }

      let masterEventDate = data.eventDate;
      if (data.isRecurring && finalSessionDates.length > 0) {
        masterEventDate = finalSessionDates[0];
      }

      if (!masterEventDate || masterEventDate.trim() === "") {
        throw new Error("Primary Date is strictly required.");
      }

      const res = await fetch(`/api/events/${event.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          sessionDates: finalSessionDates,
          eventDate: new Date(masterEventDate).toISOString(),
        }),
      });

      if (!res.ok) throw new Error("Failed to update event");
      router.push(`/admin/events/${event.id}`);
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background font-sans p-8 lg:p-16">
      <div className="max-w-4xl mx-auto flex flex-col mb-12">
        <Link href={`/admin/events/${event.id}`} className="inline-flex w-fit items-center text-foreground/50 hover:text-foreground text-xs uppercase tracking-widest font-bold mb-6 transition-colors">
          <ArrowLeft size={14} className="mr-2" /> Back to Intel
        </Link>
        <p className="text-[11px] uppercase tracking-[0.1em] font-bold text-foreground/50 mb-3">Formulation System</p>
        <h1 className="text-5xl font-serif text-foreground tracking-tight">Edit Operation</h1>
      </div>
      
      <div className="max-w-4xl mx-auto">
        <form onSubmit={handleSubmit(onSubmit)}>
          <Card className="shadow-[0_32px_64px_-12px_rgba(25,28,26,0.03)] border-0 ring-1 ring-foreground/[0.03] bg-card rounded-[24px]">
            <CardHeader className="p-10 pb-6 border-b border-foreground/[0.03]">
              <CardTitle className="text-2xl font-serif text-foreground font-medium">Operation Parameters</CardTitle>
              <CardDescription className="text-sm font-light text-foreground/60">Modify the operational logistics and public details for this event.</CardDescription>
            </CardHeader>
            <CardContent className="p-10 space-y-10">
              {error && <div className="p-4 bg-red-50 text-red-600 border border-red-100 rounded-[12px] text-sm font-medium">{error}</div>}
              
              <div className="space-y-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="h-1 flex-1 bg-foreground/[0.03]"></div>
                  <h3 className="text-[10px] uppercase tracking-[0.15em] font-bold text-foreground/40">Core Identifiers</h3>
                  <div className="h-1 flex-1 bg-foreground/[0.03]"></div>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-[11px] uppercase tracking-widest font-bold text-foreground/50">Classification Title</label>
                  <Input {...register("title")} className="h-14 bg-muted/30 border-foreground/10 focus-visible:ring-primary rounded-[8px]" />
                  {errors.title && <p className="text-red-500 text-[11px] mt-1">{errors.title.message}</p>}
                </div>
                
                <div className="flex flex-col gap-2">
                  <label className="text-[11px] uppercase tracking-widest font-bold text-foreground/50">Operation Objective (Description)</label>
                  <textarea 
                    {...register("description")} 
                    className="w-full h-32 p-4 bg-muted/30 border border-foreground/10 rounded-[8px] focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-sm transition-all resize-none" 
                  />
                  {errors.description && <p className="text-red-500 text-[11px] mt-1">{errors.description.message}</p>}
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="flex flex-col gap-2">
                    <label className="text-[11px] uppercase tracking-widest font-bold text-foreground/50">Event Type</label>
                    <Select onValueChange={(val) => setValue("eventType", val ?? "")} defaultValue={watch("eventType") ?? undefined}>
                      <SelectTrigger className="h-14 bg-muted/30 border-foreground/10 text-foreground rounded-[8px] focus:ring-primary">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-card border-foreground/10 rounded-[8px] p-1 shadow-xl">
                        <SelectItem value="Workshop">Workshop</SelectItem>
                        <SelectItem value="Fundraiser">Fundraiser</SelectItem>
                        <SelectItem value="Community Service">Community Service</SelectItem>
                        <SelectItem value="Medical Camp">Medical Camp</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex flex-col gap-2">
                    <label className="text-[11px] uppercase tracking-widest font-bold text-foreground/50">Current Status</label>
                    <Select onValueChange={(val) => setValue("status", val ?? "")} defaultValue={watch("status") ?? undefined}>
                      <SelectTrigger className="h-14 bg-muted/30 border-foreground/10 text-foreground rounded-[8px] focus:ring-primary">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-card border-foreground/10 rounded-[8px] p-1 shadow-xl">
                        <SelectItem value="upcoming">Upcoming</SelectItem>
                        <SelectItem value="ongoing">Ongoing</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-[11px] uppercase tracking-widest font-bold text-foreground/50">Banner Cover Image URL</label>
                  <Input {...register("bannerImageUrl")} placeholder="https://..." className="h-14 bg-muted/30 border-foreground/10 focus-visible:ring-primary rounded-[8px]" />
                  {errors.bannerImageUrl && <p className="text-red-500 text-[11px] mt-1">{errors.bannerImageUrl.message}</p>}
                </div>
              </div>

              <div className="space-y-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="h-1 flex-1 bg-foreground/[0.03]"></div>
                  <h3 className="text-[10px] uppercase tracking-[0.15em] font-bold text-foreground/40">Temporal & Spatial Data</h3>
                  <div className="h-1 flex-1 bg-foreground/[0.03]"></div>
                </div>

                <div className="flex items-center gap-1 col-span-2 bg-foreground/[0.03] p-1 rounded-[10px] w-full max-w-sm mb-6">
                  <div 
                    onClick={() => setValue("isRecurring", false)} 
                    className={`flex-1 text-center py-2 text-xs uppercase tracking-widest font-bold rounded-[8px] cursor-pointer transition-all ${!watch("isRecurring") ? "bg-card shadow-sm text-foreground" : "text-foreground/40 hover:text-foreground/70"}`}
                  >
                    Single Operation
                  </div>
                  <div 
                    onClick={() => setValue("isRecurring", true)} 
                    className={`flex-1 text-center py-2 text-xs uppercase tracking-widest font-bold rounded-[8px] cursor-pointer transition-all ${watch("isRecurring") ? "bg-primary text-primary-foreground shadow-sm" : "text-foreground/40 hover:text-foreground/70"}`}
                  >
                    Recurring Campaign
                  </div>
                </div>

                {!watch("isRecurring") ? (
                  <div className="flex flex-col gap-2 mb-6 md:w-1/3">
                    <label className="text-[11px] uppercase tracking-widest font-bold text-foreground/50">Primary Event Date</label>
                    <Input type="date" {...register("eventDate")} className="h-14 bg-muted/30 border-foreground/10 focus-visible:ring-primary rounded-[8px]" />
                  </div>
                ) : (
                  <div className="flex flex-col gap-4 col-span-2 p-6 mb-6 bg-primary/[0.02] border border-primary/10 rounded-[12px]">
                    <div>
                      <label className="text-xs uppercase tracking-widest font-bold text-primary/70">Session Roster Generator</label>
                      <p className="text-[10px] text-foreground/50 mt-1">Configuring a recurring campaign requires mapping multiple operation dates.</p>
                    </div>

                    <div className="pt-2 flex flex-col gap-4">
                      <label className="text-[11px] font-bold text-foreground/60">1. Auto-Generate by Days of Week</label>
                      <div className="flex flex-wrap gap-2">
                        {[{ id: 1, label: "Mon" }, { id: 2, label: "Tue" }, { id: 3, label: "Wed" }, { id: 4, label: "Thu" }, { id: 5, label: "Fri" }, { id: 6, label: "Sat" }, { id: 0, label: "Sun" }].map(d => {
                          const currentDays = watch("recurringDays") || [];
                          const isSelected = currentDays.includes(d.id);
                          return (
                            <button
                              key={d.id}
                              type="button"
                              onClick={() => {
                                if (isSelected) {
                                  setValue("recurringDays", currentDays.filter((x: number) => x !== d.id), { shouldValidate: true });
                                } else {
                                  setValue("recurringDays", [...currentDays, d.id], { shouldValidate: true });
                                }
                              }}
                              className={`px-4 py-2 border rounded-full text-xs font-bold transition-colors ${isSelected ? 'bg-primary text-primary-foreground border-primary' : 'bg-background border-foreground/10 text-foreground/70 hover:bg-muted'}`}
                            >
                              {d.label}
                            </button>
                          );
                        })}
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                         <div className="flex flex-col gap-2">
                           <label className="text-[10px] uppercase font-bold text-foreground/40">From Date</label>
                           <Input type="date" {...register("recurringStartDate")} className="bg-background border-foreground/10 rounded-[8px]" />
                         </div>
                         <div className="flex flex-col gap-2">
                           <label className="text-[10px] uppercase font-bold text-foreground/40">Until Date</label>
                           <Input type="date" {...register("recurringEndDate")} className="bg-background border-foreground/10 rounded-[8px]" />
                         </div>
                      </div>
                    </div>

                    <div className="pt-4 mt-2 border-t border-primary/10">
                      <label className="text-[11px] font-bold text-foreground/60">2. Include Manual Date Injections (Optional)</label>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <Input type="date" id="newSessionDate" className="bg-background border-foreground/10 focus-visible:ring-primary h-12 rounded-[8px] w-48" />
                      <Button 
                        type="button" 
                        variant="outline" 
                        className="h-12 border-primary/20 hover:bg-primary/[0.05] text-primary shadow-none uppercase text-[10px] font-bold tracking-widest"
                        onClick={() => {
                          const val = (document.getElementById('newSessionDate') as HTMLInputElement).value;
                          if (!val) return;
                          const currentStr = watch("sessionDatesString") || "";
                          const current = currentStr.split(',').map((s: string) => s.trim()).filter(Boolean);
                          if (!current.includes(val)) {
                            setValue("sessionDatesString", [...current, val].join(', '), { shouldValidate: true });
                          }
                          (document.getElementById('newSessionDate') as HTMLInputElement).value = "";
                        }}
                      >
                        + Accumulate Session
                      </Button>
                    </div>

                    <div className="flex flex-wrap gap-2 mt-2">
                       {watch("sessionDatesString")?.split(',').map((d: string) => d.trim()).filter(Boolean).map((dateStr, idx) => (
                         <div key={idx} className="flex items-center gap-2 bg-background border border-foreground/10 px-3 py-1.5 rounded-full text-xs font-mono">
                           {dateStr}
                           <button 
                             type="button" 
                             className="text-foreground/40 hover:text-red-500 transition-colors cursor-pointer ml-1"
                             onClick={() => {
                               const currentStr = watch("sessionDatesString") || "";
                               const arr = currentStr.split(',').map((s: string) => s.trim()).filter(Boolean);
                               arr.splice(idx, 1);
                               setValue("sessionDatesString", arr.join(', '), { shouldValidate: true });
                             }}
                           >
                             ×
                           </button>
                         </div>
                       ))}
                    </div>
                  </div>
                )}

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="flex flex-col gap-2">
                    <label className="text-[11px] uppercase tracking-widest font-bold text-foreground/50">Start Time</label>
                    <Input type="time" {...register("startTime")} className="h-14 bg-muted/30 border-foreground/10 focus-visible:ring-primary rounded-[8px]" />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-[11px] uppercase tracking-widest font-bold text-foreground/50">End Time</label>
                    <Input type="time" {...register("endTime")} className="h-14 bg-muted/30 border-foreground/10 focus-visible:ring-primary rounded-[8px]" />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6 mt-6">
                  <div className="flex flex-col gap-2">
                    <label className="text-[11px] uppercase tracking-widest font-bold text-foreground/50">Street Address / Venue</label>
                    <Input {...register("venue")} className="h-14 bg-muted/30 border-foreground/10 focus-visible:ring-primary rounded-[8px]" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-2">
                      <label className="text-[11px] uppercase tracking-widest font-bold text-foreground/50">City</label>
                      <Input {...register("city")} className="h-14 bg-muted/30 border-foreground/10 focus-visible:ring-primary rounded-[8px]" />
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-[11px] uppercase tracking-widest font-bold text-foreground/50">State</label>
                      <Input {...register("state")} className="h-14 bg-muted/30 border-foreground/10 focus-visible:ring-primary rounded-[8px]" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="h-1 flex-1 bg-foreground/[0.03]"></div>
                  <h3 className="text-[10px] uppercase tracking-[0.15em] font-bold text-foreground/40">Logistics Registration</h3>
                  <div className="h-1 flex-1 bg-foreground/[0.03]"></div>
                </div>

                <div className="grid md:grid-cols-2 gap-8 bg-foreground/[0.02] p-8 rounded-[16px] border border-foreground/[0.03]">
                  {/* Operative Controls */}
                  <div className="space-y-6">
                    <div className="flex items-center justify-between border-b border-foreground/[0.05] pb-4">
                      <h4 className="font-serif text-lg text-cyan-600">Field Operatives</h4>
                      <div 
                        onClick={() => setValue("volunteerRegistrationOpen", !watch("volunteerRegistrationOpen"), { shouldValidate: true })}
                        className="flex items-center gap-2 cursor-pointer"
                      >
                        <span className={`text-[10px] uppercase tracking-widest font-bold ${watch("volunteerRegistrationOpen") ? "text-cyan-600" : "text-foreground/40"}`}>
                          {watch("volunteerRegistrationOpen") ? "Recruiting" : "Closed"}
                        </span>
                        <div className={`w-10 h-6 rounded-full transition-colors flex items-center px-1 ${watch("volunteerRegistrationOpen") ? "bg-cyan-600" : "bg-foreground/20"}`}>
                          <div className={`w-4 h-4 rounded-full bg-white transition-transform ${watch("volunteerRegistrationOpen") ? "translate-x-4" : "translate-x-0"}`} />
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-[11px] uppercase tracking-widest font-bold text-foreground/50">Required Operatives</label>
                      <Input type="number" {...register("maxVolunteers")} placeholder="Leave blank for unlimited" className="h-14 bg-background border-foreground/10 focus-visible:ring-cyan-600 rounded-[8px]" />
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-[11px] uppercase tracking-widest font-bold text-cyan-600/70">Classified Instructions</label>
                      <textarea 
                        {...register("volunteerInstructions")} 
                        placeholder="Visible only to approved volunteers..."
                        className="w-full h-24 p-4 bg-cyan-50/50 border border-cyan-100 rounded-[8px] focus:outline-none focus:ring-1 focus:ring-cyan-600 focus:border-cyan-600 text-sm transition-all resize-none" 
                      />
                    </div>
                  </div>
                </div>

              </div>
            </CardContent>
            <CardFooter className="flex justify-between items-center bg-foreground/[0.02] p-8 mt-2 rounded-b-[24px] border-t border-foreground/[0.03]">
              <Button type="button" variant="ghost" onClick={() => router.back()} className="text-xs uppercase tracking-widest font-bold text-foreground/50 hover:text-foreground">
                Discard Changes
              </Button>
              <Button type="submit" disabled={loading} className="h-14 px-8 text-xs uppercase tracking-widest font-bold shadow-none hover:bg-primary/90 transition-all gap-2">
                {loading ? "Committing..." : <><Save size={16} /> Compile Archive Record</>}
              </Button>
            </CardFooter>
          </Card>
        </form>
      </div>
    </div>
  );
}
