'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

export type KPITheme = 'green' | 'blue' | 'purple' | 'amber' | 'rose' | 'cyan' | 'default';

interface PerformanceKPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: LucideIcon;
  theme?: KPITheme;
  trend?: string;
  isPositive?: boolean;
  className?: string;
  onClick?: () => void;
}

const themeStyles: Record<KPITheme, { border: string; bg: string; title: string; text: string; sub: string }> = {
  green: {
    border: 'border-emerald-500/20 hover:border-emerald-500/40',
    bg: 'bg-emerald-500/[0.03] dark:bg-emerald-500/[0.05]',
    title: 'text-emerald-700 dark:text-emerald-400',
    text: 'text-foreground',
    sub: 'text-emerald-600/70 dark:text-emerald-400/70',
  },
  blue: {
    border: 'border-blue-500/20 hover:border-blue-500/40',
    bg: 'bg-blue-500/[0.03] dark:bg-blue-500/[0.05]',
    title: 'text-blue-700 dark:text-blue-400',
    text: 'text-foreground',
    sub: 'text-blue-600/70 dark:text-blue-400/70',
  },
  purple: {
    border: 'border-purple-500/20 hover:border-purple-500/40',
    bg: 'bg-purple-500/[0.03] dark:bg-purple-500/[0.05]',
    title: 'text-purple-700 dark:text-purple-400',
    text: 'text-foreground',
    sub: 'text-purple-600/70 dark:text-purple-400/70',
  },
  amber: {
    border: 'border-amber-500/20 hover:border-amber-500/40',
    bg: 'bg-amber-500/[0.03] dark:bg-amber-500/[0.05]',
    title: 'text-amber-700 dark:text-amber-400',
    text: 'text-foreground',
    sub: 'text-amber-600/70 dark:text-amber-400/70',
  },
  rose: {
    border: 'border-rose-500/20 hover:border-rose-500/40',
    bg: 'bg-rose-500/[0.03] dark:bg-rose-500/[0.05]',
    title: 'text-rose-700 dark:text-rose-400',
    text: 'text-foreground',
    sub: 'text-rose-600/70 dark:text-rose-400/70',
  },
  cyan: {
    border: 'border-cyan-500/20 hover:border-cyan-500/40',
    bg: 'bg-cyan-500/[0.03] dark:bg-cyan-500/[0.05]',
    title: 'text-cyan-700 dark:text-cyan-400',
    text: 'text-foreground',
    sub: 'text-cyan-600/70 dark:text-cyan-400/70',
  },
  default: {
    border: 'border-border/60 hover:border-border',
    bg: 'bg-card',
    title: 'text-muted-foreground',
    text: 'text-foreground',
    sub: 'text-muted-foreground/70',
  },
};

export function PerformanceKPICard({
  title,
  value,
  subtitle,
  icon: Icon,
  theme = 'default',
  trend,
  isPositive,
  className,
  onClick,
}: PerformanceKPICardProps) {
  const styles = themeStyles[theme] || themeStyles.default;

  return (
    <div
      onClick={onClick}
      className={cn(
        'rounded-2xl border p-4 sm:p-5 flex flex-col justify-between transition-all duration-300 shadow-sm',
        styles.border,
        styles.bg,
        onClick && 'cursor-pointer hover:shadow-md hover:-translate-y-0.5',
        className
      )}
    >
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className={cn('text-[10px] font-black uppercase tracking-[0.18em]', styles.title)}>
          {title}
        </span>
        {Icon && <Icon size={16} className={cn('opacity-60', styles.title)} />}
      </div>

      <div className="flex items-baseline gap-2 my-1">
        <span className={cn('text-2xl sm:text-3xl font-black tracking-tight', styles.text)}>
          {value}
        </span>
        {trend && (
          <span
            className={cn(
              'text-[10px] font-bold px-1.5 py-0.5 rounded-md',
              isPositive ? 'bg-emerald-500/10 text-emerald-600' : 'bg-rose-500/10 text-rose-600'
            )}
          >
            {trend}
          </span>
        )}
      </div>

      {subtitle && (
        <span className={cn('text-[9px] font-bold uppercase tracking-widest mt-1', styles.sub)}>
          {subtitle}
        </span>
      )}
    </div>
  );
}
