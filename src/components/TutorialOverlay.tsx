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
      title: "أهلاً بك في Aura 🧪",
      description: "المكان اللي هتحول فيه أهدافك لواقع ملموس بتجارب يومية مدروسة.",
      icon: <Sparkles className="w-12 h-12 text-blue-500" />,
      color: "from-blue-500 to-blue-600"
    },
    {
      title: "نظام النقاط الذكي 📈",
      description: "كل مهارة بتخلصها بتديك نقاط. الالتزام (Elite) بيديك ضعف النقاط، والاستمرارية بتديك بونص Streak!",
      icon: <Target className="w-12 h-12 text-blue-500" />,
      color: "from-blue-500 to-blue-600"
    },
    {
      title: "وضع الاستشفاء (Recovery) 🩹",
      description: "تعبان؟ مش قادر؟ شغل وضع الاستشفاء عشان تحافظ على الـ Streak بتاعك بنص المجهود.. Aura بيقدر ظروفك.",
      icon: <Zap className="w-12 h-12 text-blue-500" />,
      color: "from-blue-500 to-blue-600"
    },
    {
      title: "جاهز تبدأ؟ 🚀",
      description: "ابني عادتك الأولى وابدأ رحلة الصعود في المستويات. بالتوفيق يا عالم!",
      icon: <Rocket className="w-12 h-12 text-blue-500" />,
      color: "from-blue-600 to-blue-700"
    }
  ];

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] bg-white flex items-center justify-center p-6 text-right"
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
            <div className={`w-24 h-24 rounded-[2.5rem] bg-white border-2 border-blue-100 flex items-center justify-center text-white mx-auto shadow-2xl`}>
              {steps[step].icon}
            </div>
            
            <div className="space-y-4">
              <h2 className="text-3xl font-black text-slate-900 leading-tight">{steps[step].title}</h2>
              <p className="text-lg font-medium text-slate-500 leading-relaxed">
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
            className={`w-full py-5 rounded-[2rem] bg-blue-600 text-white font-black text-lg shadow-2xl hover:scale-[1.02] active:scale-[0.98] transition-all`}
          >
            {step === steps.length - 1 ? 'يلا بينا!' : 'التالي'}
          </button>
          
          <div className="flex justify-center gap-2">
            {steps.map((_, i) => (
              <div 
                key={i} 
                className={`h-1.5 rounded-full transition-all duration-500 ${i === step ? 'w-8 bg-blue-500' : 'w-2 bg-slate-200'}`} 
              />
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
};
