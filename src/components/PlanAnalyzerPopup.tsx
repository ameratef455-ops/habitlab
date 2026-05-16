import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, X, Loader2, Download } from 'lucide-react';
import { analyzePlan, preloadModel, isModelLoaded } from '../services/aiAnalyzer';

interface PlanAnalyzerPopupProps {
  onClose: () => void;
  planData: string;
  reports: any[];
  setReports: (reports: any[]) => void;
}

export const PlanAnalyzerPopup: React.FC<PlanAnalyzerPopupProps> = ({ onClose, planData, reports, setReports }) => {
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [modelReady, setModelReady] = useState(isModelLoaded());
  const [activeTab, setActiveTab] = useState<'analyze' | 'history'>('analyze');

  const performAnalysis = async () => {
    if (!isModelLoaded()) return;
    setLoading(true);
    try {
      const res = await analyzePlan(planData);
      setReport(res);
      // Save report
      const newReport = {
        id: crypto.randomUUID(),
        date: new Date().toISOString(),
        planData,
        result: res
      };
      setReports([newReport, ...reports]);
    } catch (err) {
      console.error(err);
      setReport({ error: 'فشل في تحليل الخطة' });
    }
    setLoading(false);
  };

  const handlePreload = async () => {
    setDownloading(true);
    await preloadModel();
    setDownloading(false);
    setModelReady(true);
    performAnalysis();
  };

  React.useEffect(() => {
    if (modelReady) {
      performAnalysis();
    }
  }, [planData, modelReady]);

  return (
    <div className="fixed inset-0 z-[600] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0, y: 20 }} 
        animate={{ scale: 1, opacity: 1, y: 0 }} 
        className="bg-white dark:bg-slate-900 p-8 rounded-[3rem] w-full max-w-lg shadow-[0_20px_50px_rgba(0,0,0,0.3)] relative text-right border border-slate-100 dark:border-slate-800"
      >
        <button onClick={onClose} className="absolute top-6 left-6 p-2 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-400 hover:text-rose-500 transition-colors"><X className="w-5 h-5"/></button>
        
        <div className="flex flex-col items-center mb-8 pt-4">
          <div className="w-16 h-16 bg-blue-500/10 rounded-3xl flex items-center justify-center mb-4">
            <Sparkles className="w-8 h-8 text-blue-500" />
          </div>
          <h2 className="text-2xl font-black text-slate-800 dark:text-white">تحليل الذكاء الطبيعي 🧬</h2>
          <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest mt-1">Aura Neural Engine (BERT)</p>
        </div>
        
        {/* Tabs */}
        <div className="flex bg-slate-100 dark:bg-slate-800 rounded-full p-1 mb-8">
            <button 
                onClick={() => setActiveTab('analyze')}
                className={`flex-1 py-3 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'analyze' ? 'bg-white dark:bg-slate-700 shadow-sm' : 'text-slate-400'}`}
            >
                تحليل جديد
            </button>
            <button 
                onClick={() => setActiveTab('history')}
                className={`flex-1 py-3 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'history' ? 'bg-white dark:bg-slate-700 shadow-sm' : 'text-slate-400'}`}
            >
                تقارير سابقة ({reports.length})
            </button>
        </div>

        {activeTab === 'analyze' && (
          <>
            {!modelReady && !loading && (
              <div className="text-center mb-8 bg-blue-50 dark:bg-blue-900/20 p-6 rounded-3xl border border-blue-100 dark:border-blue-800">
                 <Download className="w-8 h-8 text-blue-500 mx-auto mb-3" />
                 <p className="text-sm font-black text-slate-800 dark:text-slate-200 mb-1">الموديل الذكي غير محمل</p>
                 <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-4">هذا سيقوم بتحميل حوالي 500 ميجابايت من البيانات للعمل دون إنترنت.</p>
                 <button 
                    onClick={handlePreload} 
                    disabled={downloading}
                    className={`px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${downloading ? 'bg-slate-100 text-slate-400 animate-pulse' : 'bg-blue-500 text-white hover:bg-blue-600'}`}
                  >
                    {downloading ? 'جاري التحميل...' : 'أوافق على تحميل الموديل'}
                  </button>
              </div>
            )}
            
            {modelReady && !loading && !report && (
              <div className="flex justify-center mb-6">
                <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest bg-emerald-50 px-4 py-1 rounded-full">الموديل جاهز</span>
              </div>
            )}
            
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-[2.5rem] p-8 border border-slate-100 dark:border-slate-700 min-h-[200px] flex flex-col items-center justify-center">
              {loading ? (
                <div className="flex flex-col items-center gap-6 py-10">
                  <Loader2 className="w-12 h-12 animate-spin text-blue-500" />
                  <div className="text-center">
                    <p className="text-sm font-black text-slate-700 dark:text-slate-200">جاري مسح الروابط العصبية لخطتك...</p>
                    <p className="text-[9px] font-bold text-slate-400 mt-2 uppercase tracking-widest">Processing offline via transformers.js</p>
                  </div>
                </div>
              ) : report?.error ? (
                <p className="text-rose-500 font-bold">{report.error}</p>
              ) : report ? (
                <div className="w-full space-y-6 text-right" dir="rtl">
                  <div className="text-right">
                    <h3 className="text-sm font-black text-slate-800 dark:text-white mb-2">الالتزام:</h3>
                    <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">{report.commitment.text}</p>
                    <div className="h-2 w-full bg-slate-200 dark:bg-slate-700 rounded-full mt-2 overflow-hidden">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${report.commitment.score * 100}%` }} className="h-full bg-blue-500" />
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <h3 className="text-sm font-black text-slate-800 dark:text-white mb-2">الكفاءة:</h3>
                    <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">{report.efficiency.text}</p>
                    <div className="h-2 w-full bg-slate-200 dark:bg-slate-700 rounded-full mt-2 overflow-hidden">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(report.efficiency.score * 10, 100)}%` }} className="h-full bg-emerald-500" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-emerald-50 dark:bg-emerald-900/20 p-4 rounded-2xl">
                      <h4 className="text-[10px] font-black text-emerald-600 mb-2 uppercase">نقاط القوة</h4>
                      <ul className="text-[10px] font-bold text-slate-700 dark:text-slate-300 space-y-1">
                        {report.strengths.map((s: string, i: number) => <li key={i}>• {s}</li>)}
                      </ul>
                    </div>
                    <div className="bg-rose-50 dark:bg-rose-900/20 p-4 rounded-2xl">
                      <h4 className="text-[10px] font-black text-rose-600 mb-2 uppercase">نقاط الضعف</h4>
                      <ul className="text-[10px] font-bold text-slate-700 dark:text-slate-300 space-y-1">
                        {report.weaknesses.map((s: string, i: number) => <li key={i}>• {s}</li>)}
                      </ul>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          </>
        )}
        
        {activeTab === 'history' && (
          <div className="bg-slate-50 dark:bg-slate-800/50 rounded-[2.5rem] p-8 border border-slate-100 dark:border-slate-700 min-h-[300px] overflow-y-auto space-y-4">
            {reports.length === 0 ? (
              <p className="text-center text-slate-400 text-sm font-black mt-20">لا توجد تقارير سابقة...</p>
            ) : (
              reports.map(r => (
                <div key={r.id} className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 flex justify-between items-center">
                   <div className="text-right">
                     <p className="text-xs font-black text-slate-800 dark:text-white">تحليل بتاريخ {new Date(r.date).toLocaleDateString()}</p>
                     <p className="text-[9px] font-bold text-slate-400">عدد النتائج: {Array.isArray(r.result) ? r.result.length : 0}</p>
                   </div>
                   <button 
                     onClick={() => { setReport(r.result); setActiveTab('analyze'); }}
                     className="px-4 py-2 bg-blue-50 rounded-lg text-[10px] font-black text-blue-500 hover:bg-blue-100 uppercase"
                   >
                     عرض
                   </button>
                </div>
              ))
            )}
          </div>
        )}

        <button 
          onClick={onClose}
          className="w-full mt-8 py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-black transition-all shadow-xl shadow-slate-900/20"
        >
          فهمت الرسالة
        </button>
      </motion.div>
    </div>
  );
};
