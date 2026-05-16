import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronRightIcon, Calendar as CalendarIcon, Crosshair, Target, Trash2 } from 'lucide-react';
import { PlannerData } from '../types';

const QUARTERS = [
  { id: 'q1', name: 'الربع الأول', months: ['يناير', 'فبراير', 'مارس'], color: 'bg-indigo-500' },
  { id: 'q2', name: 'الربع الثاني', months: ['أبريل', 'مايو', 'يونيو'], color: 'bg-sky-500' },
  { id: 'q3', name: 'الربع الثالث', months: ['يوليو', 'أغسطس', 'سبتمبر'], color: 'bg-emerald-500' },
  { id: 'q4', name: 'الربع الرابع', months: ['أكتوبر', 'نوفمبر', 'ديسمبر'], color: 'bg-violet-500' },
];

interface PlannerViewProps {
  onBack: () => void;
  plannerData: PlannerData;
  setPlannerData: React.Dispatch<React.SetStateAction<PlannerData>>;
  requestConfirm: (title: string, description: string, icon: React.ReactNode, onConfirm: () => void) => void;
}

export const PlannerView: React.FC<PlannerViewProps> = ({ onBack, plannerData, setPlannerData, requestConfirm }) => {
  const [selectedQ, setSelectedQ] = useState<string | null>(null);
  const [localData, setLocalData] = useState<PlannerData>({});

  useEffect(() => {
    setLocalData(plannerData);
  }, [plannerData]);

  const activeQ = QUARTERS.find(q => q.id === selectedQ);

  const handleUpdate = (month: string, field: 'goal' | 'notes', value: string) => {
    // Update local stage
    setLocalData(prev => ({
      ...prev,
      [month]: {
        ...prev[month],
        [field]: value
      }
    }));
    
    // Auto-save to parent state
    setPlannerData(prev => ({
      ...prev,
      [month]: {
        ...(prev[month] || { goal: '', notes: '' }),
        [field]: value
      }
    }));
  };

  const handleDelete = (month: string) => {
    requestConfirm(
      'حذف بيانات الشهر؟',
      `هل أنت متأكد من حذف جميع بيانات شهر ${month}؟ لا يمكن التراجع عن هذا الإجراء.`,
      <Trash2 className="w-12 h-12 text-blue-500 mb-6 mx-auto" />,
      () => {
        setPlannerData(prev => {
          const newData = { ...prev };
          delete newData[month];
          return newData;
        });
        setLocalData(prev => {
          const newData = { ...prev };
          delete newData[month];
          return newData;
        });
        // Important: close the confirmation modal
        requestConfirm('', '', null, () => {}); 
      }
    );
  };

  return (
    <div className="relative pt-6 min-h-[70vh]">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack}
            className="w-12 h-12 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-slate-400 border border-slate-100 dark:border-slate-800"
          >
            <ChevronRightIcon className="w-5 h-5 pr-0.5" />
          </button>
          <div className="text-right">
             <h2 className="text-2xl font-black text-slate-800 dark:text-white leading-none">المخطط الشخصي</h2>
             <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest mt-1">Timeline 2026</p>
          </div>
        </div>
        {!selectedQ && (
          <div className="bg-emerald-50 dark:bg-emerald-900/20 px-4 py-2 rounded-xl text-emerald-600 dark:text-emerald-400 text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
             <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
             حفظ تلقائي مفعّل
          </div>
        )}
      </div>

      <AnimatePresence mode="wait">
        {!selectedQ ? (
          <motion.div 
            key="grid"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="relative w-full aspect-square max-w-[550px] mx-auto flex items-center justify-center mt-12 bg-white dark:bg-slate-900 border-4 border-slate-50 dark:border-slate-800 shadow-2xl rounded-full"
          >
            {/* Orbit paths */}
            <div className="absolute inset-[10%] border-2 border-blue-500/5 dark:border-blue-500/10 rounded-full border-dashed" />
            <div className="absolute inset-[30%] border-2 border-blue-500/10 dark:border-blue-500/20 rounded-full border-dashed" />
            
            <div className="w-28 h-28 bg-white dark:bg-slate-800 rounded-full shadow-2xl flex flex-col items-center justify-center z-10 border-4 border-blue-50 dark:border-slate-700">
               <Crosshair className="w-10 h-10 text-blue-500 mb-1 animate-spin-slow" />
               <span className="text-[12px] font-black text-slate-400">2026</span>
            </div>

            {QUARTERS.map((q, idx) => {
              const angles = [225, 315, 45, 135]; // Positioning quarters in 4 corners
              const angle = angles[idx];
              const radius = '40%';
              return (
                <motion.button
                  key={q.id}
                  onClick={() => setSelectedQ(q.id)}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  style={{ 
                    position: 'absolute',
                    top: `calc(50% + ${Math.sin(angle * Math.PI / 180) * 40}%)`,
                    left: `calc(50% + ${Math.cos(angle * Math.PI / 180) * 40}%)`,
                    transform: 'translate(-50%, -50%)'
                  }}
                  className={`w-36 h-36 rounded-full overflow-hidden text-center shadow-2xl shadow-blue-500/10 border-4 border-white dark:border-slate-800 bg-white dark:bg-slate-900 group z-20 flex flex-col items-center justify-center p-6 hover:scale-110 active:scale-90 transition-all`}
                >
                  <div className={`absolute inset-0 transition-all ${q.color} opacity-[0.03] group-hover:opacity-10`} />
                  <CalendarIcon className={`w-8 h-8 ${q.color.replace('bg-', 'text-')} mb-2 group-hover:scale-125 transition-transform`} />
                  <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-tighter">{q.name}</h3>
                  <div className="flex gap-1 mt-2">
                    {q.months.map(m => (
                      <span key={m} className={`w-1.5 h-1.5 rounded-full ${plannerData[m]?.goal ? q.color : 'bg-slate-100 dark:bg-slate-800'}`} />
                    ))}
                  </div>
                </motion.button>
              );
            })}
          </motion.div>
        ) : (
          <motion.div 
            key="detail"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex flex-col items-center"
          >
            <div className="flex items-center justify-between w-full mb-12 pb-6 border-b border-slate-100 dark:border-slate-800">
              <button 
                 onClick={() => setSelectedQ(null)}
                 className="px-6 py-2.5 bg-slate-50 dark:bg-slate-800 rounded-full text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-blue-500 transition-all border border-slate-100 dark:border-slate-800"
              >
                العودة للمركز
              </button>
              <div className="text-right">
                <h3 className="text-3xl font-black text-slate-900 dark:text-white">{activeQ?.name}</h3>
                <p className="text-[10px] font-black text-blue-500 uppercase tracking-[0.3em] mt-1">Timeline Detail</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full">
              {activeQ?.months.map(month => {
                const monthData = localData[month] || { goal: '', notes: '' };
                return (
                  <div key={month} className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[3rem] p-8 shadow-xl shadow-slate-100/50 dark:shadow-none flex flex-col items-center text-center">
                    <div className={`w-20 h-20 rounded-full ${activeQ.color} bg-opacity-10 dark:bg-opacity-20 flex items-center justify-center mb-6 border-2 border-white dark:border-slate-800 shadow-lg`}>
                       <h4 className={`text-xl font-black ${activeQ.color.replace('bg-', 'text-')}`}>{month.substring(0, 1) === 'ا' ? month.substring(0,2) : month.substring(0,1)}</h4>
                    </div>
                    <h4 className="text-2xl font-black text-slate-800 dark:text-white mb-6 underline decoration-blue-500/20 underline-offset-8">{month}</h4>
                    
                    <div className="space-y-6 w-full relative">
                      {/* Close/Delete corner button */}
                      <button 
                        onClick={() => handleDelete(month)} 
                        className="absolute -top-20 -right-4 w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-900/10 text-blue-500 flex items-center justify-center hover:bg-blue-500 hover:text-white transition-all border border-blue-100 dark:border-blue-900/30 z-10 shadow-sm"
                        title="حذف البيانات"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>

                      <div className="text-right">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 px-2">الهدف المركزي</label>
                        <input 
                          type="text" 
                          value={monthData.goal || ''}
                          onChange={(e) => handleUpdate(month, 'goal', e.target.value)}
                          placeholder="هدفك لهذا الشهر..."
                          className="w-full bg-slate-50 dark:bg-slate-800 rounded-[2rem] px-6 py-4 text-right text-sm font-bold border border-transparent focus:border-blue-200 outline-none transition-all shadow-inner"
                        />
                      </div>
                      <div className="text-right">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 px-2">تأملات</label>
                        <textarea 
                          value={monthData.notes || ''}
                          onChange={(e) => handleUpdate(month, 'notes', e.target.value)}
                          placeholder="خواطر..."
                          rows={3}
                          className="w-full bg-slate-50 dark:bg-slate-800 rounded-[2rem] px-6 py-4 text-right text-xs font-bold border border-transparent focus:border-blue-200 outline-none resize-none transition-all shadow-inner"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
