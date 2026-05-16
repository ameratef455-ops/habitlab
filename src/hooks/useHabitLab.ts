import { useState, useEffect } from 'react';
import { Habit, HabitFrequency, AppTheme, WeeklyChallenge, ScheduleTask, PlannerData } from '../types';

export const HABIT_SCORING_MAP = {
  QUICK_LOG: 10,
  NORMAL_COMMITMENT: 10,
  HIGH_COMMITMENT_PERFECT_TIMING: 20, // completing duration or on time
  HIGH_COMMITMENT_PERFECT_TIMING_OVER_EXPECTED: 50 // completing duration or on time + over expected
};

export function useHabitLab() {
  const [habits, setHabits] = useState<Habit[]>(() => {
    const saved = localStorage.getItem('habits');
    return saved ? JSON.parse(saved) : [];
  });

  const [scheduleTasks, setScheduleTasks] = useState<ScheduleTask[]>(() => {
    const saved = localStorage.getItem('scheduleTasks');
    return saved ? JSON.parse(saved) : [];
  });

  const [plannerData, setPlannerData] = useState<PlannerData>(() => {
    const saved = localStorage.getItem('plannerData');
    return saved ? JSON.parse(saved) : {};
  });

  const [generalNotes, setGeneralNotes] = useState<any[]>(() => {
    const saved = localStorage.getItem('generalNotes');
    return saved ? JSON.parse(saved) : [];
  });

  const [focusSessions, setFocusSessions] = useState<any[]>(() => {
    const saved = localStorage.getItem('focusSessions');
    return saved ? JSON.parse(saved) : [];
  });

  const [dreamSessions, setDreamSessions] = useState<any[]>(() => {
    const saved = localStorage.getItem('dreamSessions');
    return saved ? JSON.parse(saved) : [];
  });

  const [reports, setReports] = useState<any[]>(() => {
    const saved = localStorage.getItem('reports');
    return saved ? JSON.parse(saved) : [];
  });

  const [weeklyChallenge, setWeeklyChallenge] = useState<WeeklyChallenge | null>(() => {
    const saved = localStorage.getItem('weeklyChallenge');
    return saved ? JSON.parse(saved) : null;
  });

  const [points, setPoints] = useState<number>(() => {
    const saved = localStorage.getItem('userPoints');
    return saved ? parseInt(saved) : 0;
  });

  const [lastCompletion, setLastCompletion] = useState<{
    habitId: string;
    pointsEarned: number;
    prevStreak: number;
    prevCompletedDates: string[];
    prevNotes: any[];
    prevWeeklyChallenge: WeeklyChallenge | null;
  } | null>(null);

  const [globalRecoveryMode, setGlobalRecoveryMode] = useState<boolean>(() => {
     const saved = localStorage.getItem('globalRecoveryMode');
     return saved === 'true';
  });
  
  const [todayIsHoliday, setTodayIsHoliday] = useState<boolean>(() => {
     const saved = localStorage.getItem('todayIsHoliday');
     return saved === 'true';
  });

  useEffect(() => {
    localStorage.setItem('habits', JSON.stringify(habits));
    localStorage.setItem('scheduleTasks', JSON.stringify(scheduleTasks));
    localStorage.setItem('plannerData', JSON.stringify(plannerData));
    localStorage.setItem('generalNotes', JSON.stringify(generalNotes));
    localStorage.setItem('focusSessions', JSON.stringify(focusSessions));
    localStorage.setItem('dreamSessions', JSON.stringify(dreamSessions));
    localStorage.setItem('reports', JSON.stringify(reports));
    localStorage.setItem('globalRecoveryMode', String(globalRecoveryMode));
    localStorage.setItem('todayIsHoliday', String(todayIsHoliday));
    if (weeklyChallenge) {
      localStorage.setItem('weeklyChallenge', JSON.stringify(weeklyChallenge));
    } else {
      localStorage.removeItem('weeklyChallenge');
    }
    localStorage.setItem('userPoints', points.toString());
  }, [
    habits, 
    scheduleTasks, 
    plannerData, 
    generalNotes, 
    focusSessions, 
    dreamSessions, 
    globalRecoveryMode, 
    todayIsHoliday, 
    weeklyChallenge, 
    points
  ]);

  const addHabit = (habit: Omit<Habit, 'id' | 'streak' | 'completedDates' | 'notes'>) => {
    const newHabit: Habit = {
      ...habit,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      streak: 0,
      completedDates: [],
      notes: []
    };
    setHabits(prev => [...prev, newHabit].sort((a, b) => {
      return (a.order || '').localeCompare(b.order || '') || (a.time || '').localeCompare(b.time || '');
    }));
    return newHabit;
  };

  const updateHabit = (id: string, updates: Partial<Habit>) => {
    setHabits(prev => prev.map(h => h.id === id ? { ...h, ...updates } : h));
  };

  const deleteHabit = (id: string) => {
    setHabits(prev => prev.filter(h => h.id !== id));
  };

  const toggleHabitRecovery = (id: string) => {
    setHabits(prev => prev.map(h => h.id === id ? { ...h, isRecoveryModeEnabled: !h.isRecoveryModeEnabled } : h));
  };

  const undoHabitCompletion = (habitId: string) => {
    const today = new Date().toISOString().split('T')[0];
    const habit = habits.find(h => h.id === habitId);
    if (!habit || !habit.completedDates.includes(today)) return;

    // Find the note/data for today's completion to calculate points to deduct
    // Note: This is a simplification. Ideally we'd store how many points were earned for each specific completion date.
    // Given the current architecture, we'll try to find the last note from today or assume a base value if not found.
    const todayNoteIdx = [...habit.notes].reverse().findIndex(n => n.date === today);
    let pointsToDeduct = (habit.isRecoveryModeEnabled || globalRecoveryMode) ? 20 : 10; // Default base

    if (todayNoteIdx !== -1) {
      const actualIdx = habit.notes.length - 1 - todayNoteIdx;
      const note = habit.notes[actualIdx];
      // Try to reconstruct points earned
      let actionPoints = note.isQuick ? HABIT_SCORING_MAP.QUICK_LOG : HABIT_SCORING_MAP.NORMAL_COMMITMENT;
      let timingPoints = (note.onTime || note.onExpectedTime) ? 10 : 0;
      let overExpectedPoints = (note.goalLevel === 'exceeded') ? 30 : 0;
      pointsToDeduct = (actionPoints + timingPoints + overExpectedPoints) * (note.recovery ? 2 : 1);
    }

    setHabits(prev => prev.map(h => {
      if (h.id === habitId) {
        return {
          ...h,
          streak: Math.max(0, h.streak - 1),
          completedDates: h.completedDates.filter(d => d !== today),
          notes: h.notes.filter(n => n.date !== today)
        };
      }
      return h;
    }));

    setPoints(p => Math.max(0, p - pointsToDeduct));
    
    // Also update weekly challenge progress
    setWeeklyChallenge(wp => {
      if (!wp) return null;
      return { ...wp, progress: Math.max(0, wp.progress - pointsToDeduct) };
    });
  };

  const revertLastCompletion = () => {
    if (!lastCompletion) return;

    setHabits(prev => prev.map(h => {
      if (h.id === lastCompletion.habitId) {
        return {
          ...h,
          streak: lastCompletion.prevStreak,
          completedDates: lastCompletion.prevCompletedDates,
          notes: lastCompletion.prevNotes
        };
      }
      return h;
    }));

    setPoints(p => p - lastCompletion.pointsEarned);
    setWeeklyChallenge(lastCompletion.prevWeeklyChallenge);
    setLastCompletion(null);
  };

  const completeHabit = (
    id: string, 
    note?: string, 
    type: 'text' | 'voice' = 'text', 
    recovery: boolean = false,
    questionnaire?: { 
      onTime: boolean; 
      onExpectedTime?: boolean;
      actualTime?: string;
      focus: number; 
      goalLevel: 'min' | 'expected' | 'exceeded'; 
      isQuick?: boolean 
    }
  ) => {
    const today = new Date().toISOString().split('T')[0];
    const habitToComplete = habits.find(h => h.id === id);
    if (!habitToComplete || habitToComplete.completedDates.includes(today)) return;

    const habitIsRecovery = habitToComplete.isRecoveryModeEnabled || recovery || globalRecoveryMode;
    
    let totalEarnedPoints = 0;

    setHabits(prev => prev.map(h => {
      if (h.id === id) {
        const lastDate = h.completedDates.length > 0 ? new Date(h.completedDates[h.completedDates.length - 1]) : null;
        const currentDate = new Date(today);
        
        let isConsecutive = false;
        const alreadyCompletedToday = false; // We already returned early if it was completed

        if (lastDate) {
          // Normalize dates to midnight to calculate day difference accurately
          const d1 = new Date(lastDate);
          d1.setHours(0, 0, 0, 0);
          const d2 = new Date(currentDate);
          d2.setHours(0, 0, 0, 0);
          
          const diffTime = Math.abs(d2.getTime() - d1.getTime());
          const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
          
          if (h.frequency === HabitFrequency.DAILY || (h.nearGoal && h.nearGoal.frequency === 'مرات يومياً')) {
            isConsecutive = diffDays === 1;
          } else if (h.frequency === HabitFrequency.WEEKLY || (h.nearGoal && h.nearGoal.frequency === 'مرات أسبوعياً') || h.frequency === HabitFrequency.CUSTOM_DAYS) {
            isConsecutive = diffDays <= 7;
          } else if (h.frequency === HabitFrequency.MONTHLY || (h.nearGoal && h.nearGoal.frequency === 'مرات شهرياً')) {
            isConsecutive = diffDays <= 31;
          } else {
            isConsecutive = diffDays <= 7; // Default fallback
          }
        }
        
        let newStreak = isConsecutive ? h.streak + 1 : 1;
        // However if it's the very first time doing the habit:
        if (h.completedDates.length === 0) {
          newStreak = 1;
        }
        
        // Calculate points according to explicit user rules
        let earnedPoints = 0;
        
        let actionPoints = 0;
        let timingPoints = 0;
        let overExpectedPoints = 0;
        
        if (questionnaire?.isQuick) {
          actionPoints = HABIT_SCORING_MAP.QUICK_LOG; // 10
        } else {
          actionPoints = HABIT_SCORING_MAP.NORMAL_COMMITMENT; // 10
          
          const hasPerfectTiming = questionnaire?.onTime || questionnaire?.onExpectedTime;
          const isOverExpected = questionnaire?.goalLevel === 'exceeded';
          
          if (hasPerfectTiming) {
            timingPoints = 10; // Making it reaching 20 for "HIGH_COMMITMENT+PERFECT_TIMING"
          }
          
          if (isOverExpected) {
            overExpectedPoints = 30; // Making it reaching 50 total if there's perfect timing too
          }
        }
        
        // Total points for an action = (Action Points + Timing Points+over expected) * (IsRecoveryMode ? 2 : 1)
        const basePoints = actionPoints + timingPoints + overExpectedPoints;
        earnedPoints = basePoints * (habitIsRecovery ? 2 : 1);
        
        totalEarnedPoints = earnedPoints; // Capture to update outside

        return {
          ...h,
          streak: newStreak,
          completedDates: [...h.completedDates, today],
          notes: (note || questionnaire) ? [...h.notes, { 
            date: today, 
            content: note || '', 
            type, 
            recovery: habitIsRecovery,
            ...questionnaire
          }] : h.notes
        };
      }
      return h;
    }));

    if (totalEarnedPoints > 0) {
      setPoints(p => p + totalEarnedPoints);

      // Store for undo
      setLastCompletion({
        habitId: id,
        pointsEarned: totalEarnedPoints,
        prevStreak: habitToComplete.streak,
        prevCompletedDates: habitToComplete.completedDates,
        prevNotes: habitToComplete.notes,
        prevWeeklyChallenge: weeklyChallenge,
      });

      setWeeklyChallenge(wp => {
        if (!wp) return null;
        const nextProgress = wp.progress + totalEarnedPoints;
        if (nextProgress >= wp.target) {
          const nextLevel = wp.level + 1;
          const newTarget = (100 * nextLevel); 
          setTodayIsHoliday(true);
          return {
            level: nextLevel,
            progress: 0,
            target: newTarget,
            goal: `اجمع ${newTarget} نقطة في المستوى الجديد`,
            reward: `مكافأة المستوى ${nextLevel} 🎁`
          };
        }
        return { ...wp, progress: nextProgress };
      });
    }
  };

  const overrideData = (remoteData: any) => {
    setHabits(remoteData.habits || []);
    setPoints(remoteData.points || 0);
    setWeeklyChallenge(remoteData.weeklyChallenge || null);
    if (remoteData.scheduleTasks) setScheduleTasks(remoteData.scheduleTasks);
    if (remoteData.plannerData) setPlannerData(remoteData.plannerData);
    if (remoteData.generalNotes) setGeneralNotes(remoteData.generalNotes);
    if (remoteData.focusSessions) setFocusSessions(remoteData.focusSessions);
    if (remoteData.dreamSessions) setDreamSessions(remoteData.dreamSessions);
    if (remoteData.reports) setReports(remoteData.reports);
    if (remoteData.globalRecoveryMode !== undefined) setGlobalRecoveryMode(remoteData.globalRecoveryMode);
    if (remoteData.todayIsHoliday !== undefined) setTodayIsHoliday(remoteData.todayIsHoliday);
  };

  const addNoteToHabit = (id: string, text: string) => {
    setHabits(prev => prev.map(h => 
      h.id === id 
        ? { ...h, notes: [...(h.notes || []), { text, type: 'text', date: new Date().toISOString() }] } 
        : h
    ));
  };

  return { 
    habits, 
    weeklyChallenge,
    points,
    setPoints,
    scheduleTasks,
    setScheduleTasks,
    plannerData,
    setPlannerData,
    generalNotes,
    setGeneralNotes,
    focusSessions,
    setFocusSessions,
    dreamSessions,
    setDreamSessions,
    reports,
    setReports,
    globalRecoveryMode,
    setGlobalRecoveryMode,
    setWeeklyChallenge,
    addHabit, 
    updateHabit, 
    deleteHabit,
    toggleHabitRecovery,
    completeHabit, 
    undoHabitCompletion,
    revertLastCompletion,
    todayIsHoliday,
    setTodayIsHoliday,
    overrideData,
    addNoteToHabit
  };
}
