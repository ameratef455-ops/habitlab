import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, ListOrdered, Target, Flag, Scale, Check, Search, Tag, Timer, MapPin, Bell, ArrowRight, ArrowLeft } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { HabitFrequency, Habit, CATEGORIES, ICON_COLORS, CELEBRATION_ICONS } from '../types';

interface HabitModalProps {
  onClose: () => void;
  onSave: (habit: any) => void;
  habitToEdit?: Habit;
}

const HABIT_ICONS = Array.from(new Set([
  'Book', 'Dumbbell', 'Code', 'Music', 'Brain', 'Coffee', 'Moon', 'Sun', 'Heart', 'Zap',
  'Camera', 'Palette', 'GraduationCap', 'Languages', 'HeartPulse', 'Bike', 'Waves', 'Flame',
  'CheckCircle2', 'Target', 'Smile', 'Star', 'Anchor', 'Compass', 'MapPin', 'Bell', 'Smartphone',
  'Laptop', 'Headphones', 'Utensils', 'Apple', 'Activity', 'Feather', 'Brush', 'Cloud', 'Wind',
  'Droplets', 'Leaf', 'Mountain', 'Plane', 'Car', 'Briefcase',
  'FileText', 'Trophy', 'Medal', 'Timer', 'Clock', 'Gamepad2', 'Tv', 'Eye', 'Glasses', 'Thermometer',
  'Shield', 'Lock', 'Key', 'Mail', 'Send', 'ShoppingCart', 'Home', 'Volume2', 'Stethoscope', 'Pill'
]));

