import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Target, Zap, Rocket, CheckCircle2 } from 'lucide-react';

interface TutorialOverlayProps {
  onClose: () => void;
}

export const TutorialOverlay: React.FC<TutorialOverlayProps> = ({ onClose }) => {
  const [step, setStep] = useState(0);

  const steps = [
    {
      title: "أهلاً بك في مختبر العادات 🧪",
      description: "المكان اللي هتحول فيه أهدافك لواقع ملموس بتجارب يومية مدروسة.",
      icon: <Sparkles className="w-12 h-12 text-indigo-500" />,
      color: "from-indigo-500 to-purple-600"
    },
    {
      title: "نظام النقاط الذكي 📈",
      description: "كل عادة بتخلصها بتديك نقاط. الالتزام (Elite) بيديك ضعف النقاط، والاستمرارية بتديك بونص Streak!",
      icon: <Target className="w-12 h-12 text-emerald-500" />,
      color: "from-emerald-500 to-teal-600"
    },
    {
      title: "وضع الاستشفاء (Recovery) 🩹",
      description: "تعبان؟ مش قادر؟ شغل وضع الاستشفاء عشان تحافظ على الـ Streak بتاعك بنص المجهود.. المعمل بيقدر ظروفك.",
      icon: <Zap className="w-12 h-12 text-amber-500" />,
      color: "from-amber-500 to-orange-600"
    },
    {
      title: "جاهز تبدأ؟ 🚀",
      description: "ابني عادتك الأولى وابدأ رحلة الصعود في المستويات. بالتوفيق يا عالم!",
      icon: <Rocket className="w-12 h-12 text-indigo-500" />,
      color: "from-slate-800 to-slate-900"
    }
  ];

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] bg-white dark:bg-slate-950 flex items-center justify-center p-6 text-right"
    >
      <div className="max-w-md w-full space-y-12">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-8"
          >
            <div className={`w-24 h-24 rounded-[2.5rem] bg-gradient-to-br ${steps[step].color} flex items-center justify-center text-white mx-auto shadow-2xl`}>
              {steps[step].icon}
            </div>
            
            <div className="space-y-4">
              <h2 className="text-3xl font-black text-slate-900 dark:text-white leading-tight">{steps[step].title}</h2>
              <p className="text-lg font-medium text-slate-500 dark:text-slate-400 leading-relaxed">
                {steps[step].description}
              </p>
            </div>
          </motion.div>
        </AnimatePresence>

        <div className="flex flex-col gap-4">
          <button 
            onClick={() => {
              if (step < steps.length - 1) {
                setStep(step + 1);
              } else {
                onClose();
              }
            }}
            className={`w-full py-5 rounded-[2rem] bg-slate-900 dark:bg-white text-white dark:text-slate-950 font-black text-lg shadow-2xl hover:scale-[1.02] active:scale-[0.98] transition-all`}
          >
            {step === steps.length - 1 ? 'يلا بينا!' : 'التالي'}
          </button>
          
          <div className="flex justify-center gap-2">
            {steps.map((_, i) => (
              <div 
                key={i} 
                className={`h-1.5 rounded-full transition-all duration-500 ${i === step ? 'w-8 bg-indigo-500' : 'w-2 bg-slate-200'}`} 
              />
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
};
