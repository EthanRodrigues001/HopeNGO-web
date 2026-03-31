"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2 } from "lucide-react";
import Link from "next/link";

export default function EventActionsClient({ eventId, eventTitle }: { eventId: string, eventTitle: string }) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!window.confirm(`Are you absolutely sure you want to delete "${eventTitle}"? This cannot be undone.`)) {
      return;
    }

    setDeleting(true);
    try {
      const res = await fetch(`/api/events/${eventId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete");
      router.push("/admin/events");
      router.refresh();
    } catch (error) {
      alert("Error deleting event");
      setDeleting(false);
    }
  };

  return (
    <div className="flex items-center gap-3">
      <Link href={`/admin/events/${eventId}/edit`}>
        <Button variant="outline" className="bg-neutral-900 border-neutral-700 hover:bg-neutral-800 text-neutral-300 gap-2">
          <Pencil size={16} /> Edit
        </Button>
      </Link>
      <Button 
        variant="destructive" 
        onClick={handleDelete} 
        disabled={deleting}
        className="bg-red-500/10 text-red-500 hover:bg-red-500/20 hover:text-red-400 border border-red-500/20 gap-2"
      >
        <Trash2 size={16} /> {deleting ? "Deleting..." : "Delete"}
      </Button>
    </div>
  );
}
