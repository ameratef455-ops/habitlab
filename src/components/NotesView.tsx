import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowRight, ChevronRightIcon, FileText, Plus, BookOpen, Tag, Mic, MicOff, Trash2, Edit3, Globe, Zap, Brush, LayoutGrid, Target, Square } from 'lucide-react';
import { Habit } from '../types';

interface InternalNotesProps {
  habits: Habit[];
  generalNotes: any[];
  setGeneralNotes: React.Dispatch<React.SetStateAction<any[]>>;
  updateHabit: (id: string, partial: Partial<Habit>) => void;
  requestConfirm: (title: string, description: string, icon: React.ReactNode, onConfirm: () => void) => void;
  onBack: () => void;
  focusSessions?: any[];
  dreamSessions?: any[];
  setFocusSessions?: React.Dispatch<React.SetStateAction<any[]>>;
  setDreamSessions?: React.Dispatch<React.SetStateAction<any[]>>;
}

export const NotesView: React.FC<InternalNotesProps> = ({ 
  habits, 
  generalNotes, 
  setGeneralNotes, 
  updateHabit, 
  requestConfirm, 
  onBack,
  focusSessions = [],
  dreamSessions = [],
  setFocusSessions,
  setDreamSessions
}) => {
  const [selectedHabitId, setSelectedHabitId] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<'all' | 'general' | 'skills' | 'modes'>('all');
  const [expandedNoteId, setExpandedNoteId] = useState<string | null>(null);
  
  // Compose modal state
  const [isComposing, setIsComposing] = useState(false);
  const [composeTitle, setComposeTitle] = useState('');
  const [composeSubtitle, setComposeSubtitle] = useState('');
  const [composeText, setComposeText] = useState('');
  const [composeHabitId, setComposeHabitId] = useState<string>('general');
  const [composeEditId, setComposeEditId] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isVoiceRecording, setIsVoiceRecording] = useState(false); // True audio recording
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const startVoiceRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];
      
      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        const audioUrl = URL.createObjectURL(audioBlob);
        setComposeText(prev => prev + (prev ? '\n' : '') + `[رابط الملاحظة الصوتية: ${audioUrl}]`);
      };
      
      mediaRecorderRef.current.start();
      setIsVoiceRecording(true);
    } catch (e) {
      console.error('Mic Access Error:', e);
      alert('تعذر الوصول للميكروفون.');
    }
  };

  const stopVoiceRecording = () => {
    if (mediaRecorderRef.current && isVoiceRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      setIsVoiceRecording(false);
    }
  };

  const startVoiceDictation = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("للأسف متصفحك لا يدعم تسجيل الصوت بهذه الطريقة.");
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = 'ar-EG';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    
    recognition.onstart = () => setIsRecording(true);
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setComposeText(prev => prev + (prev ? '\n' : '') + transcript);
    };
    recognition.onerror = () => setIsRecording(false);
    recognition.onend = () => setIsRecording(false);
    
    recognition.start();
  };

  const handleSaveNote = () => {
    if (!composeText.trim() || !composeHabitId) return;
    
    // For session notes, we might want to keep them as plain text if edited
    const finalContent = (composeHabitId === 'modes-focus' || composeHabitId === 'modes-dreams') 
      ? composeText 
      : JSON.stringify({ title: composeTitle, subtitle: composeSubtitle, body: composeText });
    
    if (composeEditId) {
      // Editing
      if (composeHabitId === 'general') {
        setGeneralNotes(prev => prev.map(n => n.id === composeEditId ? { ...n, text: finalContent } : n));
      } else if (composeHabitId === 'modes-focus') {
        setFocusSessions && setFocusSessions(prev => prev.map(s => s.id === composeEditId ? { ...s, note: finalContent, sessionFeedback: undefined } : s));
      } else if (composeHabitId === 'modes-dreams') {
        setDreamSessions && setDreamSessions(prev => prev.map(s => s.id === composeEditId ? { ...s, notes: finalContent, reflection: undefined } : s));
      } else {
        const habit = habits.find(h => h.id === composeHabitId);
        if (habit) {
          const updatedNotes = habit.notes?.map(n => (n as any).globalId === composeEditId ? { ...n, text: finalContent } : n) || [];
          updateHabit(habit.id, { notes: updatedNotes });
        }
      }
    } else {
      // Adding new
      const newNote = { text: finalContent, date: new Date().toISOString(), type: 'text', id: Date.now().toString(), globalId: Date.now().toString() };
      if (composeHabitId === 'general') {
        setGeneralNotes(prev => [...prev, newNote]);
      } else {
        const habit = habits.find(h => h.id === composeHabitId);
        if (habit) {
          updateHabit(habit.id, { notes: [...(habit.notes || []), newNote] });
        }
      }
    }
    
    setComposeTitle('');
    setComposeSubtitle('');
    setComposeText('');
    setComposeHabitId('general');
    setComposeEditId(null);
    setIsComposing(false);
  };

  const openEditNote = (note: any) => {
    if (note.isSession) {
      setComposeTitle('');
      setComposeSubtitle('');
      setComposeText(note.content || note.text || '');
    } else {
      try {
        const parsed = JSON.parse(note.text);
        setComposeTitle(parsed.title || '');
        setComposeSubtitle(parsed.subtitle || '');
        setComposeText(parsed.body || '');
      } catch {
        setComposeTitle('');
        setComposeSubtitle('');
        setComposeText(note.text || '');
      }
    }
    setComposeHabitId(note.habitId);
    setComposeEditId(note.globalId || note.id);
    setIsComposing(true);
  };

  const handleDeleteNote = (note: any) => {
    requestConfirm(
      'حذف الملاحظة؟',
      'هل أنت متأكد من حذف هذه الملاحظة نهائياً؟',
      <Trash2 className="w-12 h-12 text-blue-500 mb-6 mx-auto" />,
      () => {
        const targetId = note.globalId || note.id;
        if (note.habitId === 'general') {
           setGeneralNotes(prev => prev.filter(n => n.id !== targetId));
        } else if (note.habitId === 'modes-focus') {
           setFocusSessions && setFocusSessions(prev => prev.map(s => s.id === targetId ? { ...s, note: undefined, sessionFeedback: undefined } : s));
        } else if (note.habitId === 'modes-dreams') {
           setDreamSessions && setDreamSessions(prev => prev.map(s => s.id === targetId ? { ...s, notes: undefined, reflection: undefined, canvasImage: undefined } : s));
        } else {
           const habit = habits.find(h => h.id === note.habitId);
           if (habit) {
              updateHabit(habit.id, { notes: habit.notes?.filter((n: any) => (n.globalId || n.id) !== targetId) || [] });
           }
        }
      }
    );
  };

  const allHabitNotes = habits.flatMap(h => 
    (h.notes || []).map((n: any) => ({ ...n, habitId: h.id, habitName: h.name, globalId: n.globalId || n.id }))
  );
  
  const allGeneralNotes = generalNotes.map(n => ({ ...n, habitId: 'general', habitName: 'عامة', globalId: n.id }));
  
  const focusNotes = focusSessions.filter(s => s.note || s.sessionFeedback).map(s => ({
    id: s.id,
    globalId: s.id,
    date: s.endTime || s.timestamp,
    text: s.note ? `[جلسة تركيز: ${s.task}]\n${s.note}${s.sessionFeedback ? `\n\nتغذية راجعة: ${s.sessionFeedback}` : ''}` : `[جلسة تركيز: ${s.task}] ${s.sessionFeedback}`,
    content: s.note ? `${s.note}${s.sessionFeedback ? `\n\nتغذية راجعة: ${s.sessionFeedback}` : ''}` : s.sessionFeedback,
    habitId: 'modes-focus',
    habitName: `Focus: ${s.task}`,
    type: 'text',
    isSession: true
  }));

  const dreamNotes = dreamSessions.filter(s => s.notes || s.reflection || s.canvasImage).map(s => ({
    id: s.id,
    globalId: s.id,
    date: s.timestamp,
    text: s.notes ? `[جلسة أحلام]\n${s.notes}${s.reflection ? `\n\nتأمل: ${s.reflection}` : ''}` : `[جلسة أحلام] ${s.reflection}`,
    content: s.notes ? `${s.notes}${s.reflection ? `\n\nتأمل: ${s.reflection}` : ''}` : s.reflection,
    habitId: 'modes-dreams',
    habitName: 'Aura Dreams',
    type: 'text',
    isSession: true,
    canvasImage: s.canvasImage
  }));

  const allNotes = [...allHabitNotes, ...allGeneralNotes, ...focusNotes, ...dreamNotes].sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime());

  const filteredBySource = selectedHabitId 
    ? allNotes.filter(n => n.habitId === selectedHabitId) 
    : allNotes;

  const displayedNotes = filteredBySource.filter(n => {
    if (filterType === 'all') return true;
    if (filterType === 'general') return n.habitId === 'general';
    if (filterType === 'skills') return !n.habitId.startsWith('modes') && n.habitId !== 'general';
    if (filterType === 'focus') return n.habitId === 'modes-focus';
    if (filterType === 'dreams') return n.habitId === 'modes-dreams';
    return true;
  });

  return (
    <div className="relative pt-6 min-h-[70vh] font-sans">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-6 mb-12">
        <div className="flex items-center gap-2 order-2 sm:order-1 flex-wrap justify-end sm:justify-start">
          <button onClick={() => setFilterType('all')} className={`px-4 py-2 rounded-full text-[10px] font-black transition-all flex items-center gap-1.5 ${filterType === 'all' ? 'bg-slate-900 text-white shadow-lg' : 'bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-slate-400'}`}>
            <LayoutGrid className="w-3 h-3" />
            الكل
          </button>
          <button onClick={() => setFilterType('general')} className={`px-4 py-2 rounded-full text-[10px] font-black transition-all flex items-center gap-1.5 ${filterType === 'general' ? 'bg-slate-900 text-white shadow-lg' : 'bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-slate-400'}`}>
            <Globe className="w-3 h-3" />
            عامة
          </button>
          <button onClick={() => setFilterType('skills')} className={`px-4 py-2 rounded-full text-[10px] font-black transition-all flex items-center gap-1.5 ${filterType === 'skills' ? 'bg-slate-900 text-white shadow-lg' : 'bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-slate-400'}`}>
            <Target className="w-3 h-3" />
            مهارات
          </button>
          <button onClick={() => setFilterType('focus')} className={`px-4 py-2 rounded-full text-[10px] font-black transition-all flex items-center gap-1.5 ${filterType === 'focus' ? 'bg-blue-600 text-white shadow-lg' : 'bg-blue-50 dark:bg-blue-900/20 text-blue-500'}`}>
            <Zap className="w-3 h-3" />
            Focus
          </button>
          <button onClick={() => setFilterType('dreams')} className={`px-4 py-2 rounded-full text-[10px] font-black transition-all flex items-center gap-1.5 ${filterType === 'dreams' ? 'bg-purple-600 text-white shadow-lg' : 'bg-purple-50 dark:bg-purple-900/20 text-purple-500'}`}>
            <Brush className="w-3 h-3" />
            Dreams
          </button>
        </div>
        
        <div className="flex items-center gap-4 order-1 sm:order-2">
          <div className="text-right">
             <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">ملاحظات Aura Hub</h2>
             <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest mt-1">Intelligence Database</p>
          </div>
          <button 
            onClick={onBack}
            className="w-12 h-12 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400 hover:bg-slate-100 transition-colors"
          >
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="flex flex-row-reverse gap-3 mb-12 overflow-x-auto no-scrollbar pb-2">
        <button 
          onClick={() => setSelectedHabitId(null)}
          className={`flex-shrink-0 px-6 py-4 rounded-full border-2 transition-all font-black text-xs ${!selectedHabitId ? 'bg-slate-900 border-slate-900 text-white' : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 text-slate-400'}`}
        >
          كل المصادر
        </button>
        {habits.map(h => (
          <button 
            key={h.id}
            onClick={() => setSelectedHabitId(h.id)}
            className={`flex-shrink-0 px-6 py-4 rounded-full border-2 transition-all font-black text-xs flex items-center gap-2 ${selectedHabitId === h.id ? 'bg-slate-900 border-slate-900 text-white' : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 text-slate-400'}`}
          >
            <span className="opacity-50">{h.icon}</span>
            {h.name}
          </button>
        ))}
      </div>

      <div className="flex justify-start mb-8">
        <button 
          onClick={() => {
            setComposeTitle('');
            setComposeSubtitle('');
            setComposeText('');
            setComposeHabitId('general');
            setComposeEditId(null);
            setIsComposing(true);
          }}
          className="flex items-center gap-2 px-8 py-4 bg-blue-600 text-white rounded-full text-sm font-black shadow-2xl shadow-blue-500/30 hover:scale-105 active:scale-95 transition-all"
        >
          <Plus className="w-5 h-5" />
          إضافة ملاحظة فكرية
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pb-32">
        <AnimatePresence mode="popLayout">
               {displayedNotes.map((note, idx) => {
                 const isExpanded = expandedNoteId === note.globalId;
                 let displayTitle = '';
                 let displaySubtitle = '';
                 let displayBody = note.content || note.text;

                 if (!note.isSession) {
                   try {
                     const parsed = JSON.parse(note.text);
                     displayTitle = parsed.title || '';
                     displaySubtitle = parsed.subtitle || '';
                     displayBody = parsed.body || '';
                   } catch {
                     // Not JSON
                   }
                 }

                 return (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.5, ease: "backOut", delay: idx * 0.05 }}
                    key={`${note.globalId || idx}`} 
                    layout
                    onClick={() => setExpandedNoteId(isExpanded ? null : (note.globalId || idx.toString()))}
                    className={`p-10 bg-white dark:bg-slate-900 rounded-[4.5rem] text-right border border-slate-50 dark:border-slate-800 shadow-2xl shadow-slate-200/20 dark:shadow-none group relative overflow-hidden flex flex-col justify-between transition-all cursor-pointer ${isExpanded ? 'min-h-[350px] row-span-2' : 'aspect-square'}`}
                  >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl" />
                    
                    <div>
                      <div className="flex items-center justify-between mb-6 flex-row-reverse">
                         <div className="flex flex-col items-end">
                            <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest">{note.habitName}</span>
                            <span className="text-[10px] font-bold text-slate-400">{new Date(note.date).toLocaleDateString('ar-EG', { day: 'numeric', month: 'long' })}</span>
                         </div>
                         <div className="flex gap-2">
                           <div className="flex gap-2 opacity-100 sm:opacity-60 group-hover:opacity-100 transition-opacity">
                              <button 
                                onClick={(e) => { e.stopPropagation(); openEditNote(note); }} 
                                className="w-8 h-8 rounded-full flex items-center justify-center transition-all bg-blue-500 text-white hover:scale-110 active:scale-90 shadow-md"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button 
                                onClick={(e) => { e.stopPropagation(); handleDeleteNote(note); }} 
                                className="w-8 h-8 rounded-full flex items-center justify-center transition-all bg-rose-500 text-white hover:scale-110 active:scale-90 shadow-md"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                           </div>
                           <ChevronRightIcon className={`w-5 h-5 text-slate-300 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                         </div>
                      </div>
                      
                      <div className={`overflow-y-auto no-scrollbar transition-all ${isExpanded ? 'max-h-full' : 'max-h-[100px]'}`}>
                         <AnimatePresence>
                           {isExpanded ? (
                             <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}>
                               {displayTitle && <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2">{displayTitle}</h3>}
                               {displaySubtitle && <h4 className="text-sm font-black text-blue-500 mb-4">{displaySubtitle}</h4>}
                               
                               {note.canvasImage && (
                                 <div className="mb-6 rounded-[2rem] overflow-hidden border border-slate-100 bg-slate-50 relative aspect-video flex-shrink-0">
                                   <img src={note.canvasImage} className="w-full h-full object-contain" alt="رسمة Aura Dreams" />
                                 </div>
                               )}
                               
                               <p className="text-sm font-bold text-slate-700 dark:text-slate-200 leading-relaxed whitespace-pre-wrap">{displayBody}</p>
                             </motion.div>
                           ) : (
                             <div className="flex flex-col items-center justify-center py-4 text-slate-300">
                               <FileText className="w-8 h-8 mb-2 opacity-20" />
                               <span className="text-[10px] font-black uppercase tracking-widest">اضغط لعرض الملاحظة</span>
                             </div>
                           )}
                         </AnimatePresence>
                      </div>
                    </div>

                    <div className="mt-8 flex items-center justify-between flex-row-reverse border-t border-slate-50 dark:border-slate-800 pt-6">
                       <div className="flex items-center gap-2">
                         <Tag className="w-3 h-3 text-slate-300" />
                         <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{note.type === 'voice' ? 'صوتي' : 'مكتوب'}</span>
                       </div>
                       {note.recovery && <span className="px-3 py-1 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 rounded-full text-[9px] font-black uppercase tracking-widest">تعافي</span>}
                    </div>
                  </motion.div>
                 );
               })}
        </AnimatePresence>
      </div>

      {isComposing && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsComposing(false)} />
            <motion.div 
            initial={{ scale: 0.95, opacity: 0 }} 
            animate={{ scale: 1, opacity: 1 }} 
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
            className="relative bg-white dark:bg-slate-900 rounded-[2rem] p-6 w-full max-w-sm border border-slate-100 dark:border-slate-800 shadow-2xl"
          >
            <h3 className="text-xl font-black text-right text-slate-800 dark:text-white mb-6">{composeEditId ? 'تعديل ملاحظة' : 'ملاحظة جديدة'}</h3>
            
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 text-right">الارتباط (التصنيف)</label>
                <select 
                  value={composeHabitId}
                  onChange={(e) => setComposeHabitId(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 px-4 py-3 rounded-xl text-right text-sm font-bold border border-transparent outline-none focus:border-blue-200 text-slate-800 dark:text-slate-100"
                  dir="rtl"
                >
                  <option value="general">ملاحظة عامة 🌍</option>
                  <optgroup label="المهارات المسجلة">
                    {habits.map(h => (
                      <option key={h.id} value={h.id}>{h.name}</option>
                    ))}
                  </optgroup>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1 text-right">العنوان الأساسي (اختياري)</label>
                <input 
                  type="text"
                  value={composeTitle}
                  onChange={(e) => setComposeTitle(e.target.value)}
                  placeholder="مثال: Cranial Nerves"
                  className="w-full bg-slate-50 dark:bg-slate-800 px-4 py-2.5 rounded-xl text-right text-lg font-serif font-bold text-slate-900 dark:text-white border border-transparent outline-none focus:border-blue-200"
                  dir="rtl"
                />
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1 text-right">عنوان فرعي (اختياري)</label>
                <input 
                  type="text"
                  value={composeSubtitle}
                  onChange={(e) => setComposeSubtitle(e.target.value)}
                  placeholder="مثال: Functions & Origins"
                  className="w-full bg-slate-50 dark:bg-slate-800 px-4 py-2 rounded-xl text-right text-sm font-note font-medium text-slate-800 dark:text-slate-200 border border-transparent outline-none focus:border-blue-200"
                  dir="rtl"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                   <div className="flex gap-2">
                     <button 
                       onClick={isVoiceRecording ? stopVoiceRecording : startVoiceRecording} 
                       className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${isVoiceRecording ? 'bg-red-500 text-white animate-pulse shadow-[0_0_15px_rgba(239,68,68,0.5)]' : 'bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-blue-500'}`}
                       title="تسجيل صوتي (ملف)"
                     >
                       {isVoiceRecording ? <Square className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                     </button>
                     <button 
                       onClick={startVoiceDictation} 
                       disabled={isRecording || isVoiceRecording}
                       className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${isRecording ? 'bg-blue-500 text-white animate-pulse shadow-[0_0_15px_rgba(59,130,246,0.5)]' : 'bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-blue-500'}`}
                       title="تحويل الصوت لنص"
                     >
                       <MicOff className="w-4 h-4" />
                     </button>
                   </div>
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">التفاصيل</label>
                </div>
                <textarea 
                  value={composeText}
                  onChange={(e) => setComposeText(e.target.value)}
                  placeholder="دوّن ملاحظاتك..."
                  className="w-full bg-slate-50 dark:bg-slate-800 px-4 py-3 rounded-xl text-right text-sm font-note text-slate-700 dark:text-slate-300 border border-transparent outline-none resize-none focus:border-blue-200 h-28"
                  dir="rtl"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button 
                  onClick={() => setIsComposing(false)}
                  className="flex-1 py-3 px-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl font-black text-sm hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                >
                  إلغاء
                </button>
                <button 
                  onClick={handleSaveNote}
                  disabled={!composeText.trim() || !composeHabitId}
                  className="flex-1 py-3 px-4 bg-blue-500 text-white rounded-xl font-black text-sm hover:border-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/20"
                >
                  حفظ
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};
