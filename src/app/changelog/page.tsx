import { getDeployments } from "@/lib/vercel";
import { formatDistanceToNow } from "date-fns";
import { GitBranch, ChevronLeft, ChevronRight, ExternalLink } from "lucide-react";
import { DeploymentActions } from "./DeploymentActions";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface Props {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export const revalidate = 60;
export const dynamic = 'force-dynamic';

const StateDot = ({ state }: { state: string }) => {
  const colors: Record<string, string> = {
    READY: "bg-[#50e3c2]",
    ERROR: "bg-[#ff0000]",
    BUILDING: "bg-[#f5a623]",
    CANCELED: "bg-[#888]",
  };
  return <div className={`size-2 rounded-full ${colors[state] || "bg-gray-500"} mr-2 shadow-[0_0_8px_rgba(80,227,194,0.4)]`} />;
};

export default async function ChangelogPage({ searchParams }: Props) {
  const params = await searchParams;
  const until = params.until as string | undefined;
  const limit = 20;

  const { deployments, pagination } = await getDeployments(limit, until);

  return (
    <div className="min-h-screen bg-white dark:bg-[#050505] pt-24 pb-12 font-sans selection:bg-primary selection:text-white">
      <div className="max-w-[1600px] mx-auto px-6">
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="size-10 bg-black dark:bg-white rounded-xl flex items-center justify-center hover:scale-105 transition-transform duration-500 shadow-xl">
              <span className="text-white dark:text-black font-black text-xl">T</span>
            </Link>
            <div>
              <h1 className="text-2xl font-black tracking-tighter text-black dark:text-white uppercase italic">Trac AI Changelog</h1>
              <p className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-[0.3em] mt-0.5">Live Updates</p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between py-4">
          <div className="text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">
            {deployments.length > 0 ? (
              <>
                Showing {deployments.length} records 
                {pagination?.next ? " • More updates available" : " • End of stream"}
              </>
            ) : "No records found"}
          </div>
          <div className="flex items-center gap-2">
            {pagination?.prev && (
              <Button variant="outline" size="sm" asChild className="h-8 rounded-lg font-black text-[10px] uppercase tracking-widest gap-1 px-3">
                <Link href={`/changelog?until=${pagination.prev}`}>
                  <ChevronLeft size={14} /> Previous
                </Link>
              </Button>
            )}
            {pagination?.next && (
              <Button variant="outline" size="sm" asChild className="h-8 rounded-lg font-black text-[10px] uppercase tracking-widest gap-1 px-3">
                <Link href={`/changelog?until=${pagination.next}`}>
                  Next <ChevronRight size={14} />
                </Link>
              </Button>
            )}
          </div>
        </div>

        <div className="border border-black/10 dark:border-white/10 rounded-lg overflow-hidden bg-white dark:bg-black shadow-sm">
          <div className="flex flex-col">
            {deployments.length === 0 ? (
              <div className="p-12 text-center text-muted-foreground uppercase text-xs font-black tracking-widest">
                No deployments found
              </div>
            ) : (
              deployments.map((deployment) => (
                <div 
                  key={deployment.uid} 
                  className="flex flex-col md:flex-row md:items-center gap-4 px-6 py-4 border-b border-black/10 dark:border-white/10 last:border-0 hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors group"
                >
                  {/* Name & Target */}
                  <div className="w-full md:w-[15%] shrink-0">
                    <div className="text-[13px] font-bold text-black dark:text-white truncate">
                      {deployment.uid.slice(0, 12)}
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-[11px] text-muted-foreground capitalize">{deployment.target || "preview"}</span>
                      {deployment.target === "production" && (
                        <div className="bg-primary/10 text-primary text-[10px] font-black px-1.5 py-0.5 rounded-full flex items-center gap-1">
                          <div className="size-1 bg-primary rounded-full animate-pulse" />
                          Current
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Status */}
                  <div className="w-full md:w-[15%] shrink-0 flex items-center">
                    <div className="flex items-center">
                      <StateDot state={deployment.state} />
                      <span className="text-[13px] font-medium text-black dark:text-white capitalize">
                        {deployment.state.toLowerCase()}
                      </span>
                    </div>
                  </div>

                  {/* Git Info */}
                  <div className="w-full md:w-[45%] flex-1 flex flex-col gap-0.5">
                    <div className="flex items-center gap-2">
                      <GitBranch size={13} className="text-muted-foreground" />
                      <span className="text-[13px] font-medium text-black dark:text-white tracking-tight">
                        {deployment.meta.githubCommitRef || "main"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="size-1.5 rounded-full border border-black/20 dark:border-white/20 shrink-0" />
                      <span className="text-[12px] font-mono text-muted-foreground mr-1">
                        {deployment.meta.githubCommitSha?.slice(0, 7) || "-------"}
                      </span>
                      <span className="text-[13px] text-black/70 dark:text-white/70 truncate font-medium group-hover:text-primary transition-colors">
                        {deployment.meta.githubCommitMessage || "No commit message provided"}
                      </span>
                    </div>
                  </div>

                  {/* Time & User */}
                  <div className="w-full md:w-[20%] shrink-0 flex items-center justify-between md:justify-end gap-4">
                    <div className="text-right">
                      <div className="text-[13px] text-muted-foreground font-medium">
                        {formatDistanceToNow(new Date(deployment.created), { addSuffix: true })}
                      </div>
                      <div className="text-[11px] text-muted-foreground/60">
                        by {deployment.creator.username}
                      </div>
                    </div>
                    <div className="size-8 rounded-full border border-black/10 dark:border-white/10 overflow-hidden shrink-0 bg-secondary flex items-center justify-center">
                      <img 
                        src={`https://api.dicebear.com/9.x/avataaars/svg?seed=${deployment.creator.username}`} 
                        alt={deployment.creator.username}
                        className="size-full"
                      />
                    </div>
                    <DeploymentActions deployment={deployment} />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="flex items-center justify-between py-4">
          <div className="text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">
            {deployments.length > 0 ? (
              <>
                Showing {deployments.length} records 
                {pagination?.next ? " • More updates available" : " • End of stream"}
              </>
            ) : "No records found"}
          </div>
          <div className="flex items-center gap-2">
            {pagination?.prev && (
              <Button variant="outline" size="sm" asChild className="h-8 rounded-lg font-black text-[10px] uppercase tracking-widest gap-1 px-3">
                <Link href={`/changelog?until=${pagination.prev}`}>
                  <ChevronLeft size={14} /> Previous
                </Link>
              </Button>
            )}
            {pagination?.next && (
              <Button variant="outline" size="sm" asChild className="h-8 rounded-lg font-black text-[10px] uppercase tracking-widest gap-1 px-3">
                <Link href={`/changelog?until=${pagination.next}`}>
                  Next <ChevronRight size={14} />
                </Link>
              </Button>
            )}
          </div>
        </div>

        <div className="mt-8 flex justify-end">
          <a 
            href="https://vercel.com" 
            target="_blank" 
            className="text-[11px] font-black uppercase tracking-[0.3em] text-muted-foreground hover:text-primary transition-colors flex items-center gap-2"
          >
            Powered by Vercel <ExternalLink size={12} />
          </a>
        </div>
      </div>
    </div>
  );
}
