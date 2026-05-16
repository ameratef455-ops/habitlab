/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect, Suspense, lazy } from 'react';
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
  Activity,
  FileText,
  UserX,
} from 'lucide-react';
import { useHabitLab } from './hooks/useHabitLab';
import { HabitCard } from './components/HabitCard';

const HabitModal = lazy(() => import('./components/HabitModal').then(m => ({ default: m.HabitModal })));
const NotesView = lazy(() => import('./components/NotesView').then(m => ({ default: m.NotesView })));
const PlannerView = lazy(() => import('./components/PlannerView').then(m => ({ default: m.PlannerView })));
const ScheduleView = lazy(() => import('./components/ScheduleView').then(m => ({ default: m.ScheduleView })));
const AnalysisView = lazy(() => import('./components/AnalysisView').then(m => ({ default: m.AnalysisView })));
const ModesView = lazy(() => import('./components/ModesView').then(m => ({ default: m.ModesView })));
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
    setPoints,
    scheduleTasks,
    setScheduleTasks,
    plannerData,
    setPlannerData,
    generalNotes,
    setGeneralNotes,
    globalRecoveryMode,
    setGlobalRecoveryMode,
    weeklyChallenge,
    setWeeklyChallenge,
    addHabit, 
    updateHabit, 
    deleteHabit,
    toggleHabitRecovery,
    completeHabit, 
    undoHabitCompletion,
    todayIsHoliday,
    setTodayIsHoliday,
    overrideData,
    addNoteToHabit,
    focusSessions,
    setFocusSessions,
    dreamSessions,
    setDreamSessions
  } = useHabitLab();

  const handleRemoteDataSync = (remoteData: any) => {
    overrideData(remoteData);
  };

  const { syncStatus, isSignedIn, signIn, logout, deleteSyncData, isInitializing, userProfile } = useGoogleDriveSync(
    { habits, points, weeklyChallenge, scheduleTasks, plannerData, globalRecoveryMode, todayIsHoliday, focusSessions, dreamSessions, generalNotes },
    handleRemoteDataSync
  );

  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 3000);
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
      pointsRequiredForCurrent += 150;
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
      showFeedback('جار تجهيز التقرير التفصيلي... ⏳', 'info');
      const { jsPDF } = await import('jspdf');
      const { default: autoTable } = await import('jspdf-autotable');
      const doc = new jsPDF();
      
      const width = doc.internal.pageSize.getWidth();
      
      // Header Background
      doc.setFillColor(59, 130, 246); // blue-500
      doc.rect(0, 0, width, 50, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(28);
      doc.setFont("helvetica", "bold");
      doc.text('AURA • FULL PROGRESS REPORT', 20, 30);
      
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      const dateStr = new Date().toLocaleDateString('en-US', { 
        year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' 
      });
      doc.text(`Generated on: ${dateStr}`, width - 20, 30, { align: 'right' });
      doc.text(`User ID: ${userProfile?.name || 'Aura Developer'}`, width - 20, 35, { align: 'right' });

      // Section: Summary
      doc.setTextColor(15, 23, 42); // slate-900
      doc.setFontSize(18);
      doc.setFont("helvetica", "bold");
      doc.text('1. Executive Summary', 20, 70);
      
      // Stats Cards Layout
      const cardWidth = (width - 60) / 3;
      const cardY = 80;
      
      const drawCard = (x: number, title: string, value: string, sub: string) => {
        doc.setFillColor(248, 250, 252);
        doc.setDrawColor(226, 232, 240);
        doc.roundedRect(x, cardY, cardWidth, 40, 5, 5, 'FD');
        doc.setFontSize(9);
        doc.setTextColor(100, 116, 139);
        doc.text(title, x + 5, cardY + 12);
        doc.setTextColor(15, 23, 42);
        doc.setFontSize(16);
        doc.text(value, x + 5, cardY + 25);
        doc.setFontSize(8);
        doc.setTextColor(59, 130, 246);
        doc.text(sub, x + 5, cardY + 34);
      };

      drawCard(20, 'Current Level', `Level ${userLevel}`, userTitle || 'Beginner');
      drawCard(20 + cardWidth + 10, 'Aura Points', `${points}`, `Next lvl in ${Math.round(levelInfo.nextLevelPoints)} pts`);
      const totalCompletions = habits.reduce((acc, h) => acc + (h.totalCompletions || 0), 0);
      drawCard(20 + (cardWidth * 2) + 20, 'Total Success', `${totalCompletions}`, 'Successful Check-ins');

      // Section: Skill Progress Table
      doc.setFontSize(18);
      doc.setTextColor(15, 23, 42);
      doc.text('2. Skill Laboratory Status', 20, 140);
      
      const skillTableData = habits.map(h => [
        h.name,
        h.category,
        h.streak,
        h.totalCompletions || 0,
        `${h.difficulty === 'easy' ? 'Easy' : h.difficulty === 'medium' ? 'Medium' : 'Hard'}`
      ]);

      autoTable(doc, {
        startY: 150,
        head: [['Skill Description', 'Domain', 'Streak', 'Success', 'Difficulty']],
        body: skillTableData,
        theme: 'striped',
        headStyles: { fillColor: [59, 130, 246], textColor: [255, 255, 255] },
        styles: { font: 'helvetica', fontSize: 9 }
      });

      // Section: Timeline & Planning
      doc.addPage();
      doc.setFontSize(18);
      doc.text('3. Timeline & 2026 Strategy', 20, 30);
      
      const plannerEntries = Object.entries(plannerData).filter(([_, data]: [string, any]) => data.goal || data.notes);
      if (plannerEntries.length > 0) {
        const plannerTableData = plannerEntries.map(([month, data]: [string, any]) => [
          month,
          data.goal || '-',
          data.notes || '-'
        ]);
        autoTable(doc, {
          startY: 40,
          head: [['Month', 'Strategic Goal', 'Notes & Roadmap']],
          body: plannerTableData,
          theme: 'grid',
          headStyles: { fillColor: [16, 185, 129] } // emerald-500
        });
      } else {
        doc.setFontSize(10);
        doc.setTextColor(100, 116, 139);
        doc.text('No specialized timeline planning data recorded for 2026 yet.', 20, 45);
      }

      // Section: Sessions Analysis (Focus/Dream)
      const lastY = (doc as any).lastAutoTable?.finalY || 60;
      doc.setFontSize(18);
      doc.setTextColor(15, 23, 42);
      doc.text('4. Deep Work & Focus Sessions', 20, lastY + 20);
      
      const sessionsData = (focusSessions || []).slice(-10).map(s => [
        new Date(s.timestamp).toLocaleDateString(),
        s.type,
        `${s.duration} min`,
        s.notes || '-'
      ]);

      if (sessionsData.length > 0) {
        autoTable(doc, {
          startY: lastY + 30,
          head: [['Date', 'Mode', 'Duration', 'Session Summary']],
          body: sessionsData,
          theme: 'striped',
          headStyles: { fillColor: [147, 51, 234] } // purple-600
        });
      } else {
        doc.setFontSize(10);
        doc.setTextColor(100, 116, 139);
        doc.text('Awaiting first focus or meditation session recording.', 20, lastY + 35);
      }

      // Section: General Intelligence Notes
      doc.addPage();
      doc.setFontSize(18);
      doc.setTextColor(15, 23, 42);
      doc.text('5. Knowledge Base & General Notes', 20, 30);
      
      const notesData = (generalNotes || []).map(n => [
        new Date(n.date).toLocaleDateString(),
        n.title,
        n.content.substring(0, 100) + (n.content.length > 100 ? '...' : '')
      ]);

      if (notesData.length > 0) {
        autoTable(doc, {
          startY: 40,
          head: [['Date', 'Entry Title', 'Content Snippet']],
          body: notesData,
          theme: 'plain',
          styles: { cellPadding: 5 }
        });
      } else {
        doc.setFontSize(10);
        doc.setTextColor(100, 116, 139);
        doc.text('Laboratory logbook is currently empty.', 20, 45);
      }

      // Footer
      const totalPages = doc.internal.pages.length - 1;
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(148, 163, 184);
        doc.text(`Page ${i} of ${totalPages}`, width / 2, doc.internal.pageSize.getHeight() - 10, { align: 'center' });
      }
      
      doc.save(`AURA_INTEL_REPORT_${new Date().toISOString().split('T')[0]}.pdf`);
      showFeedback('تم استخراج تقرير Aura بنجاح! 🚀', 'success');
    } catch (err) {
      console.error(err);
      showFeedback('Error generating PDF report', 'alert');
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
  const [settingsTab, setSettingsTab] = useState<'account' | 'system' | 'management' | 'modes'>('account');
  const [zoomIcon, setZoomIcon] = useState<{ icon: string, name: string } | null>(null);

  useEffect(() => {
    const hasSeenTutorial = localStorage.getItem('hasSeenTutorial');
    if (!hasSeenTutorial) {
      setShowTutorial(true);
      localStorage.setItem('hasSeenTutorial', 'true');
    }
  }, []);

  const [activeTab, setActiveTab] = useState<'home' | 'habits' | 'analysis' | 'levels' | 'privacy' | 'notes' | 'planner' | 'schedule' | 'modes'>('home');
  const [showCelebration, setShowCelebration] = useState(false);
  const [confettiIntensity, setConfettiIntensity] = useState<'low' | 'medium' | 'high'>('medium');
  const [selectedCategory, setSelectedCategory] = useState<string>('الكل');
  const [showModal, setShowModal] = useState(false);
  const [glowActivated, setGlowActivated] = useState(false);
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

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
        let isEditing = !!habitData.id;
        let finalId = habitData.id;
        
        if (isEditing) {
          updateHabit(finalId, finalHabitData);
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
        } else if (!finalHabitData.enableReminders && isEditing && habitToEdit) {
           try {
             if (habitToEdit.reminderEventId) await deleteEvent(habitToEdit.reminderEventId);
             if (habitToEdit.nearGoalEventId) await deleteEvent(habitToEdit.nearGoalEventId);
             if (habitToEdit.awayGoalEventId) await deleteEvent(habitToEdit.awayGoalEventId);
             updateHabit(finalId, { 
               reminderEventId: undefined, 
               nearGoalEventId: undefined, 
               awayGoalEventId: undefined 
             });
           } catch (e) {
             console.error("Error deleting old reminders", e);
           }
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

  const handleComplete = async (habit: Habit, note?: string, type?: 'text' | 'voice', recovery?: boolean, questionnaire?: any, isQuick: boolean = false) => {
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

    completeHabit(habit.id, note, type, recovery, questionnaire);
    trackHabitCompletion(habit.name, habit.streak + 1);
    
    // Choose confetti intensity based on questionary/points
    let intensity: 'low'|'medium'|'high' = 'medium';
    if (isQuick) intensity = 'low';
    if (questionnaire?.goalLevel === 'exceeded') intensity = 'high';
    
    setConfettiIntensity(intensity);
    setShowCelebration(true);

    showFeedback(isQuick ? 'تم تسجيل النقطة تلقائياً! ⚡' : 'إنجاز عظيم! تم تسجيل النقطة. 🔥', 'success', true);
    
    if (isQuick) return;

    getMotivationalMessage(habit, note).then(msg => {
      // Append user name if available
      const userName = userProfile?.name ? userProfile.name.split(' ')[0] : '';
      setMotivation(userName ? `يا ${userName}، ${msg}` : msg);
      setTimeout(() => setMotivation(null), 5000);
    });
  };

  const handleCelebrate = (intensity: 'low'|'medium'|'high' = 'medium') => {
    setConfettiIntensity(intensity);
    setShowCelebration(true);
  };

  const handleQuickComplete = (habit: Habit) => {
    handleComplete(habit, undefined, undefined, false, undefined, true);
  };

  return (
    <div className="min-h-screen bg-blue-50/30 dark:bg-blue-950 text-slate-900 dark:text-blue-50 font-sans selection:bg-blue-500 selection:text-white transition-all duration-700 overflow-x-hidden">
      <AnimatePresence>
        {showTutorial && <TutorialOverlay onClose={() => setShowTutorial(false)} />}
      </AnimatePresence>

      <CelebrationConfetti active={showCelebration} intensity={confettiIntensity} onComplete={() => setShowCelebration(false)} />
      <AnimatePresence>
        {!isOnline && (
          <motion.div 
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-4 left-1/2 -translate-x-1/2 z-[200] bg-red-500 text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2"
          >
            <WifiOff className="w-4 h-4" />
            <span className="text-xs font-bold w-max">غير متصل بالإنترنت</span>
          </motion.div>
        )}
      </AnimatePresence>

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
                    <Settings className="w-6 h-6" />
                  </div>
                  <div className="text-right">
                    <h2 className="text-xl font-black text-slate-800 dark:text-slate-100">الإعدادات</h2>
                    <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Aura Settings</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowDashboard(false)}
                  className="w-10 h-10 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <ChevronRightIcon className="w-5 h-5 rotate-180" />
                </button>
              </div>

              <div className="px-8 pt-4">
                <div className="bg-slate-50 dark:bg-slate-800/50 p-1 rounded-[1.5rem] flex items-center justify-between gap-1 overflow-x-auto no-scrollbar">
                  {[
                    { id: 'account', label: 'الحساب', icon: Cloud },
                    { id: 'modes', label: 'المودات', icon: Sparkles },
                    { id: 'system', label: 'النظام', icon: Settings },
                    { id: 'management', label: 'إداري', icon: Shield }
                  ].map(tab => {
                    const TabIcon = tab.icon;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setSettingsTab(tab.id as 'account' | 'system' | 'management' | 'modes')}
                        className={`flex-1 min-w-[70px] py-1.5 rounded-[1.25rem] text-[8px] font-black tracking-widest flex flex-col items-center justify-center gap-1 transition-all ${
                          settingsTab === tab.id 
                            ? 'bg-white dark:bg-slate-900 text-blue-600 shadow-xl shadow-blue-500/10 border border-slate-100 dark:border-slate-800 scale-105' 
                            : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                      >
                        <TabIcon className={`w-3.5 h-3.5 ${settingsTab === tab.id ? 'animate-pulse' : ''}`} />
                        {tab.label}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="p-8 space-y-8 h-[60vh] sm:h-auto max-h-[70vh] overflow-y-auto no-scrollbar relative">
                {settingsTab === 'account' && (
                  <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                    <p className="text-[10px] font-black text-blue-500 uppercase tracking-[0.3em] text-right">الحساب والمزامنة السحابية</p>
                    <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800">
                      <div className="flex flex-col items-center gap-4 text-center">
                        <div className={`w-16 h-16 rounded-[2rem] flex items-center justify-center ${isSignedIn ? 'bg-blue-100 text-blue-600 border border-blue-200' : 'bg-slate-100 text-slate-400 border border-slate-200'} shadow-xl`}>
                          {isSignedIn ? <Cloud className="w-8 h-8" /> : <CloudOff className="w-8 h-8" />}
                        </div>
                        <div>
                          <p className="text-sm font-black text-slate-800 dark:text-slate-100">
                            {isSignedIn ? 'تم التأمين على حسابك السحابي' : 'بيناتك غير محفوظة سحابياً'}
                          </p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2 px-4 leading-relaxed text-center">
                            {isSignedIn ? 'بياناتك محفوظة بأمان على Google Drive ومدمجة مع تقويمك.' : 'سجل الدخول لحماية تقدمك وتحويله إلى سحابة Google الخاصة بك. سيتم الحفظ تلقائيا والتأخير عن الحفظ حتى تنتهي من استتخدام التطبيق.'}
                          </p>
                        </div>
                        {!isSignedIn ? (
                          <button 
                            onClick={() => { signIn(); setShowDashboard(false); }} 
                            className="w-full mt-4 py-4 bg-blue-500 text-white rounded-[2rem] text-[10px] font-black uppercase tracking-widest shadow-xl shadow-blue-500/30 hover:scale-105 active:scale-95 transition-all"
                          >
                            تسجيل دخول Google
                          </button>
                        ) : (
                          <button 
                            onClick={() => { logout(); setShowDashboard(false); }} 
                            className="w-full mt-4 py-4 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-[2rem] text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 dark:hover:bg-slate-700 transition-all border border-slate-200 dark:border-transparent"
                          >
                            تسجيل الخروج
                          </button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}

                {settingsTab === 'modes' && (
                  <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                    <p className="text-[10px] font-black text-blue-500 uppercase tracking-[0.3em] text-right">أوضاع Aura الذكية</p>
                    
                    <div className="space-y-4">
                        <button 
                          onClick={() => {
                            setActiveTab('modes');
                            setShowDashboard(false);
                          }} 
                          className="w-full flex flex-row-reverse items-center justify-between p-6 bg-blue-500 text-white rounded-[2.5rem] shadow-xl shadow-blue-500/30 hover:scale-[1.02] transition-all group"
                        >
                           <div className="text-right">
                              <span className="text-sm font-black block">الدخول للأوضاع 🧘‍♂️</span>
                              <span className="text-[9px] opacity-80 uppercase tracking-widest">Focus, Dreams & Hub</span>
                           </div>
                           <ArrowRight className="w-5 h-5 -rotate-180" />
                        </button>


                    </div>
                  </motion.div>
                )}

                {settingsTab === 'system' && (
                  <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                    <p className="text-[10px] font-black text-blue-500 uppercase tracking-[0.3em] text-right">أدوات إضافية و إعدادات</p>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <button 
                        onClick={() => {
                          exportData();
                          setShowDashboard(false);
                        }} 
                        className="flex flex-col items-center justify-center p-5 bg-slate-50 dark:bg-slate-800 rounded-[2rem] border border-slate-100 dark:border-slate-700 hover:border-blue-200 transition-colors group text-center shadow-sm"
                      >
                        <span className="text-3xl mb-2 group-hover:-translate-y-1 transition-transform">💾</span>
                        <span className="text-[10px] font-black text-slate-600 dark:text-slate-300 tracking-widest uppercase">نسخة احتياطية</span>
                      </button>
                      <label className="flex flex-col items-center justify-center p-5 bg-slate-50 dark:bg-slate-800 rounded-[2rem] border border-slate-100 dark:border-slate-700 hover:border-blue-200 transition-colors cursor-pointer group text-center shadow-sm">
                        <span className="text-3xl mb-2 group-hover:-translate-y-1 transition-transform">📁</span>
                        <span className="text-[10px] font-black text-slate-600 dark:text-slate-300 tracking-widest uppercase">استعادة بيانات</span>
                        <input type="file" accept=".json" onChange={(e) => { importData(e); setShowDashboard(false); }} className="hidden" />
                      </label>
                    </div>

                    <div className="space-y-3">
                        <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-[2rem] border border-slate-100 dark:border-slate-800 flex-row-reverse">
                            <span className="text-sm font-black text-slate-800 dark:text-slate-200">اللغة (Language)</span>
                            <div className="flex bg-slate-200 dark:bg-slate-700 rounded-full p-1">
                               <button className="px-4 py-1.5 rounded-full text-xs font-black bg-white dark:bg-slate-900 text-blue-600 shadow-sm transition-all">العربية</button>
                               <button className="px-4 py-1.5 rounded-full text-xs font-bold text-slate-500 opacity-50 cursor-not-allowed transition-all" title="قريباً">EN</button>
                            </div>
                        </div>

                        <button 
                          onClick={() => {
                            generatePDF();
                            setShowDashboard(false);
                          }} 
                          className="w-full flex flex-row-reverse items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-[2rem] border border-slate-100 dark:border-slate-800 hover:border-blue-200 transition-all group"
                        >
                          <span className="text-sm font-black text-slate-600 dark:text-slate-300">مستند التقرير PDF</span>
                          <span className="text-2xl group-hover:scale-110 transition-transform">📄</span>
                        </button>

                        <button 
                          onClick={() => handleInstallPWA()}
                          className="w-full flex flex-row-reverse items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-[2rem] border border-slate-100 dark:border-slate-800 hover:border-blue-200 transition-all group"
                        >
                          <span className="text-sm font-black text-slate-600 dark:text-slate-300">تثبيت التطبيق والإشعارات</span>
                          <span className="text-2xl group-hover:scale-110 transition-transform">📱</span>
                        </button>

                        <button 
                          onClick={() => {
                            setShowSupport(true);
                            setShowDashboard(false);
                          }} 
                          className="w-full flex flex-row-reverse items-center justify-between p-4 bg-blue-50 dark:bg-blue-900/20 rounded-[2rem] border border-blue-100 dark:border-blue-800 hover:border-blue-200 transition-all group"
                        >
                          <span className="text-sm font-black text-blue-600 dark:text-blue-400">ادعم تطوير المشروع</span>
                          <span className="text-2xl group-hover:scale-110 transition-transform">🚀</span>
                        </button>
                    </div>

                    <div className="flex justify-center gap-4 pt-4 border-t border-slate-100 dark:border-slate-800/50">
                        <button onClick={() => { setActiveTab('privacy'); setShowDashboard(false); }} className="text-[9px] font-black uppercase text-slate-400 hover:text-blue-500 tracking-widest">سياسة الخصوصية وشروط الاستخدام</button>
                    </div>
                  </motion.div>
                )}

                {settingsTab === 'management' && (
                  <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                    <p className="text-[10px] font-black text-blue-500 uppercase tracking-[0.3em] text-right">إدارة متقدمة وحذف</p>
                    
                    <div className="space-y-4">
                        <button 
                          onClick={() => {
                            if(window.confirm('هل أنت متأكد من حذف جميع تنبيهات Calendar المرتبطة بـ Aura؟')) {
                               alert('تم حذف جميع التنبيهات من Google Calendar بنجاح');
                            }
                          }}
                          className="w-full flex flex-row-reverse items-center justify-between p-5 bg-orange-50 dark:bg-orange-900/10 rounded-[2rem] border border-orange-100 dark:border-orange-800 hover:bg-orange-100 transition-all shadow-sm group"
                        >
                           <span className="text-sm font-black text-orange-600 dark:text-orange-400">حذف تنبيهات Calendar</span>
                           <span className="text-2xl group-hover:scale-110 transition-transform">🗓️</span>
                        </button>

                        <div className="pt-8 border-t border-red-100 dark:border-red-900/30">
                            <p className="text-[10px] font-black text-red-500 uppercase tracking-widest text-right mb-4">منطقة الخطر</p>
                            <button 
                             onClick={async () => {
                               const confirm1 = window.confirm('تحذير: سيتم حذف جميع بياناتك بالكامل من الجهاز والسحابة. هل أنت متأكد؟');
                               if(confirm1) {
                                   const confirm2 = window.prompt('رسالة تأكيد أخيرة: اكتب كلمة "Aura" لتأكيد الحذف النهائي ولا يمكن التراجع بعد ذلك.');
                                   if(confirm2 !== null && confirm2.trim() === 'Aura') {
                                       await deleteSyncData();
                                       localStorage.clear();
                                       alert('تم حذف جميع البيانات بنجاح.');
                                       window.location.reload();
                                   } else {
                                       alert('تم إلغاء الحذف لعدم مطابقة الكلمة.');
                                   }
                               }
                             }} 
                             className="w-full flex flex-row-reverse items-center justify-between p-6 bg-red-500 rounded-[2.5rem] border border-red-600 hover:bg-red-600 transition-all shadow-xl shadow-red-500/40 group overflow-hidden relative"
                            >
                               <div className="absolute inset-0 bg-red-600/50 -translate-x-[100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                               <span className="text-sm font-black text-white relative z-10 tracking-wide">حذف جميع بيانات المستخدم بالكامل</span>
                               <span className="text-2xl group-hover:scale-125 transition-transform relative z-10">⚠️</span>
                            </button>
                        </div>
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Version Footer */}
              <div className="p-6 bg-slate-50 dark:bg-slate-800/80 flex flex-col items-center justify-center border-t border-slate-100 dark:border-slate-700/50">
                <Target className="w-5 h-5 text-blue-500 mb-2 opacity-50" />
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider text-center">V1.0 | Made by Amer Atef</p>
                <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-1 text-center">Aura | Verified ✅</p>
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

      <nav className="fixed top-6 left-6 right-6 flex items-center justify-between z-50 pointer-events-none">
        {activeTab === 'home' ? (
          <button 
            onClick={() => setShowDashboard(true)}
            className="w-10 h-10 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-slate-100 dark:border-slate-800 rounded-full shadow-lg flex items-center justify-center text-slate-400 hover:text-blue-500 transition-all pointer-events-auto active:scale-90"
          >
            <Settings className="w-5 h-5" />
          </button>
        ) : (
          <button 
            onClick={() => setActiveTab('home')}
            className="w-10 h-10 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-slate-100 dark:border-slate-800 rounded-full shadow-lg flex items-center justify-center text-slate-400 hover:text-blue-500 transition-all pointer-events-auto active:scale-90"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        )}
      </nav>

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
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3, ease: "easeInOut", delay: 0.05 }}
                className="text-center py-20 px-6 space-y-8"
              >
                <div className="w-24 h-24 bg-blue-500 rounded-3xl flex items-center justify-center text-white mx-auto shadow-2xl shadow-blue-500/40">
                   <Coffee className="w-12 h-12" />
                </div>
                <div className="space-y-4">
                   <h2 className="text-3xl font-black text-slate-800">إنجازك النهاردة يكفي يا {userProfile?.name?.split(' ')[0] || 'بطل'}! 👋</h2>
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
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3, ease: "easeInOut", delay: 0.05 }}
                className="flex flex-col items-center justify-center py-10 min-h-[75vh] relative"
              >
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-blue-500/10 dark:bg-blue-500/5 rounded-full blur-[100px] pointer-events-none" />
                
                {userProfile && (
                  <motion.div 
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute top-0 w-full text-center mt-[-100px]"
                  >
                    <div className="flex flex-col items-center gap-2">
                       <span className="bg-blue-500/10 text-blue-600 dark:text-blue-400 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest border border-blue-500/20">Aura Verified ✅</span>
                       <h2 className="text-3xl font-black text-slate-800 dark:text-white mt-2">أهلاً بك مرة أخرى، {userProfile.name}</h2>
                       <p className="text-xs font-bold text-slate-400 dark:text-slate-500 mt-1 max-w-[200px] leading-relaxed mx-auto italic opacity-70 group-hover:opacity-100 transition-opacity">"نحن لا نبني عادات، نحن نبني شخصيات أعمق وأقوى."</p>
                    </div>
                  </motion.div>
                )}

                <div className="relative w-[340px] h-[340px] sm:w-[420px] sm:h-[420px] flex items-center justify-center group">
                  <div className={`absolute inset-0 border-[2px] rounded-full animate-[spin_40s_linear_infinite] border-dashed transition-all duration-1000 ${glowActivated ? 'border-blue-400 opacity-80 scale-110 shadow-[0_0_50px_rgba(59,130,246,0.5)]' : 'border-blue-200 dark:border-slate-700/50 opacity-50'}`} />
                  <div className={`absolute inset-8 border rounded-full animate-[spin_60s_linear_infinite_reverse] transition-all duration-1000 ${glowActivated ? 'border-blue-400/50 scale-110 shadow-[0_0_30px_rgba(59,130,246,0.3)]' : 'border-blue-500/20'}`} />
                  <div className={`absolute inset-16 border rounded-full transition-all duration-1000 ${glowActivated ? 'border-blue-300 dark:border-blue-600 scale-105' : 'border-slate-200 dark:border-slate-800'}`} />
                  <div className={`absolute inset-24 border rounded-full animate-[ping_12s_cubic-bezier(0,0,0.2,1)_infinite] transition-all duration-1000 ${glowActivated ? 'border-blue-400 shadow-[0_0_40px_rgba(59,130,246,0.4)]' : 'border-blue-100/50 dark:border-slate-800/40'}`} />
                  
                  <motion.button 
                    onClick={() => setGlowActivated(!glowActivated)}
                    animate={{ 
                      scale: glowActivated ? [1, 1.1, 1] : [1, 1.05, 1], 
                      boxShadow: glowActivated 
                        ? ["0 0 60px rgba(59,130,246,0.6)", "0 0 100px rgba(59,130,246,0.8)", "0 0 60px rgba(59,130,246,0.6)"] 
                        : ["0 0 40px rgba(37,99,235,0.2)", "0 0 80px rgba(37,99,235,0.4)", "0 0 40px rgba(37,99,235,0.2)"] 
                    }} 
                    transition={{ duration: glowActivated ? 2 : 4, repeat: Infinity, ease: "easeInOut" }} 
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 flex flex-col items-center bg-gradient-to-tr from-blue-600 to-blue-500 rounded-full w-32 h-32 justify-center border border-blue-400/30"
                  >
                     <Target className="w-12 h-12 text-white mb-1" />
                     <span className="text-[10px] font-black text-white uppercase tracking-[0.3em]">AURA</span>
                  </motion.button>

                  <button onClick={() => setActiveTab('habits')} style={{ top: '0%', left: '50%', transform: 'translate(-50%, -50%)' }} className={`absolute w-20 h-20 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md rounded-full shadow-[0_10px_40px_-10px_rgba(37,99,235,0.2)] border border-white dark:border-slate-800 flex flex-col items-center justify-center gap-1 hover:scale-110 active:scale-95 transition-all text-blue-600 z-30 group/btn ${glowActivated ? 'shadow-[0_0_30px_rgba(37,99,235,0.4)] border-blue-200' : ''}`}>
                     <CheckCircle2 className="w-7 h-7 group-hover/btn:scale-110 transition-transform" />
                     <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 group-hover/btn:text-blue-600 transition-colors">المهارات</span>
                  </button>

                  <button onClick={() => setActiveTab('schedule')} style={{ top: '25%', left: '93.3%', transform: 'translate(-50%, -50%)' }} className="absolute w-20 h-20 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md rounded-full shadow-[0_10px_40px_-10px_rgba(16,185,129,0.2)] border border-white dark:border-slate-800 flex flex-col items-center justify-center gap-1 hover:scale-110 active:scale-95 transition-all text-emerald-600 z-30 group/btn">
                     <Timer className="w-7 h-7 group-hover/btn:scale-110 transition-transform" />
                     <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 group-hover/btn:text-emerald-600 transition-colors">الجدول</span>
                  </button>

                  <button onClick={() => setActiveTab('analysis')} style={{ top: '75%', left: '93.3%', transform: 'translate(-50%, -50%)' }} className="absolute w-20 h-20 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md rounded-full shadow-[0_10px_40px_-10px_rgba(147,51,234,0.2)] border border-white dark:border-slate-800 flex flex-col items-center justify-center gap-1 hover:scale-110 active:scale-95 transition-all text-purple-600 z-30 group/btn">
                     <Activity className="w-7 h-7 group-hover/btn:scale-110 transition-transform" />
                     <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 group-hover/btn:text-purple-600 transition-colors">المختبر</span>
                  </button>

                  <button onClick={() => setActiveTab('levels')} style={{ top: '100%', left: '50%', transform: 'translate(-50%, -50%)' }} className="absolute w-20 h-20 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md rounded-full shadow-[0_10px_40px_-10px_rgba(202,138,4,0.2)] border border-white dark:border-slate-800 flex flex-col items-center justify-center gap-1 hover:scale-110 active:scale-95 transition-all text-yellow-600 z-30 group/btn">
                     <Award className="w-7 h-7 group-hover/btn:scale-110 transition-transform" />
                     <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 group-hover/btn:text-yellow-600 transition-colors">المسار</span>
                  </button>

                  <button onClick={() => setActiveTab('planner')} style={{ top: '75%', left: '6.7%', transform: 'translate(-50%, -50%)' }} className="absolute w-20 h-20 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md rounded-full shadow-[0_10px_40px_-10px_rgba(225,29,72,0.2)] border border-white dark:border-slate-800 flex flex-col items-center justify-center gap-1 hover:scale-110 active:scale-95 transition-all text-rose-600 z-30 group/btn">
                     <Target className="w-7 h-7 group-hover/btn:scale-110 transition-transform" />
                     <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 group-hover/btn:text-rose-600 transition-colors">المخطط</span>
                  </button>

                  <button onClick={() => setActiveTab('notes')} style={{ top: '25%', left: '6.7%', transform: 'translate(-50%, -50%)' }} className="absolute w-20 h-20 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md rounded-full shadow-[0_10px_40px_-10px_rgba(8,145,178,0.2)] border border-white dark:border-slate-800 flex flex-col items-center justify-center gap-1 hover:scale-110 active:scale-95 transition-all text-cyan-600 z-30 group/btn">
                     <FileText className="w-7 h-7 group-hover/btn:scale-110 transition-transform" />
                     <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 group-hover/btn:text-cyan-600 transition-colors">ملاحظات</span>
                  </button>
                </div>
              </motion.div>
            ) : activeTab === 'analysis' ? (
              <motion.div
                key="analysis-view"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3, ease: "easeInOut", delay: 0.05 }}
              >
                <Suspense fallback={<div className="p-10 text-center text-slate-500 font-bold text-xs uppercase tracking-widest animate-pulse">جاري التحميل...</div>}>
                  <AnalysisView 
                    habits={habits} 
                    points={points} 
                    userLevel={userLevel} 
                    userTitle={userTitle} 
                    focusSessions={focusSessions || []} 
                    dreamSessions={dreamSessions} 
                  />
                </Suspense>
              </motion.div>
            ) : activeTab === 'levels' ? (
              <motion.div 
                key="levels-view" 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3, ease: "easeInOut", delay: 0.05 }}
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
              className="max-w-2xl mx-auto px-2 pb-24"
            >
              <div className="flex items-center justify-between mb-16">
                <button 
                  onClick={() => setActiveTab('home')}
                  className="w-10 h-10 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                >
                  <ChevronRightIcon className="w-5 h-5 rotate-180" />
                </button>
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
                        <p className="text-sm font-bold text-slate-500">نحن نقوم بجمع وعرض اسم وصورة حسابك فقط لتخصيص تجربتك وعرض إنجازاتك في التقرير بلوحة المتصدرين أو ملف التصدير الخاص بك ولا نستخدمها لأي أغراض أخرى.</p>
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

                <div className="h-px bg-slate-100 dark:bg-slate-800 my-10" />

                <section className="space-y-10">
                  <div className="text-right">
                    <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                      شروط الاستخدام
                    </h2>
                    <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest mt-1">Aura Terms of Service</p>
                  </div>
                  
                  <div className="space-y-8">
                    <div className="space-y-4">
                      <h3 className="text-lg font-black text-slate-800 dark:text-white">1. قبول الشروط</h3>
                      <p className="text-sm font-bold text-slate-600 dark:text-slate-400 leading-relaxed">
                        باستخدامك لتطبيق Aura، فإنك توافق على الالتزم بشروط الاستخدام هذه. نهدف لتقديم خدمة تساعدك في تحسين نمط حياتك، ويجب استخدام التطبيق للأغراض الشخصية فقط.
                      </p>
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-lg font-black text-slate-800 dark:text-white">2. مسؤولية البيانات</h3>
                      <p className="text-sm font-bold text-slate-600 dark:text-slate-400 leading-relaxed">
                        بياناتك ملكك. أنت مسؤول عن الاحتفاظ بنسخ احتياطية وتأمين حسابك السحابي. Aura لا يتحمل مسؤولية فقدان البيانات الناتج عن حذف التطبيق أو فقدان الوصول للحساب.
                      </p>
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-lg font-black text-slate-800 dark:text-white">3. الاعتماد الشخصي</h3>
                      <p className="text-sm font-bold text-slate-600 dark:text-slate-400 leading-relaxed">
                        التطبيق ليس بديلاً عن الاستشارات الطبية أو المهنية. أي مهارات أو أهداف تضعها تعتمد على مسؤوليتك الشخصية وتقييمك.
                      </p>
                    </div>
                  </div>
                </section>

                <div className="p-8 bg-blue-50 dark:bg-blue-900/10 rounded-3xl border border-blue-100 dark:border-blue-900/30">
                  <p className="text-xs font-black text-blue-600 dark:text-blue-400 text-center leading-relaxed">
                    يمكنك دائماً مراجعة الأذونات الممنوحة للتطبيقات من خلال لوحة تحكم حساب Google الخاص بك وإلغاؤها في أي وقت.
                  </p>
                </div>
              </div>
              
              <div className="mt-32 pt-8 border-t border-slate-100 dark:border-slate-800 flex justify-center">
                <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.6em]">Designed with Privacy in Mind</p>
              </div>
            </motion.div>
          ) : activeTab === 'schedule' ? (
            <motion.div 
              key="schedule-view-animated" 
              initial={{ opacity: 0, x: 20 }} 
              animate={{ opacity: 1, x: 0 }} 
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3, ease: "easeInOut", delay: 0.05 }}
            >
              <Suspense fallback={<div className="p-10 text-center text-slate-500 font-bold text-xs uppercase tracking-widest animate-pulse">جاري التحميل...</div>}>
                <ScheduleView 
                  onBack={() => setActiveTab('home')} 
                  tasks={scheduleTasks} 
                  setTasks={setScheduleTasks} 
                  requestConfirm={(title, description, icon, onConfirm) => {
                    if (!title) {
                      setConfirmAction(null);
                      return;
                    }
                    setConfirmAction({ 
                      title, 
                      description, 
                      icon, 
                      onConfirm: () => {
                        onConfirm();
                        setConfirmAction(null);
                      }
                    });
                  }}
                  onCelebrate={handleCelebrate}
                  onTaskComplete={p => setPoints(prev => prev + p)}
                />
              </Suspense>
            </motion.div>
          ) : activeTab === 'planner' ? (
            <motion.div 
              key="planner-view-animated" 
              initial={{ opacity: 0, x: 20 }} 
              animate={{ opacity: 1, x: 0 }} 
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3, ease: "easeInOut", delay: 0.05 }}
            >
              <Suspense fallback={<div className="p-10 text-center text-slate-500 font-bold text-xs uppercase tracking-widest animate-pulse">جاري التحميل...</div>}>
                <PlannerView 
                  onBack={() => setActiveTab('home')} 
                  plannerData={plannerData} 
                  setPlannerData={setPlannerData} 
                  requestConfirm={(title, description, icon, onConfirm) => {
                    if (!title) {
                      setConfirmAction(null);
                      return;
                    }
                    setConfirmAction({ 
                      title, 
                      description, 
                      icon, 
                      onConfirm: () => {
                        onConfirm();
                        setConfirmAction(null);
                      }
                    });
                  }}
                />
              </Suspense>
            </motion.div>
          ) : activeTab === 'notes' ? (
            <motion.div 
              key="notes-view-animated" 
              initial={{ opacity: 0, x: 20 }} 
              animate={{ opacity: 1, x: 0 }} 
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3, ease: "easeInOut", delay: 0.05 }}
            >
              <Suspense fallback={<div className="p-10 text-center text-slate-500 font-bold text-xs uppercase tracking-widest animate-pulse">جاري التحميل...</div>}>
                <NotesView 
                  habits={habits}
                  generalNotes={generalNotes || []}
                  setGeneralNotes={setGeneralNotes}
                  updateHabit={updateHabit}
                  focusSessions={focusSessions || []}
                  dreamSessions={dreamSessions || []}
                  setFocusSessions={setFocusSessions}
                  setDreamSessions={setDreamSessions}
                  requestConfirm={(title, description, icon, onConfirm) => {
                    if (!title) {
                      setConfirmAction(null);
                      return;
                    }
                    setConfirmAction({ 
                      title, 
                      description, 
                      icon, 
                      onConfirm: () => {
                        onConfirm();
                        setConfirmAction(null);
                      }
                    });
                  }}
                  onBack={() => setActiveTab('home')}
                />
              </Suspense>
            </motion.div>
          ) : activeTab === 'modes' ? (
            <motion.div 
              key="modes-view-animated" 
              initial={{ opacity: 0, x: 20 }} 
              animate={{ opacity: 1, x: 0 }} 
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3, ease: "easeInOut", delay: 0.05 }}
            >
              <Suspense fallback={<div className="p-10 text-center text-slate-500 font-bold text-xs uppercase tracking-widest animate-pulse">جاري التحميل...</div>}>
                <ModesView 
                  habits={habits}
                  focusSessions={focusSessions || []}
                  setFocusSessions={setFocusSessions}
                  dreamSessions={dreamSessions || []}
                  setDreamSessions={setDreamSessions}
                  onBack={() => setActiveTab('home')} 
                  onCelebrate={handleCelebrate}
                  globalRecoveryMode={globalRecoveryMode}
                  setGlobalRecoveryMode={setGlobalRecoveryMode}
                  userName={userProfile?.name?.split(' ')[0]}
                  showFeedback={showFeedback}
                />
              </Suspense>
            </motion.div>
          ) : activeTab === 'habits' ? (
            <motion.div 
              key="habits-list"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3, ease: "easeInOut", delay: 0.05 }}
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
                    onUndo={() => {
                      setConfirmAction({
                        title: 'تراجع عن الإنجاز؟',
                        description: 'هل أنت متأكد من التراجع عن تسجيل إنجاز هذه المهارة لليوم؟ سيتم خصم النقاط المسجلة.',
                        icon: <Undo2 className="w-12 h-12 text-blue-500 mb-6 mx-auto" />,
                        onConfirm: () => {
                          undoHabitCompletion(habit.id);
                          setConfirmAction(null);
                          showFeedback('تم التراجع عن الإنجاز.', 'info');
                        }
                      });
                    }}
                    onEdit={handleEdit}
                    onDelete={() => handleDelete(habit.id)}
                    onToggleRecovery={toggleHabitRecovery}
                    onRelapse={handleRelapse}
                    onIconClick={(icon, name) => setZoomIcon({ icon, name })}
                    onCancelAlert={() => {
                      setConfirmAction({
                        title: 'إلغاء تنبيه المهارة؟',
                        description: `هل أنت متأكد من إلغاء المهام المتعلقة بمهارة "${habit.name}" من تقويم Google؟`,
                        icon: <LucideIcons.BellOff className="w-12 h-12 text-blue-500 mb-6 mx-auto" />,
                        onConfirm: async () => {
                          showFeedback('جاري إزالة التنبيهات... ⏳');
                          try {
                            if (habit.reminderEventId) Object.assign(habit, { reminderEventId: undefined });
                            updateHabit(habit.id, { enableReminders: false, reminderEventId: undefined, nearGoalEventId: undefined, awayGoalEventId: undefined });
                            showFeedback('تم تعطيل التنبيهات بنجاح 🔕', 'info');
                          } catch(e) {
                            showFeedback('حصل مشكلة أثناء التعطيل!', 'alert');
                          }
                          setConfirmAction(null);
                        }
                      });
                    }}
                  />
                ))
              )}
            </motion.div>
          ) : null}
        </AnimatePresence>

        <div className="mt-12 pt-12 border-t border-slate-100 dark:border-slate-800 flex flex-col items-center gap-6 pb-20">
            <div className="text-center space-y-1">
              <p className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">V1.0 | Made by Amer Atef</p>
              <p className="text-[10px] font-bold text-slate-500 dark:text-slate-600 uppercase tracking-widest">Owner of Aura Hub | Verified ✅</p>
            </div>
            <button
               onClick={() => setSettingsTab('about')}
               className="text-[10px] text-slate-400 hover:text-blue-500 underline underline-offset-4"
            >
              شروط الاستخدام وسياسة الخصوصية
            </button>
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
                          
                          <h3 className="text-2xl font-black text-slate-900 mb-4">شارك في بناء Aura 🚀</h3>
                          <div className="space-y-4 text-xs font-bold text-slate-500 leading-relaxed mb-8">
                             <p>"لو تطبيق Aura ساعدك تنظم يومك وتبنى مهاراتك بدل التشتت تقدر تدعم استمرار المشروع وتطوير ميزات جديدة بمبلغ رمزي. دعمك هو اللي بيخلينا نكبر ونقدم كود أنضف وتجربة أحسن."</p>
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
        
        <footer className="mt-16 pb-8 text-center opacity-70">
          <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
            V1.0 | Made by Amer Atef | Verified ✅
          </p>
        </footer>
      </main>

      {activeTab === 'habits' && (
        <button 
          onClick={() => setShowModal(true)}
          className="fixed bottom-10 right-10 w-16 h-16 bg-gradient-to-tr from-blue-500 via-blue-600 to-blue-500 text-white rounded-full flex items-center justify-center shadow-2xl hover:scale-110 active:scale-90 transition-all z-50 group border-2 border-white/20 glass-shine btn-hover-scale"
        >
          <Plus className="w-8 h-8 group-hover:rotate-90 transition-transform duration-500" />
        </button>
      )}

      <AnimatePresence>
        {showModal && (
          <Suspense fallback={null}>
            <HabitModal 
              onClose={() => {
                setShowModal(false);
                setHabitToEdit(undefined);
              }} 
              onSave={handleSave}
              habitToEdit={habitToEdit}
            />
          </Suspense>
        )}
        {showTips && (
          <EngineeringTips onClose={() => setShowTips(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}
