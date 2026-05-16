import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Target, Zap, Rocket, CheckCircle2, ArrowRight } from 'lucide-react';

interface TutorialOverlayProps {
  onClose: () => void;
}

export const TutorialOverlay: React.FC<TutorialOverlayProps> = ({ onClose }) => {
  const [step, setStep] = useState(0);

  const steps = [
    {
      title: "أهلاً بك في Aura Lab 🧪",
      description: "المكان اللي هتحول فيه أهدافك لواقع ملموس بتجارب يومية مدروسة. إحنا هنا عشان نساعدك تبني مهاراتك بذكاء.",
      icon: <Sparkles className="w-12 h-12 text-blue-500" />,
      color: "from-blue-500 to-indigo-600"
    },
    {
      title: "الرؤية الدائرية (Aura Hub) 🌌",
      description: "اضغط على الأيقونات في الدائرة للوصول السريع لمهاراتك، جدولك، ملاحظاتك، ومسار تطورك.",
      icon: <Target className="w-12 h-12 text-emerald-500" />,
      color: "from-emerald-500 to-teal-600"
    },
    {
      title: "الذكاء الاصطناعي (BERT) 🧠",
      description: "استخدم ميزة 'افحص خطتي' لتحليل توازن أهدافك باستخدام موديل BERT العصبي أوفلاين تماماً.",
      icon: <Zap className="w-12 h-12 text-purple-500" />,
      color: "from-purple-500 to-pink-600"
    },
    {
      title: "نظام الـ Streak والاستشفاء 🔋",
      description: "حافظ على حماسك! لو تعبان شغل وضع الـ Recovery عشان تحمي الـ Streak بتاعك بنص المجهود.",
      icon: <Rocket className="w-12 h-12 text-orange-500" />,
      color: "from-orange-500 to-rose-600"
    },
    {
      title: "التزامن والخصوصية 🛡️",
      description: "بياناتك متأمنة على Google Drive بتاعك. مفيش حد يقدر يشوفها غيرك. خصوصيتك هي أولويتنا.",
      icon: <CheckCircle2 className="w-12 h-12 text-blue-400" />,
      color: "from-blue-400 to-blue-600"
    }
  ];

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] bg-white dark:bg-slate-950 flex items-center justify-center p-6 text-right"
    >
      <div className="max-w-md w-full">
        <div className="flex justify-between items-center mb-12">
          <button onClick={onClose} className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-rose-500 transition-colors">تخطي الجولة</button>
          <div className="flex gap-1.5">
            {steps.map((_, i) => (
              <div key={i} className={`h-1 rounded-full transition-all duration-500 ${i === step ? 'w-6 bg-blue-500' : 'w-2 bg-slate-200 dark:bg-slate-800'}`} />
            ))}
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-10"
          >
            <div className={`w-full aspect-square rounded-[3.5rem] bg-gradient-to-tr ${steps[step].color} flex items-center justify-center text-white mx-auto shadow-2xl relative overflow-hidden group`}>
              <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
              <motion.div
                animate={{ scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }}
                transition={{ duration: 4, repeat: Infinity }}
              >
                {steps[step].icon}
              </motion.div>
              {/* Mockup decoration */}
              <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl" />
            </div>
            
            <div className="space-y-4">
              <h2 className="text-4xl font-black text-slate-900 dark:text-white leading-tight">{steps[step].title}</h2>
              <p className="text-lg font-bold text-slate-500 dark:text-slate-400 leading-relaxed">
                {steps[step].description}
              </p>
            </div>
          </motion.div>
        </AnimatePresence>

        <div className="mt-16">
          <button 
            onClick={() => {
              if (step < steps.length - 1) {
                setStep(step + 1);
              } else {
                onClose();
              }
            }}
            className="w-full py-6 rounded-[2.2rem] bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black text-lg shadow-2xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 group"
          >
            {step === steps.length - 1 ? 'انطلق الآن!' : 'التالي'}
            <ArrowRight className={`w-5 h-5 transition-transform group-hover:translate-x-[-10px] ${step === steps.length - 1 ? 'hidden' : ''}`} />
          </button>
        </div>
      </div>
    </motion.div>
  );
};
