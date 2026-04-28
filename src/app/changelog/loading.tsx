import { Skeleton } from "@/components/ui/skeleton";
import { GitBranch, MoreHorizontal } from "lucide-react";

export default function ChangelogLoading() {
  return (
    <div className="min-h-screen bg-white dark:bg-[#050505] pt-24 pb-12 font-sans">
      <div className="max-w-[1600px] mx-auto px-6">
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="size-10 bg-black dark:bg-white rounded-xl flex items-center justify-center">
              <span className="text-white dark:text-black font-black text-xl">T</span>
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tighter text-black dark:text-white uppercase italic">Trac AI Changelog</h1>
              <p className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-[0.3em] mt-0.5">Live Updates</p>
            </div>
          </div>
        </div>

        {/* Top Pagination Skeleton */}
        <div className="flex items-center justify-between mb-4">
           <Skeleton className="h-8 w-48" />
           <div className="flex gap-2">
             <Skeleton className="h-8 w-20" />
             <Skeleton className="h-8 w-20" />
           </div>
        </div>

        <div className="border border-black/10 dark:border-white/10 rounded-lg overflow-hidden bg-white dark:bg-black">
          {[...Array(10)].map((_, i) => (
            <div key={i} className="flex flex-col md:flex-row md:items-center gap-4 px-6 py-4 border-b border-black/10 dark:border-white/10 last:border-0">
              <div className="w-full md:w-[15%] shrink-0">
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-3 w-16" />
              </div>
              <div className="w-full md:w-[15%] shrink-0 flex items-center">
                <Skeleton className="size-2 rounded-full mr-2" />
                <Skeleton className="h-4 w-16" />
              </div>
              <div className="w-full md:w-[45%] flex-1 flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <GitBranch size={13} className="text-muted-foreground opacity-20" />
                  <Skeleton className="h-4 w-20" />
                </div>
                <div className="flex items-center gap-2">
                  <div className="size-1.5 rounded-full bg-border shrink-0" />
                  <Skeleton className="h-4 w-full max-w-md" />
                </div>
              </div>
              <div className="w-full md:w-[20%] shrink-0 flex items-center justify-end gap-4">
                <div className="text-right">
                  <Skeleton className="h-4 w-24 mb-1" />
                  <Skeleton className="h-3 w-16 ml-auto" />
                </div>
                <Skeleton className="size-8 rounded-full" />
                <MoreHorizontal size={16} className="text-muted-foreground opacity-20" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
