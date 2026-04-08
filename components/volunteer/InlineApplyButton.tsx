'use client';
import { useState } from 'react';
import { Loader2 } from 'lucide-react';

export function InlineApplyButton({ eventId, eventTitle }: { eventId: string; eventTitle: string }) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'applied' | 'error'>('idle');

  async function handleApply() {
    setStatus('loading');
    try {
      const res = await fetch('/api/volunteer-applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId }),
      });
      setStatus(res.ok ? 'applied' : 'error');
    } catch {
      setStatus('error');
    }
  }

  if (status === 'applied') return <span className="text-green-600 text-sm font-medium">✓ Applied</span>;

  return (
    <button
      onClick={handleApply}
      disabled={status === 'loading'}
      className="bg-primary hover:bg-primary/90 text-primary-foreground text-sm px-4 py-2 rounded-lg transition disabled:opacity-50 flex items-center justify-center min-w-[120px]"
    >
      {status === 'loading' ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Apply to Volunteer'}
    </button>
  );
}
