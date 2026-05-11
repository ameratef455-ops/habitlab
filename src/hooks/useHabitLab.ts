import { useState, useEffect } from 'react';
import { Habit, HabitFrequency, AppTheme, WeeklyChallenge } from '../types';

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

  const [weeklyChallenge, setWeeklyChallenge] = useState<WeeklyChallenge | null>(() => {
    const saved = localStorage.getItem('weeklyChallenge');
    return saved ? JSON.parse(saved) : null;
  });

  const [points, setPoints] = useState<number>(() => {
    const saved = localStorage.getItem('userPoints');
    return saved ? parseInt(saved) : 0;
  });

  const [theme, setTheme] = useState<AppTheme>(() => {
    const saved = localStorage.getItem('theme');
    return (saved as AppTheme) || 'light';
  });

  const [lastCompletion, setLastCompletion] = useState<{
    habitId: string;
    pointsEarned: number;
    prevStreak: number;
    prevCompletedDates: string[];
    prevNotes: any[];
    prevWeeklyChallenge: WeeklyChallenge | null;
  } | null>(null);

  const [globalRecoveryMode, setGlobalRecoveryMode] = useState<boolean>(false);
  const [todayIsHoliday, setTodayIsHoliday] = useState<boolean>(false);

  useEffect(() => {
    localStorage.setItem('habits', JSON.stringify(habits));
    if (weeklyChallenge) {
      localStorage.setItem('weeklyChallenge', JSON.stringify(weeklyChallenge));
    } else {
      localStorage.removeItem('weeklyChallenge');
    }
    localStorage.setItem('userPoints', points.toString());
    localStorage.setItem('theme', theme);
    
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
    }
  }, [habits, weeklyChallenge, points, theme]);

  const addHabit = (habit: Omit<Habit, 'id' | 'streak' | 'completedDates' | 'notes'>) => {
    const newHabit: Habit = {
      ...habit,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      streak: 0,
      completedDates: [],
      notes: []
    };
    setHabits([...habits, newHabit].sort((a, b) => {
      return (a.order || '').localeCompare(b.order || '') || (a.time || '').localeCompare(b.time || '');
    }));
  };

  const updateHabit = (id: string, updates: Partial<Habit>) => {
    setHabits(habits.map(h => h.id === id ? { ...h, ...updates } : h));
  };

  const deleteHabit = (id: string) => {
    setHabits(habits.filter(h => h.id !== id));
  };

  const toggleHabitRecovery = (id: string) => {
    setHabits(habits.map(h => h.id === id ? { ...h, isRecoveryModeEnabled: !h.isRecoveryModeEnabled } : h));
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
    
    setHabits(prev => prev.map(h => {
      if (h.id === id) {
        const lastDate = h.completedDates.length > 0 ? new Date(h.completedDates[h.completedDates.length - 1]) : null;
        const currentDate = new Date(today);
        
        let isConsecutive = false;
        const alreadyCompletedToday = h.completedDates.includes(today);

        if (lastDate && !alreadyCompletedToday) {
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
        
        let newStreak = h.streak;
        if (!alreadyCompletedToday) {
           newStreak = isConsecutive ? h.streak + 1 : 1;
           // However if it's the very first time doing the habit:
           if (h.completedDates.length === 0) {
             newStreak = 1;
           }
        }
        
        // Calculate points according to explicit user rules
        let earnedPoints = 0;
        
        if (!alreadyCompletedToday) {
          let basePoints = 0;
          
          if (questionnaire?.isQuick) {
            basePoints = HABIT_SCORING_MAP.QUICK_LOG;
          } else {
            const goalLevel = questionnaire?.goalLevel || 'min';
            if (goalLevel === 'exceeded') {
              basePoints = HABIT_SCORING_MAP.HIGH_COMMITMENT_PERFECT_TIMING_OVER_EXPECTED;
            } else if (goalLevel === 'expected') {
              basePoints = HABIT_SCORING_MAP.HIGH_COMMITMENT_PERFECT_TIMING;
            } else {
              basePoints = HABIT_SCORING_MAP.NORMAL_COMMITMENT;
            }
          }
          
          // Total points for an action = (Action Points + Timing Points+over expected) * (IsRecoveryMode ? 2 : 1)
          earnedPoints = basePoints * (habitIsRecovery ? 2 : 1);
          
          setPoints(p => p + earnedPoints);
        }

        // Store for undo
        setLastCompletion({
          habitId: id,
          pointsEarned: earnedPoints,
          prevStreak: h.streak,
          prevCompletedDates: h.completedDates,
          prevNotes: h.notes,
          prevWeeklyChallenge: weeklyChallenge,
        });

        if (earnedPoints > 0) {
          setWeeklyChallenge(wp => {
            if (!wp) return null;
            const nextProgress = wp.progress + earnedPoints;
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

        return {
          ...h,
          streak: newStreak,
          completedDates: alreadyCompletedToday ? h.completedDates : [...h.completedDates, today],
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
  };

  return { 
    habits, 
    weeklyChallenge,
    points,
    globalRecoveryMode,
    setGlobalRecoveryMode,
    setWeeklyChallenge,
    addHabit, 
    updateHabit, 
    deleteHabit,
    toggleHabitRecovery,
    completeHabit, 
    revertLastCompletion,
    todayIsHoliday,
    setTodayIsHoliday,
    theme,
    setTheme
  };
}
