
export enum HabitFrequency {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  CUSTOM = 'custom',
  CUSTOM_DAYS = 'custom_days'
}

export interface Habit {
  id: string;
  name: string;
  icon: string;
  category: string;
  frequency: HabitFrequency;
  customFrequency?: string; 
  order: string; 
  time?: string;
  duration?: string;
  motivation?: string;
  nearGoal: { target: number; frequency: string; description?: string };
  awayGoal: { targetDate?: string; description?: string };
  minGoal: string;
  expectedGoal: string;
  streak: number;
  createdAt: string;
  completedDates: string[];
  totalCompletions?: number;
  color?: string;
  tag?: string;
  celebrationIcon?: string;
  replacingHabit?: string;
  isRecoveryModeEnabled?: boolean;
  enableReminders?: boolean;
  reminderEventId?: string;
  nearGoalEventId?: string;
  awayGoalEventId?: string;
  notes: Array<{ 
    date: string; 
    content: string; 
    type: 'text' | 'voice'; 
    recovery: boolean;
    onTime?: boolean;
    onExpectedTime?: boolean;
    actualTime?: string;
    focus?: number; // 1-5
    goalLevel?: 'min' | 'expected' | 'exceeded';
  }>;
  relapses?: Array<{
    date: string;
    reason: string;
  }>;
}

export interface WeeklyChallenge {
  goal: string;
  reward: string;
  progress: number;
  target: number;
  level: number;
}

export type AppTheme = 'light' | 'dark';

export const ICON_COLORS = [
  'bg-slate-900',
  'bg-blue-500',
  'bg-emerald-500',
  'bg-amber-500',
  'bg-rose-500',
  'bg-indigo-500',
  'bg-violet-500',
  'bg-sky-500',
  'bg-teal-500',
  'bg-orange-500',
  'bg-pink-500',
  'bg-fuchsia-500',
];

export const USER_RANKS = [
  "مبتدئ 🌟",
  "متدرب 🚀",
  "هاوي 🎨",
  "مبادر 💡",
  "مثابر 🏃",
  "ممارس 🔄",
  "منضبط 🎯",
  "محترف ⚡",
  "خبير 🧠",
  "متقدم 📈",
  "قائد 👑",
  "ملهم ✨",
  "سيد 🥇",
  "رائد 🚀",
  "بطل 🏆",
  "أسطورة 💎",
  "حكيم 🦉",
  "نخبة 🦅",
  "فارس 🐎",
  "سيد الوقت ⏳",
  "أيقونة 🏅",
  "عبقري ⚛️",
  "سفير 🌍",
  "أستاذ 🎓",
  "متقن 🎯",
  "زعيم 🏛️",
  "محارب ⚔️",
  "منارة 🗼",
  "عظيم 🏔️",
];

export interface ScheduleTask {
  id: string;
  name: string;
  time: string;
  duration: string;
  minGoal: string;
  expectedGoal: string;
  date: string;
  tag?: string;
  completed: boolean;
  completionData?: {
    durationMet: boolean;
    goalMet: 'min' | 'expected' | 'none';
    notes: string;
  };
}

export interface PlannerMonthData {
  goal: string;
  notes: string;
}

export interface PlannerData {
  [month: string]: PlannerMonthData;
}

export const CATEGORIES = [
  'عام',
  'رياضة',
  'تعلم',
  'نمو شخصي',
  'صحة',
  'عمل',
  'ترفيه',
  'مخصص'
];

export const CELEBRATION_ICONS = [
  'PartyPopper',
  'Sparkles',
  'Trophy',
  'Star',
  'Rocket',
  'Target',
  'Gift',
  'Medal'
];

export interface FocusSession {
  id: string;
  habitId?: string;
  modeId: string;
  startTime: number;
  endTime?: number;
  durationMinutes: number;
  points: number;
  feedback?: string; 
  date: string;
}

export interface Report {
  id: string;
  date: string;
  planData: string;
  result: any;
}
