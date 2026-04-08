"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

const schema = z.object({
  title: z.string().min(3),
  description: z.string().min(10),
  eventType: z.string(),
  eventDate: z.string(), // acts as primary/start date normally
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

export default function NewEventPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<EventForm>({
    resolver: zodResolver(schema) as any,
    defaultValues: {
      eventType: "Workshop",
      status: "upcoming",
      volunteerRegistrationOpen: true,
      maxVolunteers: null,
      isRecurring: false,
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
        
        // Also combine with any manually injected individual dates if they used it
        if (data.sessionDatesString) {
          const manual = data.sessionDatesString.split(',').map(s => s.trim()).filter(Boolean);
          finalSessionDates = Array.from(new Set([...finalSessionDates, ...manual]));
        }
        
        finalSessionDates.sort(); // chronologically order dates
      }

      if (data.isRecurring && finalSessionDates.length === 0) {
        throw new Error("Recurring operation requires at least one computed session date.");
      }

      let masterEventDate = data.eventDate;
      if (data.isRecurring && finalSessionDates.length > 0) {
        masterEventDate = finalSessionDates[0]; // Derive primary date from earliest session
      }

      if (!masterEventDate || masterEventDate.trim() === "") {
        throw new Error("Primary Date is strictly required.");
      }

      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          sessionDates: finalSessionDates,
          eventDate: new Date(masterEventDate).toISOString(),
        }),
      });

      if (!res.ok) throw new Error("Failed to create event");
      router.push("/admin/dashboard");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background font-sans p-8 lg:p-16 text-foreground flex justify-center">
      <div className="w-full max-w-4xl">
        <Link href="/admin/events" className="inline-flex items-center text-xs uppercase tracking-[0.1em] font-bold text-foreground/50 hover:text-primary mb-8 transition-colors">
          <ArrowLeft size={16} className="mr-2" /> Back to Operations
        </Link>
        <Card className="bg-card w-full shadow-[0_32px_64px_-12px_rgba(25,28,26,0.03)] border-0 ring-1 ring-foreground/[0.04] rounded-[24px]">
          <CardHeader className="p-10 pb-6 border-b border-foreground/[0.03] mb-6">
            <p className="text-[11px] uppercase tracking-[0.1em] font-bold text-primary mb-3">Field Drafting</p>
            <CardTitle className="text-4xl font-serif text-foreground tracking-tight">Create New Campaign</CardTitle>
          </CardHeader>
          <form onSubmit={handleSubmit(onSubmit)}>
            <CardContent className="px-10 pb-6 space-y-8 flex flex-col gap-6">
              {error && <div className="p-4 bg-red-50 text-red-700 text-sm font-medium border border-red-100 rounded-[8px]">{error}</div>}
              
              <div className="grid md:grid-cols-2 gap-8">
                <div className="flex flex-col gap-3">
                  <label className="text-xs uppercase tracking-widest font-bold text-foreground/50">Campaign Title</label>
                  <Input {...register("title")} className="bg-transparent border-foreground/10 focus-visible:ring-primary h-12 rounded-[8px]" placeholder="e.g. Winter Food Drive" />
                  {errors.title && <p className="text-red-600 text-[10px] uppercase font-bold tracking-wider">{errors.title.message}</p>}
                </div>
                <div className="flex flex-col gap-3">
                  <label className="text-xs uppercase tracking-widest font-bold text-foreground/50">Event Type</label>
                  <Select onValueChange={(val) => setValue("eventType", val ?? "")} defaultValue={watch("eventType") ?? undefined}>
                    <SelectTrigger className="bg-transparent border-foreground/10 focus-visible:ring-primary h-12 rounded-[8px] font-medium">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-foreground/10 shadow-xl rounded-[12px]">
                      <SelectItem value="Workshop">Workshop</SelectItem>
                      <SelectItem value="Fundraiser">Fundraiser</SelectItem>
                      <SelectItem value="Community Service">Community Service</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex flex-col gap-3 col-span-2">
                  <label className="text-xs uppercase tracking-widest font-bold text-foreground/50">Public Briefing (Description)</label>
                  <textarea 
                    {...register("description")} 
                    className="w-full min-h-[120px] p-4 bg-transparent border border-foreground/10 text-sm rounded-[8px] focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all hover:bg-muted/50" 
                    placeholder="Enter full campaign details..."
                  />
                </div>

                <div className="col-span-2 pt-6 pb-2 border-b border-foreground/[0.03]">
                  <h3 className="font-serif text-2xl text-foreground">Schedule & Geography</h3>
                </div>

                <div className="flex items-center gap-1 col-span-2 bg-foreground/[0.03] p-1 rounded-[10px] w-full max-w-sm mb-2">
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
                  <div className="flex flex-col gap-3 col-span-2 md:col-span-1">
                    <label className="text-xs uppercase tracking-widest font-bold text-foreground/50">Primary Event Date</label>
                    <Input type="date" {...register("eventDate")} className="bg-transparent border-foreground/10 focus-visible:ring-primary h-12 rounded-[8px]" />
                  </div>
                ) : (
                  <div className="flex flex-col gap-4 col-span-2 p-6 bg-primary/[0.02] border border-primary/10 rounded-[12px]">
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
                <div className="flex flex-col gap-3">
                  <label className="text-xs uppercase tracking-widest font-bold text-foreground/50">Start Time</label>
                  <Input type="time" {...register("startTime")} className="bg-transparent border-foreground/10 focus-visible:ring-primary h-12 rounded-[8px]" />
                </div>
                <div className="flex flex-col gap-3">
                  <label className="text-xs uppercase tracking-widest font-bold text-foreground/50">End Time</label>
                  <Input type="time" {...register("endTime")} className="bg-transparent border-foreground/10 focus-visible:ring-primary h-12 rounded-[8px]" />
                </div>
                <div className="flex flex-col gap-3">
                  <label className="text-xs uppercase tracking-widest font-bold text-foreground/50">Venue Name</label>
                  <Input {...register("venue")} className="bg-transparent border-foreground/10 focus-visible:ring-primary h-12 rounded-[8px]" />
                </div>
                <div className="flex flex-col gap-3">
                  <label className="text-xs uppercase tracking-widest font-bold text-foreground/50">City</label>
                  <Input {...register("city")} className="bg-transparent border-foreground/10 focus-visible:ring-primary h-12 rounded-[8px]" />
                </div>
                <div className="flex flex-col gap-3">
                  <label className="text-xs uppercase tracking-widest font-bold text-foreground/50">State</label>
                  <Input {...register("state")} className="bg-transparent border-foreground/10 focus-visible:ring-primary h-12 rounded-[8px]" />
                </div>

                <div className="col-span-2 pt-6 pb-2 border-b border-foreground/[0.03]">
                  <h3 className="font-serif text-2xl text-foreground">Visual Log</h3>
                </div>
                <div className="flex flex-col gap-3 col-span-2">
                  <label className="text-xs uppercase tracking-widest font-bold text-foreground/50">Banner Image / Poster URL</label>
                  <Input {...register("bannerImageUrl")} placeholder="https://..." className="bg-transparent border-foreground/10 focus-visible:ring-primary h-12 rounded-[8px] font-mono text-[13px]" />
                </div>

                <div className="col-span-2 pt-6 pb-2 border-b border-foreground/[0.03]">
                  <h3 className="font-serif text-2xl text-foreground">Personnel Cap</h3>
                </div>


                <div className="flex flex-col gap-3">
                  <label className="text-xs uppercase tracking-widest font-bold text-foreground/50">Max Volunteers Limit</label>
                  <Input type="number" {...register("maxVolunteers")} className="bg-transparent border-foreground/10 focus-visible:ring-primary h-12 rounded-[8px]" placeholder="Leave blank for infinite" />
                </div>
                <div className="flex flex-col gap-3 col-span-2">
                  <label className="text-xs uppercase tracking-widest font-bold text-foreground/50">Classified Volunteer Directives (Hidden from public)</label>
                  <textarea 
                    {...register("volunteerInstructions")} 
                    className="w-full min-h-[100px] p-4 bg-muted/40 border border-transparent rounded-[8px] focus:outline-none focus:ring-2 focus:ring-primary" 
                    placeholder="Enter internal instructions for approved field operatives..."
                  />
                </div>

              </div>
            </CardContent>
            <CardFooter className="flex justify-between items-center bg-muted/20 border-t border-foreground/[0.03] p-10 rounded-b-[24px]">
              <Button type="button" variant="ghost" className="h-12 uppercase tracking-widest text-xs font-bold text-foreground/50 hover:text-foreground" onClick={() => router.back()}>Abort Drafting</Button>
              <Button type="submit" disabled={loading} className="h-12 bg-primary hover:bg-primary/90 text-primary-foreground shadow-none rounded-[8px] px-8 text-xs uppercase tracking-widest font-bold transition-all">
                {loading ? "Persisting to Archive..." : "Finalize & Launch Event"}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
