import React, { useState, useEffect, useRef, lazy, Suspense } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowRight, 
  Play, 
  Square, 
  Brush, 
  Zap, 
  Bell,
  RotateCcw,
  ShieldCheck,
  Plus,
  Trash2
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
  onCelebrate?: (intensity?: 'low' | 'medium' | 'high') => void;
  globalRecoveryMode?: boolean;
  setGlobalRecoveryMode?: (val: boolean) => void;
  userName?: string;
  showFeedback?: (msg: string, type?: 'success' | 'info' | 'alert', showUndo?: boolean) => void;
  requestConfirm: (title: string, description: string, icon: React.ReactNode, onConfirm: () => void) => void;
}

export const ModesView: React.FC<ModesViewProps> = ({ 
  onBack, 
  habits, 
  focusSessions, 
  setFocusSessions,
  dreamSessions,
  setDreamSessions,
  onCelebrate,
  globalRecoveryMode,
  setGlobalRecoveryMode,
  userName,
  showFeedback,
  requestConfirm
}) => {
  const [activeMode, setActiveMode] = useState<'hub' | 'focus' | 'dreams' | 'recovery'>('hub');
  
  const [timerText, setTimerText] = useState('00:00:00');
  const [isRunning, setIsRunning] = useState(() => localStorage.getItem('aura-focus-running') === 'true');
  const [isPaused, setIsPaused] = useState(() => localStorage.getItem('aura-focus-paused') === 'true');
  const [pauseStartTime, setPauseStartTime] = useState<number | null>(() => {
      const saved = localStorage.getItem('aura-focus-pause-start-time');
      return saved ? parseInt(saved) : null;
  });
  const [totalPausedMs, setTotalPausedMs] = useState(() => {
      const saved = localStorage.getItem('aura-focus-total-paused-ms');
      return saved ? parseInt(saved) : 0;
  });
  
  const [sessionFeedback, setSessionFeedback] = useState('');
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [tag, setTag] = useState('عام');
  const [notesList, setNotesList] = useState<{id: string, text: string}[]>([]);
  const [currentNote, setCurrentNote] = useState('');
  
  const handleAddNote = () => {
    if (!currentNote.trim()) return;
    setNotesList([{ id: crypto.randomUUID(), text: currentNote }, ...notesList]);
    setCurrentNote('');
  };

  const handleEditNote = (id: string, newText: string) => {
    setNotesList(notesList.map(n => n.id === id ? { ...n, text: newText } : n));
  };

  const handleDeleteNote = (id: string) => {
    setNotesList(notesList.filter(n => n.id !== id));
  };

  const [selectedTask, setSelectedTask] = useState(() => localStorage.getItem('aura-focus-task') || '');
  const [expectedTimeMinutes, setExpectedTimeMinutes] = useState(() => localStorage.getItem('aura-focus-expected-minutes') || '30');
  const [actualStartTimeIso, setActualStartTimeIso] = useState(() => localStorage.getItem('aura-focus-start-time-iso') || '');
  const startTime = useRef<number | null>(() => {
      const saved = localStorage.getItem('aura-focus-start-time');
      return saved ? parseInt(saved) : null;
  });

  useEffect(() => {
    localStorage.setItem('aura-focus-running', isRunning.toString());
    localStorage.setItem('aura-focus-paused', isPaused.toString());
    localStorage.setItem('aura-focus-pause-start-time', pauseStartTime ? pauseStartTime.toString() : '');
    localStorage.setItem('aura-focus-total-paused-ms', totalPausedMs.toString());
    localStorage.setItem('aura-focus-task', selectedTask);
    localStorage.setItem('aura-focus-expected-minutes', expectedTimeMinutes);
    localStorage.setItem('aura-focus-start-time-iso', actualStartTimeIso);
    localStorage.setItem('aura-focus-start-time', startTime.current ? startTime.current.toString() : '');
  }, [isRunning, isPaused, pauseStartTime, totalPausedMs, selectedTask, expectedTimeMinutes, actualStartTimeIso]);

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
    setTotalPausedMs(0);
    setIsPaused(false);
    setActualStartTimeIso(new Date().toISOString());
    setIsRunning(true);
  };

  const handlePauseResume = () => {
    if (isPaused) {
      // Resuming
      if (pauseStartTime) {
        setTotalPausedMs(prev => prev + (Date.now() - pauseStartTime));
      }
      setPauseStartTime(null);
      setIsPaused(false);
    } else {
      // Pausing
      setPauseStartTime(Date.now());
      setIsPaused(true);
    }
  };

  const handleStopFocus = () => {
    setShowFeedbackModal(true);
  };

  const handleBackFromMode = () => {
    if (activeMode === 'focus') {
      if (isRunning) {
        requestConfirm(
          'كدا هترجع من الاول وتخسر تركيزك، متأكد؟ ⚠️',
          'الخروج الآن سيؤدي لإلغاء الجلسة الحالية ومسح أي ملاحظات لم يتم حفظها.',
          <Zap className="w-12 h-12 text-blue-500 mb-6 mx-auto" />,
          () => {
            setIsRunning(false);
            setIsPaused(false);
            setActiveMode('hub');
          }
        );
      } else {
        if (selectedTask || notesList.length > 0) {
          requestConfirm(
            'متأكد إنك عايز تخرج؟ ⚠️',
            'كل اللي كتبته في الجلسة الحالية هيتمسح.',
            <RotateCcw className="w-12 h-12 text-amber-500 mb-6 mx-auto" />,
            () => setActiveMode('hub')
          );
        } else {
          setActiveMode('hub');
        }
      }
    } else {
      setActiveMode('hub');
    }
  };

  const finalizeFocus = () => {
    setIsRunning(false);
    let currentTotalPaused = totalPausedMs;
    if (isPaused && pauseStartTime) {
       currentTotalPaused += (Date.now() - pauseStartTime);
    }
    setIsPaused(false);

    let actualMinutes = 0;
    if (startTime.current) {
        const diffMs = (Date.now() - startTime.current) - currentTotalPaused;
        actualMinutes = Math.floor(diffMs / 60000);
    }

    // Prepare encouragement message and celebration
    const expected = parseInt(expectedTimeMinutes) || 0;
    
    // We will show a system alert for the motivational feedback.
    
    let sysFeedback = sessionFeedback;
    let encouragement = "";
    const nameStr = userName ? ` يا ${userName}` : '';
    if (expected > 0) {
      if (actualMinutes >= expected) {
        encouragement = `عاش بجد${nameStr}! ركزت أكتر من الوقت المطلوب. أنا فخور بيك جداً 🔥`;
        if(onCelebrate) onCelebrate('high');
      } else if (actualMinutes >= expected / 2) {
        encouragement = `بطل${nameStr}! عديت نص الوقت بتركيز، كمل المرة الجاية وتجيبها كلها 💪`;
        if(onCelebrate) onCelebrate('medium');
      } else if (actualMinutes > 0) {
        encouragement = `حلو إنك بدأت${nameStr}! تركيز قليل أحسن من مفيش، المرة الجاية نقدر على أكتر 🌟`;
        if(onCelebrate) onCelebrate('low');
      } else {
        encouragement = `ملحقتش تركز${nameStr}؟ متزعلش، خد نفس وابدأ من تاني وانت مرتاح 💙`;
      }
    } else {
       if (actualMinutes > 0) {
          encouragement = `عملت جلسة تركيز ممتازة، كمل في طريقك${nameStr}! 🚀`;
          if(onCelebrate) onCelebrate('high');
       }
    }
    
    // Append the encouragement to the actual feedback text saved 
    sysFeedback = `${encouragement}\n\n[ما تم كتابته]: ${sessionFeedback}`;

    // Find if task is a habit to associate habitId
    const associatedHabit = habits.find(h => h.name === selectedTask);

    const sessionData = {
       id: Date.now().toString(),
       habitId: associatedHabit?.id,
       task: selectedTask,
       expectedMinutes: expected,
       actualMinutes,
       startTime: actualStartTimeIso,
       endTime: new Date().toISOString(),
       note: notesList.map(n => n.text).join('\n---\n') + (currentNote.trim() ? `\n---\n${currentNote}` : ''),
       feedback: sysFeedback,
       tag: tag,
       type: 'focus'
    };

    setFocusSessions(prev => [...(prev || []), sessionData]);
    setShowFeedbackModal(false);
    setActiveMode('hub');
    setNotesList([]);
    setCurrentNote('');
    setSessionFeedback('');
    setSelectedTask('');
    setExpectedTimeMinutes('30');
    setTag('عام');
    
    // Show an alert to talk to the user directly
    if (showFeedback) {
       showFeedback(encouragement || "عاش يا بطل!", 'success');
    } else {
       setTimeout(() => {
          alert(encouragement || "عاش يا بطل!");
       }, 500);
    }
  };

