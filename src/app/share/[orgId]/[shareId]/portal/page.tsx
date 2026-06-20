"use client";

import { useState, useEffect, useMemo, Suspense } from "react";
import { useParams, useRouter } from "next/navigation";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import { TeamProvider, useTeam } from "@/hooks/use-team";
import { TasksProvider, useTasks } from "@/hooks/useTasks";
import { CRMProvider, useCRM } from "@/hooks/use-crm";
import { db, auth } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { signOut } from "firebase/auth";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { 
  Loader2, LogOut, CheckCircle2, Clock, Users, ListTodo, Briefcase, 
  Settings, ChevronRight, Inbox, HelpCircle, ShieldAlert, Star, DollarSign, Calendar
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { ProductSwitcher } from "@/components/ems/shared/ProductSwitcher";

function ClientPortalContent() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  
  const orgId = params.orgId as string;
  const shareId = params.shareId as string;

  const { user, loading: authLoading } = useAuth();
  
  // 1. Fetch data from hooks (bound to overrideOrgId)
  const { tasks, loading: tasksLoading } = useTasks();
  const { employees, loading: teamLoading } = useTeam();
  const { entities, loading: crmLoading } = useCRM();

  // Portal config/branding state
  const [branding, setBranding] = useState<any>(null);
  const [allowedScopes, setAllowedScopes] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<string>("");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.replace(`/share/${orgId}/${shareId}`);
    }
  }, [user, authLoading]);

  // Load client share configurations (allowed scopes and branding settings)
  useEffect(() => {
    async function loadShareDetails() {
      try {
        const shareRef = doc(db, "organizations", orgId, "client_shares", shareId);
        const snap = await getDoc(shareRef);
        if (snap.exists()) {
          const data = snap.data();
          setBranding(data.branding || {});
          const scopes = data.allowedScopes || [];
          setAllowedScopes(scopes);
          if (scopes.length > 0) {
            setActiveTab(scopes[0]);
          }
        }
      } catch (err) {
        console.error("Failed to load share settings:", err);
      }
    }
    if (orgId && shareId) {
      loadShareDetails();
    }
  }, [orgId, shareId]);

  const handleLogout = async () => {
    await signOut(auth);
    toast({ title: "Logged Out", description: "You have securely exited the portal." });
    router.push(`/share/${orgId}/${shareId}`);
  };

  const currentModuleTitle = useMemo(() => {
    switch (activeTab) {
      case "ems": return "Our Team";
      case "crm": return "Project Accounts";
      case "tasks": return "Project Tasks";
      default: return "Portal";
    }
  }, [activeTab]);

  // Filters for CRM: invoices and deals
  const clientInvoices = useMemo(() => {
    return entities.filter(e => e.type === 'invoice' && !e.isDeleted);
  }, [entities]);

  const clientDeals = useMemo(() => {
    return entities.filter(e => e.type === 'deal' && !e.isDeleted);
  }, [entities]);

  if (authLoading || !user || !branding) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
        <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
        <p className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">LOADING SECURE PORTAL FILES...</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background text-foreground font-sans overflow-hidden">
      
      {/* Client Sidebar */}
      <aside className={cn(
        "border-r border-border bg-card/40 backdrop-blur-md flex flex-col justify-between p-4 transition-all duration-300 z-30 shrink-0",
        sidebarCollapsed ? "w-20" : "w-64"
      )}>
        <div className="space-y-6">
          
          {/* Custom Product Switcher limited to client scopes */}
          <div className="mb-6">
            <ProductSwitcher 
              currentModuleId={activeTab}
              isCollapsed={sidebarCollapsed}
              isMobileSidebarOpen={false}
              selectedModules={allowedScopes}
              partnerBrand={branding?.titleText}
              onConfigOpen={() => {}}
              isClient={true}
              allowedScopes={allowedScopes}
            />
          </div>

          {/* Navigation Links */}
          <nav className="space-y-2">
            {allowedScopes.includes("tasks") && (
              <button 
                onClick={() => setActiveTab("tasks")}
                className={cn(
                  "w-full flex items-center gap-3 p-3 rounded-xl transition-all font-semibold text-xs uppercase tracking-wider",
                  activeTab === "tasks" ? "bg-primary/10 text-primary border border-primary/20" : "text-muted-foreground hover:bg-secondary/40 hover:text-foreground"
                )}
              >
                <ListTodo size={16} />
                {!sidebarCollapsed && <span>Tasks Board</span>}
              </button>
            )}

            {allowedScopes.includes("crm") && (
              <button 
                onClick={() => setActiveTab("crm")}
                className={cn(
                  "w-full flex items-center gap-3 p-3 rounded-xl transition-all font-semibold text-xs uppercase tracking-wider",
                  activeTab === "crm" ? "bg-primary/10 text-primary border border-primary/20" : "text-muted-foreground hover:bg-secondary/40 hover:text-foreground"
                )}
              >
                <Briefcase size={16} />
                {!sidebarCollapsed && <span>CRM Details</span>}
              </button>
            )}

            {allowedScopes.includes("ems") && (
              <button 
                onClick={() => setActiveTab("ems")}
                className={cn(
                  "w-full flex items-center gap-3 p-3 rounded-xl transition-all font-semibold text-xs uppercase tracking-wider",
                  activeTab === "ems" ? "bg-primary/10 text-primary border border-primary/20" : "text-muted-foreground hover:bg-secondary/40 hover:text-foreground"
                )}
              >
                <Users size={16} />
                {!sidebarCollapsed && <span>Our Team</span>}
              </button>
            )}
          </nav>
        </div>

        {/* Footer client card (Not clickable) */}
        <div className="space-y-4 pt-4 border-t border-border/60">
          <div className="w-full flex items-center gap-3 p-2 rounded-xl border border-transparent">
            <div className="size-10 rounded-full bg-secondary/80 flex items-center justify-center border border-border shrink-0">
              <span className="text-xs font-bold text-muted-foreground">CP</span>
            </div>
            {!sidebarCollapsed && (
              <div className="flex flex-col min-w-0 text-left">
                <span className="text-xs font-bold truncate text-foreground">Client Portal</span>
                <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">{user?.email}</span>
              </div>
            )}
          </div>

          <Button 
            variant="ghost" 
            onClick={handleLogout}
            className="w-full justify-start gap-3 p-3 rounded-xl hover:bg-destructive/10 text-muted-foreground hover:text-destructive text-xs uppercase tracking-wider font-semibold"
          >
            <LogOut size={16} />
            {!sidebarCollapsed && <span>Sign Out</span>}
          </Button>
        </div>
      </aside>

      {/* Main Viewport */}
      <main className="flex-1 flex flex-col overflow-hidden bg-background">
        
        {/* Portal Header */}
        <header className="h-16 border-b border-border/80 bg-card/30 backdrop-blur-md px-6 flex items-center justify-between shrink-0">
          <h2 className="text-lg font-black uppercase tracking-tighter leading-none">
            {currentModuleTitle}
          </h2>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="text-[9px] font-black uppercase tracking-widest py-1 border-primary/30 text-primary">
              Read-Only Access
            </Badge>
          </div>
        </header>

        {/* Body content views */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <AnimatePresence mode="wait">
            
            {/* 1. Tasks Tab View */}
            {activeTab === "tasks" && (
              <motion.div 
                key="tasks"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                {tasksLoading ? (
                  <div className="flex justify-center py-20"><Loader2 className="animate-spin size-8 text-primary" /></div>
                ) : tasks.length === 0 ? (
                  <div className="text-center py-20 text-muted-foreground">
                    <ListTodo className="size-12 text-muted-foreground/30 mx-auto mb-4" />
                    <p className="text-xs uppercase font-bold tracking-wider">No shared tasks listed</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {tasks.map((task) => (
                      <div key={task.id} className="bg-card border border-border rounded-2xl p-5 shadow-sm space-y-4 flex flex-col justify-between">
                        <div className="space-y-2">
                          <div className="flex justify-between items-start gap-3">
                            <h4 className="font-bold text-sm tracking-tight text-foreground line-clamp-2">{task.title}</h4>
                            <Badge className={cn(
                              "text-[8px] font-black uppercase tracking-widest shrink-0 py-0.5 rounded-md",
                              task.status === "done" ? "bg-green-500/10 text-green-500 border border-green-500/20" :
                              task.status === "in_progress" ? "bg-blue-500/10 text-blue-500 border border-blue-500/20" : "bg-secondary text-muted-foreground"
                            )}>
                              {task.status?.replace('_', ' ')}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed">
                            {task.description || "No description provided."}
                          </p>
                        </div>

                        <div className="flex items-center justify-between border-t border-border/50 pt-3 text-[10px] text-muted-foreground uppercase font-bold tracking-tight">
                          <span className="flex items-center gap-1.5">
                            <Clock size={12} /> Due: {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : "TBD"}
                          </span>
                          <span className="flex items-center gap-1">
                            Priority: <span className={cn(
                              task.priority === "critical" || task.priority === "high" ? "text-red-500" : "text-muted-foreground"
                            )}>{task.priority || "medium"}</span>
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {/* 2. CRM Tab View */}
            {activeTab === "crm" && (
              <motion.div 
                key="crm"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                {crmLoading ? (
                  <div className="flex justify-center py-20"><Loader2 className="animate-spin size-8 text-primary" /></div>
                ) : (
                  <div className="space-y-8">
                    {/* Invoices List */}
                    <div className="bg-card border border-border rounded-3xl p-6 shadow-sm">
                      <h3 className="text-sm font-black uppercase tracking-widest mb-4 flex items-center gap-2">
                        <DollarSign size={16} className="text-primary" /> Project Invoices
                      </h3>
                      {clientInvoices.length === 0 ? (
                        <p className="text-xs text-muted-foreground uppercase tracking-tight py-4">No bills or invoices shared.</p>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full text-left border-collapse">
                            <thead>
                              <tr className="border-b border-border">
                                <th className="pb-3 text-[9px] font-black uppercase tracking-widest text-muted-foreground">Invoice</th>
                                <th className="pb-3 text-[9px] font-black uppercase tracking-widest text-muted-foreground">Amount</th>
                                <th className="pb-3 text-[9px] font-black uppercase tracking-widest text-muted-foreground text-center">Status</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-border/40">
                              {clientInvoices.map((inv) => (
                                <tr key={inv.id}>
                                  <td className="py-3.5 text-xs font-bold">{inv.name || `Invoice #${inv.id.substring(0,6)}`}</td>
                                  <td className="py-3.5 text-xs font-mono font-bold">${inv.data?.amount || "0.00"}</td>
                                  <td className="py-3.5 text-center">
                                    <Badge className={cn(
                                      "text-[8px] font-black uppercase tracking-widest py-0.5 rounded-md",
                                      inv.data?.status === "paid" ? "bg-green-500/10 text-green-500 border border-green-500/20" : "bg-yellow-500/10 text-yellow-500 border border-yellow-500/20"
                                    )}>
                                      {inv.data?.status || "pending"}
                                    </Badge>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>

                    {/* Deals List */}
                    <div className="bg-card border border-border rounded-3xl p-6 shadow-sm">
                      <h3 className="text-sm font-black uppercase tracking-widest mb-4 flex items-center gap-2">
                        <Briefcase size={16} className="text-primary" /> Active Milestone Contracts
                      </h3>
                      {clientDeals.length === 0 ? (
                        <p className="text-xs text-muted-foreground uppercase tracking-tight py-4">No active milestones registered.</p>
                      ) : (
                        <div className="space-y-4">
                          {clientDeals.map((deal) => (
                            <div key={deal.id} className="flex items-center justify-between p-4 bg-secondary/15 rounded-xl border border-border/50">
                              <div className="space-y-1">
                                <span className="text-xs font-bold block">{deal.name}</span>
                                <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Stage: {deal.data?.stage || "Planning"}</span>
                              </div>
                              <span className="text-xs font-mono font-black text-primary">${deal.data?.value || "0.00"}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* 3. EMS (Team) Tab View */}
            {activeTab === "ems" && (
              <motion.div 
                key="ems"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                {teamLoading ? (
                  <div className="flex justify-center py-20"><Loader2 className="animate-spin size-8 text-primary" /></div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {employees.map((member) => (
                      <div key={member.id} className="bg-card border border-border rounded-2xl p-5 shadow-sm flex items-center gap-4">
                        <div className="size-12 rounded-xl bg-secondary/85 overflow-hidden flex items-center justify-center border shrink-0">
                          {member.photoUrl || member.photoURL ? (
                            <img src={member.photoUrl || member.photoURL} alt="Avatar" className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-sm font-black uppercase text-muted-foreground">
                              {member.name ? member.name.substring(0,2) : "EM"}
                            </span>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="text-xs font-bold truncate text-foreground">{member.name || "Team Member"}</h4>
                          <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest block mt-0.5">{member.department || "Engineering"}</span>
                          <span className="text-[8px] font-bold text-muted-foreground uppercase mt-1 block truncate font-mono">{member.email}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}

// Wrapper to initialize providers under client override context
export default function ClientPortalWrapper() {
  const params = useParams();
  const orgId = params.orgId as string;

  return (
    <AuthProvider>
      <TeamProvider overrideOrgId={orgId}>
        <TasksProvider overrideOrgId={orgId}>
          <CRMProvider overrideOrgId={orgId}>
            <ClientPortalContent />
          </CRMProvider>
        </TasksProvider>
      </TeamProvider>
    </AuthProvider>
  );
}
