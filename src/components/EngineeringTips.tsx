import React from 'react';
import { motion } from 'motion/react';
import { ChevronRight, Lightbulb, Clock, Repeat, ShieldAlert, Sparkles } from 'lucide-react';

interface EngineeringTipsProps {
  onClose: () => void;
}

export const EngineeringTips: React.FC<EngineeringTipsProps> = ({ onClose }) => {
  const tips = [
    {
      icon: <Sparkles className="w-5 h-5 text-amber-500" />,
      title: 'تجنب الانفجار العظيم',
      description: 'المخ يكره التغيير المفاجئ. ١٠ دقائق يومياً تبني إدماناً إيجابياً، بينما ٣ ساعات في يوم واحد تبني مقاومة.'
    },
    {
      icon: <Clock className="w-5 h-5 text-blue-500" />,
      title: 'استغلال الأوقات البينية',
      description: 'لا تنتظر تفرغاً كاملاً. استغل المساحات البينية المهدرة لبناء عاداتك (مثل الاستماع لدرس في المواصلات).'
    },
    {
      icon: <Repeat className="w-5 h-5 text-indigo-500" />,
      title: 'استبدال المسار',
      description: 'لا يمكنك محو العادة السيئة، لكن يمكنك استبدالها. ابحث عن المحفز، واستبدل العادة بإجراء بسيط يؤدي لنفس النتيجة.'
    },
    {
      icon: <ShieldAlert className="w-5 h-5 text-rose-500" />,
      title: 'بروتوكول التعافي',
      description: 'إذا ضعفت، لا تهدم النظام بأكمله وتجلد ذاتك. السقوط مرة لا يعني فشل البرمجة؛ استأنف مسارك فوراً في المرة القادمة.'
    },
    {
      icon: <Lightbulb className="w-5 h-5 text-emerald-500" />,
      title: 'الفراغ يصنع الانحدار',
      description: 'عندما لا يجد العقل خطة عمل واضحة وقت الفراغ، يلجأ فوراً إلى مصادر الدوبامين الرخيص. خطط أوقاتك لتجنب السقوط.'
    }
  ];

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="w-full max-w-md bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-100 dark:border-slate-800 z-10 p-6 sm:p-8 max-h-[85vh] flex flex-col"
      >
        <div className="flex items-center justify-between mb-6 shrink-0">
          <div className="flex flex-col">
             <h2 className="text-xl font-black text-slate-800 dark:text-slate-100">المخطط الهندسي للسلوك</h2>
             <p className="text-xs font-bold text-slate-400 mt-1">دليل عملي للانتقال إلى الاستمرارية المنهجية</p>
          </div>
          <button onClick={onClose} className="p-2 bg-slate-50 dark:bg-slate-800 rounded-full text-slate-400 hover:text-slate-600 transition-colors">
            <ChevronRight className="w-5 h-5 rotate-180" />
          </button>
        </div>

        <div className="space-y-4 overflow-y-auto pr-2 custom-scrollbar pb-2">
          {tips.map((tip, index) => (
            <div key={index} className="p-5 rounded-3xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex gap-4 items-start">
              <div className="w-10 h-10 rounded-2xl bg-white dark:bg-slate-800 shadow-sm flex items-center justify-center shrink-0">
                {tip.icon}
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-800 dark:text-slate-200 mb-1">{tip.title}</h3>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 leading-relaxed">
                  {tip.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};
