/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import * as LucideIcons from 'lucide-react';
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
  RefreshCw,
  WifiOff,
  Target,
  Bell,
  Shield,
  MapPin,
  Timer,
  Activity
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
import { trackHabitCompletion, trackRelapse } from './services/analytics';
import { getMotivationalMessage, getProgressSummary } from './services/geminiService';
import { createOrUpdateEvent, createOrUpdateGoalEvent, deleteEvent, getRRuleFromHabit, initCalendar } from './services/calendarService';

export default function App() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
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
        title: 'تقرير Aura 🧪',
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
            const success = await copyToClipboard(`${shareData.text}\n\nتابعني في Aura: ${shareData.url}`);
            if (success) showFeedback('تم نسخ التقرير للحافظة! 📋');
          } else {
            throw shareErr;
          }
        }
      } else {
        const success = await copyToClipboard(`${shareData.text}\n\nتابعني في Aura: ${shareData.url}`);
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
      doc.setFillColor(99, 102, 241); // blue-500
      doc.rect(0, 0, width, 45, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(26);
      doc.setFont("helvetica", "bold");
      doc.text('Aura Progress Report', 20, 28);
      
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
        doc.setTextColor(99, 102, 241); // blue-500
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
      
      doc.save(`Aura_Report_${new Date().toISOString().split('T')[0]}.pdf`);
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

  const handleInstallPWA = () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then((choiceResult: any) => {
        if (choiceResult.outcome === 'accepted') {
          showFeedback('مبارك! تم تثبيت تطبيق Aura 🚀', 'success');
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
  const [showTutorial, setShowTutorial] = useState(false);
  const [showTips, setShowTips] = useState(false);
  const [showDashboard, setShowDashboard] = useState(false);
  const [zoomIcon, setZoomIcon] = useState<{ icon: string, name: string } | null>(null);

  useEffect(() => {
    const hasSeenTutorial = localStorage.getItem('hasSeenTutorial');
    if (!hasSeenTutorial) {
      setShowTutorial(true);
      localStorage.setItem('hasSeenTutorial', 'true');
    }
  }, []);

  const [activeTab, setActiveTab] = useState<'home' | 'habits' | 'analysis' | 'levels' | 'privacy'>('home');
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

  useEffect(() => {
    if (window.location.hash === '#privacy') {
      setActiveTab('privacy');
    }
    
    const handleHashChange = () => {
      if (window.location.hash === '#privacy') {
        setActiveTab('privacy');
      } else if (activeTab === 'privacy') {
        setActiveTab('home');
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [activeTab]);

  const filteredHabits = useMemo(() => {
    return habits.filter(h => {
      const matchesCategory = selectedCategory === 'الكل' || h.category === selectedCategory;
      const matchesSearch = h.name.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesCategory && matchesSearch;
    }).sort((a, b) => {
      if (a.time && b.time) return a.time.localeCompare(b.time);
      return String(a.order).localeCompare(String(b.order));
    });
  }, [habits, selectedCategory, searchTerm]);

  const handleEdit = (habit: Habit) => {
    setHabitToEdit(habit);
    setShowModal(true);
  };

  const handleSave = (habitData: any) => {
    setConfirmAction({
      title: habitToEdit ? 'تحديث المهارة؟' : 'إضافة مهارة؟',
      description: habitToEdit ? 'هل تريد حفظ التعديلات الجديدة على هذه المهارة؟' : 'سيتم توجيه Aura للبدء بتتبع هذه المهارة الجديدة.',
      icon: <Sparkles className="w-12 h-12 text-blue-500 mb-6 mx-auto" />,
      onConfirm: async () => {
        let finalHabitData = { ...habitData };
        let finalId = habitToEdit?.id;
        
        if (habitToEdit) {
          updateHabit(habitToEdit.id, finalHabitData);
          showFeedback('تم تحديث المهارة بنجاح! ✨');
        } else {
          const newH = addHabit(finalHabitData);
          finalId = newH.id;
          showFeedback('تمت إضافة مهارة جديدة للمختبر! 🧪');
        }

        // Calendar sync handling
        if (finalHabitData.enableReminders && isSignedIn) {
          showFeedback('جاري ضبط التنبيهات في Google Calendar...');
          try {
            await initCalendar();
            const rrule = getRRuleFromHabit(finalHabitData.frequency, finalHabitData.customFrequency);
            
            const reminderId = await createOrUpdateEvent(
              habitToEdit?.reminderEventId || null,
              `Aura: ${finalHabitData.name}`,
              `وقت المهارة: ${finalHabitData.name} - ${finalHabitData.category}`,
              finalHabitData.time || '09:00',
              rrule
            );

            let nearGoalId = habitToEdit?.nearGoalEventId || null;
            if (finalHabitData.nearGoal?.targetDate) {
              nearGoalId = await createOrUpdateGoalEvent(
                nearGoalId,
                `الهدف القريب: ${finalHabitData.name}`,
                finalHabitData.nearGoal.description,
                finalHabitData.nearGoal.targetDate
              ) || nearGoalId;
            }

            let awayGoalId = habitToEdit?.awayGoalEventId || null;
            if (finalHabitData.awayGoal?.targetDate) {
              awayGoalId = await createOrUpdateGoalEvent(
                awayGoalId,
                `الهدف البعيد: ${finalHabitData.name}`,
                finalHabitData.awayGoal.description,
                finalHabitData.awayGoal.targetDate
              ) || awayGoalId;
            }

            updateHabit(finalId, { 
              reminderEventId: reminderId || undefined,
              nearGoalEventId: nearGoalId || undefined,
              awayGoalEventId: awayGoalId || undefined
            });
            
          } catch (e) {
            console.error("Calendar sync error", e);
            showFeedback('حصل مشكلة في ضبط التقويم!', 'alert');
          }
        } else if (!finalHabitData.enableReminders && habitToEdit) {
           // Delete reminders if they unchecked the box
           if (habitToEdit.reminderEventId) await deleteEvent(habitToEdit.reminderEventId);
           if (habitToEdit.nearGoalEventId) await deleteEvent(habitToEdit.nearGoalEventId);
           if (habitToEdit.awayGoalEventId) await deleteEvent(habitToEdit.awayGoalEventId);
           updateHabit(finalId, { 
             reminderEventId: undefined, 
             nearGoalEventId: undefined, 
             awayGoalEventId: undefined 
           });
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
    const habitToDelete = habits.find(h => h.id === id);
    setConfirmAction({
      title: 'هل أنت متأكد؟',
      description: 'سيتم حذف المهارة وكل سجلاتها نهائياً من Aura.',
      icon: <Trash2 className="w-12 h-12 text-blue-500 mb-6 mx-auto" />,
      onConfirm: async () => {
        if (habitToDelete?.reminderEventId) {
          await deleteEvent(habitToDelete.reminderEventId);
        }
        deleteHabit(id);
        setConfirmAction(null);
        showFeedback('تم حذف المهارة من السجل.', 'alert');
      }
    });
  };

  const handleRelapse = (id: string, reason: string) => {
    let habitName = '';
    const h = habits.find(x => x.id === id);
    if (h) {
      habitName = h.name;
      updateHabit(id, {
         streak: 0,
         isRecoveryModeEnabled: true,
         relapses: [...(h.relapses || []), { date: new Date().toISOString(), reason }]
      });
      trackRelapse(habitName, reason);
      showFeedback('معلش، هتتعوض بكرة. تم تفعيل وضع الاستعادة تلقائياً', 'alert');
    }
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
    showFeedback('إنجاز عظيم! تم تسجيل النقطة. 🔥', 'success', true);
    
    // Background the AI motivational message
    getMotivationalMessage(habit, note).then(msg => {
      setMotivation(msg);
      setTimeout(() => setMotivation(null), 5000);
    });
  };

  return (
    <div className="min-h-screen bg-blue-50/30 dark:bg-blue-950 text-slate-900 dark:text-blue-50 font-sans selection:bg-blue-500 selection:text-white transition-all duration-700 overflow-x-hidden">
      <AnimatePresence>
        {showTutorial && <TutorialOverlay onClose={() => setShowTutorial(false)} />}
      </AnimatePresence>

      <CelebrationConfetti active={showCelebration} onComplete={() => setShowCelebration(false)} />
      <AnimatePresence>
        {loading && <SplashScreen key="splash" />}
      </AnimatePresence>
      
      <AnimatePresence>
        {showDashboard && (
          <div className="fixed inset-0 z-[100] p-4 flex items-start justify-center sm:items-center">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-md"
              onClick={() => setShowDashboard(false)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: -20 }}
              className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl relative z-10 overflow-hidden flex flex-col border border-blue-50 dark:border-blue-900/30"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl -translate-y-16 translate-x-16" />
              
              <div className="p-8 pb-4 flex items-center justify-between border-b border-slate-50 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/30">
                    <Zap className="w-6 h-6 fill-current" />
                  </div>
                  <div className="text-right">
                    <h2 className="text-xl font-black text-slate-800 dark:text-slate-100">لوحة التحكم</h2>
                    <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Aura Dashboard</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowDashboard(false)}
                  className="w-10 h-10 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <ChevronRightIcon className="w-5 h-5 rotate-180" />
                </button>
              </div>

              <div className="p-8 space-y-8">
                {/* Account & Sync Section */}
                <div className="space-y-4">
                  <p className="text-[10px] font-black text-blue-500 uppercase tracking-[0.3em] text-right">الحساب والمزامنة السحابية</p>
                  <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-3xl border border-slate-100 dark:border-slate-800">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex flex-row-reverse items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isSignedIn ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-400'}`}>
                          {isSignedIn ? <Cloud className="w-5 h-5" /> : <CloudOff className="w-5 h-5" />}
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-black text-slate-800 dark:text-slate-100">
                            {isSignedIn ? 'سحابة Aura متصلة' : 'المزامنة معطلة'}
                          </p>
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{syncStatus}</p>
                        </div>
                      </div>
                      {!isSignedIn ? (
                        <button 
                          onClick={() => { signIn(); setShowDashboard(false); }} 
                          className="px-6 py-2.5 bg-blue-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-blue-500/20 hover:scale-105 transition-all"
                        >
                          تسجيل دخول
                        </button>
                      ) : (
                        <button 
                          onClick={() => { logout(); setShowDashboard(false); }} 
                          className="px-6 py-2.5 bg-red-50 text-red-600 dark:bg-red-900/20 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-100 transition-all border border-red-100 dark:border-red-900/30"
                        >
                          خروج
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Settings & Tools Section */}
                <div className="space-y-4">
                  <p className="text-[10px] font-black text-blue-500 uppercase tracking-[0.3em] text-right">أدوات إضافية</p>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <button 
                      onClick={() => {
                        exportData();
                        setShowDashboard(false);
                      }} 
                      className="flex flex-col items-center justify-center p-4 bg-slate-50 dark:bg-slate-800 rounded-3xl border border-slate-100 hover:bg-blue-50 hover:border-blue-200 transition-colors group"
                    >
                      <span className="text-2xl mb-2 group-hover:-translate-y-1 transition-transform">💾</span>
                      <span className="text-xs font-black text-slate-600">نسخة احتياطية</span>
                    </button>
                    <label className="flex flex-col items-center justify-center p-4 bg-slate-50 dark:bg-slate-800 rounded-3xl border border-slate-100 hover:bg-blue-50 hover:border-blue-200 transition-colors cursor-pointer group">
                      <span className="text-2xl mb-2 group-hover:-translate-y-1 transition-transform">📁</span>
                      <span className="text-xs font-black text-slate-600">استعادة للبيانات</span>
                      <input type="file" accept=".json" onChange={(e) => { importData(e); setShowDashboard(false); }} className="hidden" />
                    </label>
                  </div>

                  <button 
                    onClick={() => {
                      generatePDF();
                      setShowDashboard(false);
                    }} 
                    className="w-full flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 hover:border-blue-200 transition-all"
                  >
                    <span className="text-sm font-black text-slate-600 dark:text-slate-300">مستند التقرير PDF</span>
                    <span className="text-xl">📄</span>
                  </button>

                  <button 
                    onClick={() => { setShowTips(true); setShowDashboard(false); }}
                    className="w-full flex flex-row-reverse items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 hover:border-blue-200 transition-all"
                  >
                    <div className="text-right">
                       <p className="text-sm font-black text-slate-800 dark:text-slate-100">مخطط Aura الهندسي</p>
                       <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Blueprint Tips</p>
                    </div>
                    <Sparkles className="w-5 h-5 text-blue-400" />
                  </button>
                </div>
              </div>

              {/* Privacy Links Footer */}
              <div className="p-8 bg-slate-50 dark:bg-slate-800/50 flex flex-col gap-4">
                <button 
                  onClick={() => {
                    window.location.hash = '#privacy';
                    setShowDashboard(false);
                  }}
                  className="text-[9px] font-black text-slate-400 uppercase tracking-widest hover:text-blue-500 transition-colors text-right flex items-center justify-end gap-2 group"
                >
                  سياسة خصوصية Aura لضمان الأمان
                  <Shield className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
                </button>
                <div className="pt-2 flex justify-center border-t border-slate-200 dark:border-slate-700/50 border-dashed">
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">v1.0 Aura Protocol</p>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Zoom Icon Window */}
      <AnimatePresence>
        {zoomIcon && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-md"
              onClick={() => setZoomIcon(null)}
            />
            <motion.div 
              initial={{ scale: 0.5, opacity: 1 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
              className="relative bg-white dark:bg-slate-900 p-12 rounded-[4rem] shadow-2xl border border-blue-50 dark:border-slate-800 flex flex-col items-center gap-8"
            >
              <div className="w-48 h-48 rounded-[3.5rem] bg-blue-500 flex items-center justify-center text-white shadow-3xl shadow-blue-500/40">
                {React.createElement((LucideIcons as any)[zoomIcon.icon] || CheckCircle2, { className: "w-24 h-24" })}
              </div>
              <div className="text-center">
                <h3 className="text-3xl font-black text-slate-800 dark:text-white mb-2">{zoomIcon.name}</h3>
                <p className="text-[10px] font-black text-blue-500 uppercase tracking-[0.5em]">Active Skill Mode</p>
              </div>
              <button 
                onClick={() => setZoomIcon(null)}
                className="w-full py-5 px-10 bg-slate-100 dark:bg-slate-800 rounded-3xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-blue-500 transition-all active:scale-95"
              >
                عودة للمختبر
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <main className="max-w-2xl mx-auto px-4 sm:px-14 pt-10 pb-32 relative z-10">
        <AnimatePresence>
          {globalRecoveryMode && (
            <motion.div 
              key="global-recovery-alert"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="mb-6 overflow-hidden"
            >
              <div className="bg-blue-500 text-white px-6 py-3 rounded-2xl font-black text-xs text-center shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2">
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
              className="mb-8 p-5 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-3xl shadow-xl shadow-blue-500/20 text-sm font-semibold flex items-center gap-3"
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
                <div className="w-24 h-24 bg-blue-500 rounded-3xl flex items-center justify-center text-white mx-auto shadow-2xl shadow-blue-500/40">
                   <Coffee className="w-12 h-12" />
                </div>
                <div className="space-y-4">
                   <h2 className="text-3xl font-black text-slate-800">إنجازك النهاردة يكفي! 👋</h2>
                   <p className="text-lg font-bold text-slate-500 leading-relaxed max-w-sm mx-auto">
                      أنت وصلت للمستوى المطلوب وأنهيت تحدي الأسبوع. النهاردة إجازة رسمية من Aura، استمتع بوقتك!
                   </p>
                </div>
                <button 
                  onClick={() => setTodayIsHoliday(false)}
                  className="px-8 py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-800 transition-colors"
                >
                  رجوع للمAura
                </button>
              </motion.div>
            ) : activeTab === 'home' ? (
              <motion.div 
                key="home-view"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.05 }}
                className="flex flex-col items-center justify-center py-10 min-h-[75vh] relative"
              >
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-blue-500/10 dark:bg-blue-500/5 rounded-full blur-[100px] pointer-events-none" />
                
                <div className="relative w-[340px] h-[340px] sm:w-[420px] sm:h-[420px] flex items-center justify-center group">
                  <div className="absolute inset-0 border-[2px] border-blue-200 dark:border-slate-700/50 rounded-full animate-[spin_40s_linear_infinite] border-dashed opacity-50" />
                  <div className="absolute inset-8 border border-blue-500/20 dark:border-blue-500/20 rounded-full animate-[spin_60s_linear_infinite_reverse]" />
                  <div className="absolute inset-16 border border-slate-200 dark:border-slate-800 rounded-full" />
                  <div className="absolute inset-24 border border-blue-100/50 dark:border-slate-800/40 rounded-full animate-[ping_12s_cubic-bezier(0,0,0.2,1)_infinite]" />
                  
                  <motion.div 
                    animate={{ scale: [1, 1.05, 1], boxShadow: ["0 0 40px rgba(37,99,235,0.2)", "0 0 80px rgba(37,99,235,0.4)", "0 0 40px rgba(37,99,235,0.2)"] }} 
                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }} 
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 flex flex-col items-center bg-gradient-to-tr from-blue-600 to-blue-500 rounded-full w-32 h-32 justify-center border border-blue-400/30"
                  >
                     <Target className="w-12 h-12 text-white mb-1" />
                     <span className="text-[10px] font-black text-white uppercase tracking-[0.3em]">AURA</span>
                  </motion.div>

                  <button onClick={() => setActiveTab('habits')} className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md rounded-full shadow-[0_10px_40px_-10px_rgba(37,99,235,0.2)] border border-white dark:border-slate-800 flex flex-col items-center justify-center gap-1 hover:scale-110 active:scale-95 transition-all text-blue-600 z-30 group/btn">
                     <CheckCircle2 className="w-7 h-7 group-hover/btn:scale-110 transition-transform" />
                     <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 group-hover/btn:text-blue-600 transition-colors">المهارات</span>
                  </button>

                  <button onClick={() => setActiveTab('analysis')} className="absolute top-1/2 right-0 translate-x-1/2 -translate-y-1/2 w-20 h-20 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md rounded-full shadow-[0_10px_40px_-10px_rgba(147,51,234,0.2)] border border-white dark:border-slate-800 flex flex-col items-center justify-center gap-1 hover:scale-110 active:scale-95 transition-all text-purple-600 z-30 group/btn">
                     <Activity className="w-7 h-7 group-hover/btn:scale-110 transition-transform" />
                     <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 group-hover/btn:text-purple-600 transition-colors">المختبر</span>
                  </button>

                  <button onClick={() => setActiveTab('levels')} className="absolute top-1/2 left-0 -translate-x-1/2 -translate-y-1/2 w-20 h-20 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md rounded-full shadow-[0_10px_40px_-10px_rgba(202,138,4,0.2)] border border-white dark:border-slate-800 flex flex-col items-center justify-center gap-1 hover:scale-110 active:scale-95 transition-all text-yellow-600 z-30 group/btn">
                     <Award className="w-7 h-7 group-hover/btn:scale-110 transition-transform" />
                     <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 group-hover/btn:text-yellow-600 transition-colors">المسار</span>
                  </button>

                  <button onClick={() => setShowDashboard(true)} className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-20 h-20 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md rounded-full shadow-xl border border-white dark:border-slate-800 flex flex-col items-center justify-center gap-1 hover:scale-110 active:scale-95 transition-all text-slate-600 dark:text-slate-300 z-30 group/btn">
                     <Settings className="w-7 h-7 group-hover/btn:rotate-90 transition-transform" />
                     <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 group-hover/btn:text-slate-800 dark:group-hover/btn:text-white transition-colors">الإعدادات</span>
                  </button>
                </div>
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
                    <div className="absolute -top-12 -right-12 w-64 h-64 bg-blue-500/20 blur-[100px] rounded-full" />
                  <div className="relative z-10 flex flex-col items-center gap-6">
                     <span className="text-[10px] font-black uppercase tracking-[0.4em] text-blue-400">الحالة الراهنة</span>
                     <div className="text-center">
                        <p className="text-sm font-black text-blue-300 uppercase mb-2">{userTitle}</p>
                        <h2 className="text-6xl font-black tracking-tighter">Lvl {userLevel}</h2>
                        <div className="mt-4 flex items-center justify-center gap-2 bg-blue-500/20 px-4 py-2 rounded-2xl border border-blue-500/30">
                           <Award className="w-5 h-5 text-blue-400" />
                           <span className="text-xl font-black text-white font-mono">{points} Point</span>
                        </div>
                     </div>
                     <div className="w-full max-w-xs h-3 bg-white/10 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${levelProgress}%` }}
                          className="h-full bg-blue-500 shadow-[0_0_15px_rgba(99,102,241,0.5)]"
                        />
                     </div>
                     <p className="text-xs font-bold text-slate-400">
                        {`باقي ${Math.round(levelInfo.nextLevelPoints)} نقطة للمستوى التالي`}
                     </p>
                  </div>
               </div>

               <div className="mb-12">
                   {!weeklyChallenge ? (
                     <div className="glass rounded-[2rem] p-10 border-2 border-blue-500/10 shadow-2xl relative overflow-hidden bg-white/70 text-center group">
                        <div className="absolute -top-12 -right-12 w-32 h-32 bg-blue-500/5 rounded-full blur-2xl group-hover:bg-blue-500/10 transition-colors" />
                        <Trophy className="w-12 h-12 text-slate-300 mx-auto mb-6" />
                        <h3 className="text-lg font-black text-slate-800 mb-2">تحدى نفسك هذا الأسبوع</h3>
                        <p className="text-xs font-bold text-slate-400 mb-8 max-w-xs mx-auto">
                          في Aura، أنت من يصمم تحدياته. ابدأ بتعريف تحدي أسبوعي مخصص يناسب أهدافك الحالية.
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
                     <div className="glass rounded-[2rem] p-8 border-2 border-blue-500/10 shadow-2xl relative overflow-hidden bg-white/70">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full -translate-y-16 translate-x-16" />
                        <div className="relative flex items-center justify-between mb-8">
                           <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-blue-500 text-white flex items-center justify-center">
                                 <Trophy className="w-5 h-5 shadow-lg shadow-blue-500/40" />
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
                              <div className="flex items-center gap-2 text-blue-500 mb-2">
                                 <ArrowRight className="w-3.5 h-3.5" />
                                 <span className="text-[10px] font-black uppercase tracking-widest">الهدف الحالي</span>
                              </div>
                              <p className="text-md font-black text-slate-700">{weeklyChallenge.goal}</p>
                           </div>
          
                           <div className="space-y-3">
                              <div className="flex justify-between items-baseline px-2">
                                 <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">نقاط الأسبوع</span>
                                 <span className="text-2xl font-black text-blue-600 font-mono tracking-tighter">{weeklyChallenge.progress}/{weeklyChallenge.target}</span>
                              </div>
                              <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden p-0.5">
                                 <motion.div 
                                   initial={{ width: 0 }}
                                   animate={{ width: `${(weeklyChallenge.progress / weeklyChallenge.target) * 100}%` }}
                                   className="h-full bg-gradient-to-r from-blue-500 via-blue-500 to-blue-500 rounded-full"
                                   transition={{ type: "spring", damping: 15 }}
                                 />
                              </div>
                           </div>
          
                           <div className={`p-5 rounded-3xl border-2 transition-all flex items-center justify-between ${weeklyChallenge.progress >= weeklyChallenge.target ? 'bg-blue-50 border-blue-100 text-blue-600' : 'bg-slate-50 border-transparent text-slate-400'}`}>
                              <div className="flex items-center gap-3">
                                 <div className={`p-2 rounded-xl ${weeklyChallenge.progress >= weeklyChallenge.target ? 'bg-blue-500 text-white' : 'bg-slate-200 text-slate-400'}`}>
                                    <Gift className="w-4 h-4" />
                                 </div>
                                 <div>
                                    <span className="text-[10px] font-black uppercase tracking-widest block">مكافأتك</span>
                                    <p className="text-xs font-black">{weeklyChallenge.reward}</p>
                                 </div>
                              </div>
                              {weeklyChallenge.progress >= weeklyChallenge.target && (
                                <Sparkles className="w-5 h-5 text-blue-500 animate-spin-slow" />
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
                                     className="w-full bg-slate-100 p-4 rounded-xl border border-slate-200 outline-none focus:border-blue-500 text-xs font-bold"
                                   />
                                </label>
                                <label className="block">
                                   <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1 block mb-2">المكافأة المخصصة</span>
                                   <input 
                                     type="text"
                                     value={weeklyChallenge.reward}
                                     onChange={e => setWeeklyChallenge({...weeklyChallenge, reward: e.target.value})}
                                     className="w-full bg-slate-100 p-4 rounded-xl border border-slate-200 outline-none focus:border-blue-500 text-xs font-bold"
                                   />
                                </label>
                                <div className="grid grid-cols-2 gap-4">
                                   <label className="block">
                                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1 block mb-2">الرقم المستهدف</span>
                                      <input 
                                        type="number"
                                        value={weeklyChallenge.target}
                                        onChange={e => setWeeklyChallenge({...weeklyChallenge, target: parseInt(e.target.value) || 1})}
                                        className="w-full bg-slate-100 p-4 rounded-xl border border-slate-200 outline-none focus:border-blue-500 text-xs font-bold"
                                      />
                                   </label>
                                   <div className="flex items-end gap-2">
                                      <button 
                                        onClick={() => {
                                          setConfirmAction({
                                            title: 'حذف التحدي؟',
                                            description: 'سيتم مسح سجلات المستوى الحالي ونقاط الأسبوع. هل أنت متأكد؟',
                                            icon: <Trash2 className="w-12 h-12 text-blue-500 mb-6 mx-auto" />,
                                            onConfirm: () => {
                                              setWeeklyChallenge(null);
                                              setShowChallengeEdit(false);
                                              setConfirmAction(null);
                                              showFeedback('تم حذف المهارة من السجل الأسبوعي.', 'alert');
                                            }
                                          });
                                        }}
                                        className="flex-1 h-[48px] bg-blue-50 text-blue-500 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-100"
                                      >
                                        حذف التحدي
                                      </button>
                                      <button 
                                        onClick={() => {
                                          setShowChallengeEdit(false);
                                          showFeedback('تم تحديث بيانات التحدي بنجاح! ✨');
                                        }}
                                        className="flex-1 h-[48px] bg-blue-500 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-600 shadow-lg shadow-blue-500/20"
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
                    <div key={`rank-v2-${i}`} className={`p-6 rounded-[2rem] border transition-all flex items-center justify-between ${i < userLevel - 1 ? 'bg-blue-50 border-blue-100' : i === userLevel - 1 ? 'bg-blue-50 border-blue-200 shadow-lg' : 'bg-slate-50 border-slate-100 opacity-40'}`}>
                       <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xs font-black ${i < userLevel - 1 ? 'bg-blue-500 text-white' : i === userLevel - 1 ? 'bg-slate-900 text-white' : 'bg-slate-200 text-slate-400'}`}>
                             {i + 1}
                          </div>
                          <div className="text-right">
                             <p className="text-[9px] font-black uppercase text-slate-400 mb-1">المستوى {i + 1}</p>
                             <p className="text-xs font-black text-slate-800">{rank}</p>
                          </div>
                       </div>
                       {i < userLevel - 1 && <CheckCircle2 className="w-5 h-5 text-blue-500" />}
                    </div>
                  ))}
               </div>
            </motion.div>
          ) : activeTab === 'privacy' ? (
            <motion.div 
              key="privacy-view"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-2xl mx-auto px-2"
            >
              <div className="flex items-center justify-between mb-16">
                <div />
                <div className="text-right">
                   <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                    سياسة الخصوصية
                  </h2>
                  <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest mt-1">Aura Protocol</p>
                </div>
              </div>

              <div className="space-y-12 text-right">
                <section className="space-y-6">
                  <div className="flex items-center gap-3 justify-end text-blue-500">
                    <h3 className="text-xl font-black uppercase tracking-tight">أمانك هو وقودنا</h3>
                    <Shield className="w-6 h-6" />
                  </div>
                  <p className="text-base font-bold text-slate-600 dark:text-slate-400 leading-relaxed">
                    خصوصية بياناتك ليست مجرد ميزة في Aura، بل هي حجر الأساس الذي بنينا عليه التطبيق. نحن لا نجمع بياناتك ولا نعرف من أنت، هدفنا فقط هو تحويلك لأفضل نسخة من نفسك.
                  </p>
                </section>

                <section className="space-y-6 p-10 bg-slate-50 dark:bg-slate-800/50 rounded-[3rem] border border-slate-100 dark:border-slate-800 relative overflow-hidden shadow-sm">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 blur-3xl rounded-full" />
                  <h4 className="font-black text-lg text-slate-800 dark:text-white">أين تذهب بياناتك؟</h4>
                  <div className="space-y-6">
                     <div className="flex items-start gap-4 justify-end">
                        <p className="text-sm font-bold text-slate-500">يتم تخزين بياناتك محلياً على جهازك فقط بشكل مشفر تماماً.</p>
                        <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                     </div>
                     <div className="flex items-start gap-4 justify-end">
                        <p className="text-sm font-bold text-slate-500">نحن لا نملك خوادم مركزية تجمع بيانات المستخدمين أو تبيعها.</p>
                        <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                     </div>
                     <div className="flex items-start gap-4 justify-end">
                        <p className="text-sm font-bold text-slate-500">عند تفعيل Google Drive، تنتقل البيانات من جهازك لمساحتك الخاصة مباشرة دون المرور بنا.</p>
                        <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                     </div>
                  </div>
                </section>

                <section className="space-y-6">
                  <div className="flex items-center gap-3 justify-end text-blue-500">
                    <h3 className="text-xl font-black uppercase tracking-tight">تكامل الخدمات السحابية</h3>
                    <Cloud className="w-6 h-6" />
                  </div>
                  <p className="text-base font-bold text-slate-600 dark:text-slate-400 leading-relaxed">
                    عند ربط Aura بحساب Google الخاص بك، فإننا نطلب أذونات محددة جداً لضمان أفضل تجربة مستخدم دون التعدي على مساحتك الشخصية.
                  </p>
                </section>

                <section className="space-y-10">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 justify-end">
                      <span className="text-xs font-black text-blue-500 uppercase tracking-widest">Google Drive</span>
                      <div className="h-px flex-1 bg-slate-100 dark:bg-slate-800" />
                    </div>
                    <p className="text-sm font-bold text-slate-500 leading-relaxed">
                      نحن نستخدم "App Data Folder"، وهو مكان مخصص للتطبيق لا يمكنك رؤيته يدوياً ولا يمكن لتطبيقات أخرى الوصول إليه. نحن لا نرى ملفاتك أو صورك الأخرى أبداً.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center gap-2 justify-end">
                      <span className="text-xs font-black text-blue-500 uppercase tracking-widest">Google Calendar</span>
                      <div className="h-px flex-1 bg-slate-100 dark:bg-slate-800" />
                    </div>
                    <p className="text-sm font-bold text-slate-500 leading-relaxed">
                      نستخدم التقويم فقط لإرسال "إشعارات ذكية" لمهاراتك وتنبيهك عند اقتراب وقت الهدف. نحن نعدل فقط الأحداث التي أنشأها التطبيق، ولا نطلع على جدولك اليومي الخاص.
                    </p>
                  </div>
                </section>

                <section className="space-y-6">
                  <h4 className="font-black text-slate-800 dark:text-white text-lg">التزاماتنا</h4>
                  <p className="text-sm font-bold text-slate-500 leading-relaxed italic border-r-4 border-blue-500 pr-6">
                    "نحن نلتزم بالحياد التام تجاه بياناتك. أنت المتحكم الوحيد في مسارك الإنمائي."
                  </p>
                </section>

                <div className="p-8 bg-blue-50 dark:bg-blue-900/10 rounded-3xl border border-blue-100 dark:border-blue-900/30">
                  <p className="text-xs font-black text-blue-600 dark:text-blue-400 text-center leading-relaxed">
                    يمكنك دائماً مراجعة الأذونات الممنوحة للتطبيقات من خلال لوحة تحكم حساب Google الخاص بك وإلغاؤها في أي وقت.
                  </p>
                </div>
              </div>
              
              <div className="mt-32 pt-8 border-t border-slate-100 dark:border-slate-800 flex justify-center">
                <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.6em]">Designed with Privacy in Mind • Aura Labs</p>
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
                    <span className="text-sm font-bold text-blue-500 dark:text-blue-400">{selectedDate === new Date().toISOString().split('T')[0] ? 'النهاردة' : selectedDate}</span>
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
                      placeholder="ابحث في المهارات.."
                      className="w-full bg-white dark:bg-slate-800 text-right pr-12 pl-4 py-3 rounded-2xl border border-slate-100 dark:border-slate-700 text-sm font-bold outline-none focus:border-blue-500 dark:text-slate-200 transition-all shadow-sm"
                    />
                  </div>
                )}
              </div>

              {habits.length === 0 ? (
                <div className="pl-12 py-20 flex flex-col items-center justify-center text-center">
                  <div className="w-20 h-20 bg-blue-50 dark:bg-blue-900/20 rounded-[2rem] flex items-center justify-center mb-6">
                    <Sparkles className="w-8 h-8 text-blue-500" />
                  </div>
                  <h3 className="text-xl font-black text-slate-800 dark:text-slate-100 mb-2">أهلاً بيك في Aura!</h3>
                  <p className="text-sm font-bold text-slate-500 dark:text-slate-400 max-w-[250px] leading-relaxed mb-12">
                    Aura فاضي مفيش فيه أي مهارات لسه.. دوس على الزرار تحت عشان تبدأ رحلتك.
                  </p>
                  
                  <div className="relative mt-8">
                    <motion.div 
                      animate={{ y: [0, 10, 0] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="absolute -bottom-20 right-8 md:right-1/2"
                    >
                      <svg width="60" height="80" viewBox="0 0 60 80" fill="none" className="text-blue-300 dark:text-blue-700 stroke-current drop-shadow-md">
                        <path d="M50 0 C 50 40, 10 40, 10 70 M 10 70 L 2 60 M 10 70 L 18 60" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </motion.div>
                  </div>
                </div>
              ) : filteredHabits.length === 0 ? (
                <div className="pl-12 py-20 text-center text-slate-300">
                  <p className="text-xs font-medium italic">مافيش مهارات في الفئة دي للAura..</p>
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
                    onRelapse={handleRelapse}
                    onIconClick={(icon, name) => setZoomIcon({ icon, name })}
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
                className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-white border border-blue-500 text-blue-600 font-bold text-xs shadow-lg shadow-blue-500/5 hover:bg-blue-50 hover:scale-105 active:scale-95 transition-all"
              >
                <Share2 className="w-4 h-4" />
                مشاركة 🚀
              </button>
              
              <button 
                onClick={() => setShowSupport(true)}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-500/20 hover:scale-105 active:scale-95 transition-all"
              >
                <Coffee className="w-4 h-4" />
                ادعمنا ☕
              </button>

              <button 
                onClick={() => window.open('https://forms.gle/FC8RuWBEkR7m5tzt9', '_blank')}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-500/20 hover:scale-105 active:scale-95 transition-all"
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
                  <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 dark:bg-blue-900/10 rounded-full blur-3xl -translate-y-16 translate-x-16" />
                  
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
                       className="py-4 bg-blue-500 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-blue-500/25 hover:bg-blue-600 transition-colors"
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
                  ? 'bg-blue-500 text-white border-blue-400' 
                  : (feedback as any).type === 'alert'
                  ? 'bg-blue-500 text-white border-blue-400'
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
                          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-full blur-3xl -translate-y-16 translate-x-16" />
                          
                          <Sparkles className="w-16 h-16 text-blue-500 mb-6 mx-auto animate-pulse" />
                          
                          <h3 className="text-2xl font-black text-slate-900 mb-4">شارك في بناء Habit Lab 🚀</h3>
                          <div className="space-y-4 text-xs font-bold text-slate-500 leading-relaxed mb-8">
                             <p>"لو تطبيق habit lab ساعدك تنظم يومك وتبنى مهاراتك بدل التشتت تقدر تدعم استمرار المشروع وتطوير ميزات جديدة بمبلغ رمزي. دعمك هو اللي بيخلينا نكبر ونقدم كود أنضف وتجربة أحسن."</p>
                             <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 space-y-3">
                                <p className="text-slate-800 font-black">طريقة الدعم (فودافون كاش):</p>
                                <p className="text-lg font-black text-blue-600 font-mono">01282920387 :حول مباشرة على رقم</p>
                                <p>خد سكرين شوت وابعتها لينا [ واتساب ] وبكدا هتبقى شاركت ف بناء البرنامج</p>
                             </div>
                          </div>
                          
                          <div className="grid grid-cols-1">
                             <button 
                               onClick={() => setShowSupport(false)} 
                               className="py-4 bg-blue-500 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-blue-500/25 hover:bg-blue-600 transition-colors"
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

      {activeTab !== 'home' && (
        <button 
          onClick={() => setActiveTab('home')}
          className="fixed top-6 right-6 sm:top-10 sm:right-10 w-12 h-12 bg-white dark:bg-slate-900 text-slate-800 dark:text-white rounded-2xl flex items-center justify-center shadow-xl hover:scale-110 active:scale-90 transition-all z-50 border border-slate-100 dark:border-slate-800"
        >
          <Target className="w-6 h-6" />
        </button>
      )}

      {activeTab !== 'analysis' && activeTab !== 'home' && activeTab !== 'privacy' && (
        <button 
          onClick={() => setShowModal(true)}
          className="fixed bottom-10 right-10 w-16 h-16 bg-gradient-to-tr from-blue-500 via-blue-600 to-blue-500 text-white rounded-full flex items-center justify-center shadow-2xl hover:scale-110 active:scale-90 transition-all z-50 group border-2 border-white/20 glass-shine btn-hover-scale"
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
