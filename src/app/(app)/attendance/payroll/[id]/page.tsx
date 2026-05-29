"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { 
  Briefcase, 
  PhoneCall, 
  NotebookPen, 
  Loader2, 
  ArrowLeft,
  Mail,
  Phone,
  Banknote,
  Shield,
  Clock,
  Settings,
  ShieldAlert,
  BadgeCheck,
  Zap,
  MoreHorizontal,
  Plus,
  FileText,
  User,
  ChevronRight,
  Download
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { db } from "@/lib/firebase";
import { doc, getDoc, updateDoc, collection, query, where, getDocs, orderBy, limit } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { format, parseISO } from "date-fns";
import { cn, getUserAvatar } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { InlineEditField } from "@/components/crm/shared/InlineEditField";
import { UploadResumeModal } from "@/components/ems/employee/UploadResumeModal";
import { storage } from "@/lib/firebase";

export default function EmployeeProfilePage() {
  const { id: employeeId } = useParams() as { id: string };
  const { userData } = useAuth();
  const router = useRouter();
  
  const [employee, setEmployee] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [payslips, setPayslips] = useState<any[]>([]);
  const [shifts, setShifts] = useState<any[]>([]);
  
  const [editedFields, setEditedFields] = useState<Record<string, any>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadResumeOpen, setIsUploadResumeOpen] = useState(false);
  
  // Document upload state
  const [isUploadingDoc, setIsUploadingDoc] = useState(false);

  useEffect(() => {
    async function fetchEmployeeData() {
      if (!employeeId) return;
      try {
        const docRef = doc(db, "users", employeeId);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          setEmployee({ id: docSnap.id, ...docSnap.data() });
        } else {
          toast.error("Employee not found");
        }

        // Fetch recent payslips
        const orgId = userData?.ownedOrgId || userData?.orgId;
        if (orgId) {
          const payslipsRef = collection(db, "organizations", orgId, "payslips");
          const qPayslips = query(payslipsRef, where("userId", "==", employeeId), orderBy("issueDate", "desc"), limit(10));
          const payslipSnap = await getDocs(qPayslips);
          setPayslips(payslipSnap.docs.map(d => ({ id: d.id, ...d.data() })));

          // Fetch recent shifts
          const shiftsRef = collection(db, "users", employeeId, "workShifts");
          const qShifts = query(shiftsRef, orderBy("__name__", "desc"), limit(10));
          const shiftSnap = await getDocs(qShifts);
          setShifts(shiftSnap.docs.map(d => ({ id: d.id, ...d.data() })));
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchEmployeeData();
  }, [employeeId, userData]);

  const handleStageField = async (fieldKey: string, value: any) => {
    setEditedFields(prev => ({ ...prev, [fieldKey]: value }));
  };

  const handleSaveChanges = async () => {
    if (!employee || Object.keys(editedFields).length === 0) return;
    setIsSaving(true);
    try {
      await updateDoc(doc(db, "users", employee.id), {
        ...editedFields,
        updatedAt: new Date().toISOString()
      });
      setEmployee({ ...employee, ...editedFields });
      setEditedFields({});
      toast.success("Profile changes saved successfully");
    } catch (err) {
      console.error(err);
      toast.error("Failed to save changes");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDocumentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !employee) return;

    setIsUploadingDoc(true);
    try {
      const docRef = ref(storage, `personnel/${employee.id}/documents/${Date.now()}_${file.name}`);
      await uploadBytes(docRef, file);
      const url = await getDownloadURL(docRef);

      const newDoc = {
        name: file.name,
        url,
        type: file.type,
        uploadedAt: new Date().toISOString()
      };

      const updatedDocs = [...(employee.documents || []), newDoc];
      
      await updateDoc(doc(db, "users", employee.id), {
        documents: updatedDocs
      });
      
      setEmployee({ ...employee, documents: updatedDocs });
      toast.success("Document uploaded successfully");
    } catch (err) {
      console.error(err);
      toast.error("Failed to upload document");
    } finally {
      setIsUploadingDoc(false);
    }
  };

  const displayEmployee = { ...employee, ...editedFields };

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="animate-spin text-emerald-500" size={48} />
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="p-8 text-center space-y-4">
        <h2 className="text-2xl font-black uppercase">Employee Not Found</h2>
        <Button onClick={() => router.back()} variant="outline" className="rounded-xl font-black uppercase text-[10px]">
          <ArrowLeft className="mr-2" size={14} /> Back to Payroll
        </Button>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-background">
      <ScrollArea className="h-full">
        <div className="p-4 md:p-6 lg:p-8 space-y-8 pb-20">
          
          {/* Top Actions */}
          <div className="flex items-center justify-between">
            <Button 
                variant="ghost" 
                onClick={() => router.push('/attendance/payroll')}
                className="group text-muted-foreground hover:text-foreground transition-colors"
            >
                <ArrowLeft size={16} className="mr-2 group-hover:-translate-x-1 transition-transform" />
                <span className="text-[10px] font-black uppercase tracking-widest">Back to Payroll</span>
            </Button>
            
            <div className="flex items-center gap-3">
              <Button onClick={() => setIsUploadResumeOpen(true)} size="sm" variant="outline" className="rounded-xl font-black uppercase text-[10px] h-9 border-border/50">
                <FileText size={14} className="mr-2" /> Resume
              </Button>
              <Button onClick={() => router.push(`/attendance/payroll/builder?userId=${employee.id}`)} size="sm" className="rounded-xl font-black uppercase text-[10px] h-9 bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-500/20">
                <Banknote size={14} className="mr-2" /> Issue Invoice
              </Button>
            </div>
          </div>

          {/* Banner Area */}
          <div className="relative group">
            <div className="w-full h-48 md:h-64 lg:h-80 rounded-[3rem] overflow-hidden relative shadow-2xl border-4 border-background">
              <img
                src={`https://picsum.photos/seed/${employee.id}/1600/400`}
                alt="Cover"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
              <button className="absolute bottom-6 right-6 p-3 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 text-white opacity-0 group-hover:opacity-100 transition-all">
                <Settings size={20} />
              </button>
            </div>

            {/* Profile Bar */}
            <div className="flex flex-col md:flex-row items-center md:items-end -mt-12 md:-mt-20 px-8 relative z-10 gap-6">
              <div className="shrink-0">
                <div className="size-32 md:size-48 rounded-[3rem] border-8 border-background shadow-2xl overflow-hidden bg-card">
                  <img 
                    src={getUserAvatar({ id: employee.id, photoUrl: employee.photoUrl, email: employee.name })} 
                    className="w-full h-full object-cover" 
                    alt={employee.name}
                  />
                </div>
              </div>
              <div className="flex-1 flex flex-col md:flex-row justify-between items-center md:items-end pb-4 w-full text-center md:text-left gap-4">
                <div className="space-y-1">
                  <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tighter text-foreground drop-shadow-sm">{displayEmployee.name}</h1>
                  <div className="flex items-center gap-2 justify-center md:justify-start">
                    <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 font-black text-[10px] uppercase tracking-widest">{displayEmployee.designation}</Badge>
                    <span className="text-muted-foreground font-bold uppercase tracking-[0.2em] text-[10px] opacity-60">• {displayEmployee.department || "Unassigned"}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                   <Button variant="outline" size="icon" className="size-12 rounded-2xl border-border/50 bg-background/50 hover:bg-emerald-500/10 hover:text-emerald-500 transition-all">
                      <PhoneCall size={20} />
                   </Button>
                   <Button variant="outline" size="icon" className="size-12 rounded-2xl border-border/50 bg-background/50 hover:bg-blue-500/10 hover:text-blue-500 transition-all">
                      <Mail size={20} />
                   </Button>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 px-2">
            
            {/* Left Column: About & System */}
            <div className="lg:col-span-4 space-y-6">
              <Card className="border-border/50 shadow-sm rounded-[2.5rem] bg-card/30 backdrop-blur-sm">
                <CardHeader className="p-8 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-blue-500/10 text-blue-500">
                      <User size={18} />
                    </div>
                    <CardTitle className="text-lg font-black uppercase tracking-tight">Professional Identity</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="p-8 pt-4 space-y-6">
                  <InlineEditField 
                    label="Full Name" 
                    value={displayEmployee.name} 
                    onSave={(val) => handleStageField("name", val)} 
                  />
                  <InlineEditField 
                    label="Work Email" 
                    value={displayEmployee.email} 
                    onSave={(val) => handleStageField("email", val)} 
                  />
                  <InlineEditField 
                    label="Designation" 
                    value={displayEmployee.designation} 
                    onSave={(val) => handleStageField("designation", val)} 
                  />
                  <InlineEditField 
                    label="Department" 
                    value={displayEmployee.department} 
                    onSave={(val) => handleStageField("department", val)} 
                  />
                  <InlineEditField 
                    label="WhatsApp Number" 
                    value={displayEmployee.whatsappNumber} 
                    onSave={(val) => handleStageField("whatsappNumber", val)} 
                  />
                  <InlineEditField 
                    label="Monthly Base Salary" 
                    type="currency"
                    value={displayEmployee.baseSalary} 
                    onSave={(val) => handleStageField("baseSalary", Number(val))} 
                  />
                </CardContent>
              </Card>

              {/* System Control Commented Out
              <Card className="border-border/50 shadow-sm rounded-[2.5rem] bg-card/30 backdrop-blur-sm border-t-4 border-t-rose-500/50">
                ...
              </Card>
              */}
              
              {displayEmployee.resumeContext && (
                <Card className="border-border/50 shadow-sm rounded-[2.5rem] bg-card/30 backdrop-blur-sm">
                  <CardHeader className="p-8 pb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-purple-500/10 text-purple-500">
                        <BadgeCheck size={18} />
                      </div>
                      <CardTitle className="text-lg font-black uppercase tracking-tight text-purple-600">AI Context</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="p-8 pt-4 space-y-4">
                    <p className="text-sm font-bold text-muted-foreground italic">
                      "{displayEmployee.resumeContext.brief}"
                    </p>
                    {displayEmployee.resumeContext.skills && displayEmployee.resumeContext.skills.length > 0 && (
                      <div className="flex flex-wrap gap-2 pt-2">
                        {displayEmployee.resumeContext.skills.map((skill: string, i: number) => (
                          <Badge key={i} variant="outline" className="text-[10px] uppercase font-black bg-background">{skill}</Badge>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Right Column: Activity & History */}
            <div className="lg:col-span-8">
              <Tabs defaultValue="activity" className="w-full">
                <TabsList className="bg-secondary/20 p-1.5 rounded-2xl border border-border/50 h-14">
                  <TabsTrigger value="activity" className="rounded-xl font-black uppercase tracking-widest text-[10px] gap-2 px-8 h-11 data-[state=active]:bg-background data-[state=active]:shadow-lg">
                    <Clock size={14} /> Activity Feed
                  </TabsTrigger>
                  <TabsTrigger value="payslips" className="rounded-xl font-black uppercase tracking-widest text-[10px] gap-2 px-8 h-11 data-[state=active]:bg-background data-[state=active]:shadow-lg">
                    <Banknote size={14} /> Payslip History
                  </TabsTrigger>
                  <TabsTrigger value="documents" className="rounded-xl font-black uppercase tracking-widest text-[10px] gap-2 px-8 h-11 data-[state=active]:bg-background data-[state=active]:shadow-lg">
                    <FileText size={14} /> Documents
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="activity" className="mt-6 space-y-4">
                  <div className="grid grid-cols-1 gap-4">
                    {shifts.map((shift) => (
                      <div key={shift.id} className="p-6 rounded-[2rem] border border-border/40 bg-card/30 backdrop-blur-sm flex items-center justify-between group hover:border-emerald-500/30 transition-all">
                        <div className="flex items-center gap-6">
                           <div className="size-12 rounded-2xl bg-secondary/50 flex items-center justify-center border border-border/50">
                              <Zap className="size-5 text-amber-500" />
                           </div>
                           <div className="space-y-1">
                              <p className="text-sm font-black uppercase tracking-tight">Work Session • {format(parseISO(shift.id.substring(0,10)), "MMM dd, yyyy")}</p>
                              <div className="flex items-center gap-3">
                                 <Badge variant="outline" className="text-[9px] font-black uppercase border-emerald-500/20 text-emerald-600 bg-emerald-500/5">
                                    {((shift.liveMetrics?.activeSeconds || 0) / 3600).toFixed(1)}h Active
                                 </Badge>
                                 <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest opacity-60">
                                   Total: {((shift.liveMetrics?.totalSeconds || shift.metrics?.totalSeconds || 0) / 3600).toFixed(1)}h
                                 </span>
                              </div>
                           </div>
                        </div>
                        <Button variant="ghost" size="icon" className="rounded-xl opacity-0 group-hover:opacity-100 transition-opacity">
                           <ChevronRight size={18} />
                        </Button>
                      </div>
                    ))}
                    {shifts.length === 0 && (
                      <div className="h-64 flex flex-col items-center justify-center opacity-30 border-2 border-dashed border-border/50 rounded-[3rem]">
                        <Clock size={48} />
                        <p className="text-xs font-black uppercase tracking-[0.2em] mt-4">No recent activity found</p>
                      </div>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="payslips" className="mt-6 space-y-4">
                  <div className="grid grid-cols-1 gap-4">
                    {payslips.map((ps) => (
                      <div key={ps.id} className="p-6 rounded-[2rem] border border-border/40 bg-card/30 backdrop-blur-sm flex items-center justify-between group hover:border-blue-500/30 transition-all">
                        <div className="flex items-center gap-6">
                           <div className="size-12 rounded-2xl bg-secondary/50 flex items-center justify-center border border-border/50 text-emerald-600">
                              <BadgeCheck className="size-6" />
                           </div>
                           <div className="space-y-1">
                              <p className="text-sm font-black uppercase tracking-tight">Payslip for {ps.month}</p>
                              <div className="flex items-center gap-3 text-[10px] font-bold text-muted-foreground uppercase tracking-widest opacity-60">
                                 <span>Net: {ps.netPay?.toLocaleString()}</span>
                                 <span>•</span>
                                 <span>Issued: {format(parseISO(ps.issueDate), "MMM dd")}</span>
                              </div>
                           </div>
                        </div>
                        <Button variant="ghost" size="sm" className="rounded-xl font-black uppercase text-[9px] tracking-widest opacity-0 group-hover:opacity-100 transition-opacity gap-2">
                           <Download size={14} /> Download
                        </Button>
                      </div>
                    ))}
                    {payslips.length === 0 && (
                      <div className="h-64 flex flex-col items-center justify-center opacity-30 border-2 border-dashed border-border/50 rounded-[3rem]">
                        <Banknote size={48} />
                        <p className="text-xs font-black uppercase tracking-[0.2em] mt-4">No payment history found</p>
                      </div>
                    )}
                  </div>
                </TabsContent>
                <TabsContent value="documents" className="mt-6 space-y-4">
                  <div className="flex justify-end mb-4">
                    <Button onClick={() => document.getElementById('doc-upload')?.click()} disabled={isUploadingDoc} className="rounded-xl font-black uppercase text-[10px] h-10 bg-emerald-600 hover:bg-emerald-700">
                      {isUploadingDoc ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Plus className="mr-2 size-4" />}
                      Upload File
                    </Button>
                    <input type="file" id="doc-upload" className="hidden" onChange={handleDocumentUpload} />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {displayEmployee.documents && displayEmployee.documents.length > 0 ? (
                      displayEmployee.documents.map((docItem: any, i: number) => (
                        <div key={i} className="p-6 rounded-[2rem] border border-border/40 bg-card/30 backdrop-blur-sm flex flex-col justify-between group hover:border-emerald-500/30 transition-all">
                          <div className="flex items-start gap-4 mb-4">
                             <div className="size-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 text-emerald-600 shrink-0">
                                <FileText className="size-5" />
                             </div>
                             <div className="space-y-1 overflow-hidden">
                                <p className="text-sm font-black uppercase tracking-tight truncate">{docItem.name}</p>
                                <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">
                                  {format(parseISO(docItem.uploadedAt), "MMM dd, yyyy")}
                                </p>
                             </div>
                          </div>
                          <div className="flex gap-2 w-full mt-auto">
                            <Button variant="outline" size="sm" className="flex-1 rounded-xl font-black uppercase text-[9px] border-border/50" asChild>
                              <a href={docItem.url} target="_blank" rel="noopener noreferrer">View</a>
                            </Button>
                            <Button variant="outline" size="sm" className="flex-1 rounded-xl font-black uppercase text-[9px] border-border/50" asChild>
                              <a href={docItem.url} download>Download</a>
                            </Button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="col-span-1 md:col-span-2 h-64 flex flex-col items-center justify-center opacity-30 border-2 border-dashed border-border/50 rounded-[3rem]">
                        <FileText size={48} />
                        <p className="text-xs font-black uppercase tracking-[0.2em] mt-4">No documents uploaded yet</p>
                      </div>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      </ScrollArea>

      {/* Floating Save Button */}
      {Object.keys(editedFields).length > 0 && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-10 fade-in duration-300">
          <div className="bg-background/80 backdrop-blur-xl border border-emerald-500/30 shadow-2xl shadow-emerald-500/20 rounded-[2rem] p-4 flex items-center gap-6">
            <div className="space-y-0.5">
              <p className="text-sm font-black uppercase tracking-tight text-emerald-500">Unsaved Changes</p>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{Object.keys(editedFields).length} fields modified</p>
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => setEditedFields({})} className="rounded-xl font-black uppercase text-[10px] tracking-widest">
                Discard
              </Button>
              <Button onClick={handleSaveChanges} disabled={isSaving} className="rounded-xl font-black uppercase text-[10px] tracking-widest bg-emerald-600 hover:bg-emerald-700">
                {isSaving ? <Loader2 className="mr-2 size-4 animate-spin" /> : <BadgeCheck className="mr-2 size-4" />}
                Save Changes
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      <UploadResumeModal 
        isOpen={isUploadResumeOpen}
        onClose={() => setIsUploadResumeOpen(false)}
        employeeId={employee.id}
        employeeName={employee.name || employee.displayName || ""}
        existingContext={employee.resumeContext}
        onSuccess={(ctx) => setEmployee({ ...employee, resumeContext: ctx })}
      />
    </div>
  );
}
