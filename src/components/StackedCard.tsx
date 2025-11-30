'use client';

import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';

interface StackedCardProps {
  items: string[];
}

export const StackedCard: React.FC<StackedCardProps> = ({ items }) => {
  const displayItems = items.slice(0, 3).reverse();

  return (
    <div className="relative h-24 w-64">
      <AnimatePresence>
        {displayItems.map((item, index) => {
          const isTop = index === displayItems.length - 1;

          return (
            <motion.div
              key={item}
              className="absolute w-full h-full rounded-xl border border-white/10 bg-gradient-to-br from-white/5 to-white/0 shadow-lg backdrop-blur-sm"
              initial={{
                scale: 1 - (displayItems.length - 1 - index) * 0.05,
                y: (displayItems.length - 1 - index) * 12,
                opacity: isTop ? 1 : 0.8,
              }}
              animate={{
                scale: 1 - (displayItems.length - 1 - index) * 0.05,
                y: (displayItems.length - 1 - index) * 12,
                opacity: isTop ? 1 : 0.8,
              }}
              exit={{
                y: -40,
                opacity: 0,
                transition: { duration: 0.3, ease: 'easeIn' },
              }}
              transition={{
                duration: 0.5,
                ease: 'easeInOut',
              }}
              style={{
                zIndex: index,
              }}
            >
              <div className="flex items-center justify-center h-full">
                <p className="text-neutral-300 text-sm font-medium">{item}</p>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};
