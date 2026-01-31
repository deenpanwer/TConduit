'use client';

import { motion } from 'framer-motion';

export const Shimmer = ({ className = "" }: { className?: string }) => (
  <div className={`relative overflow-hidden bg-gray-200/50 dark:bg-white/5 rounded-xl ${className}`}>
    <motion.div
      initial={{ x: '-100%' }}
      animate={{ x: '100%' }}
      transition={{
        repeat: Infinity,
        duration: 1.5,
        ease: 'linear',
      }}
      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 dark:via-white/5 to-transparent skew-x-12"
    />
  </div>
);

export const HoverShimmer = () => (
  <motion.div
    className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-700"
    initial={{ x: '-100%' }}
    whileHover={{ x: '100%' }}
    transition={{ duration: 1, ease: "easeInOut" }}
  >
    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 dark:via-white/5 to-transparent skew-x-12" />
  </motion.div>
);
