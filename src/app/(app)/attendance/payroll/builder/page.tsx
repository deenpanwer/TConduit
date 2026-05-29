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
import { format, endOfMonth, parseISO } from "date-fns";
import { toast } from "sonner";
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface PayslipItem {
  id: string;
  label: string;
  amount: number;
  ytdAmount: number;
}

const CURRENCY_SYMBOLS: Record<string, string> = {
  PKR: "₨",
  INR: "₹",
  USD: "$",
  EUR: "€",
  GBP: "£",
  AED: "د.إ",
  SAR: "SR"
};

function convertNumberToWords(num: number, currencyCode: string): string {
  const currencyWords: Record<string, { singular: string, plural: string, decimalsSingular: string, decimalsPlural: string }> = {
    PKR: { singular: "Pakistani Rupee", plural: "Pakistani Rupees", decimalsSingular: "Paisa", decimalsPlural: "Paise" },
    INR: { singular: "Indian Rupee", plural: "Indian Rupees", decimalsSingular: "Paisa", decimalsPlural: "Paise" },
    USD: { singular: "US Dollar", plural: "US Dollars", decimalsSingular: "Cent", decimalsPlural: "Cents" },
    EUR: { singular: "Euro", plural: "Euros", decimalsSingular: "Cent", decimalsPlural: "Cents" },
    GBP: { singular: "British Pound", plural: "British Pounds", decimalsSingular: "Penny", decimalsPlural: "Pence" },
    AED: { singular: "UAE Dirham", plural: "UAE Dirhams", decimalsSingular: "Fils", decimalsPlural: "Fils" },
    SAR: { singular: "Saudi Riyal", plural: "Saudi Riyals", decimalsSingular: "Halala", decimalsPlural: "Halalas" },
  };

  const currencyInfo = currencyWords[currencyCode.toUpperCase()] || {
    singular: currencyCode,
    plural: currencyCode + "s",
    decimalsSingular: "Cent",
    decimalsPlural: "Cents"
  };

  if (num === 0) return `Zero ${currencyInfo.plural} Only`;

  const ones = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
  const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
  const scales = ["", "Thousand", "Million", "Billion", "Trillion"];

  function convertLessThanThousand(n: number): string {
    let str = "";
    if (n >= 100) {
      str += ones[Math.floor(n / 100)] + " Hundred ";
      n %= 100;
    }
    if (n >= 20) {
      str += tens[Math.floor(n / 10)] + " ";
      n %= 10;
    }
    if (n > 0) {
      str += ones[n] + " ";
    }
    return str.trim();
  }

  let result = "";
  let scaleIndex = 0;
  let temp = Math.floor(num);

  while (temp > 0) {
    const chunk = temp % 1000;
    if (chunk > 0) {
      const chunkStr = convertLessThanThousand(chunk);
      result = chunkStr + (scales[scaleIndex] ? " " + scales[scaleIndex] : "") + " " + result;
    }
    temp = Math.floor(temp / 1000);
    scaleIndex++;
  }

  result = result.trim().replace(/\s+/g, " ");

  const cents = Math.round((num % 1) * 105); // Standard cent rounding
  let centsText = "";
  const actualCents = Math.round((num % 1) * 100);
  if (actualCents > 0) {
    const centsStr = convertLessThanThousand(actualCents);
    const decimalWord = actualCents === 1 ? currencyInfo.decimalsSingular : currencyInfo.decimalsPlural;
    centsText = " and " + centsStr + " " + decimalWord;
  }

  return `${currencyInfo.singular} ${result}${centsText} Only`;
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
  const [isPayslipCreated, setIsPayslipCreated] = useState(false);
  const [payslipStatus, setPayslipStatus] = useState<'issued' | 'paid' | null>(null);

  // New Tabular Meta States
  const [employeeId, setEmployeeId] = useState("");
  const [paidDays, setPaidDays] = useState(30);
  const [lopDays, setLopDays] = useState(0);
  const [currencyCode, setCurrencyCode] = useState("PKR");

  // Dropdown States for Pay Date
  const [payDay, setPayDay] = useState("31");
  const [payMonth, setPayMonth] = useState("05");
  const [payYear, setPayYear] = useState("2026");

  useEffect(() => {
    async function fetchDefaultCurrency() {
      const orgId = userData?.ownedOrgId || userData?.orgId;
      if (orgId) {
        try {
          const orgDoc = await getDoc(doc(db, "organizations", orgId));
          if (orgDoc.exists()) {
            const orgData = orgDoc.data();
            if (orgData?.attendanceSettings?.currency) {
              setCurrencyCode(orgData.attendanceSettings.currency);
              return;
            } else if (orgData?.settings?.currency) {
              setCurrencyCode(orgData.settings.currency);
              return;
            }
          }
        } catch (err) {
          console.error("Error loading default currency from organization settings:", err);
        }
      }
      
      // Fallback
      if (userData?.currency) {
        setCurrencyCode(userData.currency);
      }
    }
    fetchDefaultCurrency();
  }, [userData]);

  useEffect(() => {
    const end = endOfMonth(new Date());
    setPayDay(format(end, "dd"));
    setPayMonth(format(end, "MM"));
    setPayYear(format(end, "yyyy"));
  }, []);

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
          
          // Set initial default Basic earning
          const initialSalary = data.baseSalary || 0;
          setEarnings([{ id: "base", label: "Basic", amount: initialSalary, ytdAmount: initialSalary }]);
          
          // Set meta defaults
          setEmployeeId(data.employeeCode || data.employeeId || "EMP-" + userDoc.id.substring(0, 5).toUpperCase());
        }

        // Check if payslip is already created
        const orgId = userData?.ownedOrgId || userData?.orgId;
        if (orgId) {
          const payslipsRef = collection(db, "organizations", orgId, "payslips");
          const q = query(payslipsRef, where("userId", "==", userId), where("month", "==", format(new Date(), "yyyy-MM")));
          const snap = await getDocs(q);
          if (!snap.empty) {
            setIsPayslipCreated(true);
            const payslipData = snap.docs[0].data();
            setPayslipStatus(payslipData.status);
            
            // Populate fields if already created
            if (payslipData.earnings) setEarnings(payslipData.earnings);
            if (payslipData.deductions) setDeductions(payslipData.deductions);
            if (payslipData.employeeId) setEmployeeId(payslipData.employeeId);
            
            if (payslipData.payDate) {
              const rawPayDate = payslipData.payDate;
              let parsedDay = "31";
              let parsedMonth = "05";
              let parsedYear = "2026";
              if (rawPayDate.includes("/")) {
                const parts = rawPayDate.split("/");
                if (parts.length === 3) {
                  parsedDay = parts[0];
                  parsedMonth = parts[1];
                  parsedYear = parts[2];
                }
              } else if (rawPayDate.includes("-")) {
                const parts = rawPayDate.split("-");
                if (parts.length === 3) {
                  parsedYear = parts[0];
                  parsedMonth = parts[1];
                  parsedDay = parts[2];
                }
              }
              setPayDay(parsedDay);
              setPayMonth(parsedMonth);
              setPayYear(parsedYear);
            }
            
            if (payslipData.paidDays !== undefined) setPaidDays(payslipData.paidDays);
            if (payslipData.lopDays !== undefined) setLopDays(payslipData.lopDays);
            if (payslipData.currency) setCurrencyCode(payslipData.currency);
          }
        }
      } catch (err) {
        console.error(err);
        toast.error("Failed to load employee data");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [userId, router, userData]);

  // Formatter for Date of Joining (attachedAt field from database)
  const formattedDOJ = useMemo(() => {
    if (!employee?.attachedAt) return "N/A";
    try {
      if (employee.attachedAt.seconds) {
        return format(new Date(employee.attachedAt.seconds * 1000), "dd/MM/yyyy");
      }
      const parsed = new Date(employee.attachedAt);
      if (!isNaN(parsed.getTime())) {
        return format(parsed, "dd/MM/yyyy");
      }
    } catch (e) {}
    try {
      const cleanText = String(employee.attachedAt).replace(" at ", " ");
      const parsed = new Date(cleanText);
      if (!isNaN(parsed.getTime())) {
        return format(parsed, "dd/MM/yyyy");
      }
    } catch (e) {}
    
    return String(employee.attachedAt).substring(0, 10) || "N/A";
  }, [employee?.attachedAt]);

  // Formatter for Designation (role field)
  const designationDisplay = useMemo(() => {
    const raw = employee?.role || employee?.designation || "N/A";
    return raw.charAt(0).toUpperCase() + raw.slice(1);
  }, [employee]);

  const totalEarnings = useMemo(() => earnings.reduce((sum, item) => sum + Number(item.amount), 0), [earnings]);
  const totalDeductions = useMemo(() => deductions.reduce((sum, item) => sum + Number(item.amount), 0), [deductions]);
  const netPay = totalEarnings - totalDeductions;

  const currencySymbol = useMemo(() => CURRENCY_SYMBOLS[currencyCode] || currencyCode, [currencyCode]);
  
  const netPayInWords = useMemo(() => convertNumberToWords(netPay, currencyCode), [netPay, currencyCode]);

  const payPeriodLabel = useMemo(() => {
    try {
      const d = parseISO(`${month}-01`);
      return format(d, "MMMM yyyy");
    } catch (e) {
      return month;
    }
  }, [month]);

  // Synthesize Pay Date display string
  const payDateDisplay = useMemo(() => {
    return `${payDay}/${payMonth}/${payYear}`;
  }, [payDay, payMonth, payYear]);

  // Generate dynamic 2-year range for Pay Period dropdown
  const payPeriodOptions = useMemo(() => {
    const options = [];
    const currentDate = new Date();
    for (let i = -12; i <= 12; i++) {
      const d = new Date(currentDate.getFullYear(), currentDate.getMonth() + i, 1);
      options.push({
        value: format(d, "yyyy-MM"),
        label: format(d, "MMMM yyyy")
      });
    }
    return options;
  }, []);

  const addItem = (type: 'earning' | 'deduction') => {
    const newItem = { id: Math.random().toString(), label: "", amount: 0, ytdAmount: 0 };
    if (type === 'earning') setEarnings([...earnings, newItem]);
    else setDeductions([...deductions, newItem]);
  };

  const removeItem = (type: 'earning' | 'deduction', id: string) => {
    if (type === 'earning') setEarnings(earnings.filter(i => i.id !== id));
    else setDeductions(deductions.filter(i => i.id !== id));
  };

  const updateItem = (type: 'earning' | 'deduction', id: string, field: keyof PayslipItem, value: any) => {
    const update = (list: PayslipItem[]) => list.map(i => i.id === id ? { ...i, [field]: value } : i);
    if (type === 'earning') setEarnings(update(earnings));
    else setDeductions(update(deductions));
  };

  const createOrUpdatePayslip = async (targetStatus: 'issued' | 'paid') => {
    const orgId = userData?.ownedOrgId || userData?.orgId;
    if (!orgId) throw new Error("Org ID missing");
    const payslipId = `PS-${userId}-${month}`;

    const payslipData = {
      userId,
      userName: employee.name || employee.displayName,
      month,
      issueDate: format(new Date(), "yyyy-MM-dd"),
      earnings,
      deductions,
      totalEarnings,
      totalDeductions,
      netPay,
      currency: currencyCode,
      employeeId,
      dateOfJoining: formattedDOJ,
      payDate: payDateDisplay,
      paidDays,
      lopDays,
      status: targetStatus,
      issuedBy: userData?.name || userData?.displayName,
      createdAt: serverTimestamp(),
      ...(targetStatus === 'paid' ? { paymentDate: format(new Date(), "yyyy-MM-dd") } : {})
    };

    if (!isPayslipCreated) {
      await setDoc(doc(db, "organizations", orgId, "payslips", payslipId), payslipData);
      setIsPayslipCreated(true);
      setPayslipStatus(targetStatus);
    } else {
      await setDoc(doc(db, "organizations", orgId, "payslips", payslipId), {
        ...payslipData,
        updatedAt: serverTimestamp(),
        ...(targetStatus === 'paid' ? { status: 'paid', paymentDate: format(new Date(), "yyyy-MM-dd") } : {})
      }, { merge: true });
      if (targetStatus === 'paid') {
        setPayslipStatus('paid');
      }
    }
  };

  const handlePrintOrDownload = async () => {
    if (isIssuing) return;
    setIsIssuing(true);
    try {
      if (!isPayslipCreated) {
        await createOrUpdatePayslip('issued');
        toast.success("Payslip created successfully.");
      }

      if (!payslipRef.current) return;
      
      // Calculate layout scroll dimensions to prevent any clipping from viewport overflow
      const element = payslipRef.current;
      const fullWidth = element.scrollWidth;
      const fullHeight = element.scrollHeight;

      const canvas = await html2canvas(element, {
        scale: 3,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
        windowWidth: fullWidth,
        windowHeight: fullHeight,
        width: fullWidth,
        height: fullHeight,
        scrollX: 0,
        scrollY: 0
      });
      
      const imgData = canvas.toDataURL('image/png');
      
      const imgWidthMm = 210;
      const imgHeightMm = (fullHeight * imgWidthMm) / fullWidth;
      
      // Initialize jsPDF with custom height matching the scrollHeight perfectly!
      const pdf = new jsPDF({
        orientation: imgWidthMm > imgHeightMm ? 'l' : 'p',
        unit: 'mm',
        format: [imgWidthMm, imgHeightMm]
      });
      
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidthMm, imgHeightMm);
      pdf.save(`Payslip-${employee?.name || "Employee"}-${month}.pdf`);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to download payslip");
    } finally {
      setIsIssuing(false);
    }
  };

  const handleMarkAsPaid = async () => {
    if (isIssuing) return;
    setIsIssuing(true);

    try {
      await createOrUpdatePayslip('paid');
      toast.success("Employee marked as Paid for this cycle.");
    } catch (err: any) {
      console.error(err);
      toast.error("Failed to mark as paid");
    } finally {
      setIsIssuing(false);
    }
  };

  // Prepare Earnings & Deductions side-by-side rows for tabular alignment
  const tabularRows = useMemo(() => {
    const maxRows = Math.max(earnings.length, deductions.length);
    const rows = [];
    for (let i = 0; i < maxRows; i++) {
      rows.push({
        earning: earnings[i] || null,
        deduction: deductions[i] || null
      });
    }
    return rows;
  }, [earnings, deductions]);

  if (loading) return <div className="p-20 flex justify-center"><Loader2 className="animate-spin text-emerald-500" /></div>;

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Left: Controls */}
      <div className="w-[450px] border-r border-border/40 flex flex-col bg-card/30 backdrop-blur-xl shrink-0">
        <div className="p-6 border-b border-border/50 flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => router.back()} className="rounded-xl font-black uppercase text-[10px]">
            <ChevronLeft className="mr-2" size={14} /> Back
          </Button>
          <h2 className="text-sm font-black uppercase tracking-tighter italic">Payslip <span className="text-emerald-500">Maker</span></h2>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
          {/* Employee Summary Card */}
          <div className="flex items-center gap-4 p-4 rounded-3xl bg-emerald-500/5 border border-emerald-500/10">
             <div className="size-12 rounded-2xl bg-background overflow-hidden border border-border/50">
               <img src={getUserAvatar({ id: employee.id, email: employee.name })} className="w-full h-full object-cover" alt="" />
             </div>
             <div>
               <p className="text-sm font-black uppercase tracking-tight">{employee?.name}</p>
               <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{designationDisplay}</p>
             </div>
          </div>

          {/* Currency Setup */}
          <div className="space-y-3">
            <Label className="text-[11px] font-black uppercase tracking-widest flex items-center gap-2"><Banknote size={14} className="text-emerald-500" /> Currency Setup</Label>
            <select 
              value={currencyCode} 
              onChange={(e) => setCurrencyCode(e.target.value)}
              className="w-full h-10 px-3 rounded-xl bg-secondary/30 border border-border/50 text-xs font-bold focus:ring-2 focus:ring-emerald-500 outline-none"
            >
              <option value="PKR">PKR (₨) - Pakistani Rupee</option>
              <option value="INR">INR (₹) - Indian Rupee</option>
              <option value="USD">USD ($) - US Dollar</option>
              <option value="EUR">EUR (€) - Euro</option>
              <option value="GBP">GBP (£) - British Pound</option>
              <option value="AED">AED (د.إ) - UAE Dirham</option>
              <option value="SAR">SAR (SR) - Saudi Riyal</option>
            </select>
          </div>

          {/* Pay Cycle Details */}
          <div className="space-y-4">
            <Label className="text-[11px] font-black uppercase tracking-widest flex items-center gap-2"><Receipt size={14} className="text-emerald-500" /> Pay Details</Label>
            
            {/* Pay Date & Pay Period Select Dropdowns */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <span className="text-[9px] font-bold text-muted-foreground uppercase">Pay Date</span>
                <div className="grid grid-cols-3 gap-1">
                  {/* Day */}
                  <select 
                    value={payDay} 
                    onChange={(e) => setPayDay(e.target.value)}
                    className="h-10 px-2 rounded-xl bg-secondary/20 border-none text-xs font-bold focus:ring-2 focus:ring-emerald-500 outline-none w-full appearance-none cursor-pointer text-center"
                  >
                    {Array.from({ length: 31 }, (_, i) => String(i + 1).padStart(2, "0")).map(d => (
                      <option key={d} value={d} className="text-black">{d}</option>
                    ))}
                  </select>
                  {/* Month */}
                  <select 
                    value={payMonth} 
                    onChange={(e) => setPayMonth(e.target.value)}
                    className="h-10 px-1 rounded-xl bg-secondary/20 border-none text-xs font-bold focus:ring-2 focus:ring-emerald-500 outline-none w-full appearance-none cursor-pointer text-center"
                  >
                    {[
                      { val: "01", lbl: "Jan" },
                      { val: "02", lbl: "Feb" },
                      { val: "03", lbl: "Mar" },
                      { val: "04", lbl: "Apr" },
                      { val: "05", lbl: "May" },
                      { val: "06", lbl: "Jun" },
                      { val: "07", lbl: "Jul" },
                      { val: "08", lbl: "Aug" },
                      { val: "09", lbl: "Sep" },
                      { val: "10", lbl: "Oct" },
                      { val: "11", lbl: "Nov" },
                      { val: "12", lbl: "Dec" },
                    ].map(m => (
                      <option key={m.val} value={m.val} className="text-black">{m.lbl}</option>
                    ))}
                  </select>
                  {/* Year */}
                  <select 
                    value={payYear} 
                    onChange={(e) => setPayYear(e.target.value)}
                    className="h-10 px-1 rounded-xl bg-secondary/20 border-none text-xs font-bold focus:ring-2 focus:ring-emerald-500 outline-none w-full appearance-none cursor-pointer text-center"
                  >
                    {Array.from({ length: 5 }, (_, i) => String(new Date().getFullYear() - 2 + i)).map(y => (
                      <option key={y} value={y} className="text-black">{y}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="space-y-1">
                <span className="text-[9px] font-bold text-muted-foreground uppercase">Pay Period</span>
                <select 
                  value={month} 
                  onChange={(e) => setMonth(e.target.value)}
                  className="h-10 px-3 rounded-xl bg-secondary/20 border-none text-xs font-bold focus:ring-2 focus:ring-emerald-500 outline-none w-full cursor-pointer"
                >
                  {payPeriodOptions.map(opt => (
                    <option key={opt.value} value={opt.value} className="text-black">{opt.label}</option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <span className="text-[9px] font-bold text-muted-foreground uppercase">Paid Days</span>
                <Input 
                   type="number"
                   min={0}
                   value={paidDays} 
                   onChange={(e) => setPaidDays(Math.max(0, Number(e.target.value)))}
                   className="h-10 rounded-xl bg-secondary/20 border-none text-xs font-bold" 
                />
              </div>
              <div className="space-y-1">
                <span className="text-[9px] font-bold text-muted-foreground uppercase">Loss of Pay (LOP) Days</span>
                <Input 
                   type="number"
                   min={0}
                   value={lopDays} 
                   onChange={(e) => setLopDays(Math.max(0, Number(e.target.value)))}
                   className="h-10 rounded-xl bg-secondary/20 border-none text-xs font-bold" 
                />
              </div>
            </div>
          </div>

          {/* Earnings */}
          <div className="space-y-4">
             <div className="flex items-center justify-between">
               <Label className="text-[11px] font-black uppercase tracking-widest flex items-center gap-2"><Wallet size={14} className="text-emerald-500" /> Earnings</Label>
               <Button onClick={() => addItem('earning')} variant="ghost" size="sm" className="h-6 text-[9px] font-black uppercase tracking-widest">Add</Button>
             </div>
             <div className="space-y-3">
               {earnings.map(item => (
                 <div key={item.id} className="flex flex-col gap-2 p-3 rounded-2xl bg-secondary/10 border border-border/30 group">
                   <div className="flex items-center gap-2">
                     <Input 
                        placeholder="Label (e.g. Basic, HRA)" 
                        value={item.label} 
                        onChange={(e) => updateItem('earning', item.id, 'label', e.target.value)}
                        className="h-9 rounded-xl bg-secondary/20 border-none text-xs font-bold flex-1" 
                     />
                     <Input 
                        type="number"
                        min={0}
                        placeholder="Amount" 
                        value={item.amount} 
                        onChange={(e) => updateItem('earning', item.id, 'amount', Math.max(0, Number(e.target.value)))}
                        className="h-9 w-24 rounded-xl bg-secondary/20 border-none text-xs font-black text-right" 
                     />
                     {item.id !== 'base' && (
                       <button onClick={() => removeItem('earning', item.id)} className="p-1 text-rose-500 hover:bg-rose-500/10 rounded-lg"><Minus size={14} /></button>
                     )}
                   </div>
                   <div className="flex items-center gap-2">
                     <span className="text-[9px] font-bold text-muted-foreground uppercase pl-1 shrink-0">Year to Date (YTD)</span>
                     <Input 
                        type="number"
                        min={0}
                        placeholder="YTD Amount" 
                        value={item.ytdAmount} 
                        onChange={(e) => updateItem('earning', item.id, 'ytdAmount', Math.max(0, Number(e.target.value)))}
                        className="h-8 rounded-xl bg-secondary/15 border-none text-[11px] font-bold text-right" 
                     />
                   </div>
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
             <div className="space-y-3">
               {deductions.map(item => (
                 <div key={item.id} className="flex flex-col gap-2 p-3 rounded-2xl bg-secondary/10 border border-border/30 group">
                   <div className="flex items-center gap-2">
                     <Input 
                        placeholder="Label (e.g. Tax, LOP)" 
                        value={item.label} 
                        onChange={(e) => updateItem('deduction', item.id, 'label', e.target.value)}
                        className="h-9 rounded-xl bg-secondary/20 border-none text-xs font-bold flex-1" 
                     />
                     <Input 
                        type="number"
                        min={0}
                        placeholder="Amount" 
                        value={item.amount} 
                        onChange={(e) => updateItem('deduction', item.id, 'amount', Math.max(0, Number(e.target.value)))}
                        className="h-9 w-24 rounded-xl bg-secondary/20 border-none text-xs font-black text-right text-rose-500" 
                     />
                     <button onClick={() => removeItem('deduction', item.id)} className="p-1 text-rose-500 hover:bg-rose-500/10 rounded-lg"><Minus size={14} /></button>
                   </div>
                   <div className="flex items-center gap-2">
                     <span className="text-[9px] font-bold text-muted-foreground uppercase pl-1 shrink-0">Year to Date (YTD)</span>
                     <Input 
                        type="number"
                        min={0}
                        placeholder="YTD Amount" 
                        value={item.ytdAmount} 
                        onChange={(e) => updateItem('deduction', item.id, 'ytdAmount', Math.max(0, Number(e.target.value)))}
                        className="h-8 rounded-xl bg-secondary/15 border-none text-[11px] font-bold text-right text-rose-500" 
                     />
                   </div>
                 </div>
               ))}
             </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-border/50 bg-background/50 space-y-3">
           <div className="flex items-center justify-between mb-2 px-2">
             <p className="text-[10px] font-black uppercase text-muted-foreground">Net Payout ({currencyCode})</p>
             <p className="text-2xl font-black tracking-tighter text-emerald-500">{currencySymbol}{netPay.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
           </div>
           
           <div className="grid grid-cols-2 gap-3">
             <Button variant="outline" onClick={handlePrintOrDownload} disabled={isIssuing} className="h-12 rounded-2xl font-black uppercase tracking-widest border-border/50 gap-2 text-[10px]">
               {isIssuing ? <Loader2 className="animate-spin" /> : <Printer size={14} />} Print/Download
             </Button>
             <Button onClick={handleMarkAsPaid} disabled={isIssuing || payslipStatus === 'paid'} className="h-12 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase tracking-widest transition-all shadow-lg shadow-emerald-500/20 text-[10px]">
               {payslipStatus === 'paid' ? "Paid" : "Mark as Paid"}
             </Button>
           </div>
        </div>
      </div>

      {/* Right: Preview Area */}
      <div className="flex-1 bg-slate-100 dark:bg-slate-900 overflow-y-auto p-8 custom-scrollbar flex flex-col items-center justify-start">
         
         {/* Zoho style dynamic proportions box with flex shrink prevention and auto height to fit all rows perfectly */}
         <div 
           ref={payslipRef} 
           className="w-[210mm] h-auto min-h-[160mm] bg-white text-slate-900 p-10 shadow-2xl rounded-sm flex flex-col justify-between shrink-0"
         >
           <div>
             {/* 1. Header (Organization branding vs Trac AI Payroll) */}
             <div className="flex justify-between items-center border-b border-slate-200 pb-4 mb-5">
                <div className="text-left space-y-1">
                   <h1 className="text-lg font-black text-slate-800 tracking-tight uppercase leading-none">
                     {userData?.orgName || "Trac AI Corporation"}
                   </h1>
                   <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                     {userData?.companyAddress || "Official Business Registration"}
                   </p>
                </div>
                
                {/* Logo selection: Employer logo first, Trac AI default second */}
                <div className="text-right">
                  {userData?.orgLogo ? (
                    <img src={userData.orgLogo} alt="Employer Logo" className="h-10 max-w-[150px] object-contain" />
                  ) : (
                    <img src="/logo.png" alt="Trac AI Payroll Logo" className="h-9 object-contain" />
                  )}
                </div>
             </div>

             {/* 2. Month title */}
             <div className="text-center py-2.5 border-t border-b border-slate-200 mb-5 bg-slate-50/50">
               <h2 className="text-xs font-black uppercase tracking-widest text-slate-800">
                 Payslip for the month of {payPeriodLabel}
               </h2>
             </div>

             {/* 3. Employee Pay Summary */}
             <div className="w-full border border-slate-200 rounded-sm overflow-hidden mb-5">
               <div className="bg-slate-50/80 p-2 border-b border-slate-200 text-left">
                 <h3 className="text-[9px] font-black uppercase text-slate-700 tracking-widest">Employee Pay Summary</h3>
               </div>
               <div className="grid grid-cols-1 md:grid-cols-12 text-slate-700">
                 {/* Left details grid */}
                 <div className="md:col-span-7 p-3 border-r border-slate-200 space-y-1.5 text-[11px]">
                   <div className="grid grid-cols-3 gap-1">
                     <span className="font-semibold text-slate-400">Employee Name</span>
                     <span className="col-span-2 font-bold text-slate-900">: {employee?.name || "N/A"}{employeeId ? `, ${employeeId}` : ""}</span>
                   </div>
                   <div className="grid grid-cols-3 gap-1">
                     <span className="font-semibold text-slate-400">Designation</span>
                     <span className="col-span-2 font-bold text-slate-900">: {designationDisplay}</span>
                   </div>
                   <div className="grid grid-cols-3 gap-1">
                     <span className="font-semibold text-slate-400">Date of Joining</span>
                     <span className="col-span-2 font-bold text-slate-900">: {formattedDOJ}</span>
                   </div>
                   <div className="grid grid-cols-3 gap-1">
                     <span className="font-semibold text-slate-400">Pay Period</span>
                     <span className="col-span-2 font-bold text-slate-900">: {payPeriodLabel}</span>
                   </div>
                   <div className="grid grid-cols-3 gap-1">
                     <span className="font-semibold text-slate-400">Pay Date</span>
                     <span className="col-span-2 font-bold text-slate-900">: {payDateDisplay}</span>
                   </div>
                 </div>
                 
                 {/* Right Large Net Pay display */}
                 <div className="md:col-span-5 p-3 flex flex-col items-center justify-center text-center bg-slate-50/20">
                   <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Employee Net Pay</span>
                   <h2 className="text-2xl font-black text-slate-900 tracking-tight mt-1">
                     {currencySymbol}{netPay.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                   </h2>
                   <span className="text-[9px] font-bold text-slate-500 bg-slate-100/70 border border-slate-200/50 px-2.5 py-0.5 rounded-full mt-2.5">
                     Paid Days: <span className="text-slate-950 font-extrabold">{paidDays}</span> | LOP Days: <span className="text-rose-600 font-extrabold">{lopDays}</span>
                   </span>
                 </div>
               </div>
             </div>

             {/* 4. Side-by-Side Tabular Earnings & Deductions */}
             <div className="w-full border border-slate-200 rounded-sm overflow-hidden mb-5">
               <table className="w-full border-collapse">
                 <thead>
                   <tr className="bg-slate-50 text-[9px] font-black text-slate-600 uppercase tracking-wider border-b border-slate-200">
                     <th className="p-2 border-r border-slate-200 text-left">Earnings</th>
                     <th className="p-2 border-r border-slate-200 text-right w-[95px]">Amount</th>
                     <th className="p-2 border-r border-slate-200 text-right w-[95px]">YTD</th>
                     <th className="p-2 border-r border-slate-200 text-left">Deductions</th>
                     <th className="p-2 border-r border-slate-200 text-right w-[95px]">Amount</th>
                     <th className="p-2 text-right w-[95px]">YTD</th>
                   </tr>
                 </thead>
                 <tbody>
                   {tabularRows.map((row, idx) => (
                     <tr key={idx} className="border-b border-slate-200 text-[11px] text-slate-800">
                       {/* Earnings Info */}
                       <td className="p-2 border-r border-slate-200 text-left font-medium">
                         {row.earning ? row.earning.label : ""}
                       </td>
                       <td className="p-2 border-r border-slate-200 text-right font-semibold text-slate-900">
                         {row.earning ? `${currencySymbol}${row.earning.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : ""}
                       </td>
                       <td className="p-2 border-r border-slate-200 text-right text-slate-500">
                         {row.earning ? `${currencySymbol}${row.earning.ytdAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : ""}
                       </td>
                       
                       {/* Deductions Info */}
                       <td className="p-2 border-r border-slate-200 text-left font-medium">
                         {row.deduction ? row.deduction.label : ""}
                       </td>
                       <td className="p-2 border-r border-slate-200 text-right font-semibold text-slate-900">
                         {row.deduction ? `${currencySymbol}${row.deduction.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : ""}
                       </td>
                       <td className="p-2 text-right text-slate-500">
                         {row.deduction ? `${currencySymbol}${row.deduction.ytdAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : ""}
                       </td>
                     </tr>
                   ))}
                   
                   {/* Combined totals row */}
                   <tr className="bg-slate-50/50 text-[11px] font-bold text-slate-900 border-b border-slate-200">
                     <td className="p-2 border-r border-slate-200 text-left uppercase tracking-tight">Gross Earnings</td>
                     <td className="p-2 border-r border-slate-200 text-right">
                       {currencySymbol}{totalEarnings.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                     </td>
                     <td className="p-2 border-r border-slate-200"></td>
                     
                     <td className="p-2 border-r border-slate-200 text-left uppercase tracking-tight">Total Deductions</td>
                     <td className="p-2 border-r border-slate-200 text-right">
                       {currencySymbol}{totalDeductions.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                     </td>
                     <td className="p-2"></td>
                   </tr>
                 </tbody>
               </table>
             </div>

             {/* 5. Net Pay Table Grid */}
             <div className="w-full border border-slate-200 rounded-sm overflow-hidden mb-5">
               <table className="w-full border-collapse">
                 <thead>
                   <tr className="bg-slate-50 text-[9px] font-black text-slate-600 uppercase tracking-widest border-b border-slate-200">
                     <th className="p-2 text-left">Net Pay</th>
                     <th className="p-2 text-right w-[150px]">Amount</th>
                   </tr>
                 </thead>
                 <tbody>
                   <tr className="border-b border-slate-100 text-[11px] text-slate-700">
                     <td className="p-2 text-left font-medium">Gross Earnings</td>
                     <td className="p-2 text-right font-semibold text-slate-900">
                       {currencySymbol}{totalEarnings.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                     </td>
                   </tr>
                   <tr className="border-b border-slate-200 text-[11px] text-slate-700">
                     <td className="p-2 text-left font-medium">Total Deductions</td>
                     <td className="p-2 text-right font-semibold text-slate-950">
                       (-) {currencySymbol}{totalDeductions.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                     </td>
                   </tr>
                   <tr className="bg-slate-50/70 text-[11px] font-bold text-slate-900">
                     <td className="p-2.5 text-right uppercase tracking-wider text-slate-500 font-bold">Total Net Payable</td>
                     <td className="p-2.5 text-right text-slate-955 font-black text-xs">
                       {currencySymbol}{netPay.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                     </td>
                   </tr>
                 </tbody>
               </table>
             </div>

             {/* 6. Total in Words Box */}
             <div className="w-full text-center py-4 border-t border-b border-dashed border-slate-300 mb-5">
               <p className="text-[11px] font-bold text-slate-800">
                 Total Net Payable <span className="font-extrabold">{currencySymbol}{netPay.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span> ({netPayInWords})
               </p>
               <p className="text-[9px] text-slate-400 font-medium italic mt-1">
                 **Total Net Payable = Gross Earnings - Total Deductions
               </p>
             </div>
           </div>

           {/* 7. Footer section */}
           <div className="text-center mt-auto text-[9px] text-slate-400 font-medium pt-4 border-t border-slate-100 w-full shrink-0">
             -- This document has been automatically generated by Trac AI Payroll; therefore, a signature is not required. --
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