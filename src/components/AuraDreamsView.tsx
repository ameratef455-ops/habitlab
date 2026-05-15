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
  MessageCircle
} from 'lucide-react';

interface AuraDreamsViewProps {
  onBack: () => void;
  onSaveSession: (session: any) => void;
}

export const AuraDreamsView: React.FC<AuraDreamsViewProps> = ({ onBack, onSaveSession }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [elements, setElements] = useState<any[]>([]);
  const [tool, setTool] = useState<'pencil' | 'eraser'>('pencil');
  const [color, setColor] = useState('#3b82f6');
  const [startTime] = useState(Date.now());
  const [showReflection, setShowReflection] = useState(false);
  const [reflection, setReflection] = useState('');
  const [notes, setNotes] = useState('');

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
    const session = {
      id: crypto.randomUUID(),
      type: 'dreams',
      durationMinutes,
      timestamp: new Date().toISOString(),
      reflection,
      notes,
      points: Math.min(durationMinutes * 5, 100) // Max 100 points for drawing
    };
    onSaveSession(session);
    onBack();
  };

  return (
    <div className="fixed inset-0 z-[250] bg-white dark:bg-slate-950 flex flex-col pt-12 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-8 mb-8">
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
      <div className="flex-1 relative bg-slate-50/50 dark:bg-slate-900/20">
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
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-white dark:bg-slate-900 p-2 rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800">
          <button 
            onClick={() => setTool('pencil')}
            className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${tool === 'pencil' ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20 scale-110' : 'text-slate-400 hover:bg-slate-50'}`}
          >
            <Pencil className="w-5 h-5" />
          </button>
          <button 
            onClick={() => setTool('eraser')}
            className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${tool === 'eraser' ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20 scale-110' : 'text-slate-400 hover:bg-slate-50'}`}
          >
            <Eraser className="w-5 h-5" />
          </button>
          <div className="w-px h-8 bg-slate-100 dark:bg-slate-800 mx-1" />
          {['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6'].map(c => (
            <button 
              key={c}
              onClick={() => { setColor(c); setTool('pencil'); }}
              className={`w-8 h-8 rounded-full transition-transform hover:scale-120 ${color === c && tool === 'pencil' ? 'ring-2 ring-offset-2 ring-blue-500' : ''}`}
              style={{ backgroundColor: c }}
            />
          ))}
          <div className="w-px h-8 bg-slate-100 dark:bg-slate-800 mx-1" />
          <button onClick={clearCanvas} className="w-12 h-12 rounded-2xl flex items-center justify-center text-red-400 hover:bg-red-50">
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Notes Section Overlay */}
      <div className="p-8 bg-white dark:bg-slate-950 border-t border-slate-100 dark:border-slate-900">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-4">
             <button 
              onClick={handleFinish}
              className="px-8 py-3 bg-emerald-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-emerald-500/20 hover:scale-105 transition-transform"
             >
              إرسال وتحليل الجلسة
             </button>
             <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest">محرر الخواطر ✍️</h3>
          </div>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="دَوّن هنا أي أفكار أو مشاعر طرأت على ذهنك أثناء الرسم..."
            className="w-full h-32 bg-slate-50 dark:bg-slate-900/50 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 focus:border-blue-500 outline-none text-right font-sans text-sm resize-none"
            dir="rtl"
          />
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
