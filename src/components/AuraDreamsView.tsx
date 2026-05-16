import React, { useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import rough from 'roughjs';
import { 
  ArrowRight, 
  Trash2, 
  Download, 
  Eraser, 
  Pencil, 
  CheckCircle2, 
  HelpCircle,
  Save,
  MessageCircle,
  Plus,
  RotateCcw,
  Mic,
  Square
} from 'lucide-react';
import * as LucideIcons from 'lucide-react';

interface AuraDreamsViewProps {
  onBack: () => void;
  onSaveSession: (session: any) => void;
}

export const AuraDreamsView: React.FC<AuraDreamsViewProps> = ({ onBack, onSaveSession }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [elements, setElements] = useState<any[]>([]);
  const [tool, setTool] = useState<'pencil' | 'eraser'>('pencil');
  
  const undo = () => {
    if (elements.length === 0) return;
    setElements(prev => prev.slice(0, -1));
  };
  const [color, setColor] = useState('#3b82f6');
  const [startTime] = useState(Date.now());
  const [showReflection, setShowReflection] = useState(false);
  const [reflection, setReflection] = useState('');
  const [notesList, setNotesList] = useState<{id: string, text: string}[]>([]);
  const [currentNote, setCurrentNote] = useState('');
  const [showNotesDrawer, setShowNotesDrawer] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
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
        setNotesList([{ id: crypto.randomUUID(), text: `ملاحظة صوتية: ${audioUrl}` }, ...notesList]);
      };
      
      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (e) {
      console.error('Error starting recording:', e);
      alert('تعذر الوصول إلى الميكروفون.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
    }
  };

  const handleAddNote = () => {
    if (!currentNote.trim()) return;
    setNotesList([{ id: crypto.randomUUID(), text: currentNote }, ...notesList]);
    setCurrentNote('');
  };

  const handleEditNote = (id: string, newText: string) => {
    setNotesList(notesList.map(n => n.id === id ? { ...n, text: newText } : n));
  };

  const handleDeleteNote = (id: string) => {
    setNotesList(notesList.filter(n => n.id !== id));
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size to full window but within container bounds
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight * 0.6;
      drawElements();
    };

    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    return () => window.removeEventListener('resize', resizeCanvas);
  }, []);

  const drawElements = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rc = rough.canvas(canvas);
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    elements.forEach(element => {
      if (element.type === 'pencil' || element.type === 'eraser') {
        ctx.beginPath();
        ctx.moveTo(element.points[0].x, element.points[0].y);
        element.points.forEach((p: any) => ctx.lineTo(p.x, p.y));
        ctx.strokeStyle = element.type === 'eraser' ? '#ffffff' : element.color;
        ctx.lineWidth = element.type === 'eraser' ? 20 : 2;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.stroke();
      }
    });
  };

  useEffect(() => {
    drawElements();
  }, [elements]);

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDrawing(true);
    const pos = getPos(e);
    const newElement = {
      type: tool,
      points: [pos],
      color: tool === 'eraser' ? '#ffffff' : color
    };
    setElements(prev => [...prev, newElement]);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    const pos = getPos(e);
    setElements(prev => {
      const next = [...prev];
      const last = next[next.length - 1];
      last.points.push(pos);
      return next;
    });
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const getPos = (e: any) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX || (e.touches && e.touches[0].clientX)) - rect.left;
    const y = (e.clientY || (e.touches && e.touches[0].clientY)) - rect.top;
    return { x, y };
  };

  const clearCanvas = () => {
    if (window.confirm('هل أنت متأكد من مسح اللوحة؟')) {
      setElements([]);
    }
  };

  const handleFinish = () => {
    setShowReflection(true);
  };

  const saveAndExit = () => {
    const durationMinutes = Math.round((Date.now() - startTime) / 60000);
    const canvas = canvasRef.current;
    const canvasImage = canvas ? canvas.toDataURL('image/png') : undefined;

    const session = {
      id: crypto.randomUUID(),
      type: 'dreams',
      durationMinutes,
      timestamp: new Date().toISOString(),
      reflection,
      notes: notesList.map(n => n.text).join('\n---\n') + (currentNote.trim() ? `\n---\n${currentNote}` : ''),
      canvasImage,
      points: Math.min(durationMinutes * 5, 100) // Max 100 points for drawing
    };
    onSaveSession(session);
    onBack();
  };

  return (
    <div className="fixed inset-0 z-[250] bg-white dark:bg-slate-950 flex flex-col pt-12 overflow-y-auto no-scrollbar pb-32">
      {/* Header */}
      <div className="flex items-center justify-between px-8 mb-8 flex-shrink-0">
        <button 
          onClick={onBack}
          className="w-12 h-12 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-full flex items-center justify-center text-slate-400 hover:text-blue-500 transition-colors"
        >
          <ArrowRight className="w-5 h-5" />
        </button>
        <div className="text-right">
          <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100">Aura Dreams 🌌</h2>
          <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest mt-1">Creative Unconscious</p>
        </div>
      </div>

      {/* Main Canvas Area */}
      <div className="relative min-h-[400px] bg-slate-50/50 dark:bg-slate-900/20 mb-8 mx-6 rounded-[3rem] border border-slate-100 dark:border-slate-800 overflow-hidden shadow-inner">
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          className="w-full h-full cursor-crosshair touch-none"
        />

        {/* Toolbar */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md p-3 rounded-[2.5rem] shadow-2xl border border-slate-100 dark:border-slate-800">
          <div className="flex flex-col items-center gap-1">
            <button 
              onClick={() => setTool('pencil')}
              className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all ${tool === 'pencil' ? 'bg-blue-500 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'}`}
            >
              <Pencil className="w-4 h-4" />
            </button>
          </div>

          <div className="flex flex-col items-center gap-1">
            <button 
              onClick={() => setTool('eraser')}
              className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all ${tool === 'eraser' ? 'bg-blue-500 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'}`}
            >
              <Eraser className="w-4 h-4" />
            </button>
          </div>

          <div className="w-px h-8 bg-slate-100 dark:bg-slate-800 mx-1" />
          
          <button 
            onClick={undo}
            className="w-10 h-10 rounded-2xl flex items-center justify-center text-slate-400 hover:bg-blue-50 hover:text-blue-500"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <div className="w-px h-8 bg-slate-100 dark:bg-slate-800 mx-1" />

          {['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6'].map(c => (
            <button 
              key={c}
              onClick={() => { setColor(c); setTool('pencil'); }}
              className={`w-6 h-6 rounded-full transition-transform hover:scale-125 ${color === c && tool === 'pencil' ? 'ring-2 ring-blue-500 ring-offset-2' : ''}`}
              style={{ backgroundColor: c }}
            />
          ))}
          
          <div className="w-px h-8 bg-slate-100 dark:bg-slate-800 mx-1" />
          
          <button onClick={clearCanvas} className="w-10 h-10 rounded-2xl flex items-center justify-center text-rose-500 hover:bg-rose-50 transition-all">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Notes Section Overlay */}
      <div className="px-8 pb-12">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center justify-between mb-8">
             <button 
              onClick={handleFinish}
              className="px-8 py-4 bg-emerald-500 text-white rounded-[2rem] font-black text-xs uppercase tracking-widest shadow-2xl hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
             >
              <CheckCircle2 className="w-4 h-4" />
              إرسال وتحليل الجلسة
             </button>
             <div className="text-right">
                <h3 className="text-xl font-black text-slate-800 dark:text-white">سجل الخواطر ✍️</h3>
                <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mt-1">Flow of thoughts</p>
             </div>
          </div>

          <div className="space-y-6">
            <div className="flex flex-col gap-4">
              <AnimatePresence>
                {notesList.map(n => (
                  <motion.div key={n.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.8 }} className="group relative bg-white dark:bg-slate-800 p-6 rounded-[2.5rem] border border-slate-100 dark:border-slate-700 shadow-sm">
                    <textarea 
                      value={n.text}
                      onChange={(e) => handleEditNote(n.id, e.target.value)}
                      className="bg-transparent border-none outline-none resize-none w-full text-sm font-bold text-slate-700 dark:text-slate-200 min-h-[60px]"
                      dir="rtl"
                      placeholder="..."
                    />
                    <button onClick={() => handleDeleteNote(n.id)} className="absolute top-4 left-4 w-9 h-9 rounded-full bg-rose-50 dark:bg-rose-900/20 text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center hover:bg-rose-600 hover:text-white">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            <div className="p-2 bg-white dark:bg-slate-800 rounded-[3rem] border border-slate-100 dark:border-slate-700 shadow-xl ring-emerald-500/10 focus-within:ring-4 transition-all">
                <div className="flex items-end gap-2 p-1">
                  <div className="flex-1 relative">
                    <textarea
                      value={currentNote}
                      onChange={(e) => setCurrentNote(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAddNote(); } }}
                      placeholder="اكتب هنا أي فكرة أو صورة طرأت على ذهنك... (Enter للحفظ)"
                      className="w-full min-h-[120px] p-6 pb-16 bg-slate-50 dark:bg-slate-900/50 rounded-[2.5rem] border-none outline-none text-right font-sans text-sm resize-none text-slate-800 dark:text-slate-100"
                      dir="rtl"
                    />
                    <button 
                      onClick={isRecording ? stopRecording : startRecording}
                      className={`absolute bottom-4 right-4 w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${isRecording ? 'bg-rose-500 text-white animate-pulse' : 'bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-emerald-500'}`}
                      title="تسجيل صوتي"
                    >
                      {isRecording ? <Square className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                    </button>
                  </div>
                  <button onClick={handleAddNote} className="w-16 h-16 rounded-[2.2rem] bg-emerald-500 text-white flex items-center justify-center shadow-lg hover:bg-emerald-600 transition-all active:scale-95 flex-shrink-0 group">
                    <Plus className="w-8 h-8 group-hover:rotate-90 transition-transform" />
                  </button>
                </div>
            </div>
          </div>
        </div>
      </div>


      {/* Reflection Modal */}
      <AnimatePresence>
        {showReflection && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-xl"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative bg-white dark:bg-slate-900 rounded-[3rem] p-10 w-full max-w-md border border-slate-100 dark:border-slate-800 shadow-2xl text-right"
            >
              <div className="w-20 h-20 bg-blue-50 dark:bg-blue-900/20 rounded-full flex items-center justify-center mb-8 mx-auto">
                <HelpCircle className="w-10 h-10 text-blue-500" />
              </div>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-4">إلى ماذا وصلت اليوم؟</h3>
              <p className="text-sm font-bold text-slate-500 mb-8 leading-relaxed">
                في Aura Dreams، الرسم والكتابة الحرة هما مفتاح لعقلك الباطن. كيف تصف حالتك الآن بعد هذه الجلسة؟
              </p>
              
              <textarea 
                value={reflection}
                onChange={(e) => setReflection(e.target.value)}
                placeholder="أشعر بوضوح أكثر... خلصت من فكرة كانت شاغلة بالي..."
                className="w-full h-32 bg-slate-50 dark:bg-slate-800 rounded-3xl p-6 mb-8 text-right text-sm font-bold border border-transparent focus:border-blue-500 outline-none resize-none"
                dir="rtl"
              />

              <div className="flex gap-4">
                <button 
                  onClick={() => setShowReflection(false)}
                  className="flex-1 py-4 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-2xl font-black text-xs uppercase tracking-widest"
                >
                  تعديل
                </button>
                <button 
                  onClick={saveAndExit}
                  className="flex-[2] py-4 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-500/30"
                >
                  حفظ في السجل
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
