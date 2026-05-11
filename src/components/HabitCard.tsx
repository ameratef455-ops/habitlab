import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Check, Flame, MessageSquare, Mic, AlertCircle, TrendingUp, Calendar, Clock, Goal, ListOrdered, Plus, MoreVertical, Edit3, Trash2, Sparkles, Target, Zap } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { Habit } from '../types';

interface HabitCardProps {
  habit: Habit;
  onComplete: (note?: string, type?: 'text' | 'voice', recovery?: boolean, questionnaire?: any) => void;
  isCompletedToday: boolean;
  onEdit: (habit: Habit) => void;
  onDelete: (id: string) => void;
  onToggleRecovery: (id: string) => void;
  isGlobalRecovery?: boolean;
}

export const HabitCard: React.FC<HabitCardProps> = ({ habit, onComplete, isCompletedToday, onEdit, onDelete, onToggleRecovery, isGlobalRecovery }) => {
  const [showNoteInput, setShowNoteInput] = useState(false);
  const [note, setNote] = useState('');
  const [isRecovery, setIsRecovery] = useState(false);
  const [showActions, setShowActions] = useState(false);
  
  // Questionnaire state
  const [step, setStep] = useState(0); // -1: quick choice, 0: note, 1: details
  const [qData, setQData] = useState({
    onTime: true,
    onExpectedTime: true,
    actualTime: '',
    focus: 3,
    goalLevel: 'expected' as 'min' | 'expected' | 'exceeded'
  });

  const [showDetails, setShowDetails] = useState(false);
  const [isRecording, setIsRecording] = useState(false);

  const handleQuickComplete = () => {
    setShowNoteInput(true);
    setStep(-1);
  };

  const recordImmediately = () => {
    onComplete(undefined, 'text', isRecovery || isGlobalRecovery, { ...qData, isQuick: true });
    setShowNoteInput(false);
    setStep(0);
  };

  const handleComplete = (type: 'text' | 'voice' = 'text') => {
    onComplete(note, type, isRecovery || isGlobalRecovery, qData);
    setShowNoteInput(false);
    setNote('');
    setStep(0);
    setIsRecording(false);
  };

  const startRecording = () => {
    setIsRecording(true);
    // Mimic recording
    setTimeout(() => {
      setIsRecording(false);
      setNote('تسجيل صوتي تم حفظه بنجاح 🎙️');
    }, 3000);
  };

  const progress = React.useMemo(() => {
    if (!habit.awayGoal || !habit.awayGoal.targetDate) return 0;
    
    // Use createdAt or default to 30 days ago
    const start = habit.createdAt ? new Date(habit.createdAt).getTime() : (Date.now() - 30 * 24 * 60 * 60 * 1000);
    const target = new Date(habit.awayGoal.targetDate).getTime();
    const now = Date.now();
    
    if (target <= start) return 100;
    
    const total = target - start;
    const elapsed = now - start;
    
    return Math.min(100, Math.max(0, (elapsed / total) * 100));
  }, [habit]);

  const isNearGoal = progress >= 80 && progress < 100;

  const HabitIcon = (LucideIcons as any)[habit.icon] || LucideIcons.CheckCircle2;

  const goalCounts = React.useMemo(() => {
    const counts = { min: 0, expected: 0, exceeded: 0 };
    habit.notes?.forEach(n => {
      if (n.goalLevel) counts[n.goalLevel]++;
    });
    return counts;
  }, [habit.notes]);

  return (
    <motion.div 
      layout
      className="relative flex flex-col sm:flex-row gap-4 sm:gap-6 group items-center sm:items-start text-center sm:text-right"
    >
      {/* Timeline Node (Hidden on mobile for better centering) */}
      <div className="hidden sm:flex relative flex-col items-center">
        <div className={`w-8 h-8 rounded-full z-10 flex items-center justify-center transition-all duration-500 border-2 ${
          isCompletedToday 
            ? 'bg-emerald-500 border-emerald-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.4)]' 
            : 'bg-white border-slate-200 text-slate-400 group-hover:border-indigo-500'
        }`}>
          {isCompletedToday ? <Check className="w-4 h-4" /> : <div className="w-1.5 h-1.5 rounded-full bg-current" />}
        </div>
        <div className="timeline-line" />
      </div>

      {/* Content Card */}
      <div className="w-full sm:flex-1 pb-4 sm:pb-6">
        <motion.div 
          animate={isNearGoal && !isCompletedToday ? { 
            boxShadow: ["0 0 0px rgba(99,102,241,0)", "0 0 40px rgba(99,102,241,0.3)", "0 0 0px rgba(99,102,241,0)"],
            borderColor: ["rgba(99,102,241,0.2)", "rgba(99,102,241,1)", "rgba(99,102,241,0.2)"]
          } : {}}
          transition={{ repeat: Infinity, duration: 2 }}
          className={`p-5 rounded-[2rem] glass transition-all duration-500 relative overflow-hidden border capitalize ${
            isCompletedToday 
              ? 'opacity-60 border-transparent bg-slate-50/20' 
              : isNearGoal 
                ? 'shadow-2xl shadow-indigo-500/5 border-indigo-500 bg-white/90'
                : 'shadow-lg shadow-slate-200/50 border-white/50 backdrop-blur-3xl bg-white/80'
          }`}
        >
          {isNearGoal && !isCompletedToday && (
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: [0, 1.2, 1] }}
              className="absolute -top-1 -right-1 w-24 h-24 bg-indigo-500/5 blur-2xl rounded-full"
            />
          )}

          <div className="flex flex-col gap-4 relative z-10">
            <div className="flex items-start justify-between">
              <div className="flex gap-4 items-center">
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-colors duration-500 text-white ${
                  isCompletedToday ? 'bg-emerald-400' : (habit.color || 'bg-indigo-500')
                }`}>
                  <HabitIcon className="w-5 h-5" />
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-2 mb-0.5">
                    <h4 className="text-base font-black tracking-tight text-slate-800 dark:text-slate-100">{habit.name}</h4>
                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{habit.category || 'العامة'}</span>
                  </div>
                  <div className="flex items-center gap-3 text-[8px] font-bold text-slate-400 uppercase tracking-widest flex-row-reverse">
                    <span className="flex items-center gap-1"><Clock className="w-2.5 h-2.5" /> {habit.time || 'أي وقت'}</span>
                    <span className="flex items-center gap-1"><Flame className="w-2.5 h-2.5 text-orange-400" /> {habit.streak} يوم</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5 opacity-40 hover:opacity-100 transition-opacity">
                <button 
                  onClick={() => onEdit(habit)}
                  className="w-8 h-8 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 transition-all flex items-center justify-center"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
                <button 
                  onClick={() => onDelete(habit.id)}
                  className="w-8 h-8 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-all flex items-center justify-center"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="space-y-4">
               {/* Away Goal Progress */}
               <div className="space-y-1.5 bg-slate-50/50 dark:bg-slate-800/20 p-3 rounded-2xl border border-slate-100 dark:border-slate-800/50">
                  <div className="flex justify-between items-center px-1 mb-1">
                     <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">المتبقي للهدف البعيد</span>
                     <span className="text-[8px] font-black text-indigo-500">{Math.round(progress)}%</span>
                  </div>
                  <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden relative">
                     <motion.div 
                       initial={{ width: 0 }}
                       animate={{ width: `${progress}%` }}
                       className={`h-full relative ${
                         isNearGoal 
                           ? 'bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 animate-gradient-x' 
                           : 'bg-gradient-to-r from-indigo-400 to-indigo-600'
                       }`}
                     />
                  </div>
               </div>

               {/* Details Toggle */}
               <div className="pt-2 border-t border-slate-50 dark:border-slate-800/50">
                  <button 
                    onClick={() => setShowDetails(!showDetails)}
                    className="w-full flex items-center justify-between px-2 py-1 text-[8px] font-black text-slate-400 uppercase tracking-widest hover:text-indigo-500 transition-colors"
                  >
                    <span>{showDetails ? 'إخفاء التفاصيل' : 'عرض تفاصيل العادة'}</span>
                    <Plus className={`w-2.5 h-2.5 transition-transform ${showDetails ? 'rotate-45' : ''}`} />
                  </button>
                  
                  <AnimatePresence>
                    {showDetails && (
                      <motion.div 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="grid grid-cols-2 gap-2 pt-3">
                           <div className="col-span-2 flex gap-1 justify-end mb-1">
                              <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-600 text-[7px] font-black uppercase">ممتاز: {goalCounts.exceeded}</span>
                              <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-600 text-[7px] font-black uppercase">متوقع: {goalCounts.expected}</span>
                              <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-600 text-[7px] font-black uppercase">أدنى: {goalCounts.min}</span>
                              <span className="text-[8px] font-black text-slate-400 uppercase mr-1">الإنجازات:</span>
                           </div>
                           <div className="p-2 bg-slate-50/50 dark:bg-slate-800/50 rounded-xl flex items-center gap-2 justify-end">
                              <span className="text-[9px] font-bold text-slate-600 dark:text-slate-300">{habit.frequency}</span>
                              <span className="text-[8px] font-black text-slate-400 uppercase">تكرار العادة</span>
                              <Calendar className="w-2.5 h-2.5 text-indigo-400" />
                           </div>
                           <div className="p-2 bg-slate-50/50 dark:bg-slate-800/50 rounded-xl flex items-center gap-2 justify-end">
                              <span className="text-[9px] font-bold text-slate-600 dark:text-slate-300">{habit.nearGoal.target} {habit.nearGoal.frequency}</span>
                              <span className="text-[8px] font-black text-slate-400 uppercase">تكرار الهدف القريب</span>
                              <ListOrdered className="w-2.5 h-2.5 text-blue-400" />
                           </div>
                           <div className="p-2 bg-slate-50/50 dark:bg-slate-800/50 rounded-xl flex items-center gap-2 justify-end">
                              <span className="text-[9px] font-bold text-slate-600 dark:text-slate-300">{habit.minGoal}</span>
                              <span className="text-[8px] font-black text-slate-400 uppercase">الحد الأدنى</span>
                              <TrendingUp className="w-2.5 h-2.5 text-amber-400" />
                           </div>
                           <div className="p-2 bg-slate-50/50 dark:bg-slate-800/50 rounded-xl flex items-center gap-2 justify-end">
                              <span className="text-[9px] font-bold text-slate-600 dark:text-slate-300">{habit.expectedGoal}</span>
                              <span className="text-[8px] font-black text-slate-400 uppercase">الهدف المتوقع</span>
                              <Target className="w-2.5 h-2.5 text-emerald-400" />
                           </div>
                           <div className="p-2 bg-slate-50/50 dark:bg-slate-800/50 rounded-xl flex items-center gap-2 justify-end">
                              <span className="text-[9px] font-bold text-slate-600 dark:text-slate-300">{habit.duration} د</span>
                              <span className="text-[8px] font-black text-slate-400 uppercase">المدة</span>
                              <Goal className="w-2.5 h-2.5 text-blue-400" />
                           </div>
                           <div className="col-span-2 p-2 bg-indigo-50/30 dark:bg-indigo-900/10 rounded-xl flex items-center gap-2 justify-end">
                              <span className="text-[9px] font-bold text-indigo-600 dark:text-indigo-300">{habit.awayGoal.description}</span>
                              <span className="text-[8px] font-black text-indigo-400 uppercase">الهدف البعيد</span>
                              <Sparkles className="w-2.5 h-2.5 text-purple-400" />
                           </div>
                           {habit.replacingHabit && (
                             <div className="col-span-2 p-2 bg-rose-50/30 dark:bg-rose-900/10 rounded-xl flex items-center gap-2 justify-end">
                                <span className="text-[9px] font-bold text-rose-600 dark:text-rose-300">{habit.replacingHabit}</span>
                                <span className="text-[8px] font-black text-rose-400 uppercase">بديل لـ</span>
                                <AlertCircle className="w-2.5 h-2.5 text-rose-400" />
                             </div>
                           )}
                           {habit.motivation && (
                             <div className="col-span-2 p-2 bg-amber-50/50 dark:bg-amber-900/10 rounded-xl flex items-center gap-2 justify-end">
                                <span className="text-[9px] font-bold text-amber-700 dark:text-amber-300">"{habit.motivation}"</span>
                                <span className="text-[8px] font-black text-amber-500 uppercase">الحافز</span>
                                <Zap className="w-2.5 h-2.5 text-amber-400" />
                             </div>
                           )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
               </div>

               {/* Buttons Row */}
               {!isCompletedToday && (
                 <div className="flex items-center gap-2 justify-end pt-2">
                   <button 
                    onClick={() => onToggleRecovery(habit.id)}
                    className={`h-9 px-4 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${
                      habit.isRecoveryModeEnabled 
                        ? 'bg-amber-100 text-amber-700 border border-amber-200 shadow-sm' 
                        : 'bg-white dark:bg-slate-800 text-slate-400 border border-slate-100 dark:border-slate-700 hover:bg-amber-50'
                    }`}
                  >
                    استعادة
                  </button>
                  <button 
                    onClick={handleQuickComplete}
                    className="h-9 px-4 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-emerald-500 hover:text-white transition-all shadow-sm"
                  >
                    إنجاز سريع
                  </button>
                  <button 
                    onClick={() => setShowNoteInput(true)}
                    className="h-9 px-6 bg-indigo-500 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-indigo-600 transition-all shadow-md shadow-indigo-500/20"
                  >
                    بدء التسجيل
                  </button>
                 </div>
               )}
            </div>
          </div>

          <AnimatePresence mode="wait">
            {showNoteInput && (
              <motion.div 
                key={step}
                initial={{ height: 0, opacity: 0, x: step === 1 ? 20 : -20 }}
                animate={{ height: 'auto', opacity: 1, x: 0 }}
                exit={{ height: 0, opacity: 0, x: step === 1 ? -20 : 20 }}
                className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800 space-y-4"
              >
                {step === -1 ? (
                  <div className="space-y-6 text-right">
                    <div className="flex items-center justify-end gap-2 text-indigo-500">
                       <span className="text-xs font-black uppercase tracking-widest">إتمام الإنجاز</span>
                       <Zap className="w-4 h-4 fill-current" />
                    </div>
                    <p className="text-xs font-bold text-slate-500">تحب تسجل الإنجاز دلوقتى ولا تضيف شوية تفاصيل؟</p>
                    <div className="grid grid-cols-2 gap-3">
                       <button 
                         onClick={recordImmediately}
                         className="py-4 bg-emerald-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-emerald-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                       >
                          سجل فوراً (١٠ نقاط)
                       </button>
                       <button 
                         onClick={() => setStep(0)}
                         className="py-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
                       >
                          إضافة ملاحظات
                       </button>
                    </div>
                  </div>
                ) : step === 0 ? (
                  <>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2 text-indigo-500">
                        <MessageSquare className="w-4 h-4" />
                        <span className="text-[10px] font-black uppercase tracking-widest">ملاحظات اليوم</span>
                      </div>
                      <button 
                        type="button"
                        onClick={startRecording}
                        className={`p-2 rounded-lg transition-all ${isRecording ? 'bg-rose-500 text-white animate-pulse' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-indigo-500 dark:hover:text-indigo-400'}`}
                      >
                        <Mic className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="relative">
                      <textarea 
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-800/50 p-4 rounded-3xl border border-slate-100 dark:border-slate-800 outline-none focus:border-indigo-500 text-xs font-semibold resize-none h-24 text-right dark:text-slate-200"
                        placeholder={isRecording ? 'جاري التسجيل... استنى شوية' : 'إيه اللي حصل النهاردة؟ حسيت بإيه؟'}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <button 
                        onClick={() => setIsRecovery(!isRecovery)}
                        className={`text-[9px] font-black uppercase tracking-widest px-4 py-2 rounded-xl transition-all border ${
                          isRecovery 
                            ? 'bg-amber-500 text-white border-amber-500 shadow-lg shadow-amber-500/20' 
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-transparent hover:border-slate-300 dark:hover:border-slate-700'
                        }`}
                      >
                        وضع الاستشفاء
                      </button>
                      <button 
                        onClick={() => setStep(1)}
                        className="px-8 py-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 dark:hover:bg-slate-100 shadow-xl active:scale-95 transition-all"
                      >
                        التالي
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="space-y-6 text-right">
                    <div>
                      <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-3">أي مستوى حققت اليوم؟</span>
                      <div className="grid grid-cols-3 gap-2">
                        <button 
                          onClick={() => setQData({...qData, goalLevel: 'min'})}
                          className={`px-3 py-3 rounded-xl text-[9px] font-black border transition-all ${qData.goalLevel === 'min' ? 'bg-amber-500 text-white border-amber-500 shadow-lg shadow-amber-500/20' : 'bg-slate-50 dark:bg-slate-800 border-slate-100 dark:border-slate-800 text-slate-400 uppercase tracking-tight'}`}
                        >
                          <span className="block opacity-50 mb-0.5">الحد الأدنى</span>
                          {habit.minGoal}
                        </button>
                        <button 
                          onClick={() => setQData({...qData, goalLevel: 'expected'})}
                          className={`px-3 py-3 rounded-xl text-[9px] font-black border transition-all ${qData.goalLevel === 'expected' ? 'bg-indigo-500 text-white border-indigo-500 shadow-lg shadow-indigo-500/20' : 'bg-slate-50 dark:bg-slate-800 border-slate-100 dark:border-slate-800 text-slate-400 uppercase tracking-tight'}`}
                        >
                          <span className="block opacity-50 mb-0.5">المتوقع</span>
                          {habit.expectedGoal}
                        </button>
                        <button 
                          onClick={() => setQData({...qData, goalLevel: 'exceeded'})}
                          className={`px-3 py-3 rounded-xl text-[9px] font-black border transition-all ${qData.goalLevel === 'exceeded' ? 'bg-emerald-500 text-white border-emerald-500 shadow-lg shadow-emerald-500/20' : 'bg-slate-50 dark:bg-slate-800 border-slate-100 dark:border-slate-800 text-slate-400 uppercase tracking-tight'}`}
                        >
                          <span className="block opacity-50 mb-0.5">ممتاز</span>
                          {habit.expectedGoal}+
                        </button>
                      </div>
                    </div>

                    <div>
                      <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-3">كيف كان تركيزك؟</span>
                      <div className="flex gap-2 flex-wrap justify-end flex-row-reverse">
                        {[1, 2, 3, 4, 5].map(score => (
                          <button 
                            key={`focus-${score}`}
                            onClick={() => setQData({...qData, focus: score})}
                            className={`w-10 h-10 rounded-xl text-[12px] font-black border transition-all flex items-center justify-center ${qData.focus === score ? 'bg-indigo-500 text-white border-indigo-500 shadow-lg shadow-indigo-500/20' : 'bg-slate-50 dark:bg-slate-800 border-slate-100 dark:border-slate-800 text-slate-400 hover:border-indigo-200'}`}
                          >
                            {score}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-3">هل كنت في الموعد؟</span>
                      <div className="flex gap-2 justify-end">
                        <button 
                          onClick={() => setQData({...qData, onTime: true})}
                          className={`px-4 py-2 rounded-xl text-[10px] font-bold border transition-all ${qData.onTime ? 'bg-emerald-500 text-white border-emerald-500' : 'bg-slate-50 dark:bg-slate-800 border-slate-100 dark:border-slate-800 text-slate-400 dark:text-slate-500'}`}
                        >نعم</button>
                        <button 
                          onClick={() => setQData({...qData, onTime: false})}
                          className={`px-4 py-2 rounded-xl text-[10px] font-bold border transition-all ${!qData.onTime ? 'bg-rose-500 text-white border-rose-500' : 'bg-slate-50 dark:bg-slate-800 border-slate-100 dark:border-slate-800 text-slate-400 dark:text-slate-500'}`}
                        >لا</button>
                      </div>
                    </div>

                    <div>
                      <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-3">هل قضيت الوقت المتوقع؟ ({habit.duration || 'غير محدد'} د)</span>
                      <div className="flex gap-2 justify-end mb-3">
                        <button 
                          onClick={() => setQData({...qData, onExpectedTime: true, actualTime: habit.duration || ''})}
                          className={`px-4 py-2 rounded-xl text-[10px] font-bold border transition-all ${qData.onExpectedTime ? 'bg-emerald-500 text-white border-emerald-500' : 'bg-slate-50 dark:bg-slate-800 border-slate-100 dark:border-slate-800 text-slate-400 dark:text-slate-500'}`}
                        >نعم</button>
                        <button 
                          onClick={() => setQData({...qData, onExpectedTime: false})}
                          className={`px-4 py-2 rounded-xl text-[10px] font-bold border transition-all ${!qData.onExpectedTime ? 'bg-rose-500 text-white border-rose-500' : 'bg-slate-50 dark:bg-slate-800 border-slate-100 dark:border-slate-800 text-slate-400 dark:text-slate-500'}`}
                        >لا</button>
                      </div>
                      {!qData.onExpectedTime && (
                        <motion.div 
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border border-slate-100 dark:border-slate-700"
                        >
                           <input 
                              type="text" 
                              placeholder="قد ايه تقريباً؟"
                              value={qData.actualTime}
                              onChange={(e) => setQData({...qData, actualTime: e.target.value})}
                              className="flex-1 bg-transparent text-right text-xs font-bold font-mono outline-none dark:text-slate-200"
                           />
                           <span className="text-[10px] font-black text-slate-400">دقيقة</span>
                        </motion.div>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-4">
                      <button 
                        onClick={() => setStep(0)}
                        className="text-[10px] font-black text-slate-400 dark:text-slate-500 underline underline-offset-4"
                      >رجوع</button>
                      <button 
                        onClick={() => handleComplete(note.includes('تسجيل') ? 'voice' : 'text')}
                        className="px-8 py-3 bg-indigo-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-600 shadow-xl shadow-indigo-500/20 active:scale-95 transition-all"
                      >تأكيد نهائي</button>
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {isCompletedToday && (
            <div className="mt-4 flex items-center justify-between">
              <div className="flex items-center gap-2 text-emerald-500">
                <div className="w-6 h-6 rounded-full bg-emerald-500/10 flex items-center justify-center">
                  <Check className="w-3.5 h-3.5" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest">مهمة مكتملة</span>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </motion.div>
  );
};
