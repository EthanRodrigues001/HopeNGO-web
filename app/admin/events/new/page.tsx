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

export default function NewEventPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<EventForm>({
    resolver: zodResolver(schema) as any,
    defaultValues: {
      eventType: "Workshop",
      status: "upcoming",
      participantRegistrationOpen: true,
      volunteerRegistrationOpen: true,
      maxParticipants: null,
      maxVolunteers: null,
    }
  });

  const onSubmit = async (data: EventForm) => {
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          eventDate: new Date(data.eventDate).toISOString(),
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

                <div className="flex flex-col gap-3">
                  <label className="text-xs uppercase tracking-widest font-bold text-foreground/50">Date</label>
                  <Input type="date" {...register("eventDate")} className="bg-transparent border-foreground/10 focus-visible:ring-primary h-12 rounded-[8px]" />
                </div>
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
                  <label className="text-xs uppercase tracking-widest font-bold text-foreground/50">Max Participants Limit</label>
                  <Input type="number" {...register("maxParticipants")} className="bg-transparent border-foreground/10 focus-visible:ring-primary h-12 rounded-[8px]" placeholder="Leave blank for infinite" />
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
