import React from 'react';
import { motion } from 'motion/react';
import { Target, Sparkles } from 'lucide-react';

export const SplashScreen: React.FC = () => {
  return (
    <motion.div 
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1.2, ease: [0.43, 0.13, 0.23, 0.96] }}
      className="fixed inset-0 z-[100] bg-white dark:bg-slate-900 flex flex-col items-center justify-center overflow-hidden"
    >
      <div className="absolute inset-0 pointer-events-none">
        <motion.div 
          animate={{ 
            opacity: [0.03, 0.08, 0.03],
          }}
          transition={{ duration: 6, repeat: Infinity }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-500 rounded-full blur-[140px]"
        />
      </div>

      <div className="relative flex flex-col items-center">
        <motion.div
           initial={{ scale: 0.8, opacity: 0 }}
           animate={{ scale: 1, opacity: 1 }}
           transition={{ duration: 0.3, type: "spring", delay: 0.05 }}
           className="w-64 h-64 rounded-full border border-blue-100 flex flex-col items-center justify-center relative overflow-hidden bg-white/50 backdrop-blur-sm shadow-inner"
        >
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, type: "spring", delay: 0.2 }}
            className="w-24 h-24 bg-blue-900 rounded-[2rem] flex items-center justify-center shadow-2xl relative mb-4"
          >
            <Target className="w-12 h-12 text-white" />
            <motion.div 
              animate={{ scale: [1, 1.5, 1], opacity: [0, 0.5, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="absolute inset-0 bg-blue-500 rounded-[2rem] blur-xl -z-10"
            />
          </motion.div>

          <motion.div
             initial={{ y: 10, opacity: 0 }}
             animate={{ y: 0, opacity: 1 }}
             transition={{ delay: 0.5 }}
             className="text-center"
          >
            <h1 className="text-3xl font-black tracking-tighter text-slate-800">Aura</h1>
            <p className="text-[8px] font-black uppercase tracking-[0.4em] text-blue-500">for better life</p>
          </motion.div>
          
          <div className="absolute inset-0 border-[16px] border-blue-50/30 rounded-full pointer-events-none" />
        </motion.div>
      </div>

      <motion.div 
        initial={{ width: 0 }}
        animate={{ width: "200px" }}
        transition={{ delay: 0.5, duration: 1.5 }}
        className="absolute bottom-20 h-1 bg-slate-100 rounded-full overflow-hidden"
      >
        <motion.div 
          animate={{ x: ["-100%", "100%"] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
          className="w-full h-full bg-blue-500"
        />
      </motion.div>
    </motion.div>
  );
};
