'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const schema = z.object({
  donorName:     z.string().min(2, "Name must be at least 2 characters"),
  donorEmail:    z.string().email("Invalid email address"),
  amount:        z.number().min(1, "Amount must be at least 1"),
  paymentMethod: z.enum(['upi', 'bank_transfer', 'other']),
  transactionId: z.string().optional(),
  message:       z.string().max(300).optional(),
});

export function DonationForm() {
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const { register, handleSubmit, formState: { errors, isSubmitting }, reset, setValue } = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: {
      paymentMethod: 'upi',
    }
  });

  async function onSubmit(data: z.infer<typeof schema>) {
    try {
      const res = await fetch('/api/donations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        setSubmitStatus('success');
        reset();
      } else {
        setSubmitStatus('error');
      }
    } catch {
      setSubmitStatus('error');
    }
  }

  if (submitStatus === 'success') {
    return (
      <div className="bg-green-50 border border-green-100 rounded-2xl p-8 text-center shadow-sm">
        <h2 className="text-2xl font-serif text-green-800 mb-2">Thank you!</h2>
        <p className="text-green-700">We have recorded your donation intent. Once verified, it will be added to our records.</p>
        <Button 
          onClick={() => setSubmitStatus('idle')} 
          variant="outline" 
          className="mt-6 border-green-200 text-green-700 bg-white hover:bg-green-50"
        >
          Submit another
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="bg-white border rounded-2xl p-6 shadow-sm space-y-4">
      <h2 className="text-lg font-semibold">Record Your Donation</h2>
      
      {submitStatus === 'error' && (
        <div className="p-3 bg-red-50 text-red-600 rounded-md text-sm">Failed to submit. Please try again.</div>
      )}

      <div className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Name</label>
          <Input {...register('donorName')} placeholder="Your name" />
          {errors.donorName && <p className="text-xs text-red-500">{errors.donorName.message}</p>}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Email</label>
          <Input {...register('donorEmail')} type="email" placeholder="you@example.com" />
          {errors.donorEmail && <p className="text-xs text-red-500">{errors.donorEmail.message}</p>}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Amount (INR)</label>
          <Input {...register('amount', { valueAsNumber: true })} type="number" placeholder="1000" />
          {errors.amount && <p className="text-xs text-red-500">{errors.amount.message}</p>}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Payment Method</label>
          <Select onValueChange={(val) => setValue('paymentMethod', val as 'upi'|'bank_transfer'|'other')} defaultValue="upi">
            <SelectTrigger>
              <SelectValue placeholder="Select method" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="upi">UPI</SelectItem>
              <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Transaction ID (Optional)</label>
          <Input {...register('transactionId')} placeholder="e.g. UTR number" />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Message (Optional)</label>
          <Input {...register('message')} placeholder="Leave a comment..." />
        </div>
      </div>

      <Button type="submit" disabled={isSubmitting} className="w-full mt-6 bg-green-600 hover:bg-green-700 text-white shadow-none h-12">
        {isSubmitting ? "Submitting..." : "Submit Donation Record"}
      </Button>
    </form>
  );
}
