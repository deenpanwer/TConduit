'use client';

import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';

interface CardItem {
  title: string;
  time: string;
}

interface StackedCardProps {
  items: CardItem[];
}

export const StackedCard: React.FC<StackedCardProps> = ({ items }) => {
  const displayItems = items.slice(0, 3).reverse();

  return (
    <div className="relative h-24 w-full max-w-md">
      <AnimatePresence>
        {displayItems.map((item, index) => {
          const isTop = index === displayItems.length - 1;

          return (
            <motion.div
              key={`${item.title}-${index}`}
              className="absolute w-full h-full rounded-xl border border-white/10 bg-neutral-950 shadow-lg backdrop-blur-sm flex items-center justify-center p-4"
              initial={{
                scale: 1 - (displayItems.length - 1 - index) * 0.05,
                y: (displayItems.length - 1 - index) * 12,
                opacity: isTop ? 1 : 0.7,
              }}
              animate={{
                scale: 1 - (displayItems.length - 1 - index) * 0.05,
                y: (displayItems.length - 1 - index) * 12,
                opacity: isTop ? 1 : 0.7,
                zIndex: index,
              }}
              exit={{
                y: -40,
                opacity: 0,
                scale: 0.95,
                transition: { duration: 0.3, ease: 'easeIn' },
              }}
              transition={{
                duration: 0.5,
                ease: 'easeInOut',
              }}
              whileHover={isTop ? { backgroundColor: 'rgba(55, 55, 55, 0.5)' } : {}}
            >
              {isTop && (
                 <div className="flex justify-between items-start w-full">
                    <div>
                        <p className="text-white font-semibold">{item.title}</p>
                        <p className="text-neutral-400 text-sm">Matched with a vetted specialist.</p>
                    </div>
                    <p className="text-neutral-500 text-xs whitespace-nowrap">{item.time}</p>
                </div>
              )}
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};