// Removed startRecording here

  if (activeMode === 'recovery') {
    return (
      <div className="fixed inset-0 z-[200] bg-amber-50 dark:bg-slate-950 flex flex-col pt-12 p-8 text-right overflow-y-auto w-full h-full font-sans">
        <div className="flex items-center justify-between mb-16">
           <button onClick={() => setActiveMode('hub')} className="w-10 h-10 rounded-full bg-white dark:bg-slate-900 flex items-center justify-center text-slate-400">
             <ArrowRight className="w-5 h-5 shadow-sm" />
           </button>
           <div className="text-right">
              <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100">Aura Recovery</h2>
              <p className="text-[10px] font-black uppercase tracking-widest text-amber-500">Healing & Growth Workspace</p>
           </div>
        </div>

        <div className="flex-1 flex flex-col items-center justify-start gap-8 max-w-sm mx-auto w-full">
           <div className="w-32 h-32 bg-white dark:bg-slate-900 rounded-[2.5rem] flex items-center justify-center text-amber-500 shadow-xl shadow-amber-500/10">
              <RotateCcw className="w-12 h-12" />
           </div>
           
           <div className="text-center space-y-4">
              <h3 className="text-xl font-black text-slate-800 dark:text-white leading-tight">وقت الاستراحة والتعافي</h3>
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400 leading-relaxed">
                الوقعات والارهاق جزء من الرحلة. في Aura، الاستعادة مش بس مجرد راحة، هي خطوة ذكية للرجوع أقوى وبوعي أكبر ليه ده حصل.
              </p>
           </div>
           
           <div className="w-full bg-amber-50 dark:bg-amber-900/20 p-6 rounded-3xl border border-amber-200 dark:border-amber-800/50 flex flex-row-reverse items-center justify-between shadow-sm">
             <div className="flex flex-col text-right">
                <span className="text-sm font-black text-amber-800 dark:text-amber-100 mb-1">تفعيل الاستعادة الشاملة</span>
                <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400/80">النقاط مضاعفة لتشجيعك على الرجوع</span>
             </div>
             <button 
                onClick={() => setGlobalRecoveryMode && setGlobalRecoveryMode(!globalRecoveryMode)}
                className={`w-14 h-8 rounded-full transition-colors relative shadow-inner ${globalRecoveryMode ? 'bg-amber-500' : 'bg-slate-300 dark:bg-slate-700'}`}
             >
                <div className={`w-6 h-6 rounded-full bg-white absolute top-1 transition-transform shadow-sm ${globalRecoveryMode ? 'right-7' : 'right-1'}`} />
             </button>
           </div>

           <div className="w-full space-y-4 pt-2">
              <button 
                onClick={() => {
                   setSelectedTask('تأمل سريع وهدوء');
                   setTag('تفكير');
                   setExpectedTimeMinutes('5');
                   setActiveMode('focus');
                }} 
                className="w-full p-6 bg-white dark:bg-slate-900 rounded-3xl border border-amber-100 dark:border-slate-800 flex flex-row-reverse items-center justify-between group hover:border-amber-400 transition-all"
              >
                <div className="flex flex-col text-right">
                  <span className="text-sm font-black text-slate-800 dark:text-slate-100">تأمل سريع (5 دقائق) 🧘‍♂️</span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Mindfulness Break</span>
                </div>
                <ArrowRight className="w-4 h-4 -rotate-180 text-amber-500" />
              </button>

              <button 
                onClick={() => {
                   setSelectedTask('سجل الامتنان والوعي');
                   setTag('تفكير');
                   setExpectedTimeMinutes('10');
                   setActiveMode('focus');
                }} 
                className="w-full p-6 bg-white dark:bg-slate-900 rounded-3xl border border-amber-100 dark:border-slate-800 flex flex-row-reverse items-center justify-between group hover:border-amber-400 transition-all"
              >
                <div className="flex flex-col text-right">
                  <span className="text-sm font-black text-slate-800 dark:text-slate-100">سجل الامتنان والوعي 📝</span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Gratitude Log</span>
                </div>
                <ArrowRight className="w-4 h-4 -rotate-180 text-amber-500" />
              </button>

              <button 
                onClick={() => {
                   setSelectedTask('تحليل العثرات والتعلم');
                   setTag('تفكير');
                   setExpectedTimeMinutes('15');
                   setActiveMode('focus');
                }} 
                className="w-full p-6 bg-white dark:bg-slate-900 rounded-3xl border border-amber-100 dark:border-slate-800 flex flex-row-reverse items-center justify-between group hover:border-amber-400 transition-all"
              >
                <div className="flex flex-col text-right">
                  <span className="text-sm font-black text-slate-800 dark:text-slate-100">تحليل الوقعة (الوقعات) 🧠</span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Relapse Analysis</span>
                </div>
                <ArrowRight className="w-4 h-4 -rotate-180 text-amber-500" />
              </button>
           </div>
        </div>
      </div>
    );
  }

  if (activeMode === 'focus') {
    return (
      <div className="fixed inset-0 z-[200] bg-white dark:bg-slate-950 flex flex-col pt-12 p-8 text-right overflow-y-auto w-full h-full font-sans">
        <div className="flex items-center justify-between mb-16">
           <button onClick={handleBackFromMode} className="w-12 h-12 rounded-full bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 flex items-center justify-center text-slate-400 hover:text-blue-500 transition-colors">
              <ArrowRight className="w-5 h-5" />
           </button> 
           <div className="text-right">
              <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100">Aura Focus</h2>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Deep Work Sanctuary</p>
           </div>
        </div>

        <div className="flex-1 flex flex-col items-center justify-start gap-10">
           {!isRunning && (
             <div className="w-full max-w-sm space-y-8 mb-4">
                <div className="space-y-2">
                   <label className="text-[10px] font-black text-slate-300 dark:text-slate-600 uppercase tracking-[0.3em] block text-right pr-2">المهمة أو المهارة (الهمة)</label>
                   <input
                     list="focus-tasks"
                     value={selectedTask}
                     onChange={(e) => setSelectedTask(e.target.value)}
                     placeholder="اختر مهارة أو اكتب مهمة..."
                     className="w-full bg-transparent border-b-2 border-slate-100 dark:border-slate-800 rounded-none px-2 py-4 text-right text-lg font-black text-slate-800 dark:text-slate-100 focus:border-blue-500 outline-none transition-all placeholder:text-slate-200"
                     dir="rtl"
                   />
                   <datalist id="focus-tasks">
                     {habits.map(h => <option key={h.id} value={h.name} />)}
                   </datalist>
                </div>
                <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-2 text-right">
                    <label className="text-[10px] font-black text-slate-300 dark:text-slate-600 uppercase tracking-[0.3em] block pr-2">التصنيف (Tag)</label>
                    <select
                      value={tag}
                      onChange={(e) => setTag(e.target.value)}
                      className="w-full bg-transparent border-b-2 border-slate-100 dark:border-slate-800 rounded-none px-2 py-4 text-right text-xs font-black text-slate-800 dark:text-slate-100 focus:border-blue-500 outline-none transition-all appearance-none"
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
                  <div className="space-y-2 text-right">
                    <label className="text-[10px] font-black text-slate-300 dark:text-slate-600 uppercase tracking-[0.3em] block pr-2">الوقت المتوقع</label>
                    <div className="flex items-center border-b-2 border-slate-100 dark:border-slate-800 focus-within:border-blue-500 transition-all">
                      <span className="text-[10px] font-black text-slate-300 ml-2">دقيقة</span>
                      <input
                        type="number"
                        value={expectedTimeMinutes}
                        onChange={(e) => setExpectedTimeMinutes(e.target.value)}
                        className="w-full bg-transparent rounded-none px-2 py-4 text-left text-lg font-black text-slate-800 dark:text-slate-100 outline-none tabular-nums"
                      />
                    </div>
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
                    <h3 className="text-3xl font-black text-slate-800 dark:text-white mb-2 italic">
                       {isPaused ? 'استراحة مؤقتة' : 'جلسة تركيز نشطة'}
                    </h3>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                       {isPaused ? 'خد نفس...' : 'Aura is keeping you focused'}
                    </p>
                 </div>
                 <div className="flex gap-4">
                    <button onClick={handlePauseResume} className={`px-8 py-5 rounded-[2rem] font-black text-sm uppercase tracking-widest shadow-lg hover:scale-105 transition-transform flex items-center gap-3 ${isPaused ? 'bg-amber-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
                       <Play className={`w-5 h-5 fill-current ${isPaused ? '' : 'hidden'}`} />
                       <Square className={`w-5 h-5 fill-current ${isPaused ? 'hidden' : ''}`} />
                       {isPaused ? 'إكمال' : 'إيقاف مؤقت'}
                    </button>
                    <button onClick={handleStopFocus} className="px-8 py-5 bg-red-500 text-white rounded-[2rem] font-black text-sm uppercase tracking-widest shadow-2xl hover:scale-105 transition-transform flex items-center gap-3">
                       <Square className="w-5 h-5 fill-current" />
                       إنهاء الجلسة
                    </button>
                 </div>
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
                  <div className="flex flex-col gap-3 max-h-60 overflow-y-auto w-full pr-2 space-y-2">
                    <AnimatePresence>
                      {notesList.map(n => (
                        <motion.div key={n.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, scale: 0.8 }} className="group flex flex-col bg-blue-50 dark:bg-blue-900/10 p-4 rounded-2xl border border-blue-100 dark:border-blue-900/30 text-right gap-2">
                          <textarea 
                            value={n.text}
                            onChange={(e) => handleEditNote(n.id, e.target.value)}
                            className="bg-transparent border-none outline-none resize-none w-full text-sm font-bold text-slate-700 dark:text-slate-300 min-h-[40px]"
                            dir="rtl"
                          />
                          <button onClick={() => handleDeleteNote(n.id)} className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-500 self-start opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center hover:bg-blue-600 hover:text-white">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>

                  <div className="flex bg-slate-50 dark:bg-slate-900 p-2 rounded-3xl border border-slate-100 dark:border-slate-800 items-center justify-between gap-2 shadow-sm focus-within:border-blue-500 transition-colors">
                     <button onClick={handleAddNote} className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-lg hover:bg-blue-700 transition-all active:scale-95 flex-shrink-0">
                       <Plus className="w-5 h-5" />
                     </button>
                     <textarea 
                       value={currentNote}
                       onChange={(e) => setCurrentNote(e.target.value)}
                       onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAddNote(); } }}
                       placeholder="دوّن ملاحظة سريعة (Enter للحفظ)..."
                       className="w-full bg-transparent border-none outline-none text-right font-sans text-sm resize-none pt-4 text-slate-800 dark:text-slate-100 h-12"
                       dir="rtl"
                     />
                  </div>

                  <div className="flex gap-3">
                    <div className="flex-1 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-full flex items-center justify-end px-6 text-xs font-bold text-slate-400">
                      ملاحظات نصية جاهزة
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
      <div className="fixed inset-0 z-[200] bg-white dark:bg-slate-950 flex flex-col w-full h-full overflow-y-auto no-scrollbar font-sans">
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

         {/* Aura Recovery */}
         <button onClick={() => setActiveMode('recovery')} className="w-full p-8 bg-amber-50 dark:bg-amber-900/10 hover:bg-amber-100 dark:hover:bg-amber-900/20 border border-amber-100 dark:border-amber-900/30 rounded-[2.5rem] flex flex-col items-end gap-3 transition-all hover:scale-[1.02] active:scale-95 shadow-sm hover:shadow-xl hover:shadow-amber-500/5 group text-right">
            <div className="w-16 h-16 bg-white dark:bg-slate-900 flex items-center justify-center rounded-3xl shadow-sm text-amber-500 group-hover:scale-110 transition-transform">
               <RotateCcw className="w-8 h-8" />
            </div>
            <div>
               <h3 className="text-xl font-black text-slate-800 dark:text-slate-100">Aura Recovery</h3>
               <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">وضع الاستعادة. لإعادة شحن طاقتك بعد يوم شاق أو وقعة، والبدء من جديد بوعي أكبر.</p>
            </div>
         </button>
      </div>
    </motion.div>
  );
};
