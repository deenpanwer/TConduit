'use client';

import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import { GlassCard } from './shared/GlassCard';
import { useTheme } from 'next-themes';

const data = Array.from({ length: 30 }, (_, i) => ({
  day: i + 1,
  hours: Math.floor(Math.random() * 15) + 30 + (i * 1.8),
}));

const forecastData = data.slice(-10).map(d => ({
  ...d,
  hours: d.hours * (1 + (Math.random() * 0.15))
}));

export const PerformanceHorizon = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <GlassCard className="p-10" hoverEffect={false}>
      <div className="flex justify-between items-center mb-10">
        <div>
          <h2 className="text-2xl font-black font-poppins text-gray-900 dark:text-white leading-none tracking-tighter uppercase">Performance Horizon</h2>
          <p className="text-gray-400 mt-2 text-[10px] font-black font-poppins uppercase tracking-[0.2em]">Aggregate output with 14-day projection</p>
        </div>
        <div className="flex bg-gray-50 dark:bg-[#111113] p-1.5 rounded-2xl border border-gray-100 dark:border-white/5 shadow-inner">
          <button className="px-6 py-2 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-blue-500/20 active:scale-95 transition-all">Monthly</button>
          <button className="px-6 py-2 text-gray-400 text-[10px] font-black uppercase tracking-widest hover:text-gray-900 dark:hover:text-white transition-colors">Weekly</button>
        </div>
      </div>
      
      <div className="h-[350px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorOutput" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25}/>
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid 
              strokeDasharray="0" 
              vertical={false} 
              stroke={isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)"} 
            />
            <XAxis dataKey="day" hide />
            <YAxis hide domain={['dataMin - 5', 'dataMax + 10']} />
            <RechartsTooltip 
              cursor={{ stroke: '#3b82f6', strokeWidth: 2, strokeDasharray: '5 5' }}
              contentStyle={{ 
                borderRadius: '24px', 
                border: 'none', 
                boxShadow: '0 40px 80px rgba(0,0,0,0.15)', 
                backgroundColor: isDark ? '#18181b' : '#ffffff', 
                backdropFilter: 'blur(16px)', 
                fontWeight: '900', 
                fontSize: '12px', 
                textTransform: 'uppercase', 
                letterSpacing: '0.1em' 
              }}
              itemStyle={{ color: isDark ? '#ffffff' : '#18181b' }}
            />
            {/* Actual Data */}
            <Area 
              type="monotone" 
              dataKey="hours" 
              stroke="#3b82f6" 
              strokeWidth={6} 
              fillOpacity={1} 
              fill="url(#colorOutput)" 
              animationDuration={2500}
            />
            {/* Forecast Line */}
            <Area 
              type="monotone" 
              data={forecastData} 
              dataKey="hours" 
              stroke="#3b82f6" 
              strokeWidth={2} 
              strokeDasharray="10 10" 
              fill="transparent" 
              opacity={0.3} 
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </GlassCard>
  );
};
