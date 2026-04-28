"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase/client";
import {
  ClipboardList, Calendar, MapPin, Loader2, Image,
  CheckCircle2, PlusCircle, X, Send, ChevronDown, ChevronUp
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getCoordinatorDashboardData } from "./actions";

interface CoordinatorReport {
  imageUrls: string[];
  notes: string;
}

export default function CoordinatorDashboard() {
  const [loading, setLoading] = useState(true);
  const [assignedEvents, setAssignedEvents] = useState<any[]>([]);

  // Per-event report form state
  const [expandedEvent, setExpandedEvent] = useState<string | null>(null);
  const [reportForms, setReportForms] = useState<Record<string, CoordinatorReport>>({});
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);
  const [newImageUrl, setNewImageUrl] = useState<Record<string, string>>({});

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) { setLoading(false); return; }
      try {
        const data = await getCoordinatorDashboardData();
        setAssignedEvents(data.assignedEvents);
        // Initialise forms with existing report data if any
        const initialForms: Record<string, CoordinatorReport> = {};
        const initialUrls: Record<string, string> = {};
        data.assignedEvents.forEach((e: any) => {
          initialForms[e.id] = { imageUrls: e.reportImageUrls || [], notes: e.reportNotes || "" };
          initialUrls[e.id] = "";
        });
        setReportForms(initialForms);
        setNewImageUrl(initialUrls);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    });
    return () => unsub();
  }, []);

  const addImageUrl = (eventId: string) => {
    const url = newImageUrl[eventId]?.trim();
    if (!url) return;
    setReportForms((prev) => ({
      ...prev,
      [eventId]: {
        ...prev[eventId],
        imageUrls: [...(prev[eventId]?.imageUrls || []), url],
      },
    }));
    setNewImageUrl((prev) => ({ ...prev, [eventId]: "" }));
  };

  const removeImageUrl = (eventId: string, idx: number) => {
    setReportForms((prev) => ({
      ...prev,
      [eventId]: {
        ...prev[eventId],
        imageUrls: prev[eventId].imageUrls.filter((_, i) => i !== idx),
      },
    }));
  };

  const handleSubmit = async (eventId: string) => {
    const form = reportForms[eventId];
    if (!form || form.imageUrls.length === 0) return;
    setSubmitting(eventId);
    try {
      const res = await fetch(`/api/events/${eventId}/coordinator-report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrls: form.imageUrls, notes: form.notes }),
      });
      if (res.ok) {
        setSubmitSuccess(eventId);
        setTimeout(() => setSubmitSuccess(null), 4000);
      } else {
        alert("Failed to submit report. Please try again.");
      }
    } catch {
      alert("Network error. Please try again.");
    } finally {
      setSubmitting(null);
    }
  };

  return (
    <div className="p-6 lg:p-10 text-foreground max-w-5xl">
      <header className="mb-10">
        <p className="text-[11px] uppercase tracking-[0.12em] font-bold text-primary/70 mb-2">
          Coordinator Hub
        </p>
        <h1 className="text-4xl font-serif tracking-tight text-foreground mb-3">My Events</h1>
        <p className="text-foreground/60 font-light max-w-lg leading-relaxed text-sm">
          View your assigned events and submit field reports with image documentation.
        </p>
      </header>

      {loading ? (
        <div className="p-20 flex justify-center items-center">
          <Loader2 className="w-7 h-7 animate-spin text-primary" />
        </div>
      ) : assignedEvents.length === 0 ? (
        <div className="p-12 rounded-2xl bg-muted/30 flex flex-col items-center justify-center text-center">
          <ClipboardList className="w-10 h-10 text-primary/30 mb-4" strokeWidth={1} />
          <h3 className="font-serif text-xl mb-2 text-foreground">No Assignments Yet</h3>
          <p className="text-sm text-foreground/50 font-light max-w-sm">
            You haven&apos;t been assigned as a coordinator to any events. Wait for administrators to delegate tasks.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          {assignedEvents.map((event) => {
            const isExpanded = expandedEvent === event.id;
            const form = reportForms[event.id] || { imageUrls: [], notes: "" };
            const hasReport = form.imageUrls.length > 0;
            const isSubmitting = submitting === event.id;
            const isSuccess = submitSuccess === event.id;

            return (
              <Card
                key={event.id}
                className="bg-card border-0 ring-1 ring-foreground/[0.05] rounded-2xl shadow-sm"
              >
                {/* Event summary row */}
                <CardHeader className="p-6 pb-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <Badge
                          variant={event.status === "completed" ? "default" : "outline"}
                          className="text-[9px] uppercase tracking-[0.12em] font-bold shadow-none rounded-sm"
                        >
                          {event.status || "Upcoming"}
                        </Badge>
                        {hasReport && (
                          <span className="flex items-center gap-1 text-[10px] font-bold text-primary uppercase tracking-widest">
                            <CheckCircle2 size={10} /> Report Added
                          </span>
                        )}
                      </div>
                      <CardTitle className="text-xl font-serif font-medium leading-[1.3] line-clamp-2 mb-2">
                        {event.title}
                      </CardTitle>
                      <div className="flex flex-wrap gap-4 text-xs text-foreground/50 font-light">
                        <span className="flex items-center gap-1.5">
                          <Calendar size={12} className="opacity-70" />
                          {event.eventDate ? new Date(event.eventDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—"}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <MapPin size={12} className="opacity-70" />
                          {event.city}{event.state ? `, ${event.state}` : ""}
                        </span>
                      </div>
                    </div>

                    {/* Read-only stats */}
                    <div className="flex gap-4 shrink-0">
                      <div className="text-center">
                        <p className="text-xl font-serif text-foreground">{event.participantCount || 0}</p>
                        <p className="text-[9px] uppercase tracking-widest font-bold text-foreground/40">Participants</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xl font-serif text-foreground">{event.volunteerCount || 0}</p>
                        <p className="text-[9px] uppercase tracking-widest font-bold text-foreground/40">Volunteers</p>
                      </div>
                    </div>
                  </div>
                </CardHeader>

                {/* Report form toggle */}
                <CardFooter className="px-6 pb-6 pt-0 flex flex-col gap-4">
                  <button
                    onClick={() => setExpandedEvent(isExpanded ? null : event.id)}
                    className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-primary hover:text-primary/80 transition-colors w-full"
                  >
                    {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    {isExpanded ? "Hide" : hasReport ? "Edit Report" : "Add Field Report"}
                    {hasReport && !isExpanded && (
                      <span className="ml-1 text-foreground/40 font-normal normal-case tracking-normal">
                        ({form.imageUrls.length} image{form.imageUrls.length !== 1 ? "s" : ""})
                      </span>
                    )}
                  </button>

                  {isExpanded && (
                    <div className="flex flex-col gap-4 w-full pt-2 border-t border-foreground/[0.05]">
                      {/* Notes */}
                      <div>
                        <label className="text-[10px] font-bold uppercase tracking-widest text-foreground/50 mb-1.5 block">
                          Field Notes (optional)
                        </label>
                        <textarea
                          placeholder="Add any observations, highlights, or context about this event..."
                          value={form.notes}
                          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setReportForms((prev) => ({
                            ...prev,
                            [event.id]: { ...prev[event.id], notes: e.target.value },
                          }))}
                          className="w-full bg-muted/20 border border-foreground/10 text-foreground placeholder:text-foreground/30 focus:outline-none focus:ring-2 focus:ring-primary rounded-lg text-sm resize-none px-3 py-2 min-h-[80px]"
                          rows={3}
                        />
                      </div>

                      {/* Image URLs */}
                      <div>
                        <label className="text-[10px] font-bold uppercase tracking-widest text-foreground/50 mb-1.5 block">
                          Image URLs <span className="text-foreground/30 normal-case font-normal tracking-normal">— paste public image links</span>
                        </label>

                        {/* Existing URLs */}
                        {form.imageUrls.length > 0 && (
                          <div className="flex flex-col gap-2 mb-3">
                            {form.imageUrls.map((url, idx) => (
                              <div key={idx} className="flex items-center gap-2 bg-muted/30 rounded-lg px-3 py-2">
                                <Image size={13} className="text-foreground/40 shrink-0" />
                                <span className="text-xs text-foreground/70 flex-1 truncate">{url}</span>
                                <button
                                  onClick={() => removeImageUrl(event.id, idx)}
                                  className="text-foreground/30 hover:text-red-500 transition-colors shrink-0"
                                >
                                  <X size={13} />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Add new URL */}
                        <div className="flex gap-2">
                          <Input
                            placeholder="https://example.com/field-photo.jpg"
                            value={newImageUrl[event.id] || ""}
                            onChange={(e) => setNewImageUrl((prev) => ({ ...prev, [event.id]: e.target.value }))}
                            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addImageUrl(event.id); } }}
                            className="h-9 bg-muted/20 border-foreground/10 text-foreground placeholder:text-foreground/30 focus-visible:ring-primary rounded-lg text-sm"
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => addImageUrl(event.id)}
                            className="h-9 border-foreground/10 hover:bg-muted text-foreground shrink-0 gap-1.5 text-xs font-bold uppercase tracking-widest shadow-none rounded-lg"
                          >
                            <PlusCircle size={13} /> Add
                          </Button>
                        </div>
                      </div>

                      {/* Submit */}
                      <Button
                        onClick={() => handleSubmit(event.id)}
                        disabled={form.imageUrls.length === 0 || isSubmitting}
                        className="h-10 bg-primary hover:bg-primary/90 text-primary-foreground shadow-none rounded-lg font-bold text-xs uppercase tracking-widest gap-2 transition-all"
                      >
                        {isSubmitting ? (
                          <><Loader2 size={13} className="animate-spin" /> Submitting...</>
                        ) : isSuccess ? (
                          <><CheckCircle2 size={13} /> Submitted!</>
                        ) : (
                          <><Send size={13} /> {hasReport ? "Update Report" : "Submit Report"}</>
                        )}
                      </Button>
                    </div>
                  )}
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
