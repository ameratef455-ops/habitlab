import React from 'react';
import { motion } from 'motion/react';
import { Habit } from '../types';

interface SkillTreeProps {
  habits: Habit[];
}

export const SkillTree: React.FC<SkillTreeProps> = ({ habits }) => {
  const [selectedHabit, setSelectedHabit] = React.useState<Habit | null>(null);

  return (
    <>
    <div className="flex flex-col items-center gap-1 opacity-70 cursor-pointer" onClick={() => setSelectedHabit(habits[0])}>
      <p className="text-[8px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest text-center">شجرة المهارات</p>
      <div className="flex gap-1.5 items-end h-8">
        {habits.slice(0, 5).map((habit, i) => {
          const streak = Math.min(habit.streak || 0, 30);
          return (
            <div key={habit.id} className="flex flex-col items-center gap-0.5">
              <div className="flex flex-col-reverse gap-0.5">
                {[...Array(5)].map((_, j) => {
                  const isActive = j < Math.ceil(streak / 6);
                  return (
                    <div 
                      key={j} 
                      className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-blue-500' : 'bg-slate-200 dark:bg-slate-800'}`} 
                    />
                  );
                })}
              </div>
              <div className="w-0.5 h-3 bg-slate-300 dark:bg-slate-700" />
            </div>
          );
        })}
      </div>
    </div>
    {selectedHabit && (
       <div className="fixed inset-0 z-[500] flex items-center justify-center bg-black/50" onClick={() => setSelectedHabit(null)}>
         <div className="bg-white p-8 rounded-3xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-black">{selectedHabit.name}</h2>
            <p>سلسلة النجاح: {selectedHabit.streak} يوم</p>
            <button className="mt-4 p-2 bg-slate-100 rounded-lg" onClick={() => setSelectedHabit(null)}>إغلاق</button>
         </div>
       </div>
    )}
    </>
  );
};
