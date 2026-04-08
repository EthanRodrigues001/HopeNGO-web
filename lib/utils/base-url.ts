/**
 * Returns the absolute base URL of the app.
 * Works in both server-side (API routes, Server Components) and client-side contexts.
 * Never hardcodes localhost.
 */
export function getBaseUrl(): string {
  // Browser: use window.location.origin
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }

  // Server: use NEXT_PUBLIC_APP_URL from environment
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL;
  }

  // Vercel auto-provides this during builds and runtime
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  // Fallback for local dev only
  return 'http://localhost:3000';
}
