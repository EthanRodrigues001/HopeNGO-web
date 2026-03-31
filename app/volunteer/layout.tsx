"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Briefcase, Calendar, LogOut } from "lucide-react";
import { useState } from "react";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase/client";
import { Menu } from "lucide-react";

const NAV_ITEMS = [
  { href: "/volunteer/dashboard", label: "My Assignments", icon: Briefcase },
  { href: "/events", label: "Browse Operations", icon: Calendar },
];

export default function VolunteerLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleSignOut = async () => {
    try {
      if (auth.currentUser) await signOut(auth);
    } catch (e) { /* silent */ }
    await fetch("/api/auth/session", { method: "DELETE" });
    window.location.href = "/";
  };

  return (
    <div className="min-h-screen bg-background flex font-sans">
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-foreground/10 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`
          fixed lg:sticky top-0 left-0 z-50 h-screen w-[260px]
          bg-background/80 backdrop-blur-xl
          flex flex-col
          transition-transform duration-300 ease-out
          lg:translate-x-0
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        <div className="p-8 pb-6">
          <Link
            href="/"
            className="flex items-center gap-2 font-serif text-xl tracking-tight text-foreground hover:opacity-80 transition-opacity"
          >
            Hope<span className="font-normal italic">NGO</span>
          </Link>
          <p className="text-[10px] uppercase tracking-[0.12em] font-bold text-primary/70 mt-2">
            Operative Station
          </p>
        </div>

        <nav className="flex-1 px-4 flex flex-col gap-1">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-[10px]
                  text-[13px] font-semibold tracking-wide
                  transition-all duration-200
                  ${isActive
                    ? "bg-primary/[0.08] text-primary"
                    : "text-foreground/60 hover:text-foreground hover:bg-muted/60"
                  }
                `}
              >
                <Icon size={18} strokeWidth={isActive ? 2 : 1.5} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 mt-auto">
          <button
            onClick={handleSignOut}
            className="
              flex items-center gap-3 px-4 py-3 rounded-[10px] w-full
              text-[13px] font-semibold tracking-wide
              text-foreground/50 hover:text-destructive hover:bg-destructive/[0.06]
              transition-all duration-200
            "
          >
            <LogOut size={18} strokeWidth={1.5} />
            Sign Out
          </button>
        </div>
      </aside>

      <div className="flex-1 min-w-0">
        <div className="lg:hidden sticky top-0 z-30 bg-background/80 backdrop-blur-xl px-4 h-14 flex items-center justify-between">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-[8px] hover:bg-muted transition-colors text-foreground/70"
          >
            <Menu size={20} />
          </button>
          <span className="font-serif text-base tracking-tight text-foreground">
            Hope<span className="font-normal italic">NGO</span>
          </span>
          <div className="w-9" />
        </div>
        <main className="animate-page-in">{children}</main>
      </div>
    </div>
  );
}
