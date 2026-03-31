import { Skeleton } from "@/components/ui/skeleton";

export default function AdminDashboardLoading() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <Skeleton className="h-10 w-48 mb-4 bg-neutral-800" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Skeleton className="h-32 rounded-xl bg-neutral-800" />
        <Skeleton className="h-32 rounded-xl bg-neutral-800" />
        <Skeleton className="h-32 rounded-xl bg-neutral-800" />
        <Skeleton className="h-32 rounded-xl bg-neutral-800" />
        <Skeleton className="h-32 rounded-xl bg-neutral-800" />
      </div>
    </div>
  );
}
