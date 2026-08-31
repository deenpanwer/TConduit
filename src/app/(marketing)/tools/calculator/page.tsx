"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { Navbar } from "@/components/home/Navbar";
import { Footer } from "@/components/home/Footer";
import { ChevronDown, ArrowLeft, Calendar, Info } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";

const currencies = [
    { code: "USD", symbol: "$" },
    { code: "EUR", symbol: "€" },
    { code: "GBP", symbol: "£" },
    { code: "AUD", symbol: "A$" },
    { code: "CAD", symbol: "C$" },
    { code: "JPY", symbol: "¥" },
    { code: "INR", symbol: "₹" },
    { code: "CHF", symbol: "CHF" },
    { code: "CNY", symbol: "¥" },
    { code: "SGD", symbol: "S$" },
];

export default function CalculatorPage() {
    const [step, setStep] = useState<"input" | "results" | "savings">("input");
    const [employees, setEmployees] = useState("15");
    const [salary, setSalary] = useState("");
    const [currency, setCurrency] = useState("USD");

    const employeesRef = useRef<HTMLInputElement>(null);
    const salaryRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (employeesRef.current && step === "input") {
            employeesRef.current.focus();
            employeesRef.current.select();
        }
    }, [step]);

    const handleCalculate = (e: React.FormEvent) => {
        e.preventDefault();
        if (!employees || !salary) return;
        setStep("results");
    };

    const numEmployees = Math.max(0, parseInt(employees) || 0);
    const avgMonthlySalary = Math.max(0, parseInt(salary) || 0);

    const totalMonthlyPayroll = numEmployees * avgMonthlySalary;
    const lostMonthly = totalMonthlyPayroll * 0.20;
    const lostQuarterly = lostMonthly * 3;
    const lostYearly = lostMonthly * 12;

    const getTracPlanPricePerUser = (currCode: string) => {
        if (currCode === "PKR") return 3000;
        if (currCode === "GBP") return 31;
        if (currCode === "EUR") return 36;
        if (currCode === "AUD") return 60;
        if (currCode === "CAD") return 53;
        if (currCode === "JPY") return 5900;
        if (currCode === "INR") return 3200;
        if (currCode === "CHF") return 35;
        if (currCode === "CNY") return 280;
        if (currCode === "SGD") return 52;
        return 39; // Default USD
    };

    const tracCost = numEmployees * getTracPlanPricePerUser(currency);

    const formatCurrency = (val: number) =>
        new Intl.NumberFormat("en-US", { style: "currency", currency: currency, maximumFractionDigits: 0 }).format(val);

    const handleEmployeesKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") {
            e.preventDefault();
            salaryRef.current?.focus();
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            const currentVal = parseInt(employees) || 0;
            setEmployees(Math.max(1, currentVal + 5).toString());
        } else if (e.key === "ArrowDown") {
            e.preventDefault();
            const currentVal = parseInt(employees) || 0;
            setEmployees(Math.max(1, currentVal - 5).toString());
        }
    };

    const handleEmployeesWheel = (e: React.WheelEvent<HTMLInputElement>) => {
        e.preventDefault();
        const currentVal = parseInt(employees) || 0;
        if (e.deltaY < 0) {
            setEmployees(Math.max(1, currentVal + 5).toString());
        } else {
            setEmployees(Math.max(1, currentVal - 5).toString());
        }
    };

    return (
        <main className="min-h-screen bg-white dark:bg-[#050505] text-black dark:text-white font-sans selection:bg-[#7B61FF] selection:text-white overflow-x-hidden">
            <Navbar />

            {/* Background elements */}
            <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[400px] bg-primary/10 blur-[120px] rounded-full opacity-60" />
            </div>

            <div className="container mx-auto px-6 pt-36 pb-24 max-w-7xl">
                {/* Navigation Back */}
                <div className="mb-12">
                    <Link 
                        href="/tools" 
                        className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors group"
                    >
                        <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                        <span>Back to Tools</span>
                    </Link>
                </div>

                <div className="max-w-md mx-auto bg-white dark:bg-[#0a0a0a] rounded-[2.5rem] shadow-[0_20px_50px_-20px_rgba(0,0,0,0.15)] dark:shadow-[0_20px_50px_-20px_rgba(0,0,0,0.7)] border border-black/5 dark:border-white/10 overflow-hidden">
                    <AnimatePresence mode="wait">
                        {step === "input" && (
                            <motion.div
                                key="input"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                className="p-8 sm:p-10"
                            >
                                <div className="mb-8 space-y-2">
                                    <h1 className="text-2xl font-bold tracking-tight text-black dark:text-white">Calculate Monthly loss</h1>
                                    <p className="text-xs text-muted-foreground leading-relaxed">
                                        According to studies, businesses lose atleast 20% productivity every month because of no visibility in their employee's work
                                    </p>
                                </div>

                                <form onSubmit={handleCalculate} className="space-y-6">
                                    <div className="space-y-2.5">
                                        <label className="text-sm font-medium text-black/70 dark:text-white/70">Team Size</label>
                                        <input
                                            ref={employeesRef}
                                            type="number"
                                            required
                                            min="1"
                                            onWheel={handleEmployeesWheel}
                                            onKeyDown={handleEmployeesKeyDown}
                                            className="w-full bg-black/5 dark:bg-white/5 border border-transparent focus:border-black/10 dark:focus:border-white/20 rounded-xl px-4 py-3.5 text-base focus:ring-4 focus:ring-black/5 dark:focus:ring-white/5 outline-none transition-all dark:text-white"
                                            placeholder="e.g. 15"
                                            value={employees}
                                            onChange={(e) => setEmployees(Math.max(0, parseInt(e.target.value) || 0).toString().replace(/^0+/, ''))}
                                        />
                                    </div>

                                    <div className="space-y-2.5">
                                        <label className="text-sm font-medium text-black/70 dark:text-white/70">Average Monthly Salary</label>
                                        <div className="relative flex items-center">
                                            <div className="absolute left-3 flex items-center gap-1 bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 border border-black/10 dark:border-white/10 px-2.5 py-1.5 rounded-lg text-xs font-bold text-black/75 dark:text-white/80 transition-colors pointer-events-none">
                                                <span>{currency}</span>
                                                <ChevronDown size={12} className="opacity-80" />
                                            </div>
                                            <select
                                                value={currency}
                                                onChange={(e) => setCurrency(e.target.value)}
                                                className="absolute left-3 w-16 h-8 opacity-0 cursor-pointer"
                                            >
                                                {currencies.map(c => (
                                                    <option key={c.code} value={c.code} className="text-black dark:text-white bg-white dark:bg-black">
                                                        {c.code}
                                                    </option>
                                                ))}
                                            </select>
                                            <input
                                                ref={salaryRef}
                                                type="number"
                                                required
                                                min="1"
                                                onWheel={(e) => (e.target as HTMLInputElement).blur()}
                                                className="w-full bg-black/5 dark:bg-white/5 border border-transparent focus:border-black/10 dark:focus:border-white/20 rounded-xl pl-24 pr-4 py-3.5 text-base focus:ring-4 focus:ring-black/5 dark:focus:ring-white/5 outline-none transition-all dark:text-white"
                                                placeholder="e.g. 5000"
                                                value={salary}
                                                onChange={(e) => setSalary(Math.max(0, parseInt(e.target.value) || 0).toString().replace(/^0+/, ''))}
                                            />
                                        </div>
                                    </div>

                                    <button
                                        type="submit"
                                        className="w-full bg-black dark:bg-white text-white dark:text-black font-semibold text-base py-4 rounded-xl hover:opacity-90 transition-opacity mt-2 shadow-lg"
                                    >
                                        Calculate Loss
                                    </button>
                                </form>
                            </motion.div>
                        )}

                        {step === "results" && (
                            <motion.div
                                key="results"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                className="p-8 sm:p-10"
                            >
                                <div className="mb-8 text-center">
                                    <h2 className="text-xl font-semibold text-black dark:text-white tracking-tight">Cost of 20% Lost Productivity</h2>
                                    <p className="text-xs text-muted-foreground mt-1">Based on a team of {numEmployees} with {formatCurrency(avgMonthlySalary)} avg. salary</p>
                                </div>

                                <div className="space-y-3 mb-6">
                                    <div className="flex justify-between items-center bg-black/5 dark:bg-white/5 px-5 py-4 rounded-2xl">
                                        <span className="text-sm font-bold text-black/80 dark:text-white/85">Monthly Lost</span>
                                        <span className="text-lg font-semibold text-black dark:text-white">{formatCurrency(lostMonthly)}</span>
                                    </div>

                                    <div className="flex justify-between items-center bg-black/5 dark:bg-white/5 px-5 py-4 rounded-2xl">
                                        <span className="text-sm font-bold text-black/80 dark:text-white/85">Quarterly Lost</span>
                                        <span className="text-lg font-semibold text-black dark:text-white">{formatCurrency(lostQuarterly)}</span>
                                    </div>

                                    <div className="flex justify-between items-center bg-red-500/10 dark:bg-red-500/10 px-5 py-5 rounded-2xl border border-red-500/20">
                                        <span className="text-sm font-bold text-red-600 dark:text-red-400">Annually Lost</span>
                                        <span className="text-2xl font-bold text-red-600 dark:text-red-400">{formatCurrency(lostYearly)}</span>
                                    </div>
                                </div>

                                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 font-medium text-center mb-6 leading-relaxed">
                                    This is all the money that's leaking out of your business, without you even knowing it.
                                </p>

                                {/* Call to Action to Compare Cost */}
                                <div className="space-y-3">
                                    <button
                                        onClick={() => setStep("savings")}
                                        className="flex items-center justify-center gap-2 w-full bg-black dark:bg-white text-white dark:text-black font-semibold text-base py-4 rounded-xl hover:opacity-90 transition-opacity shadow-lg"
                                    >
                                        Compare with Trac AI
                                    </button>
                                    <button
                                        onClick={() => setStep("input")}
                                        className="w-full bg-black/5 dark:bg-white/5 border border-transparent hover:bg-black/10 dark:hover:bg-white/10 text-black dark:text-white font-semibold text-base py-4 rounded-xl transition-colors"
                                    >
                                        Calculate Again
                                    </button>
                                </div>
                            </motion.div>
                        )}

                        {step === "savings" && (
                            <motion.div
                                key="savings"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                className="p-8 sm:p-10"
                            >
                                <div className="mb-8 text-center">
                                    <h2 className="text-xl font-semibold text-black dark:text-white tracking-tight">Trac AI Savings Potential</h2>
                                    <p className="text-xs text-muted-foreground mt-1">Based on a team of {numEmployees} with {formatCurrency(avgMonthlySalary)} avg. salary</p>
                                </div>

                                <div className="space-y-3 mb-8">
                                    <div className="flex justify-between items-center bg-black/5 dark:bg-white/5 px-5 py-4 rounded-2xl">
                                        <span className="text-sm font-bold text-black/80 dark:text-white/85">Monthly Lost</span>
                                        <span className="text-lg font-semibold text-black dark:text-white">{formatCurrency(lostMonthly)}</span>
                                    </div>

                                    <div className="flex justify-between items-center bg-emerald-500/10 dark:bg-emerald-500/10 px-5 py-4 rounded-2xl border border-emerald-500/20">
                                        <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">Monthly Trac AI Cost</span>
                                        <span className="text-lg font-semibold text-emerald-600 dark:text-emerald-400">{formatCurrency(tracCost)}</span>
                                    </div>
                                </div>

                                <p className="text-xs text-zinc-500 dark:text-zinc-400 font-semibold text-center mb-8 leading-relaxed">
                                    Trac AI saves {formatCurrency(lostMonthly)} money while only charging {formatCurrency(tracCost)} monthly.
                                </p>

                                <div className="space-y-3">
                                    <Link 
                                        href={`/demo?teamSize=${employees}&salary=${salary}&currency=${currency}&fromCalculator=true`}
                                        className="flex items-center justify-center gap-2 w-full bg-[#7B61FF] hover:bg-[#6c52ec] text-white font-semibold text-base py-4 rounded-xl transition-colors shadow-lg"
                                    >
                                        See How
                                    </Link>
                                    <a 
                                        href="https://calendly.com/kaayfkhan/discovery-call"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center justify-center gap-2 w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-base py-4 rounded-xl transition-colors shadow-lg"
                                    >
                                        <Calendar size={18} />
                                        Book a Discovery Meeting
                                    </a>
                                    <button
                                        onClick={() => setStep("results")}
                                        className="w-full bg-black/5 dark:bg-white/5 border border-transparent hover:bg-black/10 dark:hover:bg-white/10 text-black dark:text-white font-semibold text-base py-4 rounded-xl transition-colors"
                                    >
                                        Back to Results
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            <Footer />
        </main>
    );
}
