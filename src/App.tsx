/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  Flame, 
  ChevronLeft, 
  ChevronRight,
  Settings,
  Sparkles,
  Trophy,
  Award,
  Gift,
  ArrowRight,
  Share2,
  AlertCircle,
  Coffee,
  CheckCircle2,
  Trash2,
  Info,
  Zap,
  Undo2,
  Moon,
  Sun,
  Search,
  ChevronRight as ChevronRightIcon,
  Cloud,
  CloudOff,
  RefreshCw
} from 'lucide-react';
import { useHabitLab } from './hooks/useHabitLab';
import { HabitCard } from './components/HabitCard';
import { HabitModal } from './components/HabitModal';
import { AnalysisView } from './components/AnalysisView';
import { SplashScreen } from './components/SplashScreen';
import { CelebrationConfetti } from './components/CelebrationConfetti';
import { TutorialOverlay } from './components/TutorialOverlay';
import { EngineeringTips } from './components/EngineeringTips';
import { useGoogleDriveSync } from './hooks/useGoogleDriveSync';
import { Habit, AppTheme, CATEGORIES, USER_RANKS } from './types';
import { trackHabitCompletion } from './services/analytics';
import { getMotivationalMessage, getProgressSummary } from './services/geminiService';

export default function App() {
  const { 
    habits, 
    points,
    globalRecoveryMode,
    setGlobalRecoveryMode,
    weeklyChallenge,
    setWeeklyChallenge,
    addHabit, 
    updateHabit, 
    deleteHabit,
    toggleHabitRecovery,
    completeHabit, 
    revertLastCompletion,
    todayIsHoliday,
    setTodayIsHoliday,
    overrideData
  } = useHabitLab();

  const handleRemoteDataSync = (remoteData: any) => {
    overrideData(remoteData.habits || [], remoteData.points || 0, remoteData.weeklyChallenge || null);
  };

  const { syncStatus, isSignedIn, signIn, logout, deleteSyncData, isInitializing } = useGoogleDriveSync(
    { habits, points, weeklyChallenge },
    handleRemoteDataSync
  );

  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  const handleShare = async () => {
    try {
      showFeedback('جاري تجهيز تقرير التقدم... 🧪', 'info');
      const summary = await getProgressSummary(habits);
      
      const shareData = {
        title: 'تقرير معمل العادات 🧪',
        text: summary,
        url: window.location.href,
      };

      const copyToClipboard = async (text: string) => {
        try {
          window.focus();
          if (navigator.clipboard && navigator.clipboard.writeText) {
            await navigator.clipboard.writeText(text);
            return true;
          }
        } catch (err) {
          console.warn('Navigator clipboard failed, trying fallback', err);
        }
        
        // Fallback for non-focused docs or older browsers
        try {
          const textArea = document.createElement("textarea");
          textArea.value = text;
          textArea.style.position = "fixed";
          textArea.style.left = "-9999px";
          textArea.style.top = "0";
          document.body.appendChild(textArea);
          textArea.focus();
          textArea.select();
          const successful = document.execCommand('copy');
          document.body.removeChild(textArea);
          return successful;
        } catch (err) {
          console.error('Fallback copy failed', err);
          return false;
        }
      };

      if (navigator.share) {
        try {
          await navigator.share(shareData);
          showFeedback('تمت المشاركة بنجاح! 🚀');
        } catch (shareErr: any) {
          if (shareErr.name === 'AbortError') {
            const success = await copyToClipboard(`${shareData.text}\n\nتابعني في المعمل: ${shareData.url}`);
            if (success) showFeedback('تم نسخ التقرير للحافظة! 📋');
          } else {
            throw shareErr;
          }
        }
      } else {
        const success = await copyToClipboard(`${shareData.text}\n\nتابعني في المعمل: ${shareData.url}`);
        if (success) {
          showFeedback('تم نسخ التقرير للحافظة! شاركه مع صحابك 🚀');
        } else {
          showFeedback('عذراً، تعذر النسخ للحافظة', 'alert');
        }
      }
    } catch (err) {
      console.error(err);
      showFeedback('حدث خطأ أثناء المشاركة', 'alert');
    }
  };

  const getLevelInfo = (totalPoints: number) => {
    // Progressive thresholds: 300, 450, 600, 750...
    let currentLevel = 1;
    let pointsInCurrentLevel = totalPoints;
    let pointsRequiredForCurrent = 300;
    
    while (pointsInCurrentLevel >= pointsRequiredForCurrent) {
      pointsInCurrentLevel -= pointsRequiredForCurrent;
      currentLevel++;
      pointsRequiredForCurrent += 150; // Progressive increment: 300 + 150*level
    }
    
    return {
      level: currentLevel,
      progress: (pointsInCurrentLevel / pointsRequiredForCurrent) * 100,
      nextLevelPoints: pointsRequiredForCurrent - pointsInCurrentLevel
    };
  };

  const levelInfo = getLevelInfo(points);
  const userLevel = levelInfo.level;
  const levelProgress = levelInfo.progress;
  const userRankIndex = Math.min(userLevel - 1, USER_RANKS.length - 1);
  const userTitle = USER_RANKS[userRankIndex];

  const exportData = () => {
    const data = { habits, points, weeklyChallenge };
    const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `habit-lab-data-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    showFeedback('تم تصدير البيانات بنجاح! 💾');
  };

  const importData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (data.habits) {
          localStorage.setItem('habits', JSON.stringify(data.habits));
          localStorage.setItem('userPoints', (data.points || 0).toString());
          if (data.weeklyChallenge) localStorage.setItem('weeklyChallenge', JSON.stringify(data.weeklyChallenge));
          window.location.reload();
        }
      } catch (err) {
        showFeedback('خطأ في استيراد البيانات!', 'alert');
      }
    };
    reader.readAsText(file);
  };

  const generatePDF = async () => {
    try {
      showFeedback('جار تجهيز التقرير... ⏳', 'info');
      const { jsPDF } = await import('jspdf');
      const doc = new jsPDF();
      
      const width = doc.internal.pageSize.getWidth();
      
      // Header Background
      doc.setFillColor(99, 102, 241); // indigo-500
      doc.rect(0, 0, width, 45, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(26);
      doc.setFont("helvetica", "bold");
      doc.text('Habit Lab Report', 20, 28);
      
      doc.setFontSize(11);
      doc.setFont("helvetica", "normal");
      const dateStr = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
      doc.text(dateStr, width - 20, 28, { align: 'right' });

      // Body 
      doc.setTextColor(15, 23, 42); // slate-900
      doc.setFontSize(18);
      doc.setFont("helvetica", "bold");
      doc.text('Summary', 20, 65);
      
      // Stats Cards
      doc.setFillColor(248, 250, 252); // slate-50
      doc.setDrawColor(226, 232, 240); // slate-200
      doc.setLineWidth(0.5);
      
      const cardWidth = (width - 60) / 3;

      // Card 1
      doc.roundedRect(20, 75, cardWidth, 35, 3, 3, 'FD');
      doc.setFontSize(9);
      doc.setTextColor(100, 116, 139); // slate-500
      doc.setFont("helvetica", "normal");
      doc.text('Current Level', 25, 87);
      doc.setTextColor(15, 23, 42); // slate-900
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.text(`Level ${userLevel}`, 25, 100);

      // Card 2
      doc.roundedRect(20 + cardWidth + 10, 75, cardWidth, 35, 3, 3, 'FD');
      doc.setFontSize(9);
      doc.setTextColor(100, 116, 139); // slate-500
      doc.setFont("helvetica", "normal");
      doc.text('Total Points', 20 + cardWidth + 15, 87);
      doc.setTextColor(15, 23, 42); // slate-900
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.text(`${points}`, 20 + cardWidth + 15, 100);

      // Card 3
      const totalCompletions = habits.reduce((acc, h) => acc + (h.totalCompletions || 0), 0);
      doc.roundedRect(20 + (cardWidth * 2) + 20, 75, cardWidth, 35, 3, 3, 'FD');
      doc.setFontSize(9);
      doc.setTextColor(100, 116, 139); // slate-500
      doc.setFont("helvetica", "normal");
      doc.text('Total Check-ins', 20 + (cardWidth * 2) + 25, 87);
      doc.setTextColor(15, 23, 42); // slate-900
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.text(`${totalCompletions}`, 20 + (cardWidth * 2) + 25, 100);

      doc.setFontSize(18);
      doc.text('Active Habits', 20, 130);
      
      let y = 145;
      habits.forEach((h, index) => {
        if (index % 2 === 0) {
          doc.setFillColor(248, 250, 252);
          doc.rect(20, y - 7, width - 40, 18, 'F');
        }
        
        doc.setFontSize(12);
        doc.setTextColor(15, 23, 42);
        // Using encodeURIComponent / decodeURIComponent to attempt supporting raw string gracefully if it has unicode
        doc.text(`Habit: ${h.name.substring(0, 30)}`, 25, y);
        
        doc.setFontSize(11);
        doc.setTextColor(99, 102, 241); // indigo-500
        doc.text(`${h.streak} Day Streak`, width - 25, y, { align: 'right' });
        
        doc.setFontSize(9);
        doc.setTextColor(100, 116, 139);
        const diff = h.difficulty === 'easy' ? 'Easy' : h.difficulty === 'medium' ? 'Medium' : 'Hard';
        doc.text(`Category: ${h.category} | Difficulty: ${diff} | Total Completions: ${h.totalCompletions || 0}`, 25, y + 6);

        y += 18;
        if (y > 270) {
          doc.addPage();
          y = 30;
        }
      });
      
      doc.save(`HabitLab_Report_${new Date().toISOString().split('T')[0]}.pdf`);
      showFeedback('تم استخراج التقرير بنجاح! 🚀', 'success');
    } catch (err) {
      console.error(err);
      showFeedback('Error generating PDF', 'alert');
    }
  };

  const [deferredPrompt, setDeferredPrompt] = useState<any>((window as any).deferredPrompt || null);
  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      (window as any).deferredPrompt = e;
    };
    window.addEventListener('beforeinstallprompt', handler);
    
    // Check if it's already installed
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true;
    if (isStandalone) {
       setDeferredPrompt(null);
    } else if ((window as any).deferredPrompt) {
       setDeferredPrompt((window as any).deferredPrompt);
    }
    
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const installPWA = () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then((choiceResult: any) => {
        if (choiceResult.outcome === 'accepted') {
          showFeedback('مبارك! تم تثبيت تطبيق معمل العادات 🚀', 'success');
        }
        setDeferredPrompt(null);
      });
    } else {
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
      if (isIOS) {
         showFeedback('لتثبيت التطبيق على آيفون: اضغط على زر المشاركة ثم "Add to Home Screen" 📱', 'info');
      } else {
         showFeedback('لتثبيت التطبيق، اختر "Install" أو "Add to Home screen" من قائمة المتصفح الخاص بك 📱', 'info');
      }
    }
  };

  const [showSupport, setShowSupport] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [showTips, setShowTips] = useState(false);

  useEffect(() => {
    const hasSeenTutorial = localStorage.getItem('hasSeenTutorial');
    if (!hasSeenTutorial) {
      setShowTutorial(true);
      localStorage.setItem('hasSeenTutorial', 'true');
    }
  }, []);

  const [activeTab, setActiveTab] = useState<'habits' | 'analysis' | 'levels'>('habits');
  const [selectedCategory, setSelectedCategory] = useState<string>('الكل');
  const [showModal, setShowModal] = useState(false);
  const [habitToEdit, setHabitToEdit] = useState<Habit | undefined>();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [motivation, setMotivation] = useState<string | null>(null);
  const [showChallengeEdit, setShowChallengeEdit] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{ 
    title: string; 
    description: string; 
    onConfirm: () => void; 
    icon?: React.ReactNode 
  } | null>(null);
  const [feedback, setFeedback] = useState<{ msg: string; type: 'success' | 'info' | 'alert' } | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);

  const filteredHabits = habits.filter(h => {
    const matchesCategory = selectedCategory === 'الكل' || h.category === selectedCategory;
    const matchesSearch = h.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  }).sort((a, b) => {
    if (a.time && b.time) return a.time.localeCompare(b.time);
    return String(a.order).localeCompare(String(b.order));
  });

  const handleEdit = (habit: Habit) => {
    setHabitToEdit(habit);
    setShowModal(true);
  };

  const handleSave = (habitData: any) => {
    setConfirmAction({
      title: habitToEdit ? 'تحديث العادة؟' : 'إضافة عادة؟',
      description: habitToEdit ? 'هل تريد حفظ التعديلات الجديدة على هذه العادة؟' : 'سيتم توجيه المعمل للبدء بتتبع هذه العادة الجديدة.',
      icon: <Sparkles className="w-12 h-12 text-indigo-500 mb-6 mx-auto" />,
      onConfirm: () => {
        if (habitToEdit) {
          updateHabit(habitToEdit.id, habitData);
          showFeedback('تم تحديث العادة بنجاح! ✨');
        } else {
          addHabit(habitData);
          showFeedback('تمت إضافة عادة جديدة للمختبر! 🧪');
        }
        setHabitToEdit(undefined);
        setConfirmAction(null);
        setShowModal(false);
      }
    });
  };

  const showFeedback = (msg: string, type: 'success' | 'info' | 'alert' = 'success', showUndo: boolean = false) => {
    setFeedback({ msg, type, showUndo } as any);
    setTimeout(() => setFeedback(null), 5000);
  };

  const handleDelete = (id: string) => {
    setConfirmAction({
      title: 'هل أنت متأكد؟',
      description: 'سيتم حذف العادة وكل سجلاتها نهائياً من المختبر.',
      icon: <Trash2 className="w-12 h-12 text-rose-500 mb-6 mx-auto" />,
      onConfirm: () => {
        deleteHabit(id);
        setConfirmAction(null);
        showFeedback('تم حذف العادة من السجل.', 'alert');
      }
    });
  };

  const handleComplete = async (habit: Habit, note?: string, type?: 'text' | 'voice', recovery?: boolean, questionnaire?: any) => {
    // Sound effect (Ding / Pop)
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContext) {
        const ctx = new AudioContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.02);
        gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.15);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.15);
      }
    } catch(e) {}

    // Run completion immediately without confirmation
    completeHabit(habit.id, note, type, recovery, questionnaire);
    trackHabitCompletion(habit.name, habit.streak + 1);
    
    // UI feedback immediately
    setShowCelebration(true);
    showFeedback('إنجاز عظيم! تم تسجيل النقطة. 🔥', 'success', true);
    
    // Background the AI motivational message
    getMotivationalMessage(habit, note).then(msg => {
      setMotivation(msg);
      setTimeout(() => setMotivation(null), 5000);
    });
  };

  return (
    <div className="min-h-screen bg-[#fafafa] text-slate-900 font-sans selection:bg-indigo-500 selection:text-white transition-all duration-700 overflow-x-hidden">
      <AnimatePresence>
        {showTutorial && <TutorialOverlay onClose={() => setShowTutorial(false)} />}
      </AnimatePresence>

      <CelebrationConfetti active={showCelebration} onComplete={() => setShowCelebration(false)} />
      <AnimatePresence>
        {loading && <SplashScreen key="splash" />}
      </AnimatePresence>
      
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/70 dark:bg-slate-950/70 backdrop-blur-xl border-b border-slate-100 dark:border-slate-800/50 h-16 flex items-center">
        <div className="max-w-2xl mx-auto w-full px-4 sm:px-14 flex items-center justify-between">
          <div className="flex items-center gap-4">
             {activeTab !== 'habits' ? (
                <button 
                  onClick={() => setActiveTab('habits')}
                  className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600 hover:bg-indigo-50 transition-all shrink-0"
                >
                   <ChevronRightIcon className="w-5 h-5" />
                </button>
             ) : (
                <div className="relative shrink-0">
                   <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center shadow-lg">
                      <Flame className="w-5 h-5 text-white" />
                   </div>
                </div>
             )}
             <div className="text-right flex flex-col justify-center max-w-[90px] sm:max-w-none">
                <h1 className="text-[10px] sm:text-xs font-black tracking-tight text-slate-800 uppercase truncate">Habit Lab</h1>
                {!isSignedIn ? (
                   <button onClick={signIn} className="flex items-center gap-1.5 justify-end group mt-0.5">
                      <CloudOff className="w-3 h-3 text-slate-400 group-hover:text-indigo-500 transition-colors shrink-0" />
                      <span className="text-[6px] sm:text-[7px] font-bold text-slate-400 uppercase tracking-widest group-hover:text-indigo-500 transition-colors truncate">Sign in</span>
                   </button>
                ) : (
                   <div className="flex items-center gap-1.5 justify-end mt-0.5">
                     {syncStatus === 'Syncing...' && <RefreshCw className="w-3 h-3 text-indigo-500 animate-spin shrink-0" />}
                     {syncStatus === 'Synced' && <Cloud className="w-3 h-3 text-emerald-500 shrink-0" />}
                     {syncStatus === 'Error' && <AlertCircle className="w-3 h-3 text-rose-500 shrink-0" />}
                     {syncStatus === 'Offline' && <CloudOff className="w-3 h-3 text-slate-400 shrink-0" />}
                     <p className="text-[6px] sm:text-[7px] font-bold text-slate-400 uppercase tracking-widest truncate">{syncStatus}</p>
                   </div>
                )}
             </div>
          </div>
          
          <div className="flex p-0.5 sm:p-1 bg-slate-100 rounded-2xl border border-slate-200 relative mx-1">
             {['habits', 'levels', 'analysis'].map((tab) => (
               <button 
                 key={`header-tab-${tab}`}
                 onClick={() => setActiveTab(tab as any)} 
                 className={`relative px-2 sm:px-6 py-2 sm:py-2.5 rounded-xl text-[9px] sm:text-[10px] font-black uppercase tracking-widest transition-colors z-10 btn-hover-scale ${
                   activeTab === tab ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'
                 }`}
               >
                 {activeTab === tab && (
                   <motion.div 
                     layoutId="activeTab"
                     className="absolute inset-0 bg-white shadow-md rounded-xl z-[-1]"
                     transition={{ type: "spring", bounce: 0.1, duration: 0.3 }}
                   />
                 )}
                 {tab === 'habits' ? 'العادات' : tab === 'levels' ? 'المستوى' : 'التحليلات'}
               </button>
             ))}
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
             <button 
               onClick={() => setGlobalRecoveryMode(!globalRecoveryMode)}
               className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center transition-all shadow-md btn-hover-scale glass-shine shrink-0 ${globalRecoveryMode ? 'bg-amber-500 text-white shadow-amber-500/20' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-amber-50 dark:hover:bg-amber-900/20 border border-slate-200 dark:border-slate-700'}`}
               title="وضع الاستشفاء العالمي"
             >
                <Zap className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${globalRecoveryMode ? 'fill-current' : ''}`} />
             </button>
             <div className="relative">
               <button 
                 onClick={() => setShowSettings(!showSettings)}
                 className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center transition-all shadow-sm shrink-0 ${showSettings ? 'bg-indigo-500 text-white shadow-indigo-500/20' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
               >
                 <Settings className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
               </button>
             </div>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {showSettings && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/20 backdrop-blur-sm"
              onClick={() => setShowSettings(false)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl overflow-hidden border border-slate-100 dark:border-slate-800 z-10 p-6 sm:p-8"
            >
               <div className="flex items-center justify-between mb-8">
                 <h2 className="text-xl font-black text-slate-800 dark:text-slate-100">الإعدادات</h2>
                 <button onClick={() => setShowSettings(false)} className="p-2 bg-slate-50 dark:bg-slate-800 rounded-full text-slate-400 hover:text-slate-600 transition-colors">
                   <ChevronRightIcon className="w-5 h-5 rotate-180" />
                 </button>
               </div>

               <div className="space-y-3">
                 <button 
                   onClick={() => {
                     setShowTips(true);
                     setShowSettings(false);
                   }} 
                   className="w-full flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-900/20 rounded-2xl border border-blue-100 hover:bg-blue-100 transition-colors group"
                 >
                   <span className="text-sm font-black text-blue-600">نصائح المخطط الهندسي</span>
                   <span className="text-xl group-hover:scale-110 transition-transform">🧠</span>
                 </button>

                 <button 
                   onClick={() => {
                     setShowSupport(true);
                     setShowSettings(false);
                   }} 
                   className="w-full flex items-center justify-between p-4 bg-amber-50 dark:bg-amber-900/20 rounded-2xl border border-amber-100 hover:bg-amber-100 transition-colors group"
                 >
                   <span className="text-sm font-black text-amber-600">ادعم المشروع ☕</span>
                   <ChevronRightIcon className="w-4 h-4 text-amber-400 group-hover:-translate-x-1 transition-transform" />
                 </button>

                 <div className="grid grid-cols-2 gap-3">
                   <button 
                     onClick={() => {
                       exportData();
                       setShowSettings(false);
                     }} 
                     className="flex flex-col items-center justify-center p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 hover:bg-slate-100 transition-colors"
                   >
                     <span className="text-lg mb-2">💾</span>
                     <span className="text-xs font-black text-slate-600">تصدير الداتا</span>
                   </button>
                   <label className="flex flex-col items-center justify-center p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 hover:bg-slate-100 transition-colors cursor-pointer">
                     <span className="text-lg mb-2">📁</span>
                     <span className="text-xs font-black text-slate-600">استيراد الداتا</span>
                     <input type="file" accept=".json" onChange={(e) => { importData(e); setShowSettings(false); }} className="hidden" />
                   </label>
                 </div>

                 <button 
                   onClick={() => {
                     generatePDF();
                     setShowSettings(false);
                   }} 
                   className="w-full flex items-center justify-between p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl border border-indigo-100 hover:bg-indigo-100 transition-colors group"
                 >
                   <span className="text-sm font-black text-indigo-600">تقرير الإنجاز (PDF)</span>
                   <span className="text-xl group-hover:scale-110 transition-transform">📄</span>
                 </button>

                 <button 
                   onClick={() => {
                     installPWA();
                     setShowSettings(false);
                   }} 
                   className="w-full flex items-center justify-between p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl border border-emerald-100 hover:bg-emerald-100 transition-colors group"
                 >
                   <span className="text-sm font-black text-emerald-600">تثبيت التطبيق 📱</span>
                   <Cloud className="w-5 h-5 text-emerald-500 group-hover:scale-110 transition-transform" />
                 </button>

                 {isSignedIn && (
                   <div className="flex flex-col gap-2 mt-4">
                     <button 
                       onClick={() => {
                         logout();
                         setShowSettings(false);
                       }} 
                       className="w-full flex items-center justify-between p-4 bg-rose-50 dark:bg-rose-900/20 rounded-2xl border border-rose-100 hover:bg-rose-100 transition-colors group"
                     >
                       <span className="text-sm font-black text-rose-600">تسجيل الخروج من المزامنة</span>
                       <CloudOff className="w-5 h-5 text-rose-500 group-hover:scale-110 transition-transform" />
                     </button>
                     <button 
                       onClick={async () => {
                         if (window.confirm('هل أنت متأكد من حذف بياناتك من جوجل درايف؟ لا يمكن التراجع عن هذه الخطوة.')) {
                            const success = await deleteSyncData();
                            if (success) {
                               showFeedback('تم حذف بيانات المزامنة بنجاح', 'success');
                            } else {
                               showFeedback('حدث خطأ أثناء حذف بيانات المزامنة', 'alert');
                            }
                            setShowSettings(false);
                         }
                       }} 
                       className="w-full flex items-center justify-between p-4 bg-red-100 dark:bg-red-900/30 rounded-2xl border border-red-200 hover:bg-red-200 transition-colors group"
                     >
                       <span className="text-sm font-black text-red-700">حذف بيانات المزامنة</span>
                       <span className="text-xl group-hover:scale-110 transition-transform">🗑️</span>
                     </button>
                   </div>
                 )}
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <main className="max-w-2xl mx-auto px-4 sm:px-14 pt-24 pb-32 relative z-10">
        <AnimatePresence>
          {globalRecoveryMode && (
            <motion.div 
              key="global-recovery-alert"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="mb-6 overflow-hidden"
            >
              <div className="bg-amber-500 text-white px-6 py-3 rounded-2xl font-black text-xs text-center shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2">
                <Zap className="w-4 h-4 fill-current" />
                أنت الآن في وضع الاستعداد
              </div>
            </motion.div>
          )}
          {motivation && (
            <motion.div 
              key="motivation-alert"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-8 p-5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-3xl shadow-xl shadow-indigo-500/20 text-sm font-semibold flex items-center gap-3"
            >
              <Sparkles className="w-5 h-5 flex-shrink-0" />
              <p className="flex-1 text-right">{motivation}</p>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="relative">
          <AnimatePresence mode="wait">
            {todayIsHoliday ? (
              <motion.div 
                key="holiday"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.02 }}
                transition={{ duration: 0.15 }}
                className="text-center py-20 px-6 space-y-8"
              >
                <div className="w-24 h-24 bg-indigo-500 rounded-3xl flex items-center justify-center text-white mx-auto shadow-2xl shadow-indigo-500/40">
                   <Coffee className="w-12 h-12" />
                </div>
                <div className="space-y-4">
                   <h2 className="text-3xl font-black text-slate-800">إنجازك النهاردة يكفي! 👋</h2>
                   <p className="text-lg font-bold text-slate-500 leading-relaxed max-w-sm mx-auto">
                      أنت وصلت للمستوى المطلوب وأنهيت تحدي الأسبوع. النهاردة إجازة رسمية من المختبر، استمتع بوقتك!
                   </p>
                </div>
                <button 
                  onClick={() => setTodayIsHoliday(false)}
                  className="px-8 py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-800 transition-colors"
                >
                  رجوع للممعمل
                </button>
              </motion.div>
            ) : activeTab === 'analysis' ? (
              <motion.div
                key="analysis-view"
                initial={{ opacity: 0, scale: 0.99 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.01 }}
                transition={{ duration: 0.1 }}
              >
                <AnalysisView habits={habits} points={points} userLevel={userLevel} userTitle={userTitle} />
              </motion.div>
            ) : activeTab === 'levels' ? (
              <motion.div 
                key="levels-view" 
                initial={{ opacity: 0, scale: 0.99 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.01 }}
                transition={{ duration: 0.1 }}
                className="space-y-8"
              >
                 <div className="p-10 rounded-[3.5rem] bg-slate-900 text-white shadow-2xl relative overflow-hidden text-right border border-slate-800">
                    <div className="absolute -top-12 -right-12 w-64 h-64 bg-indigo-500/20 blur-[100px] rounded-full" />
                  <div className="relative z-10 flex flex-col items-center gap-6">
                     <span className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-400">الحالة الراهنة</span>
                     <div className="text-center">
                        <p className="text-sm font-black text-indigo-300 uppercase mb-2">{userTitle}</p>
                        <h2 className="text-6xl font-black tracking-tighter">Lvl {userLevel}</h2>
                        <div className="mt-4 flex items-center justify-center gap-2 bg-indigo-500/20 px-4 py-2 rounded-2xl border border-indigo-500/30">
                           <Award className="w-5 h-5 text-indigo-400" />
                           <span className="text-xl font-black text-white font-mono">{points} Point</span>
                        </div>
                     </div>
                     <div className="w-full max-w-xs h-3 bg-white/10 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${levelProgress}%` }}
                          className="h-full bg-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.5)]"
                        />
                     </div>
                     <p className="text-xs font-bold text-slate-400">
                        {`باقي ${Math.round(levelInfo.nextLevelPoints)} نقطة للمستوى التالي`}
                     </p>
                  </div>
               </div>

               <div className="mb-12">
                   {!weeklyChallenge ? (
                     <div className="glass rounded-[2rem] p-10 border-2 border-indigo-500/10 shadow-2xl relative overflow-hidden bg-white/70 text-center group">
                        <div className="absolute -top-12 -right-12 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl group-hover:bg-indigo-500/10 transition-colors" />
                        <Trophy className="w-12 h-12 text-slate-300 mx-auto mb-6" />
                        <h3 className="text-lg font-black text-slate-800 mb-2">تحدى نفسك هذا الأسبوع</h3>
                        <p className="text-xs font-bold text-slate-400 mb-8 max-w-xs mx-auto">
                          في المعمل، أنت من يصمم تحدياته. ابدأ بتعريف تحدي أسبوعي مخصص يناسب أهدافك الحالية.
                        </p>
                        <button 
                          onClick={() => {
                            setWeeklyChallenge({
                              goal: 'اسم التحدي المخصص..',
                              reward: 'مكافأتي المخصصة 💎',
                              progress: 0,
                              target: 7,
                              level: 1
                            });
                            setShowChallengeEdit(true);
                            showFeedback('تم فتح تعديل التحدي المخصص! 🧪');
                          }}
                          className="px-8 py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-slate-900/20 hover:scale-105 active:scale-95 transition-all"
                        >
                          إنشاء تحدي مخصص
                        </button>
                     </div>
                   ) : (
                     <div className="glass rounded-[2rem] p-8 border-2 border-indigo-500/10 shadow-2xl relative overflow-hidden bg-white/70">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full -translate-y-16 translate-x-16" />
                        <div className="relative flex items-center justify-between mb-8">
                           <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-indigo-500 text-white flex items-center justify-center">
                                 <Trophy className="w-5 h-5 shadow-lg shadow-indigo-500/40" />
                              </div>
                              <div>
                                 <h3 className="text-sm font-black uppercase tracking-widest text-slate-800">تحدي النقاط الأسبوعي</h3>
                                 <p className="text-[10px] font-bold text-slate-400">اجمع النقاط لرفع مستواك وفتح المكافأة!</p>
                              </div>
                           </div>
                           <button 
                             onClick={() => setShowChallengeEdit(true)}
                             className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 transition-colors"
                           >
                              <Settings className="w-4 h-4" />
                           </button>
                        </div>
          
                        <div className="space-y-6">
                           <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
                              <div className="flex items-center gap-2 text-indigo-500 mb-2">
                                 <ArrowRight className="w-3.5 h-3.5" />
                                 <span className="text-[10px] font-black uppercase tracking-widest">الهدف الحالي</span>
                              </div>
                              <p className="text-md font-black text-slate-700">{weeklyChallenge.goal}</p>
                           </div>
          
                           <div className="space-y-3">
                              <div className="flex justify-between items-baseline px-2">
                                 <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">نقاط الأسبوع</span>
                                 <span className="text-2xl font-black text-indigo-600 font-mono tracking-tighter">{weeklyChallenge.progress}/{weeklyChallenge.target}</span>
                              </div>
                              <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden p-0.5">
                                 <motion.div 
                                   initial={{ width: 0 }}
                                   animate={{ width: `${(weeklyChallenge.progress / weeklyChallenge.target) * 100}%` }}
                                   className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 rounded-full"
                                   transition={{ type: "spring", damping: 15 }}
                                 />
                              </div>
                           </div>
          
                           <div className={`p-5 rounded-3xl border-2 transition-all flex items-center justify-between ${weeklyChallenge.progress >= weeklyChallenge.target ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-slate-50 border-transparent text-slate-400'}`}>
                              <div className="flex items-center gap-3">
                                 <div className={`p-2 rounded-xl ${weeklyChallenge.progress >= weeklyChallenge.target ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-400'}`}>
                                    <Gift className="w-4 h-4" />
                                 </div>
                                 <div>
                                    <span className="text-[10px] font-black uppercase tracking-widest block">مكافأتك</span>
                                    <p className="text-xs font-black">{weeklyChallenge.reward}</p>
                                 </div>
                              </div>
                              {weeklyChallenge.progress >= weeklyChallenge.target && (
                                <Sparkles className="w-5 h-5 text-emerald-500 animate-spin-slow" />
                              )}
                           </div>
                        </div>
          
                        {showChallengeEdit && (
                          <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="absolute inset-0 bg-white/95 backdrop-blur-md z-50 p-8 flex flex-col justify-center gap-4"
                          >
                             <div className="space-y-4">
                                <label className="block">
                                   <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1 block mb-2">اسم التحدي</span>
                                   <input 
                                     type="text"
                                     value={weeklyChallenge.goal}
                                     onChange={e => setWeeklyChallenge({...weeklyChallenge, goal: e.target.value})}
                                     className="w-full bg-slate-100 p-4 rounded-xl border border-slate-200 outline-none focus:border-indigo-500 text-xs font-bold"
                                   />
                                </label>
                                <label className="block">
                                   <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1 block mb-2">المكافأة المخصصة</span>
                                   <input 
                                     type="text"
                                     value={weeklyChallenge.reward}
                                     onChange={e => setWeeklyChallenge({...weeklyChallenge, reward: e.target.value})}
                                     className="w-full bg-slate-100 p-4 rounded-xl border border-slate-200 outline-none focus:border-indigo-500 text-xs font-bold"
                                   />
                                </label>
                                <div className="grid grid-cols-2 gap-4">
                                   <label className="block">
                                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1 block mb-2">الرقم المستهدف</span>
                                      <input 
                                        type="number"
                                        value={weeklyChallenge.target}
                                        onChange={e => setWeeklyChallenge({...weeklyChallenge, target: parseInt(e.target.value) || 1})}
                                        className="w-full bg-slate-100 p-4 rounded-xl border border-slate-200 outline-none focus:border-indigo-500 text-xs font-bold"
                                      />
                                   </label>
                                   <div className="flex items-end gap-2">
                                      <button 
                                        onClick={() => {
                                          setConfirmAction({
                                            title: 'حذف التحدي؟',
                                            description: 'سيتم مسح سجلات المستوى الحالي ونقاط الأسبوع. هل أنت متأكد؟',
                                            icon: <Trash2 className="w-12 h-12 text-rose-500 mb-6 mx-auto" />,
                                            onConfirm: () => {
                                              setWeeklyChallenge(null);
                                              setShowChallengeEdit(false);
                                              setConfirmAction(null);
                                              showFeedback('تم حذف العادة من السجل الأسبوعي.', 'alert');
                                            }
                                          });
                                        }}
                                        className="flex-1 h-[48px] bg-rose-50 text-rose-500 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-rose-100"
                                      >
                                        حذف التحدي
                                      </button>
                                      <button 
                                        onClick={() => {
                                          setShowChallengeEdit(false);
                                          showFeedback('تم تحديث بيانات التحدي بنجاح! ✨');
                                        }}
                                        className="flex-1 h-[48px] bg-indigo-500 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-600 shadow-lg shadow-indigo-500/20"
                                      >
                                        تحديث
                                      </button>
                                   </div>
                                </div>
                             </div>
                          </motion.div>
                        )}
                     </div>
                   )}
               </div>
               <div className="grid grid-cols-1 gap-4 text-right">
                  {USER_RANKS.slice(0, userLevel + 5).map((rank, i) => (
                    <div key={`rank-v2-${i}`} className={`p-6 rounded-[2rem] border transition-all flex items-center justify-between ${i < userLevel - 1 ? 'bg-emerald-50 border-emerald-100' : i === userLevel - 1 ? 'bg-indigo-50 border-indigo-200 shadow-lg' : 'bg-slate-50 border-slate-100 opacity-40'}`}>
                       <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xs font-black ${i < userLevel - 1 ? 'bg-emerald-500 text-white' : i === userLevel - 1 ? 'bg-slate-900 text-white' : 'bg-slate-200 text-slate-400'}`}>
                             {i + 1}
                          </div>
                          <div className="text-right">
                             <p className="text-[9px] font-black uppercase text-slate-400 mb-1">المستوى {i + 1}</p>
                             <p className="text-xs font-black text-slate-800">{rank}</p>
                          </div>
                       </div>
                       {i < userLevel - 1 && <CheckCircle2 className="w-5 h-5 text-emerald-500" />}
                    </div>
                  ))}
               </div>
            </motion.div>
          ) : (
            <motion.div 
              key="habits-list"
              initial={{ opacity: 0, scale: 0.99 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.01 }}
              transition={{ duration: 0.1 }}
              className="space-y-4"
            >
              <div className="mb-4 pl-12 flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-bold text-indigo-500 dark:text-indigo-400">{selectedDate === new Date().toISOString().split('T')[0] ? 'النهاردة' : selectedDate}</span>
                    <div className="h-px w-8 bg-slate-200 dark:bg-slate-700" />
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => {
                      const d = new Date(selectedDate);
                      d.setDate(d.getDate() - 1);
                      setSelectedDate(d.toISOString().split('T')[0]);
                    }} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"><ChevronLeft className="w-5 h-5" /></button>
                    <button 
                      onClick={() => {
                        const d = new Date(selectedDate);
                        const today = new Date().toISOString().split('T')[0];
                        if (selectedDate < today) {
                          d.setDate(d.getDate() + 1);
                          setSelectedDate(d.toISOString().split('T')[0]);
                        }
                      }} 
                      disabled={selectedDate === new Date().toISOString().split('T')[0]}
                      className={`p-2 rounded-lg transition-all ${selectedDate === new Date().toISOString().split('T')[0] ? 'opacity-10 cursor-not-allowed' : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400'}`}
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                </div>
                
                {habits.length > 0 && (
                  <div className="relative">
                    <Search className="w-4 h-4 absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input 
                      type="text" 
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="ابحث في العادات.."
                      className="w-full bg-white dark:bg-slate-800 text-right pr-12 pl-4 py-3 rounded-2xl border border-slate-100 dark:border-slate-700 text-sm font-bold outline-none focus:border-indigo-500 dark:text-slate-200 transition-all shadow-sm"
                    />
                  </div>
                )}
              </div>

              {habits.length === 0 ? (
                <div className="pl-12 py-20 flex flex-col items-center justify-center text-center">
                  <div className="w-20 h-20 bg-indigo-50 dark:bg-indigo-900/20 rounded-[2rem] flex items-center justify-center mb-6">
                    <Sparkles className="w-8 h-8 text-indigo-500" />
                  </div>
                  <h3 className="text-xl font-black text-slate-800 dark:text-slate-100 mb-2">أهلاً بيك في معمل العادات!</h3>
                  <p className="text-sm font-bold text-slate-500 dark:text-slate-400 max-w-[250px] leading-relaxed mb-12">
                    المعمل فاضي مفيش فيه أي عادات لسه.. دوس على الزرار تحت عشان تبدأ رحلتك.
                  </p>
                  
                  <div className="relative mt-8">
                    <motion.div 
                      animate={{ y: [0, 10, 0] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="absolute -bottom-20 right-8 md:right-1/2"
                    >
                      <svg width="60" height="80" viewBox="0 0 60 80" fill="none" className="text-indigo-300 dark:text-indigo-700 stroke-current drop-shadow-md">
                        <path d="M50 0 C 50 40, 10 40, 10 70 M 10 70 L 2 60 M 10 70 L 18 60" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </motion.div>
                  </div>
                </div>
              ) : filteredHabits.length === 0 ? (
                <div className="pl-12 py-20 text-center text-slate-300">
                  <p className="text-xs font-medium italic">مافيش عادات في الفئة دي للمعمل..</p>
                </div>
              ) : (
                filteredHabits.map(habit => (
                  <HabitCard 
                    key={habit.id} 
                    habit={habit} 
                    isCompletedToday={habit.completedDates.includes(selectedDate)}
                    onComplete={(note, type, recovery, q) => handleComplete(habit, note, type, recovery, q)}
                    onEdit={handleEdit}
                    onDelete={() => handleDelete(habit.id)}
                    onToggleRecovery={toggleHabitRecovery}
                  />
                ))
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mt-12 pt-12 border-t border-slate-100 flex flex-col items-center gap-6">
            <div className="flex flex-wrap justify-center gap-4">
              <button 
                onClick={handleShare}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-white border border-indigo-500 text-indigo-600 font-bold text-xs shadow-lg shadow-indigo-500/5 hover:bg-indigo-50 hover:scale-105 active:scale-95 transition-all"
              >
                <Share2 className="w-4 h-4" />
                مشاركة 🚀
              </button>
              
              <button 
                onClick={() => setShowSupport(true)}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-amber-500 text-white font-bold text-xs shadow-lg shadow-amber-500/20 hover:scale-105 active:scale-95 transition-all"
              >
                <Coffee className="w-4 h-4" />
                ادعمنا ☕
              </button>

              <button 
                onClick={() => window.open('https://forms.gle/FC8RuWBEkR7m5tzt9', '_blank')}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-500/20 hover:scale-105 active:scale-95 transition-all"
              >
                <Sparkles className="w-4 h-4" />
                قيمنا ⭐
              </button>
            </div>
            <div className="text-center">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.1em]">v1.0 by amer atef . made with love</p>
              <p className="mt-1 text-[8px] font-bold text-slate-300 uppercase tracking-widest">Crafted by Antigravity Agency</p>
            </div>
        </div>

        {/* Global Confirmation Dialogs */}
        <AnimatePresence>
          {confirmAction && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 text-right">
               <motion.div 
                 initial={{ opacity: 0 }} 
                 animate={{ opacity: 1 }} 
                 exit={{ opacity: 0 }}
                 className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
                 onClick={() => setConfirmAction(null)}
               />
               <motion.div 
                 initial={{ scale: 0.9, opacity: 0, y: 20 }}
                 animate={{ scale: 1, opacity: 1, y: 0 }}
                 exit={{ scale: 0.9, opacity: 0, y: 20 }}
                 className="relative w-full max-w-sm bg-white dark:bg-slate-900 rounded-[3rem] p-10 shadow-2xl overflow-hidden border border-slate-100 dark:border-slate-800"
               >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 dark:bg-indigo-900/10 rounded-full blur-3xl -translate-y-16 translate-x-16" />
                  
                  {confirmAction.icon}
                  
                  <h3 className="text-2xl font-black text-slate-900 dark:text-slate-100 mb-2">{confirmAction.title}</h3>
                  <p className="text-sm font-bold text-slate-400 dark:text-slate-500 mb-8 leading-relaxed">{confirmAction.description}</p>
                  
                  <div className="grid grid-cols-2 gap-4">
                     <button 
                       onClick={() => setConfirmAction(null)} 
                       className="py-4 bg-slate-50 dark:bg-slate-800 rounded-2xl font-black text-[10px] uppercase tracking-widest text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                     >
                       تراجع
                     </button>
                     <button 
                       onClick={confirmAction.onConfirm} 
                       className="py-4 bg-indigo-500 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-indigo-500/25 hover:bg-indigo-600 transition-colors"
                     >
                       تأكيد الإجراء
                     </button>
                  </div>
               </motion.div>
            </div>
          )}

          {feedback && (
            <motion.div 
              initial={{ opacity: 0, y: 50, x: '-50%' }}
              animate={{ opacity: 1, y: 0, x: '-50%' }}
              exit={{ opacity: 0, scale: 0.9, x: '-50%' }}
              className={`fixed bottom-8 left-1/2 z-[100] px-8 py-4 rounded-3xl shadow-2xl font-black text-[11px] uppercase tracking-widest flex items-center gap-4 border-2 transition-all glass-shine ${(feedback as any).type === 'success' 
                  ? 'bg-emerald-500 text-white border-emerald-400' 
                  : (feedback as any).type === 'alert'
                  ? 'bg-rose-500 text-white border-rose-400'
                  : 'bg-slate-900 text-white border-slate-700'
              }`}
            >
               {(feedback as any).type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : (feedback as any).type === 'alert' ? <AlertCircle className="w-5 h-5" /> : <Info className="w-5 h-5" />}
               <span className="flex-1">{(feedback as any).msg}</span>
               {(feedback as any).showUndo && (
                 <button 
                  onClick={() => {
                    revertLastCompletion();
                    setFeedback(null);
                    showFeedback('تم التراجع عن الإنجاز.', 'info');
                  }}
                  className="px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg flex items-center gap-1.5 transition-all text-[10px] border border-white/30"
                 >
                    <Undo2 className="w-3.5 h-3.5" />
                    تراجع
                 </button>
               )}
            </motion.div>
          )}
        </AnimatePresence>
                {/* Support Us Modal */}
                <AnimatePresence>
                  {showSupport && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 text-right">
                       <motion.div 
                         initial={{ opacity: 0 }} 
                         animate={{ opacity: 1 }} 
                         exit={{ opacity: 0 }}
                         className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
                         onClick={() => setShowSupport(false)}
                       />
                       <motion.div 
                         initial={{ scale: 0.9, opacity: 0, y: 20 }}
                         animate={{ scale: 1, opacity: 1, y: 0 }}
                         exit={{ scale: 0.9, opacity: 0, y: 20 }}
                         className="relative w-full max-w-lg bg-white rounded-[3rem] p-10 shadow-2xl overflow-hidden border border-slate-100"
                       >
                          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-50 rounded-full blur-3xl -translate-y-16 translate-x-16" />
                          
                          <Sparkles className="w-16 h-16 text-amber-500 mb-6 mx-auto animate-pulse" />
                          
                          <h3 className="text-2xl font-black text-slate-900 mb-4">شارك في بناء Habit Lab 🚀</h3>
                          <div className="space-y-4 text-xs font-bold text-slate-500 leading-relaxed mb-8">
                             <p>"لو تطبيق habit lab ساعدك تنظم يومك وتبنى عاداتك بدل التشتت تقدر تدعم استمرار المشروع وتطوير ميزات جديدة بمبلغ رمزي. دعمك هو اللي بيخلينا نكبر ونقدم كود أنضف وتجربة أحسن."</p>
                             <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 space-y-3">
                                <p className="text-slate-800 font-black">طريقة الدعم (فودافون كاش):</p>
                                <p className="text-lg font-black text-indigo-600 font-mono">01282920387 :حول مباشرة على رقم</p>
                                <p>خد سكرين شوت وابعتها لينا [ واتساب ] وبكدا هتبقى شاركت ف بناء البرنامج</p>
                             </div>
                          </div>
                          
                          <div className="grid grid-cols-1">
                             <button 
                               onClick={() => setShowSupport(false)} 
                               className="py-4 bg-indigo-500 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-indigo-500/25 hover:bg-indigo-600 transition-colors"
                             >
                               تم، شكراً لدعمكم! ❤️
                             </button>
                          </div>
                       </motion.div>
                    </div>
                  )}
                </AnimatePresence>
        </div>
      </main>

      {activeTab !== 'analysis' && (
        <button 
          onClick={() => setShowModal(true)}
          className="fixed bottom-10 right-10 w-16 h-16 bg-gradient-to-tr from-indigo-500 via-purple-600 to-pink-500 text-white rounded-full flex items-center justify-center shadow-2xl hover:scale-110 active:scale-90 transition-all z-50 group border-2 border-white/20 glass-shine btn-hover-scale"
        >
          <Plus className="w-8 h-8 group-hover:rotate-90 transition-transform duration-500" />
        </button>
      )}

      <AnimatePresence>
        {showModal && (
          <HabitModal 
            onClose={() => {
              setShowModal(false);
              setHabitToEdit(undefined);
            }} 
            onSave={handleSave}
            habitToEdit={habitToEdit}
          />
        )}
        {showTips && (
          <EngineeringTips onClose={() => setShowTips(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}
