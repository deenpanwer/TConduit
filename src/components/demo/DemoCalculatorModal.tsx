"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { useSearchParams } from "next/navigation";

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

export function DemoCalculatorModal() {
    const searchParams = useSearchParams();
    const fromCalculator = searchParams.get("fromCalculator") === "true";
    const initialTeamSize = searchParams.get("teamSize");
    const initialSalary = searchParams.get("salary");
    const initialCurrency = searchParams.get("currency");

    const [step, setStep] = useState<"input" | "results" | "savings" | "demo">("input");
    const [employees, setEmployees] = useState("15");
    const [salary, setSalary] = useState("");
    const [currency, setCurrency] = useState("USD");

    const employeesRef = useRef<HTMLInputElement>(null);
    const salaryRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (initialTeamSize) setEmployees(initialTeamSize);
        if (initialSalary) setSalary(initialSalary);
        if (initialCurrency) setCurrency(initialCurrency);

        if (fromCalculator) {
            setStep("demo");
        }
    }, [fromCalculator, initialTeamSize, initialSalary, initialCurrency]);

    useEffect(() => {
        // Auto-select the employees input on load
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
        <AnimatePresence>
            {step !== "demo" && (
                <div className="fixed inset-0 z-[9999] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                        className="w-full max-w-md bg-white dark:bg-[#0a0a0a] rounded-[2rem] shadow-2xl border border-black/5 dark:border-white/10 overflow-hidden relative"
                    >
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
                                        <h2 className="text-2xl font-semibold text-black dark:text-white tracking-tight">Calculate Monthly Loss</h2>
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
                                            <label className="text-sm font-medium text-black/70 dark:text-white/70 flex justify-between">
                                                <span>Average Monthly Salary</span>
                                            </label>
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
                                                    onWheel={(e) => (e.target as HTMLInputElement).blur()} // Prevent accidental scrolling
                                                    className="w-full bg-black/5 dark:bg-white/5 border border-transparent focus:border-black/10 dark:focus:border-white/20 rounded-xl pl-24 pr-4 py-3.5 text-base focus:ring-4 focus:ring-black/5 dark:focus:ring-white/5 outline-none transition-all dark:text-white"
                                                    placeholder="e.g. 5000"
                                                    value={salary}
                                                    onChange={(e) => setSalary(Math.max(0, parseInt(e.target.value) || 0).toString().replace(/^0+/, ''))}
                                                />
                                            </div>
                                        </div>

                                        <button
                                            type="submit"
                                            className="w-full bg-black dark:bg-white text-white dark:text-black font-medium text-base py-4 rounded-xl hover:opacity-90 transition-opacity mt-2"
                                        >
                                            Calculate
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
                                    <h2 className="text-xl font-semibold mb-8 text-black dark:text-white text-center tracking-tight">Cost of 20% Lost Productivity</h2>

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
                                        <button
                                            onClick={() => setStep("demo")}
                                            className="flex items-center justify-center gap-2 w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-base py-4 rounded-xl transition-colors shadow-lg"
                                        >
                                            See How
                                        </button>
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
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
