'use client';

import React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';
import { cn } from '@/lib/utils';

export interface TrendDataPoint {
  date: string;
  label: string;
  tasksCompleted: number;
  subtasksCompleted: number;
  totalPoints: number;
}

interface ActivityTrendChartProps {
  data: TrendDataPoint[];
  title?: string;
  className?: string;
}

export function ActivityTrendChart({
  data,
  title = 'COMPLETION & OUTPUT VELOCITY TREND',
  className,
}: ActivityTrendChartProps) {
  return (
    <div className={cn('rounded-xl border border-border/60 bg-card p-3 sm:p-3.5 shadow-sm flex flex-col', className)}>
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-[10px] sm:text-[11px] font-black uppercase tracking-[0.18em] text-foreground font-serif">
          {title}
        </h3>
        <span className="text-[8px] sm:text-[9px] font-bold uppercase tracking-widest text-muted-foreground/60">
          DAILY OUTPUT
        </span>
      </div>

      <div className="w-full h-36 sm:h-44">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
            <defs>
              <linearGradient id="amberVelocity" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.02} />
              </linearGradient>
              <linearGradient id="emeraldTasks" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.35} />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))', fontWeight: 600 }}
              interval="preserveStartEnd"
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))', fontWeight: 600 }}
              allowDecimals={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                borderColor: 'hsl(var(--border))',
                borderRadius: '8px',
                fontSize: '11px',
                fontWeight: '600',
                boxShadow: '0 6px 16px -2px rgba(0, 0, 0, 0.1)',
                padding: '6px 10px',
              }}
              labelStyle={{ fontWeight: '800', textTransform: 'uppercase', fontSize: '9px', letterSpacing: '0.05em' }}
            />
            <Legend
              verticalAlign="top"
              align="right"
              iconType="circle"
              wrapperStyle={{ paddingBottom: '6px', fontSize: '9px', fontWeight: 'bold' }}
            />
            <Area
              type="monotone"
              dataKey="subtasksCompleted"
              name="Subtasks / Velocity"
              stroke="#f59e0b"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#amberVelocity)"
            />
            <Area
              type="monotone"
              dataKey="tasksCompleted"
              name="Tasks Completed"
              stroke="#10b981"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#emeraldTasks)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export interface PriorityBreakdownPoint {
  category: string;
  points: number;
  completed: number;
}

interface PriorityBreakdownChartProps {
  data: PriorityBreakdownPoint[];
  title?: string;
  className?: string;
}

export function PriorityBreakdownChart({
  data,
  title = 'TASK OUTPUT & POINTS BY PRIORITY',
  className,
}: PriorityBreakdownChartProps) {
  return (
    <div className={cn('rounded-xl border border-border/60 bg-card p-3 sm:p-3.5 shadow-sm flex flex-col', className)}>
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-[10px] sm:text-[11px] font-black uppercase tracking-[0.18em] text-foreground font-serif">
          {title}
        </h3>
        <span className="text-[8px] sm:text-[9px] font-bold uppercase tracking-widest text-muted-foreground/60">
          CATEGORY BREAKDOWN
        </span>
      </div>

      <div className="w-full h-32 sm:h-38">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.35} />
            <XAxis
              dataKey="category"
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))', fontWeight: 700 }}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))', fontWeight: 600 }}
              allowDecimals={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                borderColor: 'hsl(var(--border))',
                borderRadius: '8px',
                fontSize: '11px',
                fontWeight: '600',
                padding: '6px 10px',
              }}
            />
            <Legend
              verticalAlign="top"
              align="right"
              iconType="circle"
              wrapperStyle={{ paddingBottom: '6px', fontSize: '9px', fontWeight: 'bold' }}
            />
            <Bar dataKey="points" name="Total Points (Pts)" fill="#f59e0b" radius={[4, 4, 0, 0]} maxBarSize={38} />
            <Bar dataKey="completed" name="Completed Items" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={38} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export interface ValueTierPoint {
  tier: string;
  total: number;
  completed: number;
}

interface ValueTierDistributionChartProps {
  data: ValueTierPoint[];
  title?: string;
  className?: string;
}

export function ValueTierDistributionChart({
  data,
  title = 'TASK POINT SIZE DISTRIBUTION',
  className,
}: ValueTierDistributionChartProps) {
  return (
    <div className={cn('rounded-xl border border-border/60 bg-card p-3 sm:p-3.5 shadow-sm flex flex-col', className)}>
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-[10px] sm:text-[11px] font-black uppercase tracking-[0.18em] text-foreground font-serif">
          {title}
        </h3>
        <span className="text-[8px] sm:text-[9px] font-bold uppercase tracking-widest text-muted-foreground/60">
          VALUE TIERS
        </span>
      </div>

      <div className="w-full h-32 sm:h-38">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.35} />
            <XAxis
              dataKey="tier"
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))', fontWeight: 700 }}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))', fontWeight: 600 }}
              allowDecimals={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                borderColor: 'hsl(var(--border))',
                borderRadius: '8px',
                fontSize: '11px',
                fontWeight: '600',
                padding: '6px 10px',
              }}
            />
            <Legend
              verticalAlign="top"
              align="right"
              iconType="circle"
              wrapperStyle={{ paddingBottom: '6px', fontSize: '9px', fontWeight: 'bold' }}
            />
            <Bar dataKey="total" name="Total Assigned" fill="#6366f1" radius={[4, 4, 0, 0]} maxBarSize={38} />
            <Bar dataKey="completed" name="Completed" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={38} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
