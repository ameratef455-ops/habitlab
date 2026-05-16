import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ChevronRightIcon, 
  Calendar as CalendarIcon, 
  CheckCircle2, 
  Circle, 
  Clock, 
  Target, 
  Plus, 
  GripVertical, 
  TrendingUp, 
  Activity,
  Trash2,
  Edit3,
  RotateCcw
} from 'lucide-react';
import {
  DndContext, 
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const DAYS = ['السبت', 'الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة'];

interface ScheduleTask {
  id: string;
  name: string;
  time: string;
  duration: string;
  minGoal: string;
  expectedGoal: string;
  date: string; // Day name
  iso: string; // ISO Date
  completed: boolean;
  completionData?: {
    durationMet: boolean;
    goalMet: 'min' | 'expected' | 'none';
    notes: string;
  };
}

interface SortableItemProps {
  task: ScheduleTask;
  onComplete: (task: ScheduleTask) => void;
  onUndo: (task: ScheduleTask) => void;
  onDelete: (id: string) => void;
  onEdit: (task: ScheduleTask) => void;
  key?: string | number;
}

const SortableTask = ({ task, onComplete, onUndo, onDelete, onEdit }: SortableItemProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 0,
    opacity: isDragging ? 0.8 : 1,
  };

  return (
    <div 
      ref={setNodeRef} 
      style={style}
      className={`group relative p-10 rounded-[4.5rem] border transition-all duration-500 font-sans ${
        task.completed 
          ? 'bg-emerald-50 dark:bg-emerald-900/10 border-emerald-100 dark:border-emerald-900/30' 
          : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 shadow-2xl shadow-slate-200/20 dark:shadow-none'
      } text-right`}
    >
      {!task.completed && (
        <div className="absolute top-4 left-4 flex gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity z-10">
          <button 
            onClick={() => onEdit(task)} 
            className="w-10 h-10 rounded-xl flex items-center justify-center text-blue-500 hover:bg-blue-500 hover:text-white bg-blue-50 transition-all shadow-sm"
          >
            <Edit3 className="w-5 h-5" />
          </button>
          <button 
            onClick={() => onDelete(task.id)} 
            className="w-10 h-10 rounded-xl flex items-center justify-center text-blue-600 hover:bg-blue-600 hover:text-white bg-blue-50 transition-all shadow-sm"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      )}

      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing p-2 text-slate-300 hover:text-slate-500 transition-colors">
            <GripVertical className="w-5 h-5" />
          </div>
        </div>
        
        <div className="flex items-center gap-4">
           <div>
              <h3 className={`text-xl font-black ${task.completed ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-800 dark:text-white'}`}>{task.name}</h3>
              <div className="flex items-center gap-2 mt-1 justify-end opacity-60">
                <span className="text-xs font-bold text-slate-500 flex items-center gap-1"><Clock className="w-3 h-3" /> {task.time}</span>
                <span className="w-1 h-1 bg-slate-300 rounded-full" />
                <span className="text-xs font-bold text-slate-500 flex items-center gap-1"><Target className="w-3 h-3" /> {task.duration}</span>
              </div>
           </div>
           <div className="flex flex-col gap-2">
             {task.completed ? (
               <button onClick={() => onUndo(task)} className="w-14 h-14 rounded-full flex items-center justify-center text-amber-500 bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-900/30 transition-all hover:scale-110 active:scale-95 shadow-md">
                 <RotateCcw className="w-7 h-7" />
               </button>
             ) : (
               <button onClick={() => onComplete(task)} className="w-14 h-14 rounded-full flex items-center justify-center transition-all duration-500 shadow-md group/check text-slate-300 hover:text-emerald-500 bg-slate-50 dark:bg-slate-800">
                 <div className="w-8 h-8 rounded-full border-2 border-slate-200 dark:border-slate-700 group-hover/check:border-emerald-500 transition-colors duration-500" />
               </button>
             )}
           </div>
        </div>
      </div>

      {!task.completed && (
         <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-3xl flex justify-between items-center opacity-80 border border-slate-100 dark:border-slate-800">
           <div className="text-center w-1/2 border-r border-slate-200 dark:border-slate-700 pr-4">
             <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest mb-1">المتوقع</p>
             <p className="text-sm font-bold text-blue-500">{task.expectedGoal}</p>
           </div>
           <div className="text-center w-1/2 pl-4">
             <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest mb-1">الحد الأدنى</p>
             <p className="text-sm font-bold text-slate-500">{task.minGoal}</p>
           </div>
         </div>
      )}
    </div>
  );
};

