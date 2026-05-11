import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, ListOrdered, Target, Flag, Scale, Check, Search, Tag } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { HabitFrequency, Habit, CATEGORIES, ICON_COLORS, CELEBRATION_ICONS } from '../types';

interface HabitModalProps {
  onClose: () => void;
  onSave: (habit: any) => void;
  habitToEdit?: Habit;
}

const HABIT_ICONS = [
  'Book', 'Dumbbell', 'Code', 'Music', 'Brain', 'Coffee', 'Moon', 'Sun', 'Heart', 'Zap',
  'Camera', 'Palette', 'PenTool', 'GraduationCap', 'Languages', 'HeartPulse', 'Bike', 'Waves', 'Flame',
  'CheckCircle2', 'Target', 'Smile', 'Star', 'Anchor', 'Compass', 'MapPin', 'Bell', 'Smartphone'
];

export const HabitModal: React.FC<HabitModalProps> = ({ onClose, onSave, habitToEdit }) => {
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
      });
    }
  }, [habitToEdit]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ ...formData, id: habitToEdit?.id });
    onClose();
  };

  const currentIcon = (LucideIcons as any)[formData.icon] || LucideIcons.CheckCircle2;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div 
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl shadow-slate-900/20 overflow-hidden max-h-[90vh] flex flex-col border border-slate-100 dark:border-slate-800"
      >
        <div className="px-8 py-6 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md flex items-center justify-between border-b border-slate-50 dark:border-slate-800">
          <h2 className="text-xl font-black tracking-tight text-slate-800 dark:text-slate-100 uppercase">
            {habitToEdit ? 'تعديل العادة' : 'معمل العادات'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-400 btn-hover-scale">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 space-y-8 no-scrollbar">
          {/* Header Input with Icon Selection */}
          <div className="flex gap-6 items-start bg-slate-50 dark:bg-slate-800/50 p-6 rounded-3xl border border-slate-100 dark:border-slate-700">
            <button
               type="button"
               onClick={() => setShowIconPicker(!showIconPicker)}
               className="w-20 h-20 rounded-2xl bg-white dark:bg-slate-800 flex items-center justify-center border-2 border-transparent hover:border-indigo-500 transition-all group shrink-0 shadow-sm"
            >
               {React.createElement(currentIcon, { className: 'w-10 h-10 text-indigo-500 group-hover:scale-110 transition-transform' })}
            </button>
            <div className="flex-1 space-y-2 text-right">
              <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest px-1">اسم العادة</span>
              <input 
                required
                type="text" 
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                className="w-full bg-transparent text-xl font-black text-slate-800 dark:text-slate-100 outline-none placeholder:text-slate-300 dark:placeholder:text-slate-600"
                placeholder="هتعمل إيه النهارده؟"
              />
            </div>
          </div>

          <div className="space-y-2 text-right">
            <span className="text-[10px] font-black text-rose-500 uppercase tracking-widest px-1">استبدال عادة سيئة (اختياري)</span>
            <input 
              type="text" 
              value={formData.replacingHabit}
              onChange={e => setFormData({ ...formData, replacingHabit: e.target.value })}
              className="w-full px-6 py-4 bg-rose-50 dark:bg-rose-900/20 rounded-2xl border border-rose-100 dark:border-rose-900/30 outline-none focus:border-rose-300 text-right font-bold text-sm placeholder:text-rose-200 dark:placeholder:text-rose-800 dark:text-slate-200"
              placeholder="اكتب العادة اللي عايز تبطلها.."
            />
          </div>

          <div className="space-y-2 text-right">
            <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest px-1">الحافز (اختياري)</span>
            <input 
              type="text" 
              value={(formData as any).motivation || ''}
              onChange={e => setFormData({ ...formData, motivation: e.target.value } as any)}
              className="w-full px-6 py-4 bg-amber-50 dark:bg-amber-900/20 rounded-2xl border border-amber-100 dark:border-amber-900/30 outline-none focus:border-amber-300 text-right font-bold text-sm placeholder:text-amber-200 dark:placeholder:text-amber-800 dark:text-slate-200"
              placeholder="ايه الحافز اللي يخليك تكمل؟.."
            />
          </div>

          <div className="space-y-4">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest px-1 flex items-center gap-2 justify-end">التصنيف <Tag className="w-3.5 h-3.5" /></span>
            <div className="flex flex-wrap gap-2 justify-end">
              {CATEGORIES.map(cat => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setFormData({ ...formData, category: cat })}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border shadow-sm btn-hover-scale ${
                    formData.category === cat 
                      ? 'bg-indigo-500 text-white border-indigo-500 shadow-md glass-shine' 
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
            {formData.category === 'مخصص' && (
              <input 
                type="text"
                placeholder="اكتب تصنيف جديد.."
                className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 outline-none focus:border-indigo-500 text-right font-bold text-sm dark:text-slate-200"
                value={formData.category === 'مخصص' ? '' : formData.category}
                onChange={e => setFormData({ ...formData, category: e.target.value })}
              />
            )}
          </div>

          <div className="space-y-4">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1 block text-right">اللون المميز</span>
            <div className="flex gap-3 justify-end overflow-x-auto no-scrollbar py-2">
              {ICON_COLORS.map(color => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setFormData({ ...formData, color })}
                  className={`w-8 h-8 rounded-full ${color} border-4 transition-all ${
                    formData.color === color ? 'border-indigo-100 scale-125 shadow-lg' : 'border-transparent opacity-60 hover:opacity-100'
                  }`}
                />
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1 block text-right">أيقونة الاحتفال</span>
            <div className="flex gap-3 justify-end overflow-x-auto no-scrollbar py-2">
              {CELEBRATION_ICONS.map(iconName => {
                const Icon = (LucideIcons as any)[iconName];
                return (
                  <button
                    key={iconName}
                    type="button"
                    onClick={() => setFormData({ ...formData, celebrationIcon: iconName })}
                    className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                      formData.celebrationIcon === iconName ? 'bg-indigo-500 text-white shadow-lg lg:scale-110' : 'bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-500'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                  </button>
                );
              })}
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
                <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 grid grid-cols-6 gap-2">
                  {HABIT_ICONS.map(iconName => {
                    const IconComp = (LucideIcons as any)[iconName];
                    return (
                      <button
                        key={iconName}
                        type="button"
                        onClick={() => {
                          setFormData({ ...formData, icon: iconName });
                          setShowIconPicker(false);
                        }}
                        className={`p-3 rounded-xl flex items-center justify-center hover:bg-indigo-500 hover:text-white transition-all ${
                          formData.icon === iconName ? 'bg-indigo-500 text-white shadow-lg' : 'text-slate-500 dark:text-slate-400'
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

          <div className="grid grid-cols-3 gap-4">
              <label className="block space-y-3 text-right">
                <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1 flex items-center gap-2 justify-end"><Clock className="w-3.5 h-3.5" /> الوقت</span>
                <input 
                  type="time" 
                  value={formData.time}
                  onChange={e => setFormData({ ...formData, time: e.target.value })}
                  className="w-full px-4 py-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 outline-none focus:border-indigo-500 transition-all text-sm font-bold dark:text-slate-200"
                />
              </label>
              <label className="block space-y-3 text-right">
                <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1 flex items-center gap-2 justify-end"><Check className="w-3.5 h-3.5" /> المدة</span>
                <input 
                  type="text" 
                  value={formData.duration}
                  onChange={e => setFormData({ ...formData, duration: e.target.value })}
                  className="w-full px-4 py-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 outline-none focus:border-indigo-500 transition-all text-sm font-bold dark:text-slate-200"
                  placeholder="مثلاً: ٣٠ د"
                />
              </label>
              <label className="block space-y-3 text-right">
                <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1 flex items-center gap-2 justify-end"><ListOrdered className="w-3.5 h-3.5" /> فين؟</span>
                <input 
                  type="text" 
                  value={formData.order}
                  onChange={e => setFormData({ ...formData, order: e.target.value })}
                  className="w-full px-4 py-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 outline-none focus:border-indigo-500 transition-all text-sm font-bold dark:text-slate-200"
                  placeholder="مثلاً: البيت"
                />
              </label>
          </div>

          <div className="space-y-4">
            <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1 block text-right">التكرار</span>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
              {[
                { id: HabitFrequency.DAILY, label: 'يومي', freqLabel: 'مرات يومياً' },
                { id: HabitFrequency.WEEKLY, label: 'أسبوعي', freqLabel: 'مرات أسبوعياً' },
                { id: HabitFrequency.MONTHLY, label: 'شهري', freqLabel: 'مرات شهرياً' },
                { id: HabitFrequency.CUSTOM_DAYS, label: 'أيام / أسبوع', freqLabel: 'أيام في الأسبوع' },
                { id: HabitFrequency.CUSTOM, label: 'مخصص', freqLabel: 'مخصص' }
              ].map(option => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => {
                    setFormData({ 
                      ...formData, 
                      frequency: option.id, 
                      nearGoal: { ...formData.nearGoal, frequency: option.freqLabel } 
                    });
                  }}
                  className={`py-3 px-4 rounded-xl text-xs font-black transition-all border ${
                    formData.frequency === option.id 
                      ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-slate-900 dark:border-white shadow-xl' 
                      : 'bg-white dark:bg-slate-800 text-slate-400 dark:text-slate-500 border-slate-100 dark:border-slate-700 hover:border-indigo-300'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
            
            {formData.frequency === HabitFrequency.CUSTOM_DAYS && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                className="pt-2"
              >
                <div className="flex items-center gap-4 bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700">
                  <span className="text-xs font-bold text-slate-500">أيام في الأسبوع</span>
                  <input 
                    type="number"
                    min="1"
                    max="7"
                    className="flex-1 bg-transparent text-right font-black text-lg outline-none dark:text-slate-200"
                    value={formData.customFrequency}
                    onChange={e => {
                      const val = e.target.value;
                      setFormData({ 
                        ...formData, 
                        customFrequency: val,
                        nearGoal: { ...formData.nearGoal, target: parseInt(val) || 1 }
                      });
                    }}
                  />
                </div>
              </motion.div>
            )}

            {formData.frequency === HabitFrequency.CUSTOM && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                className="pt-2"
              >
                <input 
                  type="text"
                  placeholder="حدد تكرار مخصص (مثلاً: يوم ويوم، ٣ أيام في الأسبوع)"
                  className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 outline-none focus:border-indigo-500 text-right font-bold text-sm dark:text-slate-200"
                  value={formData.customFrequency}
                  onChange={e => setFormData({ ...formData, customFrequency: e.target.value })}
                />
              </motion.div>
            )}
          </div>

          <div className="space-y-2 text-right">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">وصف الهدف القريب</span>
            <textarea 
              value={formData.nearGoal.description}
              onChange={e => setFormData({ ...formData, nearGoal: { ...formData.nearGoal, description: e.target.value } })}
              className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 outline-none focus:border-indigo-500 text-right font-bold text-sm min-h-[80px] dark:text-slate-200"
              placeholder="وصف بسيط لهدفك القريب.."
            />
          </div>

          <div className="grid grid-cols-2 gap-4 text-right">
              <label className="block space-y-2">
                <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest px-1 block">تكرار الإنجاز (الهدف القريب)</span>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl border border-indigo-100 dark:border-indigo-900/30 px-4 py-3">
                    <input 
                      type="number" 
                      value={formData.nearGoal.target}
                      onChange={e => setFormData({ ...formData, nearGoal: { ...formData.nearGoal, target: parseInt(e.target.value) || 1 } })}
                      className="flex-1 bg-transparent text-right font-black text-lg outline-none dark:text-slate-200"
                      placeholder="كم مرة؟"
                    />
                    <span className="text-[10px] font-bold text-indigo-400">مرة</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 justify-end">
                    {[
                      { id: 'مرات يومياً', label: 'يومي' },
                      { id: 'مرات أسبوعياً', label: 'أسبوعي' },
                      { id: 'مخصص', label: 'مخصص' }
                    ].map(opt => (
                      <button
                        key={`near-freq-${opt.id}`}
                        type="button"
                        onClick={() => setFormData({ ...formData, nearGoal: { ...formData.nearGoal, frequency: opt.id } })}
                        className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all border ${
                          formData.nearGoal.frequency === opt.id || (opt.id === 'مخصص' && !['مرات يومياً', 'مرات أسبوعياً'].includes(formData.nearGoal.frequency))
                            ? 'bg-indigo-500 text-white border-indigo-500 shadow-md'
                            : 'bg-white dark:bg-slate-800 text-slate-400 border-slate-100 dark:border-slate-700 hover:border-indigo-200'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                  {(!['مرات يومياً', 'مرات أسبوعياً'].includes(formData.nearGoal.frequency)) && (
                    <input 
                      type="text" 
                      value={formData.nearGoal.frequency === 'مخصص' ? '' : formData.nearGoal.frequency}
                      onChange={e => setFormData({ ...formData, nearGoal: { ...formData.nearGoal, frequency: e.target.value } })}
                      className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 outline-none focus:border-indigo-500 text-right font-bold text-[10px] dark:text-slate-200"
                      placeholder="اكتب التكرار المخصص.."
                    />
                  )}
                </div>
              </label>
              <label className="block space-y-2">
                <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400 uppercase tracking-widest px-1 block">الهدف البعيد (التاريخ)</span>
                <input 
                  type="date" 
                  value={formData.awayGoal.targetDate}
                  onChange={e => setFormData({ ...formData, awayGoal: { ...formData.awayGoal, targetDate: e.target.value } })}
                  className="w-full px-6 py-4 bg-purple-50 dark:bg-purple-900/20 rounded-2xl border border-purple-100 dark:border-purple-900/30 outline-none focus:border-purple-500 dark:text-slate-200"
                />
              </label>
          </div>

          <div className="space-y-2 text-right">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">وصف الهدف البعيد</span>
            <textarea 
              value={formData.awayGoal.description}
              onChange={e => setFormData({ ...formData, awayGoal: { ...formData.awayGoal, description: e.target.value } })}
              className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 outline-none focus:border-indigo-500 text-right font-bold text-sm min-h-[80px] dark:text-slate-200"
              placeholder="مثلاً: عايز أقدر أجري ماراثون كامل بنهاية السنة.."
            />
          </div>

          <div className="grid grid-cols-2 gap-4 text-right">
              <label className="block space-y-2">
                <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-widest px-1 block">الحد الأدنى (P-Mode)</span>
                <input 
                  type="text" 
                  value={formData.minGoal}
                  onChange={e => setFormData({ ...formData, minGoal: e.target.value })}
                  className="w-full px-6 py-4 bg-amber-50 dark:bg-amber-900/20 rounded-2xl border border-amber-100 dark:border-amber-900/30 outline-none focus:border-amber-500 dark:text-slate-200"
                  placeholder="أقل مجهود"
                />
              </label>
              <label className="block space-y-2">
                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest px-1 block">المتوقع (Elite)</span>
                <input 
                  type="text" 
                  value={formData.expectedGoal}
                  onChange={e => setFormData({ ...formData, expectedGoal: e.target.value })}
                  className="w-full px-6 py-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl border border-emerald-100 dark:border-emerald-900/30 outline-none focus:border-emerald-500 dark:text-slate-200"
                  placeholder="الهدف المثالي"
                />
              </label>
          </div>

          <div className="pt-6">
            <button 
              type="submit"
              className="w-full py-5 bg-slate-900 dark:bg-indigo-600 text-white rounded-[2rem] font-black text-lg hover:shadow-2xl hover:shadow-slate-900/10 dark:hover:shadow-indigo-500/20 transition-all shadow-xl btn-hover-scale glass-shine"
            >
              {habitToEdit ? 'تحديث المعطيات' : 'يا مسهل.. ابدأ!'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};
