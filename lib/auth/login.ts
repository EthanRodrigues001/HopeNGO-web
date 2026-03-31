import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase/client';

export async function login(email: string, password: string) {
  const credential = await signInWithEmailAndPassword(auth, email, password);
  const idToken = await credential.user.getIdToken();

  // Exchange for session cookie and get backend auth role
  const res = await fetch('/api/auth/session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error('Session creation failed');

  const profile = data.profile;

  if (!profile) throw new Error('No user profile found');
  if (!profile.isActive) throw new Error('Account is deactivated');
  if (profile.role === 'volunteer' && !profile.isApproved) {
    throw new Error('PENDING_APPROVAL');
  }

  return profile.role; // "admin" | "volunteer" | "participant"
}