interface ScheduleViewProps {
  onBack: () => void;
  tasks: ScheduleTask[];
  setTasks: React.Dispatch<React.SetStateAction<ScheduleTask[]>>;
  requestConfirm: (title: string, description: string, icon: React.ReactNode, onConfirm: () => void) => void;
  onCelebrate?: () => void;
  onTaskComplete?: (points: number) => void;
}

export const ScheduleView: React.FC<ScheduleViewProps> = ({ onBack, tasks, setTasks, requestConfirm, onCelebrate, onTaskComplete }) => {
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [completingTask, setCompletingTask] = useState<ScheduleTask | null>(null);

  const [newTask, setNewTask] = useState<Partial<ScheduleTask>>({});
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [completionForm, setCompletionForm] = useState({ durationMet: true, goalMet: 'expected' as 'min'|'expected'|'none', notes: '' });

  const [isQuickLog, setIsQuickLog] = useState(false);

  const weekDates = useMemo(() => {
    const today = new Date();
    const dates = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      const name = DAYS[d.getDay() === 6 ? 0 : d.getDay() + 1]; // Simplified Arabic day logic
      dates.push({
        id: i,
        name: new Intl.DateTimeFormat('ar-EG', { weekday: 'long' }).format(d).split(' ')[0],
        label: d.toLocaleDateString('ar-EG', { day: 'numeric', month: 'short' }),
        iso: d.toISOString().split('T')[0]
      });
    }
    return dates;
  }, []);

  const selectedDayInfo = weekDates[selectedDayIndex];
  const activeTasks = tasks.filter(t => t.iso === selectedDayInfo.iso);
  
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setTasks((items) => {
        const oldIndex = items.findIndex((t) => t.id === active.id);
        const newIndex = items.findIndex((t) => t.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const handleAddTask = () => {
    if (!newTask.name) return;
    if (editingTaskId) {
      setTasks(tasks.map(t => t.id === editingTaskId ? { ...t, ...newTask } as ScheduleTask : t));
      setEditingTaskId(null);
    } else {
      const taskData: ScheduleTask = { 
        ...newTask, 
        id: crypto.randomUUID(), 
        date: selectedDayInfo.name, 
        iso: selectedDayInfo.iso,
        completed: false 
      } as ScheduleTask;
      setTasks([...tasks, taskData]);
    }
    setShowModal(false);
    setNewTask({});
  };

  const handleEditTask = (task: ScheduleTask) => {
    setNewTask(task);
    setEditingTaskId(task.id);
    setShowModal(true);
  };

  const finishTask = () => {
    if (!completingTask) return;
    setTasks(tasks.map(t => t.id === completingTask.id ? { ...t, completed: true, completionData: completionForm } as ScheduleTask : t));
    
    let basePoints = 10;
    if (completionForm.goalMet === 'expected') basePoints += 10;
    else if (completionForm.goalMet === 'min') basePoints += 5;
    
    if (completionForm.durationMet) basePoints += 10;
    
    onTaskComplete?.(basePoints);

    setCompletingTask(null);
    onCelebrate?.();
  };

  const undoTask = (task: ScheduleTask) => {
    requestConfirm(
      'تراجع عن الإنجاز؟',
      'هل تريد فعلاً إلغاء حالة الإتمام لهذه المهمة؟ سيتم خصم النقاط المكتسبة.',
      <RotateCcw className="w-12 h-12 text-amber-500 mb-6 mx-auto" />,
      () => {
        setTasks(tasks.map(t => t.id === task.id ? { ...t, completed: false, completionData: undefined } as ScheduleTask : t));
        onTaskComplete?.(-20); // Average deduction
      }
    );
  };

  const deleteTask = (id: string) => {
    requestConfirm(
      'حذف هذه المهمة؟',
      'سيتم إزالة المهمة نهائياً من جدولك اليومي.',
      <Trash2 className="w-12 h-12 text-blue-500 mb-6 mx-auto" />,
      () => {
        setTasks(prev => prev.filter(t => t.id !== id));
      }
    );
  };

  const stats = useMemo(() => {
    const dayTasks = tasks.filter(t => t.iso === selectedDayInfo.iso);
    if (dayTasks.length === 0) return { efficiency: 0, focusRate: 0 };

    const taskWeight = 100 / dayTasks.length;
    let totalEfficiency = 0;
    let totalFocus = 0;

    dayTasks.forEach(task => {
      if (task.completed) {
        // Efficiency calculation (Kafaa)
        let taskEfficiency = taskWeight;
        if (!task.completionData?.durationMet) {
          taskEfficiency = taskWeight * 0.85; // Deduct 15%
        }
        totalEfficiency += taskEfficiency;

        // Focus calculation (Tarkiz)
        let taskFocus = taskWeight;
        if (task.completionData?.goalMet !== 'expected') {
          taskFocus = taskWeight * 0.85; // Deduct 15%
        }
        totalFocus += taskFocus;
      }
    });
    
    return {
        efficiency: Math.round(totalEfficiency),
        focusRate: Math.round(totalFocus)
    };
  }, [tasks, selectedDayInfo.iso]);

  return (
    <div className="relative pt-6 min-h-[70vh] pb-32">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="text-right">
            <h2 className="text-2xl font-black text-slate-800 dark:text-white leading-none">الجدول الأسبوعي</h2>
            <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest mt-1">Weekly Protocol</p>
          </div>
        </div>
        <button onClick={() => setShowModal(true)} className="w-14 h-14 bg-blue-600 text-white rounded-full flex items-center justify-center shadow-2xl shadow-blue-600/40 hover:scale-110 active:scale-90 transition-all">
          <Plus className="w-7 h-7" />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-6 mb-10">
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[4rem] p-8 text-right shadow-2xl shadow-slate-200/20">
            <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-900/20 rounded-full flex items-center justify-center text-emerald-500 mb-6 ml-auto">
                <TrendingUp className="w-5 h-5" />
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">الكفاءة</p>
            <span className="text-4xl font-black text-slate-800 dark:text-white">{stats.efficiency}%</span>
            <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full mt-6 overflow-hidden">
                <motion.div initial={{ width: 0 }} animate={{ width: `${stats.efficiency}%` }} transition={{ duration: 0.5 }} className="h-full bg-emerald-500" />
            </div>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[4rem] p-8 text-right shadow-2xl shadow-slate-200/20">
            <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/20 rounded-full flex items-center justify-center text-blue-500 mb-6 ml-auto">
                <Activity className="w-5 h-5" />
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">التركيز</p>
            <span className="text-4xl font-black text-slate-800 dark:text-white">{stats.focusRate}%</span>
            <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full mt-6 overflow-hidden">
                <motion.div initial={{ width: 0 }} animate={{ width: `${stats.focusRate}%` }} transition={{ duration: 0.5 }} className="h-full bg-blue-500" />
            </div>
        </div>
      </div>

      <div className="flex flex-row-reverse gap-3 mb-10 overflow-x-auto no-scrollbar pb-4 px-2">
        {weekDates.map((day, idx) => (
          <button
            key={day.iso}
            onClick={() => setSelectedDayIndex(idx)}
            className={`min-w-[85px] py-6 rounded-full flex flex-col items-center justify-center gap-2 border-2 transition-all ${
              selectedDayIndex === idx 
                ? 'bg-slate-900 border-slate-900 text-white scale-110 shadow-2xl z-10'
                : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 text-slate-400 hover:border-blue-200'
            }`}
          >
            <span className="text-[10px] font-black uppercase text-blue-400 tracking-tighter">{day.name}</span>
            <span className="text-sm font-black">{day.label.split(' ')[0]}</span>
          </button>
        ))}
      </div>

      <div className="space-y-4">
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={activeTasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
        {activeTasks.map(task => (
          <SortableTask 
            key={task.id} 
            task={task} 
            onComplete={(t) => {
               setCompletingTask(t);
               setCompletionForm({ durationMet: true, goalMet: 'expected', notes: '' });
            }} 
            onUndo={undoTask}
            onDelete={deleteTask} 
            onEdit={handleEditTask} 
          />
        ))}
      </SortableContext>
    </DndContext>
      </div>

      <AnimatePresence>
        {showModal && (
           <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
             <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.5 }} className="absolute inset-0 bg-slate-950/60 backdrop-blur-md" onClick={() => setShowModal(false)} />
             <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }} transition={{ duration: 0.5, ease: "easeInOut" }} className="relative bg-white dark:bg-slate-900 rounded-[3rem] p-8 w-full max-w-sm border border-slate-100 dark:border-slate-800 shadow-2xl">
               <h3 className="text-2xl font-black text-right text-slate-900 dark:text-white mb-8">{editingTaskId ? 'تعديل المهمة' : 'مهمة جديدة'}</h3>
               <div className="space-y-6">
                 <div>
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 text-right">المهمة</label>
                   <input type="text" value={newTask.name || ''} onChange={e => setNewTask({...newTask, name: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 px-6 py-4 rounded-2xl text-right text-sm font-bold border-none outline-none" dir="rtl" />
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                   <input type="time" value={newTask.time || ''} onChange={e => setNewTask({...newTask, time: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 px-4 py-4 rounded-2xl text-center text-sm font-bold border-none outline-none" />
                   <input type="text" value={newTask.duration || ''} onChange={e => setNewTask({...newTask, duration: e.target.value})} placeholder="المدة" className="w-full bg-slate-50 dark:bg-slate-800 px-4 py-4 rounded-2xl text-center text-sm font-bold border-none outline-none" dir="rtl" />
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                   <input type="text" value={newTask.expectedGoal || ''} onChange={e => setNewTask({...newTask, expectedGoal: e.target.value})} placeholder="المتوقع" className="w-full bg-slate-50 dark:bg-slate-800 px-4 py-4 rounded-2xl text-right text-sm font-bold border-none outline-none" dir="rtl" />
                   <input type="text" value={newTask.minGoal || ''} onChange={e => setNewTask({...newTask, minGoal: e.target.value})} placeholder="الأدنى" className="w-full bg-slate-50 dark:bg-slate-800 px-4 py-4 rounded-2xl text-right text-sm font-bold border-none outline-none" dir="rtl" />
                 </div>
                 <button onClick={handleAddTask} className="w-full py-5 mt-4 bg-blue-600 text-white rounded-[2rem] font-black text-sm uppercase tracking-widest shadow-xl">حفظ المهمة</button>
               </div>
             </motion.div>
           </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {completingTask && (
           <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
             <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.5 }} className="absolute inset-0 bg-slate-950/60 backdrop-blur-md" onClick={() => setCompletingTask(null)} />
             <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }} transition={{ duration: 0.5, ease: "easeInOut" }} className="relative bg-white dark:bg-slate-900 rounded-[3rem] p-10 w-full max-w-sm border border-slate-100 dark:border-slate-800 shadow-2xl text-right">
                <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-2">إتمام المهمة</h3>
                <p className="text-xs font-bold text-slate-400 mb-8">{completingTask.name}</p>
                <div className="space-y-8">
                   <div className="flex flex-col gap-4">
                     <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">هل التزمت بالوقت؟</label>
                     <div className="flex gap-2 justify-end">
                       <button onClick={() => setCompletionForm({...completionForm, durationMet: false})} className={`px-6 py-3 rounded-xl text-xs font-black ${!completionForm.durationMet ? 'bg-red-500 text-white' : 'bg-slate-50 text-slate-400'}`}>لا</button>
                       <button onClick={() => setCompletionForm({...completionForm, durationMet: true})} className={`px-6 py-3 rounded-xl text-xs font-black ${completionForm.durationMet ? 'bg-emerald-500 text-white' : 'bg-slate-50 text-slate-400'}`}>نعم</button>
                     </div>
                   </div>
                   <div className="flex flex-col gap-4">
                     <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">مستوى الإنجاز</label>
                     <div className="grid grid-cols-3 gap-2">
                       {['none', 'min', 'expected'].map(level => (
                         <button key={level} onClick={() => setCompletionForm({...completionForm, goalMet: level as any})} className={`py-3 rounded-xl text-[10px] font-black ${completionForm.goalMet === level ? 'bg-blue-600 text-white' : 'bg-slate-50 text-slate-400'}`}>{level === 'none' ? 'لا شيء' : level === 'min' ? 'الأدنى' : 'المتوقع'}</button>
                       ))}
                     </div>
                   </div>
                   <div className="pt-6 border-t border-slate-100">
                     <button onClick={finishTask} className="w-full py-5 bg-emerald-500 text-white rounded-[2rem] font-black text-sm uppercase tracking-widest shadow-2xl">تأكيد الإنجاز 🚀</button>
                   </div>
                </div>
             </motion.div>
           </div>
        )}
      </AnimatePresence>
    </div>
  );
};

