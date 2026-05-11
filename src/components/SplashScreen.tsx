import React from 'react';
import { motion } from 'motion/react';
import { Flame, Sparkles } from 'lucide-react';

export const SplashScreen: React.FC = () => {
  return (
    <motion.div 
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8, ease: "easeInOut" }}
      className="fixed inset-0 z-[100] bg-white dark:bg-slate-950 flex flex-col items-center justify-center overflow-hidden"
    >
      <div className="absolute inset-0 pointer-events-none">
        <motion.div 
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.1, 0.2, 0.1]
          }}
          transition={{ duration: 4, repeat: Infinity }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-500 rounded-full blur-[120px]"
        />
      </div>

      <div className="relative flex flex-col items-center">
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, type: "spring" }}
          className="w-24 h-24 bg-slate-900 dark:bg-white rounded-[2rem] flex items-center justify-center shadow-2xl relative mb-8"
        >
          <Flame className="w-12 h-12 text-white dark:text-slate-900" />
          <motion.div 
            animate={{ scale: [1, 1.5, 1], opacity: [0, 0.5, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute inset-0 bg-indigo-500 rounded-[2rem] blur-xl -z-10"
          />
        </motion.div>

        <motion.div
           initial={{ y: 20, opacity: 0 }}
           animate={{ y: 0, opacity: 1 }}
           transition={{ delay: 0.3 }}
           className="text-center"
        >
          <h1 className="text-4xl font-black tracking-tighter text-slate-900 dark:text-slate-100 mb-2">Habit Lab</h1>
          <div className="flex items-center gap-2 justify-center text-indigo-500">
             <Sparkles className="w-4 h-4" />
             <span className="text-[10px] font-black uppercase tracking-[0.4em]">Dopamine Station</span>
          </div>
        </motion.div>
      </div>

      <motion.div 
        initial={{ width: 0 }}
        animate={{ width: "200px" }}
        transition={{ delay: 0.5, duration: 1.5 }}
        className="absolute bottom-20 h-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden"
      >
        <motion.div 
          animate={{ x: ["-100%", "100%"] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
          className="w-full h-full bg-indigo-500"
        />
      </motion.div>
    </motion.div>
  );
};
