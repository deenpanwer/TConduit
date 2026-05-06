"use client";

import { motion } from "framer-motion";
import { UserPlus, Sparkles, X } from "lucide-react";
import { db } from "@/lib/firebase";
import { doc, updateDoc } from "firebase/firestore";
import { useAuth } from "@/hooks/use-auth";

interface DummyDataTileProps {
  orgId: string;
  onRemove: () => void;
}

export function DummyDataTile({ orgId, onRemove }: DummyDataTileProps) {
  const { user } = useAuth();

  const handleRemove = async () => {
    try {
      // Update Org Doc
      await updateDoc(doc(db, "organizations", orgId), {
        showDummyData: false
      });
      // Cleanup User Doc as well just in case
      if (user?.uid) {
        await updateDoc(doc(db, "users", user.uid), {
          showDummyData: false
        });
      }
      onRemove();
    } catch (error) {
      console.error("Failed to remove dummy data:", error);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 100, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 100, scale: 0.9 }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={handleRemove}
      className="fixed bottom-8 right-8 z-50 cursor-pointer"
    >
      <div className="bg-rose-500 text-white p-6 rounded-[2.5rem] shadow-2xl shadow-rose-500/40 border-4 border-white dark:border-rose-900/50 flex items-center gap-6 max-w-sm backdrop-blur-xl">
        <div className="size-14 bg-white/20 rounded-2xl flex items-center justify-center shrink-0">
          <UserPlus size={28} />
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-black uppercase tracking-widest leading-tight">
            Remove Dummy Data
          </h3>
          <p className="text-[10px] font-bold uppercase tracking-tight opacity-80 mt-1">
            Bring in your first real employee and start tracking.
          </p>
        </div>
        <div className="size-10 bg-black/10 rounded-xl flex items-center justify-center shrink-0">
          <Sparkles size={18} className="animate-pulse" />
        </div>
      </div>
    </motion.div>
  );
}
