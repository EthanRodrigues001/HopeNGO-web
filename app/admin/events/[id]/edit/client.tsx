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
  eventDate: z.string(),
  startTime: z.string(),
  endTime: z.string(),
  venue: z.string(),
  city: z.string(),
  state: z.string(),
  bannerImageUrl: z.string().url(),
  maxParticipants: z.coerce.number().optional().nullable(),
  participantRegistrationOpen: z.boolean(),
  maxVolunteers: z.coerce.number().optional().nullable(),
  volunteerRegistrationOpen: z.boolean(),
  volunteerInstructions: z.string().optional(),
  status: z.string(),
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
      maxParticipants: event.maxParticipants ?? null,
      participantRegistrationOpen: event.participantRegistrationOpen ?? false,
      maxVolunteers: event.maxVolunteers ?? null,
      volunteerRegistrationOpen: event.volunteerRegistrationOpen ?? false,
      volunteerInstructions: event.volunteerInstructions ?? "",
      status: event.status ?? "upcoming",
    }
  });

  const onSubmit = async (data: EventForm) => {
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`/api/events/${event.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          eventDate: new Date(data.eventDate).toISOString(),
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

                <div className="grid md:grid-cols-3 gap-6">
                  <div className="flex flex-col gap-2">
                    <label className="text-[11px] uppercase tracking-widest font-bold text-foreground/50">Date</label>
                    <Input type="date" {...register("eventDate")} className="h-14 bg-muted/30 border-foreground/10 focus-visible:ring-primary rounded-[8px]" />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-[11px] uppercase tracking-widest font-bold text-foreground/50">Start Time</label>
                    <Input type="time" {...register("startTime")} className="h-14 bg-muted/30 border-foreground/10 focus-visible:ring-primary rounded-[8px]" />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-[11px] uppercase tracking-widest font-bold text-foreground/50">End Time</label>
                    <Input type="time" {...register("endTime")} className="h-14 bg-muted/30 border-foreground/10 focus-visible:ring-primary rounded-[8px]" />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
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
                  {/* Civilian Controls */}
                  <div className="space-y-6">
                    <div className="flex items-center justify-between border-b border-foreground/[0.05] pb-4">
                      <h4 className="font-serif text-lg">Public Attendees</h4>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <span className={`text-[10px] uppercase tracking-widest font-bold ${watch("participantRegistrationOpen") ? "text-primary" : "text-foreground/40"}`}>
                          {watch("participantRegistrationOpen") ? "Accepting" : "Closed"}
                        </span>
                        <input type="checkbox" {...register("participantRegistrationOpen")} className="hidden" />
                        <div className={`w-10 h-6 rounded-full transition-colors flex items-center px-1 ${watch("participantRegistrationOpen") ? "bg-primary" : "bg-foreground/10"}`}>
                          <div className={`w-4 h-4 rounded-full bg-white transition-transform ${watch("participantRegistrationOpen") ? "translate-x-4" : "translate-x-0"}`} />
                        </div>
                      </label>
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-[11px] uppercase tracking-widest font-bold text-foreground/50">Maximum Headcount</label>
                      <Input type="number" {...register("maxParticipants")} placeholder="Leave blank for unlimited" className="h-14 bg-background border-foreground/10 focus-visible:ring-primary rounded-[8px]" />
                    </div>
                  </div>

                  {/* Operative Controls */}
                  <div className="space-y-6">
                    <div className="flex items-center justify-between border-b border-foreground/[0.05] pb-4">
                      <h4 className="font-serif text-lg text-cyan-600">Field Operatives</h4>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <span className={`text-[10px] uppercase tracking-widest font-bold ${watch("volunteerRegistrationOpen") ? "text-cyan-600" : "text-foreground/40"}`}>
                          {watch("volunteerRegistrationOpen") ? "Recruiting" : "Closed"}
                        </span>
                        <input type="checkbox" {...register("volunteerRegistrationOpen")} className="hidden" />
                        <div className={`w-10 h-6 rounded-full transition-colors flex items-center px-1 ${watch("volunteerRegistrationOpen") ? "bg-cyan-600" : "bg-foreground/10"}`}>
                          <div className={`w-4 h-4 rounded-full bg-white transition-transform ${watch("volunteerRegistrationOpen") ? "translate-x-4" : "translate-x-0"}`} />
                        </div>
                      </label>
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
