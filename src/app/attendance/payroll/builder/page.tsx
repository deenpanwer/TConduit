"use client";

import React, { useState, useEffect, useMemo, useRef, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { 
  ChevronLeft, FileText, Download, Printer, Plus, 
  Minus, Loader2, Save, User, Building, Banknote,
  Receipt, Wallet, ShieldAlert, BadgeCheck
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn, getUserAvatar } from "@/lib/utils";
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc, collection, query, where, getDocs, serverTimestamp } from "firebase/firestore";
import { format, startOfMonth, endOfMonth, parseISO } from "date-fns";
import { toast } from "sonner";
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface PayslipItem {
  id: string;
  label: string;
  amount: number;
}

function PayslipBuilderComponent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { userData } = useAuth();
  const userId = searchParams.get("userId");
  const payslipRef = useRef<HTMLDivElement>(null);

  const [loading, setLoading] = useState(true);
  const [isIssuing, setIsIssuing] = useState(false);
  const [employee, setEmployee] = useState<any>(null);
  
  const [earnings, setEarnings] = useState<PayslipItem[]>([]);
  const [deductions, setDeductions] = useState<PayslipItem[]>([]);
  const [month, setMonth] = useState(format(new Date(), "yyyy-MM"));

  useEffect(() => {
    async function fetchData() {
      if (!userId) {
        router.push("/attendance/payroll");
        return;
      }

      try {
        const userDoc = await getDoc(doc(db, "users", userId));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setEmployee({ id: userDoc.id, ...data });
          setEarnings([{ id: "base", label: "Base Salary", amount: data.baseSalary || 0 }]);
        }
      } catch (err) {
        console.error(err);
        toast.error("Failed to load employee data");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [userId, router]);

  const totalEarnings = useMemo(() => earnings.reduce((sum, item) => sum + Number(item.amount), 0), [earnings]);
  const totalDeductions = useMemo(() => deductions.reduce((sum, item) => sum + Number(item.amount), 0), [deductions]);
  const netPay = totalEarnings - totalDeductions;

  const addItem = (type: 'earning' | 'deduction') => {
    const newItem = { id: Math.random().toString(), label: "", amount: 0 };
    if (type === 'earning') setEarnings([...earnings, newItem]);
    else setDeductions([...deductions, newItem]);
  };

  const removeItem = (type: 'earning' | 'deduction', id: string) => {
    if (type === 'earning') setEarnings(earnings.filter(i => i.id !== id));
    else setDeductions(deductions.filter(i => i.id !== id));
  };

  const updateItem = (type: 'earning' | 'deduction', id: string, field: 'label' | 'amount', value: any) => {
    const update = (list: PayslipItem[]) => list.map(i => i.id === id ? { ...i, [field]: value } : i);
    if (type === 'earning') setEarnings(update(earnings));
    else setDeductions(update(deductions));
  };

  const handleIssue = async () => {
    if (isIssuing) return;
    setIsIssuing(true);
    
    try {
      const orgId = userData?.ownedOrgId || userData?.orgId;
      if (!orgId) throw new Error("Org ID missing");

      // 1. Check if already issued
      const payslipsRef = collection(db, "organizations", orgId, "payslips");
      const q = query(payslipsRef, where("userId", "==", userId), where("month", "==", month));
      const snap = await getDocs(q);
      
      if (!snap.empty) {
        toast.error("A payslip for this employee has already been issued for this month.");
        setIsIssuing(false);
        return;
      }

      // 2. Log to Firestore (Status: issued)
      const payslipId = `PS-${userId}-${month}`;
      await setDoc(doc(db, "organizations", orgId, "payslips", payslipId), {
        userId,
        userName: employee.name || employee.displayName,
        month,
        issueDate: format(new Date(), "yyyy-MM-dd"),
        earnings,
        deductions,
        totalEarnings,
        totalDeductions,
        netPay,
        status: 'issued',
        issuedBy: userData?.name || userData?.displayName,
        createdAt: serverTimestamp()
      });

      toast.success("Payslip issued successfully.");
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to issue payslip");
    } finally {
      setIsIssuing(false);
    }
  };

  const handleMarkAsPaid = async () => {
    if (isIssuing) return;
    setIsIssuing(true);

    try {
      const orgId = userData?.ownedOrgId || userData?.orgId;
      if (!orgId) throw new Error("Org ID missing");
      const payslipId = `PS-${userId}-${month}`;
      
      // Update status to paid and log payment date
      await setDoc(doc(db, "organizations", orgId, "payslips", payslipId), {
        status: 'paid',
        paymentDate: format(new Date(), "yyyy-MM-dd"),
        updatedAt: serverTimestamp()
      }, { merge: true });

      toast.success("Employee marked as Paid for this cycle.");
      router.push("/attendance/payroll");
    } catch (err: any) {
      console.error(err);
      toast.error("Failed to mark as paid");
    } finally {
      setIsIssuing(false);
    }
  };

  const handleDownload = async () => {
    if (!payslipRef.current) return;
    const canvas = await html2canvas(payslipRef.current, { scale: 2 });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const imgWidth = 210;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
    pdf.save(`Payslip-${employee.name}-${month}.pdf`);
  };

  if (loading) return <div className="p-20 flex justify-center"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Left: Controls */}
      <div className="w-[450px] border-r border-border/40 flex flex-col bg-card/30 backdrop-blur-xl">
        <div className="p-8 border-b border-border/50 flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => router.back()} className="rounded-xl font-black uppercase text-[10px]">
            <ChevronLeft className="mr-2" size={14} /> Back
          </Button>
          <h2 className="text-sm font-black uppercase tracking-tighter italic">Payslip <span className="text-emerald-500">Engine</span></h2>
        </div>

        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar space-y-10">
          {/* Employee Summary */}
          <div className="flex items-center gap-4 p-4 rounded-3xl bg-emerald-500/5 border border-emerald-500/10">
             <div className="size-12 rounded-2xl bg-background overflow-hidden border border-border/50">
               <img src={getUserAvatar({ id: employee.id, email: employee.name })} className="w-full h-full object-cover" alt="" />
             </div>
             <div>
               <p className="text-sm font-black uppercase tracking-tight">{employee.name}</p>
               <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{employee.designation}</p>
             </div>
          </div>

          {/* Earnings */}
          <div className="space-y-4">
             <div className="flex items-center justify-between">
               <Label className="text-[11px] font-black uppercase tracking-widest flex items-center gap-2"><Wallet size={14} className="text-emerald-500" /> Earnings</Label>
               <Button onClick={() => addItem('earning')} variant="ghost" size="sm" className="h-6 text-[9px] font-black uppercase tracking-widest">Add</Button>
             </div>
             <div className="space-y-2">
               {earnings.map(item => (
                 <div key={item.id} className="flex items-center gap-2 group">
                   <Input 
                      placeholder="Label" 
                      value={item.label} 
                      onChange={(e) => updateItem('earning', item.id, 'label', e.target.value)}
                      className="h-10 rounded-xl bg-secondary/20 border-none text-xs font-bold" 
                   />
                   <Input 
                      type="number"
                      placeholder="Amount" 
                      value={item.amount} 
                      onChange={(e) => updateItem('earning', item.id, 'amount', Number(e.target.value))}
                      className="h-10 w-28 rounded-xl bg-secondary/20 border-none text-xs font-black text-right" 
                   />
                   {item.id !== 'base' && (
                     <button onClick={() => removeItem('earning', item.id)} className="opacity-0 group-hover:opacity-100 p-2 text-rose-500"><Minus size={14} /></button>
                   )}
                 </div>
               ))}
             </div>
          </div>

          {/* Deductions */}
          <div className="space-y-4">
             <div className="flex items-center justify-between">
               <Label className="text-[11px] font-black uppercase tracking-widest flex items-center gap-2"><ShieldAlert size={14} className="text-rose-500" /> Deductions</Label>
               <Button onClick={() => addItem('deduction')} variant="ghost" size="sm" className="h-6 text-[9px] font-black uppercase tracking-widest">Add</Button>
             </div>
             <div className="space-y-2">
               {deductions.map(item => (
                 <div key={item.id} className="flex items-center gap-2 group">
                   <Input 
                      placeholder="Tax, Late Fee..." 
                      value={item.label} 
                      onChange={(e) => updateItem('deduction', item.id, 'label', e.target.value)}
                      className="h-10 rounded-xl bg-secondary/20 border-none text-xs font-bold" 
                   />
                   <Input 
                      type="number"
                      placeholder="Amount" 
                      value={item.amount} 
                      onChange={(e) => updateItem('deduction', item.id, 'amount', Number(e.target.value))}
                      className="h-10 w-28 rounded-xl bg-secondary/20 border-none text-xs font-black text-right text-rose-500" 
                   />
                   <button onClick={() => removeItem('deduction', item.id)} className="opacity-0 group-hover:opacity-100 p-2 text-rose-500"><Minus size={14} /></button>
                 </div>
               ))}
             </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-8 border-t border-border/50 bg-background/50 space-y-3">
           <div className="flex items-center justify-between mb-4 px-2">
             <p className="text-[10px] font-black uppercase text-muted-foreground">Net Payout</p>
             <p className="text-2xl font-black tracking-tighter text-emerald-500">{netPay.toLocaleString()}</p>
           </div>
           
           <div className="grid grid-cols-2 gap-3">
             <Button variant="outline" onClick={handleIssue} disabled={isIssuing} className="h-14 rounded-2xl font-black uppercase tracking-widest border-border/50">
               {isIssuing ? <Loader2 className="animate-spin" /> : "Issue Payslip"}
             </Button>
             <Button onClick={handleMarkAsPaid} disabled={isIssuing} className="h-14 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase tracking-widest transition-all shadow-lg shadow-emerald-500/20">
               Mark as Paid
             </Button>
           </div>

           <Button variant="ghost" onClick={handleDownload} className="w-full h-12 rounded-xl font-black uppercase tracking-widest text-[10px] gap-2">
              <Download size={14} /> Download PDF
           </Button>
        </div>
      </div>

      {/* Right: Preview (A4) */}
      <div className="flex-1 bg-slate-100 dark:bg-slate-900 overflow-y-auto p-12 custom-scrollbar flex flex-col items-center">
         <div ref={payslipRef} className="w-[210mm] min-h-[297mm] bg-white text-slate-900 p-[20mm] shadow-2xl rounded-sm flex flex-col">
            <div className="flex justify-between items-start border-b-2 border-slate-900 pb-10 mb-10">
               <div className="space-y-4">
                  <h1 className="text-4xl font-black tracking-tighter uppercase leading-none">PAYSLIP</h1>
                  <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase text-slate-400">Statement For Period</p>
                    <p className="text-sm font-bold">{month}</p>
                  </div>
               </div>
               <div className="text-right space-y-2">
                  <p className="text-xl font-black uppercase italic tracking-tighter">{userData?.orgName || "Organization"}</p>
                  <p className="text-[10px] font-medium text-slate-500 leading-tight max-w-[250px] ml-auto">{userData?.companyAddress || "Official Business Registration"}</p>
               </div>
            </div>

            <div className="grid grid-cols-2 gap-10 mb-16 bg-slate-50 p-8 rounded-2xl border border-slate-100">
               <div className="space-y-1">
                  <p className="text-[9px] font-black uppercase text-emerald-600 tracking-widest">Employee Information</p>
                  <p className="text-lg font-black uppercase">{employee.name}</p>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">{employee.designation}</p>
                  <p className="text-[10px] font-bold text-slate-400 mt-2">{employee.email}</p>
               </div>
               <div className="text-right space-y-1">
                  <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Payment Details</p>
                  <p className="text-sm font-bold">Method: Bank Transfer</p>
                  <p className="text-[10px] font-medium text-slate-500">Date Issued: {format(new Date(), "MMM dd, yyyy")}</p>
               </div>
            </div>

            <div className="flex-1 grid grid-cols-2 gap-20">
               {/* Earnings Column */}
               <div className="space-y-6">
                  <p className="text-[10px] font-black uppercase tracking-widest border-b border-slate-200 pb-2">Earnings Breakdown</p>
                  <div className="space-y-4">
                     {earnings.map(item => (
                       <div key={item.id} className="flex justify-between items-center">
                          <span className="text-[11px] font-bold uppercase text-slate-500">{item.label || "Allowance"}</span>
                          <span className="text-sm font-black">{item.amount.toLocaleString()}</span>
                       </div>
                     ))}
                  </div>
               </div>
               
               {/* Deductions Column */}
               <div className="space-y-6">
                  <p className="text-[10px] font-black uppercase tracking-widest border-b border-slate-200 pb-2">Deductions</p>
                  <div className="space-y-4">
                     {deductions.map(item => (
                       <div key={item.id} className="flex justify-between items-center">
                          <span className="text-[11px] font-bold uppercase text-slate-500">{item.label || "Adjustment"}</span>
                          <span className="text-sm font-black text-rose-600">({item.amount.toLocaleString()})</span>
                       </div>
                     ))}
                  </div>
               </div>
            </div>

            <div className="mt-auto pt-10 border-t-2 border-slate-900 flex justify-between items-end">
               <div className="space-y-4">
                  <div className="space-y-1">
                     <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Authorized Signature</p>
                     <div className="h-10 w-48 border-b border-slate-200" />
                  </div>
                  <p className="text-[8px] font-bold text-slate-400 max-w-sm">This is a system-generated document and does not require a physical stamp unless specified by the regional payroll compliance department.</p>
               </div>
               <div className="text-right">
                  <div className="bg-slate-900 text-white p-6 rounded-2xl min-w-[200px]">
                     <p className="text-[9px] font-black uppercase tracking-widest opacity-50 mb-1">Net Pay</p>
                     <p className="text-3xl font-black tabular-nums">{netPay.toLocaleString()}</p>
                  </div>
               </div>
            </div>
         </div>
      </div>
    </div>
  );
}

export default function PayslipBuilder() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <PayslipBuilderComponent />
        </Suspense>
    );
}