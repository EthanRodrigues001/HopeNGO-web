/**
 * Generate a certificate number with HOPE- prefix.
 */
export function generateCertNumber(eventId: string, seq: number): string {
  const year = new Date().getFullYear();
  const eventShort = eventId.slice(0, 6).toUpperCase();
  const seqPadded = String(seq).padStart(4, '0');
  return `HOPE-${year}-${eventShort}-${seqPadded}`;
}
