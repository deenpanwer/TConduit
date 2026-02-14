"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { auth, db } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import { doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  LogOut, User, Building2, Ticket, 
  Check, Copy, Moon, Sun, Menu, X, ArrowLeft
} from "lucide-react";
import { useTheme } from "next-themes";
import { useToast } from "@/hooks/use-toast";
import { 
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, 
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, 
  AlertDialogTrigger 
} from "@/components/ui/alert-dialog";


export default function SettingsPage() {
  const { user, userData } = useAuth();
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();
  const router = useRouter();
  const [orgData, setOrgData] = useState<any>(null);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showDeleteOrgModal, setShowDeleteOrgModal] = useState(false);
  const [loading, setLoading] = useState(false); // Add loading state

  useEffect(() => {
    async function fetchOrg() {
      if (userData?.ownedOrgId || userData?.orgId) {
        const targetOrgId = userData?.ownedOrgId || userData?.orgId;
        const orgDoc = await getDoc(doc(db, "organizations", targetOrgId));
        if (orgDoc.exists()) setOrgData(orgDoc.data());
      }
    }
    fetchOrg();
  }, [userData]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      // Clear session cookie explicitly
      await fetch("/api/auth/session", { method: "DELETE" });
      router.push("/dashboard/login");
      toast({ title: "Signed out", description: "You have been successfully logged out." });
    } catch (error: any) {
      toast({ title: "Logout failed", description: error.message, variant: "destructive" });
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast({ title: "Copied!", description: "Invite code copied to clipboard." });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDeleteOrganization = async () => {
    if (!user || !userData?.ownedOrgId) {
      toast({ title: "Error", description: "No organization to delete.", variant: "destructive" });
      return;
    }

    setLoading(true); // Assuming a loading state exists or needs to be added
    try {
      const orgRef = doc(db, "organizations", userData.ownedOrgId);
      const userRef = doc(db, "users", user.uid);

      // Soft delete the organization
      await updateDoc(orgRef, {
        deleted: true,
        deletedAt: serverTimestamp(),
      });

      // Update the owner's user document
      await updateDoc(userRef, {
        ownedOrgId: null,
        orgId: null, // Also clear if they were referenced as an employee somewhere
        onboardingCompleted: false, // Force re-onboarding for a new org
        orgDeleted: true, // Custom flag to indicate old org was deleted
      });

      // Clear the session and redirect
      await signOut(auth);
      await fetch("/api/auth/session", { method: "DELETE" });
      
      toast({ title: "Organization Deleted", description: "Your organization has been archived. You have been logged out.", variant: "default" });
      router.push("/dashboard/signup"); // Redirect to signup to create a new org
    } catch (error: any) {
      toast({ title: "Deletion Failed", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false); // Assuming a loading state exists
    }
  };


  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <DashboardSidebar
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
        isMobileSidebarOpen={isMobileOpen}
        setIsMobileSidebarOpen={setIsMobileOpen}
        employees={[]} 
      />

      <main className="flex-1 flex flex-col overflow-hidden relative">
        <header className="h-16 border-b bg-card/50 backdrop-blur-md flex items-center justify-between px-8 sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setIsMobileOpen(true)}>
              <Menu />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => router.back()}>
              <ArrowLeft size={20} />
            </Button>
            <h2 className="font-black uppercase tracking-widest text-sm">Account Settings</h2>
          </div>
          
          <div className="flex items-center gap-4">
            <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            >
                {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
            </Button>
            <Button variant="destructive" size="sm" onClick={handleLogout} className="rounded-xl font-black uppercase tracking-widest text-[10px]">
                <LogOut size={14} className="mr-2" />
                Logout
            </Button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          <div className="max-w-3xl mx-auto space-y-8">
            
            {/* Profile Section */}
            <section className="bg-card border border-border rounded-3xl p-8 shadow-sm">
                <div className="flex items-center gap-4 mb-8">
                    <div className="size-16 rounded-2xl overflow-hidden border border-border bg-secondary shadow-inner">
                        <img 
                            src={userData?.photoUrl || `https://api.dicebear.com/9.x/bottts-neutral/svg?seed=${user?.email || 'admin'}`}
                            alt="User Avatar"
                            className="w-full h-full object-cover"
                        />
                    </div>
                    <div>
                        <h3 className="text-lg font-black uppercase tracking-tighter">{userData?.name || "Your Profile"}</h3>
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-tight">Personal account details</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest ml-1">Email Address</Label>
                        <Input value={user?.email || ""} disabled className="bg-secondary/50 h-12 rounded-xl font-bold" />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest ml-1">Account Role</Label>
                        <Input value={userData?.role || "Organization Owner"} disabled className="bg-secondary/50 h-12 rounded-xl font-bold" />
                    </div>
                </div>
            </section>

            {/* Organization Section */}
            <section className="bg-card border border-border rounded-3xl p-8 shadow-sm">
                <div className="flex items-center gap-4 mb-8">
                    <div className="size-12 bg-purple-500/10 rounded-2xl flex items-center justify-center text-purple-500">
                        <Building2 size={24} />
                    </div>
                    <div>
                        <h3 className="text-lg font-black uppercase tracking-tighter">Organization</h3>
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-tight">Company & Team management</p>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest ml-1">Organization Name</Label>
                        <Input value={userData?.orgName || ""} readOnly className="h-12 rounded-xl font-bold" />
                    </div>

                    <div className="p-6 rounded-2xl bg-secondary/30 border-2 border-dashed border-border">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="size-10 bg-background rounded-xl flex items-center justify-center border shadow-sm">
                                    <Ticket size={20} className="text-primary" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Team Invite Code</p>
                                    <p className="text-xl font-black tracking-[0.2em]">{orgData?.inviteCode || "------"}</p>
                                </div>
                            </div>
                            <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => copyToClipboard(orgData?.inviteCode || "")}
                                className="rounded-xl font-black uppercase tracking-widest text-[10px]"
                            >
                                {copied ? <Check size={14} className="mr-2" /> : <Copy size={14} className="mr-2" />}
                                {copied ? "Copied" : "Copy Code"}
                            </Button>
                        </div>
                        <p className="mt-4 text-[10px] font-bold text-muted-foreground uppercase leading-relaxed">
                            Share this code with your employees. They can enter it in the Electron app to link their profile to your organization.
                        </p>
                    </div>
                </div>
            </section>

            {/* Danger Zone */}
            <section className="p-8 border-2 border-destructive/10 rounded-3xl bg-destructive/5">
                 <h3 className="text-sm font-black uppercase tracking-widest text-destructive mb-2">Danger Zone</h3>
                 <p className="text-xs font-medium text-muted-foreground mb-6">Permanently delete your organization and all associated employee data.</p>
                 <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button variant="destructive" className="rounded-xl font-black uppercase tracking-widest text-[10px]">
                            Delete Organization
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                                This action will archive your organization's data, but you will no longer have access to it. You will be logged out and will need to create a new organization to continue using the app.
                                This action cannot be undone.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={handleDeleteOrganization}>Continue</AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                 </AlertDialog>
            </section>

          </div>
        </div>
      </main>

      {/* Mobile Sidebar Overlay */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden" 
          onClick={() => setIsMobileOpen(false)}
        >
          <div className="absolute right-4 top-4">
            <Button variant="ghost" size="icon" className="text-white">
              <X />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}