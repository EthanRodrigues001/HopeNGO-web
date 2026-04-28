"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase/client";
import { Button } from "@/components/ui/button";

const DASHBOARD_PREFIXES = ["/admin", "/participant", "/volunteer", "/coordinator"];

export function Navbar() {
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isAuth, setIsAuth] = useState(false);
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();

  // Hide navbar on dashboard routes — those have their own navigation
  const isDashboardRoute = DASHBOARD_PREFIXES.some((p) => pathname.startsWith(p));

  useEffect(() => {
    if (isDashboardRoute) {
      setLoading(false);
      return;
    }

    // Use session cookie verify endpoint — fast, no Firestore round-trip
    fetch("/api/auth/verify")
      .then((res) => {
        if (!res.ok) {
          setIsAuth(false);
          setUserRole(null);
          return null;
        }
        return res.json();
      })
      .then((data) => {
        if (data?.role) {
          setIsAuth(true);
          setUserRole(data.role);
        } else {
          setIsAuth(false);
          setUserRole(null);
        }
      })
      .catch(() => {
        setIsAuth(false);
        setUserRole(null);
      })
      .finally(() => setLoading(false));
  }, [isDashboardRoute]);


  // Don't render on dashboard routes
  if (isDashboardRoute) return null;

  const handleSignOut = async () => {
    try {
      if (auth.currentUser) await signOut(auth);
    } catch (e) { /* silent */ }
    await fetch('/api/auth/session', { method: 'DELETE' });
    setIsAuth(false);
    setUserRole(null);
    window.location.href = '/';
  };

  return (
    <nav className="bg-background/80 backdrop-blur-xl sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 lg:px-16 h-16 flex items-center justify-between">
        <Link
          href="/"
          className="flex items-center gap-2 font-serif text-2xl tracking-tight text-foreground hover:opacity-80 transition-opacity"
        >
          Hope<span className="font-normal italic">NGO</span>
        </Link>
        <div className="flex items-center gap-6">
          <Link
            href="/events"
            className={`text-[11px] uppercase tracking-[0.12em] font-bold transition-colors hidden md:block ${
              pathname === "/events"
                ? "text-primary"
                : "text-foreground/50 hover:text-primary"
            }`}
          >
            Field Operations
          </Link>
          <Link
            href="/donate"
            className={`text-[11px] uppercase tracking-[0.12em] font-bold transition-colors hidden md:block ${
              pathname === "/donate"
                ? "text-primary"
                : "text-foreground/50 hover:text-primary"
            }`}
          >
            Donations
          </Link>

          {loading ? null : isAuth ? (
            <div className="flex items-center gap-3">
              {userRole && (
                <Link
                  href={userRole === 'event_coordinator' ? '/coordinator/dashboard' : `/${userRole}/dashboard`}
                >
                  <Button
                    size="sm"
                    className="h-8 shadow-none bg-primary text-primary-foreground text-[10px] uppercase font-bold tracking-[0.12em] hover:bg-primary/90 rounded-[8px]"
                  >
                    Dashboard
                  </Button>
                </Link>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={handleSignOut}
                className="h-8 shadow-none text-[10px] uppercase font-bold tracking-[0.12em] border-foreground/[0.08] hover:bg-muted text-foreground/60 rounded-[8px]"
              >
                Sign Out
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <Link
                href="/login"
                className={`text-[11px] uppercase tracking-[0.12em] font-bold transition-colors hidden sm:block ${
                  pathname === "/login"
                    ? "text-foreground"
                    : "text-foreground/50 hover:text-foreground"
                }`}
              >
                Login
              </Link>
              <Link href="/register">
                <Button
                  size="sm"
                  className="h-8 shadow-none bg-primary text-primary-foreground text-[10px] uppercase font-bold tracking-[0.12em] hover:bg-primary/90 rounded-[8px]"
                >
                  Join Archive
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
