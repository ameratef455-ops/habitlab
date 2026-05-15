import React, { useState, memo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Check, Flame, MessageSquare, Mic, AlertCircle, TrendingUp, Calendar, Clock, Goal, ListOrdered, Plus, MoreVertical, Edit3, Trash2, Sparkles, Target, Zap, CheckCircle2, Flag } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { Habit } from '../types';

interface HabitCardProps {
  habit: Habit;
  onComplete: (note?: string, type?: 'text' | 'voice', recovery?: boolean, questionnaire?: any) => void;
  isCompletedToday: boolean;
  onEdit: (habit: Habit) => void;
  onDelete: (id: string) => void;
  onToggleRecovery: (id: string) => void;
  onRelapse: (id: string, reason: string) => void;
  isGlobalRecovery?: boolean;
  onIconClick?: (iconName: string, habitName: string) => void;
  onCancelAlert?: () => void;
}

export const HabitCard = memo<HabitCardProps>(({ habit, onComplete, isCompletedToday, onEdit, onDelete, onToggleRecovery, onRelapse, isGlobalRecovery, onIconClick, onCancelAlert }) => {
  const [showNoteInput, setShowNoteInput] = useState(false);
  const [showRelapseInput, setShowRelapseInput] = useState(false);
  const [relapseReason, setRelapseReason] = useState('');
  const [note, setNote] = useState('');
  const [noteTitle, setNoteTitle] = useState('');
  const [noteSubtitle, setNoteSubtitle] = useState('');
  const [isRecovery, setIsRecovery] = useState(false);
  const [showManageMenu, setShowManageMenu] = useState(false);
  const [showActionMenu, setShowActionMenu] = useState(false);
  
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
    let combinedNote = note;
    if (noteTitle || noteSubtitle) {
       combinedNote = `${noteTitle ? `# ${noteTitle}\n` : ''}${noteSubtitle ? `## ${noteSubtitle}\n` : ''}\n${note}`;
    }
    onComplete(combinedNote, type, isRecovery || isGlobalRecovery, qData);
    setShowNoteInput(false);
    setNote('');
    setNoteTitle('');
    setNoteSubtitle('');
    setStep(0);
    setIsRecording(false);
  };

  const startRecording = () => {
    setIsRecording(true);
    setTimeout(() => {
      setIsRecording(false);
      setNote('تسجيل صوتي تم حفظه بنجاح 🎙️');
    }, 3000);
  };

  const progress = React.useMemo(() => {
    if (!habit.awayGoal || !habit.awayGoal.targetDate) return 0;
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
    <div className="relative group w-full flex justify-center py-6 mx-auto mb-4 mt-8">
      <div className="absolute -top-6 left-0 right-0 flex flex-col items-center gap-2 z-20 pointer-events-none">
         {habit.nearGoal?.description && (
           <motion.div 
             initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
             className="bg-blue-500 text-white px-4 py-1.5 rounded-full shadow-lg shadow-blue-500/30 border-2 border-white dark:border-slate-800 text-[9px] font-black uppercase tracking-widest flex items-center gap-2 pointer-events-auto"
           >
             <span>الهدف القريب: {habit.nearGoal.description.substring(0,25)}</span>
             <Target className="w-3 h-3" />
           </motion.div>
         )}
         {habit.awayGoal?.description && (
           <motion.div 
             initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
             className="bg-emerald-500 text-white px-4 py-1.5 rounded-full shadow-lg shadow-emerald-500/30 border-2 border-white dark:border-slate-800 text-[9px] font-black uppercase tracking-widest flex items-center gap-2 pointer-events-auto"
           >
             <Sparkles className="w-3 h-3" />
             <span>الهدف البعيد: {habit.awayGoal.description.substring(0,25)}</span>
           </motion.div>
         )}
      </div>

      {/* Main Circular Card */}
      <motion.div 
        layout
        animate={isNearGoal && !isCompletedToday ? { 
          boxShadow: ["0 0 0px rgba(99,102,241,0)", "0 0 50px rgba(99,102,241,0.3)", "0 0 0px rgba(99,102,241,0)"],
          borderColor: ["rgba(99,102,241,0.2)", "rgba(99,102,241,1)", "rgba(99,102,241,0.2)"]
        } : {}}
        transition={{ repeat: Infinity, duration: 6 }}
        className={`w-full max-w-[340px] aspect-square rounded-full flex flex-col justify-center items-center text-center p-8 relative overflow-hidden transition-all duration-1000 mx-auto ${
          isCompletedToday 
            ? 'opacity-80 border-2 border-emerald-400 bg-emerald-50 dark:bg-emerald-900/10 shadow-[0_0_30px_rgba(16,185,129,0.15)]' 
            : isNearGoal 
              ? 'shadow-2xl shadow-blue-500/20 border border-blue-400 bg-white dark:bg-slate-800'
              : 'shadow-xl shadow-slate-200/50 dark:shadow-[0_10px_40px_-10px_rgba(0,0,0,0.3)] border border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800'
        }`}
      >
        {isCompletedToday && (
          <div className="absolute inset-0 bg-emerald-400/5 dark:bg-emerald-400/10 animate-pulse pointer-events-none" />
        )}

        <div className="absolute inset-2 flex items-center justify-center pointer-events-none">
           <svg className="absolute inset-0 w-full h-full -rotate-90">
             <circle cx="50%" cy="50%" r="48%" fill="none" strokeWidth="2" className="stroke-slate-100 dark:stroke-slate-700 opacity-50" />
             <motion.circle 
               cx="50%" cy="50%" r="48%" fill="none" strokeWidth="4" 
               strokeDasharray="301%"
               initial={{ strokeDashoffset: '301%' }}
               animate={{ strokeDashoffset: isCompletedToday ? '0%' : `${301 - (301 * progress / 100)}%` }}
               className={`transition-all duration-1000 ${isCompletedToday ? 'stroke-emerald-500' : 'stroke-blue-500'}`}
               strokeLinecap="round"
             />
           </svg>
        </div>

        {!showActionMenu && !showDetails && !showNoteInput && !showRelapseInput && (
          <div className="flex flex-col items-center justify-center relative z-10 w-full h-full">
            <button 
              onClick={() => onIconClick?.(habit.icon || 'CheckCircle2', habit.name)}
              className={`w-16 h-16 rounded-full mb-3 flex items-center justify-center transition-all duration-500 text-white shadow-xl ${
              isCompletedToday ? 'bg-gradient-to-tr from-emerald-500 to-emerald-400 shadow-emerald-500/40 scale-105' : 'bg-gradient-to-tr from-blue-600 to-blue-500 shadow-blue-500/40 hover:scale-110 active:scale-95'
            }`}>
              {isCompletedToday ? <Check className="w-8 h-8 animate-[scale-in_0.5s_ease-out]" /> : <HabitIcon className="w-8 h-8" />}
            </button>
            
            <h4 className="text-2xl font-black tracking-tight text-slate-800 dark:text-slate-100 leading-tight mb-2 px-2 max-w-[200px] break-words">{habit.name}</h4>
            
            <div className="flex items-center gap-3 text-[11px] font-bold text-slate-500 uppercase tracking-widest bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm px-4 py-1.5 rounded-full border border-slate-100 dark:border-slate-700">
              <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5 text-blue-400" /> {habit.time || 'أي وقت'}</span>
              <span className="flex items-center gap-1 text-orange-500"><Flame className="w-3.5 h-3.5 text-orange-400" /> {habit.streak} يوم</span>
            </div>

            <button 
              onClick={() => setShowManageMenu(!showManageMenu)}
              className="absolute top-2 right-2 w-10 h-10 rounded-full bg-slate-100/80 dark:bg-slate-700/80 text-slate-400 hover:text-blue-500 hover:bg-blue-50 transition-all flex items-center justify-center backdrop-blur-sm shadow-sm z-40"
            >
              <MoreVertical className="w-5 h-5" />
            </button>

            <AnimatePresence>
              {showManageMenu && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.3, ease: "easeInOut", delay: 0.05 }}
                  className="absolute top-14 right-2 w-40 bg-white/95 dark:bg-slate-800/95 backdrop-blur-xl border border-slate-100 dark:border-slate-700 shadow-2xl rounded-3xl overflow-hidden z-50 text-right"
                >
                  <button onClick={() => { onEdit(habit); setShowManageMenu(false); }} className="w-full px-5 py-3.5 text-xs font-bold text-slate-700 hover:bg-blue-50 dark:text-slate-200 dark:hover:bg-slate-700 flex items-center justify-between transition-colors">
                    تعديل <Edit3 className="w-4 h-4 ml-2 opacity-50" />
                  </button>
                  {habit.enableReminders && onCancelAlert && (
                    <button onClick={() => { onCancelAlert(); setShowManageMenu(false); }} className="w-full px-5 py-3.5 text-xs font-bold text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 flex items-center justify-between border-t border-slate-100 dark:border-slate-700 transition-colors">
                      حذف التنبيه <LucideIcons.BellOff className="w-4 h-4 ml-2 opacity-50" />
                    </button>
                  )}
                  <button onClick={() => { onDelete(habit.id); setShowManageMenu(false); }} className="w-full px-5 py-3.5 text-xs font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center justify-between border-t border-slate-100 dark:border-slate-700 transition-colors">
                    حذف <Trash2 className="w-4 h-4 ml-2 opacity-50" />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-3">
               <button 
                 onClick={() => setShowDetails(true)}
                 className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300 flex items-center justify-center hover:bg-blue-100 hover:text-blue-600 transition-all shadow-md active:scale-95 group/info"
               >
                 <ListOrdered className="w-5 h-5 group-hover/info:scale-125 transition-transform" />
               </button>
               {isCompletedToday ? (
                 <div className="w-12 h-12 rounded-full bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-500 flex items-center justify-center animate-pulse border border-emerald-500/30">
                   <Sparkles className="w-5 h-5" />
                 </div>
               ) : (
                 <button 
                   onClick={() => setShowActionMenu(true)}
                   className="w-12 h-12 rounded-full bg-blue-500 text-white flex items-center justify-center hover:bg-blue-600 active:scale-90 transition-all shadow-xl shadow-blue-500/40 relative group/check"
                 >
                   <Check className="w-6 h-6 group-hover/check:scale-125 transition-transform" />
                 </button>
               )}
            </div>
          </div>
        )}

        {/* Action Menu View */}
        <AnimatePresence>
          {showActionMenu && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, rotate: -5 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              exit={{ opacity: 0, scale: 0.9, rotate: 5 }}
              transition={{ duration: 0.3, ease: "easeInOut", delay: 0.05 }}
              className="absolute inset-0 bg-white/95 dark:bg-slate-800/95 backdrop-blur-xl z-20 flex flex-col justify-center items-center p-6 rounded-full"
            >
              <h5 className="text-[10px] font-black text-slate-600 dark:text-slate-300 mb-6 uppercase tracking-[0.2em] bg-slate-100 dark:bg-slate-700 px-4 py-2 rounded-full shadow-sm">Initialize Interaction</h5>
              <div className="grid grid-cols-2 gap-3 w-full max-w-[210px]">
                <button onClick={() => { setShowActionMenu(false); handleQuickComplete(); }} className="aspect-square bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-full text-[10px] font-black uppercase flex flex-col items-center justify-center gap-1 hover:scale-110 active:scale-90 transition-all shadow-sm group">
                  <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center text-xl group-hover:rotate-12 transition-transform">⚡</div>
                  سريع
                </button>
                <button onClick={() => { setShowActionMenu(false); setShowNoteInput(true); setStep(0); }} className="aspect-square bg-slate-50 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-full text-[10px] font-black uppercase flex flex-col items-center justify-center gap-1 hover:scale-110 active:scale-90 transition-all shadow-sm group">
                  <div className="w-8 h-8 rounded-full bg-slate-500/10 flex items-center justify-center text-xl group-hover:rotate-12 transition-transform">📝</div>
                  مفصل
                </button>
                <button onClick={() => { setShowActionMenu(false); onToggleRecovery(habit.id); }} className="aspect-square bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-full text-[10px] font-black uppercase flex flex-col items-center justify-center gap-1 hover:scale-110 active:scale-90 transition-all shadow-sm group">
                  <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center text-xl group-hover:rotate-12 transition-transform">🛡️</div>
                  {habit.isRecoveryModeEnabled ? 'إلغاء' : 'استعادة'}
                </button>
                <button onClick={() => { setShowActionMenu(false); setShowRelapseInput(true); }} className="aspect-square bg-orange-50 dark:bg-orange-900/20 text-orange-500 dark:text-orange-400 rounded-full text-[10px] font-black uppercase flex flex-col items-center justify-center gap-1 hover:scale-110 active:scale-90 transition-all shadow-sm group">
                  <div className="w-8 h-8 rounded-full bg-orange-500/10 flex items-center justify-center text-xl group-hover:rotate-12 transition-transform">🍂</div>
                  وقعـت؟
                </button>
              </div>
              <button 
                onClick={() => setShowActionMenu(false)} 
                className="mt-6 w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors"
              >
                <Plus className="w-5 h-5 rotate-45" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Details View */}
        <AnimatePresence>
            {showDetails && (
              <motion.div
                 initial={{ opacity: 0, scale: 0.9 }}
                 animate={{ opacity: 1, scale: 1 }}
                 exit={{ opacity: 0, scale: 0.9 }}
                 transition={{ duration: 0.3, ease: "easeInOut", delay: 0.05 }}
                 className="fixed inset-0 sm:inset-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 z-[100] bg-white dark:bg-slate-900 p-8 rounded-[3rem] shadow-[0_20px_60px_-10px_rgba(0,0,0,0.3)] border border-slate-100 dark:border-slate-800 text-right w-full sm:w-[500px] h-full sm:h-auto max-h-[90vh] flex flex-col pt-12 overflow-hidden"
              >
                 <div className="absolute top-0 right-0 w-full h-32 bg-gradient-to-b from-blue-500/5 to-transparent pointer-events-none" />
                 
                 <button 
                  onClick={() => setShowDetails(false)}
                  className="absolute top-6 right-1/2 translate-x-1/2 w-10 h-10 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-blue-500 transition-all z-40 shadow-sm border border-slate-100 dark:border-slate-700"
                >
                  <Plus className="w-5 h-5 rotate-45" />
                </button>

                 <div className="flex-1 overflow-y-auto no-scrollbar pt-8 w-full text-right px-2">
                    <div className="flex flex-col items-center mb-8">
                       <div className="w-20 h-20 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-500 mb-4 border-4 border-white dark:border-slate-800 shadow-xl">
                          {React.createElement((LucideIcons as any)[habit.icon || 'CheckCircle2'] || LucideIcons.CheckCircle2, { className: 'w-10 h-10' })}
                       </div>
                       <h3 className="text-2xl font-black text-slate-800 dark:text-white px-4 text-center">{habit.name}</h3>
                       <p className="text-[10px] font-black text-blue-500 uppercase tracking-[0.3em] mt-1">{habit.category}</p>
                    </div>

                    <div className="space-y-6">
                      {(habit as any).motivation && (
                        <div className="bg-emerald-50 dark:bg-emerald-900/10 p-6 rounded-[2.5rem] border border-emerald-100 dark:border-emerald-900/20">
                          <p className="text-[10px] font-black text-emerald-600 mb-2 uppercase tracking-widest flex items-center gap-2 justify-end">الحافز المباشر <TrendingUp className="w-3 h-3" /></p>
                          <p className="text-sm font-bold text-slate-700 dark:text-slate-300">{(habit as any).motivation}</p>
                        </div>
                      )}
                      
                      {(habit as any).replacingHabit && (
                        <div className="bg-orange-50 dark:bg-orange-900/10 p-6 rounded-[2.5rem] border border-orange-100 dark:border-orange-900/20">
                          <p className="text-[10px] font-black text-orange-600 mb-2 uppercase tracking-widest flex items-center gap-2 justify-end">استبدال <CheckCircle2 className="w-3 h-3" /></p>
                          <p className="text-sm font-bold text-slate-700 dark:text-slate-300">{(habit as any).replacingHabit}</p>
                        </div>
                      )}

                      <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-[2.5rem] space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="text-right">
                             <p className="text-[9px] font-black text-slate-400 mb-1 uppercase">التكرار</p>
                             <p className="text-xs font-black text-slate-700 dark:text-white">{habit.frequency}</p>
                          </div>
                          <div className="text-right">
                             <p className="text-[9px] font-black text-slate-400 mb-1 uppercase">الوقت</p>
                             <p className="text-xs font-black text-slate-700 dark:text-white">{habit.time || 'غير محدد'}</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4 border-t border-slate-100 dark:border-slate-700 pt-4">
                          <div className="text-right">
                             <p className="text-[9px] font-black text-slate-400 mb-1 uppercase">المدة</p>
                             <p className="text-xs font-black text-slate-700 dark:text-white">{habit.duration || 'غير محدد'}</p>
                          </div>
                          <div className="text-right">
                             <p className="text-[9px] font-black text-slate-400 mb-1 uppercase">الموقع</p>
                             <p className="text-xs font-black text-slate-700 dark:text-white">{(habit as any).order || 'غير محدد'}</p>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                         <div className="bg-blue-50 dark:bg-blue-900/10 p-5 rounded-[2.5rem] border border-blue-100 dark:border-blue-900/20 text-center">
                            <p className="text-[9px] font-black text-blue-500 mb-2 uppercase tracking-widest">الحد الأدنى</p>
                            <p className="text-xs font-bold text-slate-700 dark:text-slate-300">{habit.minGoal}</p>
                         </div>
                         <div className="bg-blue-500 p-5 rounded-[2.5rem] text-center shadow-lg shadow-blue-500/20">
                            <p className="text-[9px] font-black text-blue-100 mb-2 uppercase tracking-widest">المتوقع</p>
                            <p className="text-xs font-bold text-white">{habit.expectedGoal}</p>
                         </div>
                      </div>

                      <div className="space-y-3">
                        {habit.nearGoal && (
                          <div className="p-6 bg-slate-900 text-white rounded-[3rem] shadow-xl relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 rounded-full -translate-y-12 translate-x-12 blur-xl" />
                            <div className="relative">
                              <div className="flex items-center gap-2 mb-3 justify-end text-blue-400">
                                 <span className="text-[10px] font-black uppercase tracking-widest">الهدف القريب</span>
                                 <Target className="w-4 h-4" />
                              </div>
                              <p className="text-sm font-black text-right mb-2">{habit.nearGoal.target} - {habit.nearGoal.description}</p>
                              <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                                 <div className="h-full bg-blue-500 w-1/3" />
                              </div>
                            </div>
                          </div>
                        )}

                        {habit.awayGoal && (
                          <div className="p-6 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-[3rem] shadow-sm relative overflow-hidden group">
                            <div className="relative">
                              <div className="flex items-center gap-2 mb-3 justify-end text-slate-400">
                                 <span className="text-[10px] font-black uppercase tracking-widest">الهدف البعيد</span>
                                 <Flag className="w-4 h-4" />
                              </div>
                              <p className="text-sm font-black text-right text-slate-800 dark:text-white mb-2">{habit.awayGoal.targetDate} - {habit.awayGoal.description}</p>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="flex gap-3 pt-4 mb-10">
                         <button 
                           onClick={() => { setShowDetails(false); onEdit(habit); }}
                           className="flex-1 h-14 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-white rounded-full font-black text-xs uppercase tracking-widest hover:bg-blue-500 hover:text-white transition-all shadow-sm"
                         >
                           تعديل
                         </button>
                         <button 
                           onClick={() => { setShowDetails(false); onDelete(habit.id); }}
                           className="flex-1 h-14 bg-red-50 dark:bg-red-900/10 text-red-500 rounded-full font-black text-xs uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all border border-red-100 dark:border-red-900/20"
                         >
                           حذف
                         </button>
                      </div>
                    </div>
                 </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

      {/* Relapse & Note Inputs - Float outside */}
      <AnimatePresence>
          {showRelapseInput && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="fixed inset-4 sm:inset-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 z-50 bg-white dark:bg-slate-900 p-8 rounded-[3rem] shadow-[0_20px_60px_-10px_rgba(0,0,0,0.3)] border border-slate-100 dark:border-slate-800 text-right w-[calc(100%-2rem)] sm:w-[400px] max-h-[90vh] flex flex-col justify-center"
              >
                  <div className="flex justify-between items-center mb-6">
                     <button onClick={() => setShowRelapseInput(false)} className="text-slate-400 hover:text-slate-600 bg-slate-100 dark:bg-slate-800 w-10 h-10 rounded-full flex items-center justify-center"><AlertCircle className="w-5 h-5" /></button>
                     <h4 className="text-xl font-black text-orange-500">وقعت ليه؟</h4>
                  </div>
                  <textarea 
                    value={relapseReason}
                    onChange={(e) => setRelapseReason(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 p-5 rounded-3xl border border-slate-100 dark:border-slate-700 outline-none focus:border-orange-500 text-right placeholder:text-slate-400 mb-6 font-bold text-sm h-32 resize-none text-slate-800 dark:text-slate-200 shadow-inner"
                    placeholder="اكتب السبب بوضوح عشان تتعلم منه وتتجنبه المرة الجاية..."
                  />
                  <button onClick={() => { onRelapse(habit.id, relapseReason); setShowRelapseInput(false); setRelapseReason(''); }} className="w-full py-4 rounded-full bg-orange-500 text-white font-black text-sm uppercase tracking-widest hover:bg-orange-600 transition-colors shadow-lg shadow-orange-500/30">
                     تأكيد الانتكاسة
                  </button>
              </motion.div>
          )}

          {showNoteInput && (
             <motion.div 
               initial={{ opacity: 0, scale: 0.9 }}
               animate={{ opacity: 1, scale: 1 }}
               exit={{ opacity: 0, scale: 0.9 }}
               transition={{ duration: 0.8, ease: "easeInOut" }}
               className="fixed inset-4 sm:inset-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 z-50 bg-white dark:bg-slate-900 p-8 rounded-[3rem] shadow-[0_20px_60px_-10px_rgba(0,0,0,0.3)] border border-slate-100 dark:border-slate-800 text-right w-[calc(100%-2rem)] sm:w-[400px] max-h-[90vh] flex flex-col justify-center"
             >
                {step === -1 ? (
                  <div className="space-y-6">
                    <h4 className="text-xl font-black text-slate-800 dark:text-white mb-6 text-center">وصلت لفين؟</h4>
                    <div className="flex flex-col gap-3">
                       <button onClick={() => { setQData({...qData, goalLevel: 'exceeded'}); recordImmediately(); }} className="py-4 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-full text-xs font-black uppercase flex items-center justify-center gap-2 border border-emerald-100 dark:border-emerald-800 active:scale-95 transition-transform">
                         تخطيته <span className="text-lg">🔥</span> 
                       </button>
                       <button onClick={() => { setQData({...qData, goalLevel: 'expected'}); recordImmediately(); }} className="py-4 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-full text-xs font-black uppercase flex items-center justify-center gap-2 border-2 border-blue-200 dark:border-blue-800 active:scale-95 transition-transform">
                         المتوقع <span className="text-lg">🎯</span> 
                       </button>
                       <button onClick={() => { setQData({...qData, goalLevel: 'min'}); recordImmediately(); }} className="py-4 bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 rounded-full text-xs font-black uppercase flex items-center justify-center gap-2 border border-orange-100 dark:border-orange-800 active:scale-95 transition-transform">
                         الأدنى <span className="text-lg">🐌</span> 
                       </button>
                    </div>
                    <button onClick={() => setShowNoteInput(false)} className="w-full text-center text-xs font-black text-slate-400 hover:text-slate-600 mt-6 underline uppercase tracking-widest pt-4">إلغاء</button>
                  </div>
                ) : step === 0 ? (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center px-2">
                       <button onClick={() => setShowNoteInput(false)} className="text-slate-400 hover:text-red-500 w-10 h-10 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center transition-colors"><Trash2 className="w-5 h-5" /></button>
                       <span className="text-[10px] uppercase font-black tracking-widest text-blue-500 bg-blue-50 dark:bg-blue-900/40 px-3 py-1 rounded-full">Medical Note</span>
                    </div>
                    
                    <div className="bg-slate-50 dark:bg-slate-800/80 rounded-[2rem] p-4 flex flex-col gap-2 border border-slate-100 dark:border-slate-800 shadow-inner">
                        <input 
                          type="text"
                          value={noteTitle}
                          onChange={(e) => setNoteTitle(e.target.value)}
                          placeholder="عنوان الموضوع (مثلاً Cranial Nerves)"
                          className="w-full bg-transparent outline-none text-right placeholder:text-slate-400 font-serif text-2xl font-black text-slate-800 dark:text-slate-100"
                        />
                        <input 
                          type="text"
                          value={noteSubtitle}
                          onChange={(e) => setNoteSubtitle(e.target.value)}
                          placeholder="العنوان الفرعي (مثلاً Functions)"
                          className="w-full bg-transparent outline-none text-right placeholder:text-slate-400/70 font-sans text-base font-medium text-slate-600 dark:text-slate-300"
                        />
                        <div className="w-full h-px bg-slate-200 dark:bg-slate-700 my-2"></div>
                        <textarea 
                          value={note}
                          onChange={(e) => setNote(e.target.value)}
                          className="w-full bg-transparent outline-none text-right font-sans text-sm h-32 resize-none text-slate-800 dark:text-slate-200 placeholder:text-slate-400 leading-relaxed"
                          placeholder="أكتب ملاحظاتك وتفاصيلك هنا..."
                        />
                    </div>

                    <div className="flex gap-3 pt-2">
                      <button onClick={startRecording} className="w-14 h-14 rounded-[1.5rem] bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center hover:bg-indigo-100 transition-colors shadow-sm border border-indigo-100 dark:border-indigo-800">
                        {isRecording ? <div className="w-4 h-4 bg-red-500 rounded-full animate-pulse" /> : <Mic className="w-6 h-6" />}
                      </button>
                      <button onClick={() => setStep(1)} className="flex-1 rounded-[1.5rem] bg-blue-600 text-white font-black text-xs uppercase hover:bg-blue-700 transition-colors shadow-xl shadow-blue-500/30 hover:-translate-y-0.5">
                        التالي
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-8">
                    <h4 className="text-xl font-black text-blue-500 text-center mb-4">تفاصيل التقييم</h4>
                    <div className="space-y-6">
                      <div className="bg-slate-50 dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-slate-700">
                        <label className="text-xs font-black uppercase text-slate-500 tracking-widest block mb-4 text-center">التركيز</label>
                        <input type="range" min="1" max="5" value={qData.focus} onChange={(e) => setQData({...qData, focus: parseInt(e.target.value)})} className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-500" />
                        <div className="flex justify-between text-[10px] font-black text-slate-400 mt-3 px-1"><span>ضعيف</span><span>ممتاز</span></div>
                      </div>
                    </div>
                    <div className="flex gap-3">
                       <button onClick={() => setStep(0)} className="w-14 h-14 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 flex items-center justify-center text-[10px] font-black hover:bg-slate-200 transition-colors">رجوع</button>
                       <button onClick={() => handleComplete('text')} className="flex-1 py-4 rounded-full bg-emerald-500 text-white font-black text-xs uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-xl shadow-emerald-500/30">
                         تأكيد الإنجاز
                       </button>
                    </div>
                  </div>
                )}
             </motion.div>
          )}

          {/* Backdrop */}
          {(showRelapseInput || showNoteInput) && (
              <motion.div 
                 initial={{ opacity: 0 }}
                 animate={{ opacity: 1 }}
                 exit={{ opacity: 0 }}
                 onClick={() => { setShowRelapseInput(false); setShowNoteInput(false); }}
                 className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40"
              />
          )}
      </AnimatePresence>
    </div>
  );
});

HabitCard.displayName = 'HabitCard';
