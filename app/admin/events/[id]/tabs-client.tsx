"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface Tab {
  id: string;
  label: string;
}

export default function EventTabsClient({
  tabs,
  activeTab,
  eventId,
}: {
  tabs: Tab[];
  activeTab: string;
  eventId: string;
}) {
  return (
    <div className="border-b border-foreground/[0.06]">
      <nav className="-mb-px flex gap-0 overflow-x-auto scrollbar-none">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <Link
              key={tab.id}
              href={`/admin/events/${eventId}?tab=${tab.id}`}
              className={`
                relative shrink-0 px-4 py-3 text-xs font-bold uppercase tracking-[0.1em] transition-colors whitespace-nowrap
                ${
                  isActive
                    ? "text-foreground after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-primary after:rounded-full"
                    : "text-foreground/40 hover:text-foreground/70"
                }
              `}
            >
              {tab.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
