"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CheckCircle, XCircle } from "lucide-react";

const schema = z.object({
  fullName: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
});

export function PublicRegistrationForm({ eventId, isFull, isClosed }: { eventId: string, isFull: boolean, isClosed: boolean }) {
  const [status, setStatus] = useState<'idle' | 'success' | 'error' | 'already_registered'>('idle');
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
  });

  async function onSubmit(data: z.infer<typeof schema>) {
    setStatus('idle');
    try {
      const res = await fetch("/api/registrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId, ...data }),
      });
      const resData = await res.json();
      if (res.ok) {
        setStatus('success');
      } else if (resData.error === 'Already registered') {
        setStatus('already_registered');
      } else {
        setStatus('error');
      }
    } catch {
      setStatus('error');
    }
  }

  if (isClosed) return <div className="text-destructive font-medium text-center p-4 border rounded-xl border-destructive/20 bg-destructive/5">Registration is closed</div>;
  if (isFull) return <div className="text-secondary-foreground font-medium text-center p-4 border rounded-xl bg-muted/50">Event is full</div>;

  if (status === 'success') {
    return (
      <div className="bg-green-50 text-green-800 p-6 rounded-2xl border border-green-100 flex flex-col items-center">
        <CheckCircle className="h-8 w-8 mb-2 text-green-600" />
        <p className="font-medium text-center">You are registered successfully!</p>
        <p className="text-sm mt-1 opacity-80 text-center">We will send further communications to your email.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <h3 className="font-serif text-lg font-medium">Participant Registration</h3>
      {status === 'error' && <p className="text-destructive text-sm"><XCircle className="inline h-4 w-4 mr-1"/> Failed to register. Please try again.</p>}
      {status === 'already_registered' && <p className="text-destructive text-sm"><XCircle className="inline h-4 w-4 mr-1"/> This email is already registered.</p>}
      
      <div className="space-y-3">
        <div>
          <Input placeholder="Full Name" {...register("fullName")} className="bg-white/50" />
          {errors.fullName && <p className="text-xs text-destructive mt-1">{errors.fullName.message}</p>}
        </div>
        <div>
          <Input placeholder="Email Address" type="email" {...register("email")} className="bg-white/50" />
          {errors.email && <p className="text-xs text-destructive mt-1">{errors.email.message}</p>}
        </div>
        <div>
          <Input placeholder="Phone (Optional)" type="tel" {...register("phone")} className="bg-white/50" />
        </div>
      </div>
      <Button type="submit" disabled={isSubmitting} className="w-full h-11 bg-primary text-primary-foreground">
        {isSubmitting ? "Registering..." : "Confirm Registration"}
      </Button>
    </form>
  );
}
