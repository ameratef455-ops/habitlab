
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
  color?: string;
  celebrationIcon?: string;
  replacingHabit?: string;
  isRecoveryModeEnabled?: boolean;
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
  'bg-indigo-500',
  'bg-emerald-500',
  'bg-rose-500',
  'bg-amber-500',
  'bg-purple-500',
  'bg-cyan-500',
  'bg-pink-500',
];

export const USER_RANKS = [
  "بداية الرحلة 🌱",
  "مُبتدئ الاستمرارية 👣",
  "طالب الانضباط 📚",
  "مبادر واعد 💡",
  "صاحب الإرادة ✊",
  "مُمارس مستمر 🔄",
  "منضبط حقيقي 🤝",
  "خبير العادات 🎯",
  "محترف الإنجاز ⚡",
  "قائد التغيير 👑",
  "سيد الروتين 🥇",
  "قدوة الانضباط 🌟",
  "صانع الأثر 🌍",
  "بطل الاستمرارية 🏆",
  "أستاذ الفاعلية 🎓",
  "ملهم النجاح ✨",
  "رائد العادات 🚀",
  "خبير التطوير 📈",
  "أسطورة الالتزام 💎",
  "مهندس السلوك 🛠️",
  "أيقونة الإنجاز 🏅",
  "حكيم العادات 🦉",
  "سيد الوقت ⏳",
  "نجم الاستمرارية ⭐️",
  "عبقري الانضباط 🧠",
  "متقن المهارات 🎨",
  "رئيس الإنجازات 📊",
  "ذروة الالتزام 🏔️",
  "المُعلم الأكبر 📜",
  "نبراس الاستمرارية 🕯️"
];

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