export const HabitModal: React.FC<HabitModalProps> = ({ onClose, onSave, habitToEdit }) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    icon: 'CheckCircle2',
    category: 'عام',
    frequency: HabitFrequency.DAILY,
    customFrequency: '',
    order: '',
    time: '',
    duration: '',
    color: ICON_COLORS[0],
    celebrationIcon: 'PartyPopper',
    replacingHabit: '',
    nearGoal: { target: 1, frequency: 'مرات يومياً', description: '' },
    awayGoal: { targetDate: '', description: '' },
    minGoal: '',
    expectedGoal: '',
    enableReminders: false,
  });

  const [showIconPicker, setShowIconPicker] = useState(false);

  useEffect(() => {
    if (habitToEdit) {
      setFormData({
        name: habitToEdit.name,
        icon: habitToEdit.icon || 'CheckCircle2',
        category: habitToEdit.category || 'عام',
        frequency: habitToEdit.frequency,
        customFrequency: habitToEdit.customFrequency || '',
        order: habitToEdit.order as any,
        time: habitToEdit.time || '',
        duration: habitToEdit.duration || '',
        color: habitToEdit.color || ICON_COLORS[0],
        celebrationIcon: habitToEdit.celebrationIcon || 'PartyPopper',
        replacingHabit: habitToEdit.replacingHabit || '',
        motivation: habitToEdit.motivation || '',
        nearGoal: habitToEdit.nearGoal || { target: 1, frequency: 'مرات يومياً', description: '' },
        awayGoal: habitToEdit.awayGoal || { targetDate: '', description: '' },
        minGoal: habitToEdit.minGoal,
        expectedGoal: habitToEdit.expectedGoal,
        enableReminders: habitToEdit.enableReminders || false,
      });
    }
  }, [habitToEdit]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (step < 3) {
      setStep(step + 1);
    } else {
      onSave({ ...formData, id: habitToEdit?.id });
      onClose();
    }
  };

  const currentIcon = (LucideIcons as any)[formData.icon] || LucideIcons.CheckCircle2;

  const renderStepIndicators = () => (
    <div className="flex justify-center gap-2 mb-6">
      {[1, 2, 3].map(s => (
        <div 
          key={s} 
          className={`h-1.5 rounded-full transition-all duration-300 ${s === step ? 'w-8 bg-blue-500' : s < step ? 'w-4 bg-blue-500/50' : 'w-4 bg-slate-200 dark:bg-slate-700'}`}
        />
      ))}
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-slate-900/10 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div 
        initial={{ scale: 0.98, opacity: 0, y: 10 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.98, opacity: 0, y: 10 }}
        className="relative w-full max-w-xl bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl overflow-hidden max-h-[85vh] flex flex-col border border-blue-50 dark:border-blue-900/30"
      >
        <div className="px-8 py-5 border-b border-slate-50 dark:border-slate-800 flex items-center justify-between">
          <h2 className="text-lg font-black text-slate-800 dark:text-slate-100 uppercase tracking-tight">
            {habitToEdit ? 'تحديث المهارة' : 'بدء رحلة جديدة'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 no-scrollbar flex flex-col justify-between">
          <div>
            {renderStepIndicators()}

            <AnimatePresence mode="wait">
              {step === 1 && (
                <motion.div 
                  key="step1"
                  initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
                  className="space-y-6"
                >
                  <p className="text-[10px] font-black text-blue-500 uppercase tracking-[0.3em] text-right">المعلومات الأساسية</p>
                  <div className="flex gap-4 items-center">
                    <button
                      type="button"
                      onClick={() => setShowIconPicker(!showIconPicker)}
                      className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center border-2 border-transparent hover:border-blue-300 transition-all shrink-0 shadow-inner"
                    >
                       {React.createElement(currentIcon, { className: 'w-8 h-8 text-blue-500' })}
                    </button>
                    <div className="flex-1 text-right">
                      <input 
                        required
                        type="text" 
                        value={formData.name}
                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                        className="w-full bg-transparent text-lg font-black text-slate-800 dark:text-slate-100 outline-none placeholder:text-slate-300"
                        placeholder="عنوان المهارة.."
                        autoFocus
                      />
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">اسم المهارة الأساسي</p>
                    </div>
                  </div>

                  <AnimatePresence>
                    {showIconPicker && (
                      <motion.div 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-800 grid grid-cols-6 sm:grid-cols-10 gap-2 max-h-[200px] overflow-y-auto no-scrollbar">
                          {HABIT_ICONS.map((iconName, idx) => {
                            const IconComp = (LucideIcons as any)[iconName];
                            if (!IconComp) return null;
                            return (
                              <button
                                key={`${iconName}-${idx}`}
                                type="button"
                                onClick={() => {
                                  setFormData({ ...formData, icon: iconName });
                                  setShowIconPicker(false);
                                }}
                                className={`p-2 rounded-xl flex items-center justify-center hover:bg-white dark:hover:bg-slate-700 hover:shadow-sm transition-all ${
                                  formData.icon === iconName ? 'bg-white dark:bg-slate-700 shadow-sm text-blue-500' : 'text-slate-400'
                                }`}
                              >
                                <IconComp className="w-5 h-5" />
                              </button>
                            );
                          })}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2 text-right">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">استبدال عادة (اختياري)</span>
                      <input 
                        type="text" 
                        value={formData.replacingHabit}
                        onChange={e => setFormData({ ...formData, replacingHabit: e.target.value })}
                        className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 outline-none focus:border-blue-200 text-right font-bold text-sm"
                        placeholder="عادة عايز تبدلها.."
                      />
                    </div>
                    <div className="space-y-2 text-right">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">الحافز المباشر (اختياري)</span>
                      <input 
                        type="text" 
                        value={(formData as any).motivation || ''}
                        onChange={e => setFormData({ ...formData, motivation: e.target.value } as any)}
                        className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 outline-none focus:border-blue-200 text-right font-bold text-sm"
                        placeholder="سبب يخليك تلتزم.."
                      />
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 justify-end">
                    {CATEGORIES.map(cat => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setFormData({ ...formData, category: cat })}
                        className={`px-4 py-2 rounded-xl text-[10px] font-bold transition-all border ${
                          formData.category === cat 
                            ? 'bg-blue-500 text-white border-blue-500 shadow-lg shadow-blue-500/20' 
                            : 'bg-white dark:bg-slate-800 text-slate-400 border-slate-100 dark:border-slate-800'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div 
                  key="step2"
                  initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
                  className="space-y-6"
                >
                  <p className="text-[10px] font-black text-blue-500 uppercase tracking-[0.3em] text-right">المواعيد والتكرار</p>
                  
                  <div className="grid grid-cols-3 gap-4">
                      <label className="block space-y-2 text-right">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block"><Clock className="w-3 h-3 inline mr-1" /> الوقت</span>
                        <input 
                          type="time" 
                          value={formData.time}
                          onChange={e => setFormData({ ...formData, time: e.target.value })}
                          className="w-full px-3 py-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-800 outline-none focus:border-blue-200 text-xs font-bold"
                        />
                      </label>
                      <label className="block space-y-2 text-right">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block"><Timer className="w-3 h-3 inline mr-1" /> المدة</span>
                        <input 
                          type="text" 
                          value={formData.duration}
                          onChange={e => setFormData({ ...formData, duration: e.target.value })}
                          className="w-full px-3 py-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-800 outline-none focus:border-blue-200 text-xs font-bold"
                          placeholder="٣٠ د"
                        />
                      </label>
                      <label className="block space-y-2 text-right">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block"><MapPin className="w-3 h-3 inline mr-1" /> الموقع</span>
                        <input 
                          type="text" 
                          value={formData.order}
                          onChange={e => setFormData({ ...formData, order: e.target.value })}
                          className="w-full px-3 py-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-800 outline-none focus:border-blue-200 text-xs font-bold"
                          placeholder="البيت"
                        />
                      </label>
                  </div>

                  <div className="bg-slate-50 dark:bg-slate-800/80 p-4 rounded-2xl flex items-center justify-between">
                     <div className="flex items-center gap-3">
                        <input 
                          type="checkbox" 
                          id="enableReminders"
                          checked={formData.enableReminders}
                          onChange={e => setFormData({ ...formData, enableReminders: e.target.checked })}
                          className="w-4 h-4 accent-blue-500 rounded"
                        />
                        <label htmlFor="enableReminders" className="text-[10px] font-bold text-slate-500">تفعيل إشعارات التقويم</label>
                     </div>
                     <Bell className="w-4 h-4 text-blue-300" />
                  </div>

                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                    {[
                      { id: HabitFrequency.DAILY, label: 'يومي' },
                      { id: HabitFrequency.WEEKLY, label: 'أسبوعي' },
                      { id: HabitFrequency.MONTHLY, label: 'شهري' },
                      { id: HabitFrequency.CUSTOM_DAYS, label: 'أيام/أسبوع' },
                      { id: HabitFrequency.CUSTOM, label: 'مخصص' }
                    ].map(option => (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() => setFormData({ ...formData, frequency: option.id })}
                        className={`py-2.5 px-2 rounded-xl text-[9px] font-black uppercase transition-all ${
                          formData.frequency === option.id 
                            ? 'bg-slate-800 dark:bg-white text-white dark:text-slate-900 border border-slate-800 dark:border-white shadow-md' 
                            : 'bg-white dark:bg-slate-800 text-slate-400 border border-slate-100 dark:border-slate-800'
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}

              {step === 3 && (
                <motion.div 
                  key="step3"
                  initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
                  className="space-y-6"
                >
                  <p className="text-[10px] font-black text-blue-500 uppercase tracking-[0.3em] text-right">النماذج المستهدفة</p>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div className="text-right">
                          <span className="text-[10px] font-black text-slate-800 dark:text-white uppercase block">الهدف القريب (تكرار)</span>
                          <div className="mt-2 flex items-center gap-2 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-800 px-4 py-2">
                            <input 
                              type="number" 
                              value={formData.nearGoal.target}
                              onChange={e => setFormData({ ...formData, nearGoal: { ...formData.nearGoal, target: parseInt(e.target.value) || 1 } })}
                              className="flex-1 bg-transparent text-right font-black text-base outline-none"
                            />
                            <span className="text-[9px] font-bold text-slate-400">مرات</span>
                          </div>
                        </div>
                        <textarea 
                          value={formData.nearGoal.description}
                          onChange={e => setFormData({ ...formData, nearGoal: { ...formData.nearGoal, description: e.target.value } })}
                          className="w-full px-5 py-3 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-800 outline-none focus:border-blue-200 text-right font-bold text-xs min-h-[60px]"
                          placeholder="وصف الهدف القريب.."
                        />
                      </div>

                      <div className="space-y-4">
                        <div className="text-right">
                          <span className="text-[10px] font-black text-slate-800 dark:text-white uppercase block">الهدف البعيد (تاريخ)</span>
                          <input 
                            type="date" 
                            value={formData.awayGoal.targetDate}
                            onChange={e => setFormData({ ...formData, awayGoal: { ...formData.awayGoal, targetDate: e.target.value } })}
                            className="w-full px-4 py-2.5 mt-2 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-800 outline-none focus:border-blue-200 text-xs font-bold"
                          />
                        </div>
                        <textarea 
                          value={formData.awayGoal.description}
                          onChange={e => setFormData({ ...formData, awayGoal: { ...formData.awayGoal, description: e.target.value } })}
                          className="w-full px-5 py-3 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-800 outline-none focus:border-blue-200 text-right font-bold text-xs min-h-[60px]"
                          placeholder="وصف الهدف البعيد.."
                        />
                      </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="pt-8 flex items-center justify-between gap-4 mt-auto">
            {step > 1 ? (
              <button 
                type="button"
                onClick={() => setStep(step - 1)}
                className="w-14 h-14 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-slate-400 hover:text-slate-800 dark:hover:text-white transition-all shrink-0"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            ) : (
                <div className="w-14 shrink-0" />
            )}
            
            <button 
              type="submit"
              disabled={!formData.name}
              className="flex-1 py-4 flex items-center justify-center gap-2 bg-blue-600 text-white rounded-2xl font-black text-base hover:bg-blue-700 transition-all shadow-xl shadow-blue-600/20 active:scale-98 disabled:opacity-50 disabled:active:scale-100"
            >
              {step < 3 ? (
                 <>
                   التالي
                   <ArrowRight className="w-4 h-4 reverse-icon" />
                 </>
              ) : (
                 habitToEdit ? 'تحديث البيانات' : 'ابدأ المسار 🚀'
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};
