import React, { useState, useEffect, useRef, lazy, Suspense } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowRight, 
  Play, 
  Square, 
  Mic, 
  Brush, 
  Zap, 
  Bell
} from 'lucide-react';
import { Habit } from '../types';

const AuraDreamsView = lazy(() => import('./AuraDreamsView').then(m => ({ default: m.AuraDreamsView })));

interface ModesViewProps {
  onBack: () => void;
  habits: Habit[];
  focusSessions: any[];
  setFocusSessions: React.Dispatch<React.SetStateAction<any[]>>;
  dreamSessions: any[];
  setDreamSessions: React.Dispatch<React.SetStateAction<any[]>>;
  taskNotificationsEnabled: boolean;
  setTaskNotificationsEnabled: (val: boolean) => void;
}

export const ModesView: React.FC<ModesViewProps> = ({ 
  onBack, 
  habits, 
  focusSessions, 
  setFocusSessions,
  dreamSessions,
  setDreamSessions,
  taskNotificationsEnabled,
  setTaskNotificationsEnabled
}) => {
  const [activeMode, setActiveMode] = useState<'hub' | 'focus' | 'dreams'>('hub');
  
  const [timerText, setTimerText] = useState('00:00:00');
  const [isRunning, setIsRunning] = useState(false);
  const [sessionFeedback, setSessionFeedback] = useState('');
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [tag, setTag] = useState('عام');
  const [note, setNote] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [selectedTask, setSelectedTask] = useState<string>('');
  const [expectedTimeMinutes, setExpectedTimeMinutes] = useState<string>('30');
  const [actualStartTimeIso, setActualStartTimeIso] = useState<string>('');
  const startTime = useRef<number | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Timer text is removed as per user request (no timer display)
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const handleStartFocus = () => {
    if (!selectedTask.trim()) {
      alert("الرجاء اختيار المهمة أو المهارة قبل البدء");
      return;
    }
    startTime.current = Date.now();
    setActualStartTimeIso(new Date().toISOString());
    setIsRunning(true);
  };

  const handleStopFocus = () => {
    setShowFeedbackModal(true);
  };

  const finalizeFocus = () => {
    setIsRunning(false);
    let actualMinutes = 0;
    if (startTime.current) {
        const diffMs = Date.now() - startTime.current;
        actualMinutes = Math.floor(diffMs / 60000);
    }

    const sessionData = {
       id: Date.now().toString(),
       task: selectedTask,
       expectedMinutes: parseInt(expectedTimeMinutes) || 0,
       actualMinutes,
       startTime: actualStartTimeIso,
       endTime: new Date().toISOString(),
       note: note,
       feedback: sessionFeedback,
       tag: tag,
       type: 'focus'
    };

    setFocusSessions(prev => [...(prev || []), sessionData]);
    setShowFeedbackModal(false);
    setActiveMode('hub');
    setNote('');
    setSessionFeedback('');
    setSelectedTask('');
    setExpectedTimeMinutes('30');
    setTag('عام');
  };

  const startRecording = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.lang = 'ar-SA';
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.onstart = () => setIsRecording(true);
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setNote(prev => prev + (prev ? ' ' : '') + transcript);
        setIsRecording(false);
      };
      recognition.onerror = () => setIsRecording(false);
      recognition.onend = () => setIsRecording(false);
      recognition.start();
    } else {
      alert('المتصفح لا يدعم التسجيل الصوتي.');
    }
  };

  if (activeMode === 'focus') {
    return (
      <div className="fixed inset-0 z-[200] bg-white dark:bg-slate-950 flex flex-col pt-12 p-8 text-right overflow-y-auto w-full h-full font-sans">
        <div className="flex items-center justify-between mb-16">
           <div className="w-12 h-12" /> 
           <div className="text-right">
              <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100">Aura Focus</h2>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Deep Work Sanctuary</p>
           </div>
        </div>

        <div className="flex-1 flex flex-col items-center justify-start gap-8">
           {!isRunning && (
             <div className="w-full max-w-sm space-y-6 mb-4">
                <div>
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 text-right">المهمة أو المهارة (الهمة)</label>
                   <input
                     list="focus-tasks"
                     value={selectedTask}
                     onChange={(e) => setSelectedTask(e.target.value)}
                     placeholder="اختر مهارة أو اكتب مهمة..."
                     className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl px-4 py-3 text-right text-sm font-bold text-slate-800 dark:text-slate-100 focus:border-blue-500 outline-none"
                     dir="rtl"
                   />
                   <datalist id="focus-tasks">
                     {habits.map(h => <option key={h.id} value={h.name} />)}
                   </datalist>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 text-right">التصنيف (Tag)</label>
                    <select
                      value={tag}
                      onChange={(e) => setTag(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl px-4 py-3 text-right text-xs font-bold text-slate-800 dark:text-slate-100 focus:border-blue-500 outline-none"
                      dir="rtl"
                    >
                      <option value="عام">عام</option>
                      <option value="عمل">عمل</option>
                      <option value="دراسة">دراسة</option>
                      <option value="بناء عادات">بناء عادات</option>
                      <option value="تفكير">تفكير</option>
                      <option value="مهارة">مهارة</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 text-right">الوقت المتوقع (دقائق)</label>
                    <input
                      type="number"
                      value={expectedTimeMinutes}
                      onChange={(e) => setExpectedTimeMinutes(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl px-4 py-3 text-right text-sm font-bold text-slate-800 dark:text-slate-100 focus:border-blue-500 outline-none tabular-nums"
                      dir="rtl"
                    />
                  </div>
                </div>
             </div>
           )}

           {isRunning ? (
              <div className="flex flex-col items-center gap-12 group">
                 <div className="w-48 h-48 rounded-full border-2 border-blue-500/20 flex items-center justify-center p-4">
                    <div className="w-full h-full rounded-full bg-blue-500/10 flex items-center justify-center">
                       <Zap className="w-12 h-12 text-blue-500 animate-pulse" />
                    </div>
                 </div>
                 <div className="text-center">
                    <h3 className="text-3xl font-black text-slate-800 dark:text-white mb-2 italic">جلسة تركيز نشطة</h3>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Aura is keeping you focused</p>
                 </div>
                 <button onClick={handleStopFocus} className="px-12 py-5 bg-red-500 text-white rounded-[2rem] font-black text-sm uppercase tracking-widest shadow-2xl hover:scale-105 transition-transform flex items-center gap-3">
                    <Square className="w-5 h-5 fill-current" />
                    إنهاء الجلسة
                 </button>
              </div>
           ) : (
              <button 
                onClick={handleStartFocus} 
                className="px-12 py-5 bg-blue-600 text-white rounded-[2rem] font-black text-sm uppercase tracking-widest shadow-2xl hover:scale-105 transition-transform flex items-center gap-3"
              >
                <Play className="w-5 h-5 fill-current" />
                ابدأ الجلسة
              </button>
           )}

           <AnimatePresence>
             {isRunning && (
               <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, ease: "easeInOut", delay: 0.05 }} className="w-full max-w-xl flex flex-col gap-4 mt-8">
                  <textarea 
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="دوّن ملاحظاتك هنا بدون تشتيت..."
                    className="w-full h-40 bg-slate-50 dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 outline-none focus:border-blue-500 transition-colors text-right font-sans text-sm resize-none text-slate-800 dark:text-slate-100"
                    dir="rtl"
                  />
                  <div className="flex gap-3">
                    <button onClick={startRecording} className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors shadow-sm ${isRecording ? 'bg-red-50 text-red-500' : 'bg-slate-50 dark:bg-slate-900 text-blue-500 border border-slate-100 dark:border-slate-800'}`}>
                      <Mic className={`w-6 h-6 ${isRecording ? 'animate-pulse' : ''}`} />
                    </button>
                    <div className="flex-1 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-full flex items-center justify-end px-6 text-xs font-bold text-slate-400">
                      {isRecording ? 'جاري الاستماع...' : 'ملاحظات صوتية جاهزة'}
                    </div>
                  </div>
               </motion.div>
             )}
           </AnimatePresence>
        </div>

        <AnimatePresence>
            {showFeedbackModal && (
              <div className="fixed inset-0 z-[300] flex items-center justify-center p-6">
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.5 }} className="absolute inset-0 bg-slate-950/60 backdrop-blur-md" />
                <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }} transition={{ duration: 0.5, ease: "easeInOut" }} className="relative bg-white dark:bg-slate-900 rounded-[3rem] p-10 w-full max-w-sm border border-slate-100 dark:border-slate-800 shadow-2xl text-right">
                  <h3 className="text-2xl font-black text-slate-800 dark:text-white mb-2">إتمام الجلسة</h3>
                  <p className="text-xs font-bold text-slate-400 mb-8">عملت إيه في وقت التركيز ده؟</p>
                  <textarea
                    value={sessionFeedback}
                    onChange={(e) => setSessionFeedback(e.target.value)}
                    placeholder="اكتب باختصار إنجازاتك..."
                    className="w-full h-32 bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl text-right text-sm font-bold border-none outline-none resize-none mb-6"
                    dir="rtl"
                  />
                  <button onClick={finalizeFocus} className="w-full py-5 bg-blue-600 text-white rounded-[2rem] font-black text-sm uppercase tracking-widest shadow-xl">
                    حفظ الجلسة والإنهاء
                  </button>
                </motion.div>
              </div>
            )}
         </AnimatePresence>
      </div>
    );
  }

  if (activeMode === 'dreams') {
    return (
      <div className="fixed inset-0 z-[200] bg-white dark:bg-slate-950 flex flex-col w-full h-full overflow-hidden font-sans">
        <Suspense fallback={<div className="flex-1 flex items-center justify-center text-blue-500 font-black animate-pulse">جاري تحميل مساحة الأحلام...</div>}>
          <AuraDreamsView 
            onBack={() => setActiveMode('hub')} 
            onSaveSession={(session) => {
              setDreamSessions(prev => [...(prev || []), session]);
              setActiveMode('hub');
            }}
          />
        </Suspense>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      transition={{ duration: 0.5, ease: "easeInOut" }}
      className="max-w-2xl mx-auto px-4 pb-24 text-right font-sans"
    >
      <div className="flex items-center justify-between mb-12">
        <button 
          onClick={onBack}
          className="w-12 h-12 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400 hover:bg-slate-100 transition-colors"
        >
          <ArrowRight className="w-5 h-5" />
        </button>
        <div className="text-right">
           <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">أوضاع Aura Hub</h2>
           <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest mt-1">Productivity Hub</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
         {/* Aura Focus */}
         <button onClick={() => setActiveMode('focus')} className="w-full p-8 bg-slate-50 dark:bg-slate-800/50 hover:bg-white dark:hover:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-[2.5rem] flex flex-col items-end gap-3 transition-all hover:scale-[1.02] active:scale-95 shadow-sm hover:shadow-xl hover:shadow-blue-500/5 group text-right">
            <div className="w-16 h-16 bg-white dark:bg-slate-900 flex items-center justify-center rounded-3xl shadow-sm text-blue-500 group-hover:scale-110 transition-transform">
               <Zap className="w-8 h-8" />
            </div>
            <div>
               <h3 className="text-xl font-black text-slate-800 dark:text-slate-100">Aura Focus</h3>
               <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">الشاشة البيضاء. تخلص من أي تشتت. ركز في مهمتك وملاحظاتك مع تايمر مدمج.</p>
            </div>
         </button>

         {/* Aura Dreams */}
         <button onClick={() => setActiveMode('dreams')} className="w-full p-8 bg-slate-50 dark:bg-slate-800/50 hover:bg-white dark:hover:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-[2.5rem] flex flex-col items-end gap-3 transition-all hover:scale-[1.02] active:scale-95 shadow-sm hover:shadow-xl hover:shadow-purple-500/5 group text-right">
            <div className="w-16 h-16 bg-white dark:bg-slate-900 flex items-center justify-center rounded-3xl shadow-sm text-purple-500 group-hover:scale-110 transition-transform">
               <Brush className="w-8 h-8" />
            </div>
            <div>
               <h3 className="text-xl font-black text-slate-800 dark:text-slate-100">Aura Dreams</h3>
               <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">مساحة التفكير البصري. ارسم، صمم، ودون أفكارك بحرية تامة.</p>
            </div>
         </button>
      </div>
    </motion.div>
  );
};
