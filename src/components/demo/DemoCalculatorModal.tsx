"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

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
    const [step, setStep] = useState<"input" | "results" | "demo">("input");
    const [employees, setEmployees] = useState("15");
    const [salary, setSalary] = useState("");
    const [currency, setCurrency] = useState("USD");

    const employeesRef = useRef<HTMLInputElement>(null);
    const salaryRef = useRef<HTMLInputElement>(null);

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
                                    <h2 className="text-2xl font-semibold mb-8 text-black dark:text-white tracking-tight">Calculate Impact</h2>

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
                                                <select
                                                    value={currency}
                                                    onChange={(e) => setCurrency(e.target.value)}
                                                    className="absolute left-3 bg-transparent text-sm font-medium text-black/70 dark:text-white/70 outline-none cursor-pointer border-none appearance-none pr-4"
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
                                                    className="w-full bg-black/5 dark:bg-white/5 border border-transparent focus:border-black/10 dark:focus:border-white/20 rounded-xl pl-20 pr-4 py-3.5 text-base focus:ring-4 focus:ring-black/5 dark:focus:ring-white/5 outline-none transition-all dark:text-white"
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

                                    <div className="space-y-3 mb-10">
                                        <div className="flex justify-between items-center bg-black/5 dark:bg-white/5 px-5 py-4 rounded-2xl">
                                            <span className="text-sm font-medium text-black/60 dark:text-white/60">Monthly</span>
                                            <span className="text-lg font-semibold text-black dark:text-white">{formatCurrency(lostMonthly)}</span>
                                        </div>

                                        <div className="flex justify-between items-center bg-black/5 dark:bg-white/5 px-5 py-4 rounded-2xl">
                                            <span className="text-sm font-medium text-black/60 dark:text-white/60">Quarterly</span>
                                            <span className="text-lg font-semibold text-black dark:text-white">{formatCurrency(lostQuarterly)}</span>
                                        </div>

                                        <div className="flex justify-between items-center bg-red-500/10 dark:bg-red-500/10 px-5 py-5 rounded-2xl border border-red-500/20">
                                            <span className="text-sm font-semibold text-red-600 dark:text-red-400">Annually</span>
                                            <span className="text-2xl font-bold text-red-600 dark:text-red-400">{formatCurrency(lostYearly)}</span>
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => setStep("demo")}
                                        className="w-full bg-black dark:bg-white text-white dark:text-black font-medium text-base py-4 rounded-xl hover:opacity-90 transition-opacity"
                                    >
                                        View Demo
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
