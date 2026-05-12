import React, { useState, useMemo } from "react";
import {
  TrendingUp,
  Award,
  Calendar,
  Sparkles,
  Target,
  CheckCircle,
  Flame,
  Info,
  X,
  TrendingDown,
  Clock,
  PieChart as PieIcon,
  Zap,
} from "lucide-react";
import * as LucideIcons from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Habit } from "../types";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  PieChart,
  Pie,
  Legend,
} from "recharts";

const COLORS = [
  "#6366f1",
  "#a855f7",
  "#ec4899",
  "#f43f5e",
  "#ef4444",
  "#f59e0b",
  "#10b981",
  "#06b6d4",
];

interface AnalysisViewProps {
  habits: Habit[];
  points: number;
  userLevel: number;
  userTitle: string;
}

export const AnalysisView: React.FC<AnalysisViewProps> = ({
  habits,
  points,
  userLevel,
  userTitle,
}) => {
  const [showInfo, setShowInfo] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<
    "chart" | "achievements" | "averages"
  >("chart");

  // Calculate Average Focus Score
  const averageFocusScore = useMemo(() => {
    let totalFocus = 0;
    let focusCount = 0;
    habits.forEach((h) => {
      h.notes?.forEach((n) => {
        if (n.focus) {
          totalFocus += n.focus;
          focusCount++;
        }
      });
    });
    return focusCount > 0 ? (totalFocus / focusCount).toFixed(1) : "0.0";
  }, [habits]);

  const detailedFocusCounts = useMemo(() => {
    const counts = [1, 2, 3, 4, 5].map((lvl) => {
      const instances: { day: string; habit: string }[] = [];
      habits.forEach((h) => {
        h.notes?.forEach((n) => {
          if (n.focus === lvl) instances.push({ day: n.date, habit: h.name });
        });
      });
      return {
        lvl: `مستوى ${lvl}`,
        count: instances.length,
        instances: instances.slice(0, 5),
      };
    });
    return counts;
  }, [habits]);

  const detailedOnTimeInstances = useMemo(() => {
    const instances: { day: string; habit: string }[] = [];
    habits.forEach((h) => {
      h.notes?.forEach((n) => {
        if (n.onTime) instances.push({ day: n.date, habit: h.name });
      });
    });
    return instances;
  }, [habits]);

  const achievementsByDay = useMemo(() => {
    const dailyLogs: Record<
      string,
      { date: string; entries: { habit: string; details: any }[] }
    > = {};

    habits.forEach((h) => {
      h.notes?.forEach((n) => {
        if (!dailyLogs[n.date]) {
          dailyLogs[n.date] = { date: n.date, entries: [] };
        }
        dailyLogs[n.date].entries.push({
          habit: h.name,
          details: n,
        });
      });
    });

    return Object.values(dailyLogs).sort((a, b) =>
      b.date.localeCompare(a.date),
    );
  }, [habits]);

  const timeAdherenceStats = useMemo(() => {
    let met = 0;
    let total = 0;
    const habitStats: { name: string; avgActual: number; expected: number }[] =
      [];

    habits.forEach((h) => {
      let hTotal = 0;
      let hCount = 0;
      const expected = parseInt(h.duration || "0") || 0;

      h.notes?.forEach((n) => {
        if (n.onExpectedTime !== undefined) {
          total++;
          if (n.onExpectedTime) met++;

          if (n.actualTime) {
            const actual = parseInt(n.actualTime) || 0;
            hTotal += actual;
            hCount++;
          }
        }
      });

      if (hCount > 0) {
        habitStats.push({
          name: h.name,
          avgActual: Math.round(hTotal / hCount),
          expected,
        });
      }
    });

    return {
      percentage: total > 0 ? Math.round((met / total) * 100) : 0,
      habitStats,
    };
  }, [habits]);

  const lineData = useMemo(() => {
    const days = 14;
    const data = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dStr = d.toISOString().split("T")[0];
      const count = habits.filter((h) =>
        h.completedDates.includes(dStr),
      ).length;
      data.push({
        name: dStr,
        weekday: d.toLocaleDateString("ar-EG", { weekday: "short" }),
        count,
      });
    }
    return data;
  }, [habits]);

  const totalCompletions = habits.reduce(
    (acc, h) => acc + h.completedDates.length,
    0,
  );

  return (
    <div className="space-y-12 pb-20">
      <div className="flex items-center justify-between px-2">
        <button
          onClick={() => setShowInfo(true)}
          className="flex items-center gap-2 px-4 py-2 bg-white rounded-full border border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:border-indigo-200 transition-all shadow-md btn-hover-scale"
        >
          <Info className="w-4 h-4 text-indigo-500" />
          كيف تُحسب هذه الأرقام؟
        </button>
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-black text-slate-800">تحليلات الأداء</h2>
          <div className="w-10 h-10 rounded-2xl bg-slate-900 flex items-center justify-center text-white">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Sub Tabs Navigation */}
      <div className="flex bg-slate-100 p-1 rounded-2xl">
        {[
          { id: "chart", label: "الإحصائيات" },
          { id: "achievements", label: "الإنجازات" },
          { id: "averages", label: "ملخص العادات" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() =>
              setActiveSubTab(tab.id as "chart" | "achievements" | "averages")
            }
            className={`flex-1 py-3 text-xs font-black rounded-xl transition-all relative ${
              activeSubTab === tab.id
                ? "text-indigo-600 shadow-md bg-white"
                : "text-slate-400 hover:text-slate-600"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeSubTab === "averages" && (
        <div className="grid grid-cols-1 gap-4 text-right">
          <div className="flex items-center justify-end gap-2 mb-2 px-2">
            <h3 className="text-sm font-black uppercase tracking-widest text-slate-400">
              ملخص العادات النشطة
            </h3>
            <Target className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {habits.map((habit, hIdx) => (
              <div
                key={`summary-${habit.id}-${hIdx}`}
                className="p-5 rounded-[2rem] bg-white border border-slate-100 shadow-md hover:shadow-lg transition-all group overflow-hidden relative"
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-50 rounded-full blur-3xl -translate-y-12 translate-x-12 opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="flex items-start justify-between relative z-10">
                  <div className="flex items-center gap-3 flex-row-reverse">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center text-white shadow-sm ${habit.color || "bg-indigo-500"}`}
                    >
                      {React.createElement(
                        (LucideIcons as any)[habit.icon] || LucideIcons.Target,
                        { className: "w-4 h-4" },
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-black text-slate-800">
                        {habit.name}
                      </p>
                      <p className="text-[9px] font-bold text-indigo-500 uppercase tracking-widest">
                        {habit.category}
                      </p>
                    </div>
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-black text-indigo-600 font-mono tracking-tighter">
                      {habit.streak}d Streak
                    </p>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-slate-50 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-black text-slate-400 uppercase">
                      الهدف القريب
                    </span>
                    <span className="text-[9px] font-bold text-slate-600">
                      {habit.nearGoal.target} {habit.nearGoal.frequency}
                    </span>
                  </div>
                  {habit.awayGoal.description && (
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-black text-purple-400 uppercase">
                        الهدف البعيد
                      </span>
                      <span className="text-[9px] font-bold text-slate-500 truncate max-w-[150px]">
                        {habit.awayGoal.description}
                      </span>
                    </div>
                  )}
                  <div className="flex gap-1.5 mt-2 flex-wrap justify-end">
                    <span className="px-1.5 py-0.5 rounded-md bg-slate-50 text-[8px] font-black text-slate-400 uppercase">
                      Min: {habit.minGoal}
                    </span>
                    {habit.replacingHabit && (
                      <span className="px-1.5 py-0.5 rounded-md bg-rose-50 text-[8px] font-black text-rose-400 uppercase">
                        Anti: {habit.replacingHabit}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <AnimatePresence>
        {showInfo && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
              onClick={() => setShowInfo(false)}
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-lg bg-white rounded-[2.5rem] p-10 shadow-2xl text-right overflow-hidden border border-indigo-50"
            >
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500" />

              <div className="flex items-center justify-between mb-8">
                <button
                  onClick={() => setShowInfo(false)}
                  className="p-2 hover:bg-slate-50 rounded-full transition-colors text-slate-400 btn-hover-scale"
                >
                  <X className="w-5 h-5" />
                </button>
                <h3 className="text-xl font-black text-slate-800">
                  دليل المختبر
                </h3>
              </div>

              <div className="space-y-8">
                <section>
                  <div className="flex items-center gap-2 mb-2 justify-end text-emerald-500">
                    <span className="text-[10px] font-black uppercase tracking-widest">
                      تحليلات الأداء
                    </span>
                    <CheckCircle className="w-4 h-4" />
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed font-bold">
                    بناءً على طلبك، المختبر الآن يتتبع أرقامك بدقة. نركز على عدد
                    مرات الالتزام الفعلي ومستويات التركيز العالية!
                  </p>
                </section>
                <section className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
                  <div className="flex items-center gap-2 mb-3 justify-end text-slate-800">
                    <span className="text-[10px] font-black uppercase tracking-widest">
                      معادلة النقاط
                    </span>
                    <Award className="w-4 h-4" />
                  </div>
                  <ul className="text-[10px] text-slate-600 space-y-2 font-bold text-right">
                    <li>• الإنجاز العادي = ١٠ نقاط</li>
                    <li>• الإتمام السريع = ١٠ نقاط فقط</li>
                    <li>• التزام + تركيز كامل (Elite) = ٢٠ نقطة</li>
                    <li>• بونص الاستمرارية = +٥ نقاط لكل يوم (بحد أقصى ٣٠)</li>
                    <li>• وضع الاستعادة (P-Mode) = ضعف النقاط 🔥</li>
                  </ul>
                </section>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {activeSubTab === "chart" && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-8 text-right">
            {/* Unified Focus and Commitment Panel */}
            <div className="p-5 sm:p-8 rounded-[2.5rem] bg-indigo-50 border border-indigo-100 text-right shadow-inner flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <Sparkles className="w-6 h-6 text-indigo-500" />
                  <h3 className="text-sm font-black uppercase tracking-widest text-indigo-400">
                    متوسط التركيز العام
                  </h3>
                </div>
                <div className="flex items-baseline justify-end gap-2 mb-8">
                  <span className="text-5xl font-black text-indigo-600">
                    {averageFocusScore}
                  </span>
                  <span className="text-sm font-bold text-indigo-400">/ 5.0</span>
                </div>
              </div>

              <div className="border-t border-indigo-100 pt-6">
                <div className="flex items-center justify-between mb-4 text-right">
                  <CheckCircle className="w-5 h-5 text-emerald-500" />
                  <h3 className="text-xs font-black uppercase tracking-widest text-indigo-400">
                    سجل الالتزام بالمواعيد ({detailedOnTimeInstances.length} مرة)
                  </h3>
                </div>
                <div className="space-y-2 mt-4">
                  {detailedOnTimeInstances
                    .slice()
                    .reverse()
                    .slice(0, 3)
                    .map((inst, i) => (
                      <div
                        key={`ontime-v2-${inst.day}-${inst.habit}-${i}`}
                        className="flex justify-between items-center bg-white p-2.5 rounded-xl border border-indigo-100/50"
                      >
                        <span className="text-[9px] font-bold text-slate-400">
                          {inst.day}
                        </span>
                        <span className="text-[10px] font-black text-indigo-500">
                          {inst.habit}
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            </div>

            {/* Focus Breakdown */}
            <div className="p-5 sm:p-8 rounded-[2.5rem] bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-slate-900/50 text-right">
              <div className="flex items-center justify-between mb-8">
                <Sparkles className="w-5 h-5 text-indigo-500" />
                <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
                  مرات الوصول لمستويات التركيز
                </h3>
              </div>
              <div className="space-y-6">
                {detailedFocusCounts
                  .slice()
                  .reverse()
                  .map((data, idx) => (
                    <div key={`focus-lvl-row-v2-${idx}`} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <div className="flex items-baseline gap-2">
                          <span className="text-lg font-black text-slate-800 dark:text-slate-100">
                            {data.count}
                          </span>
                          <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500">
                            مرة
                          </span>
                        </div>
                        <span className="text-[10px] font-black text-indigo-500 dark:text-indigo-400">
                          {data.lvl}
                        </span>
                      </div>
                      {data.count > 0 ? (
                        <div className="flex flex-wrap gap-2 justify-end">
                          {data.instances.map((inst, i) => (
                            <span
                              key={`focus-inst-v2-${idx}-${i}`}
                              className="text-[8px] bg-indigo-50 dark:bg-indigo-900/20 px-2 py-1 rounded-lg text-indigo-500 dark:text-indigo-400 font-bold border border-indigo-100 dark:border-indigo-900/30"
                            >
                              {inst.habit} ({inst.day})
                            </span>
                          ))}
                        </div>
                      ) : (
                        <div className="h-px bg-slate-50 dark:bg-slate-800 w-full" />
                      )}
                    </div>
                  ))}
              </div>
            </div>
          </div>

          {/* Time Adherence Section */}
          <div className="p-5 sm:p-8 rounded-[2.5rem] bg-indigo-900 text-white border border-indigo-800 shadow-2xl shadow-indigo-500/20 text-right overflow-hidden relative">
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500 blur-3xl opacity-20 -translate-y-1/2 translate-x-1/2" />
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-8">
                <Clock className="w-6 h-6 text-indigo-300" />
                <h3 className="text-sm font-black uppercase tracking-widest text-indigo-300">
                  تحليل الوقت والالتزام
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <div className="flex items-baseline justify-end gap-3 mb-2">
                    <span className="text-5xl font-black">
                      {timeAdherenceStats.percentage}%
                    </span>
                  </div>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-300">
                    نسبة الالتزام بالوقت المتوقع
                  </p>
                  <div className="mt-6 h-2 bg-indigo-950 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${timeAdherenceStats.percentage}%` }}
                      className="h-full bg-emerald-400"
                    />
                  </div>
                </div>
                <div className="space-y-4">
                  <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest block mb-1">
                    متوسط الوقت الفعلي Vs المتوقع
                  </span>
                  {timeAdherenceStats.habitStats.slice(0, 3).map((stat, i) => (
                    <div
                      key={`time-adherence-stat-v2-${i}`}
                      className="space-y-2"
                    >
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-bold text-indigo-200">
                          {stat.avgActual}د / {stat.expected}د
                        </span>
                        <span className="text-[10px] font-black">
                          {stat.name}
                        </span>
                      </div>
                      <div className="h-1 bg-indigo-950 rounded-full flex overflow-hidden">
                        <div
                          className="h-full bg-indigo-400"
                          style={{
                            width: `${(stat.avgActual / Math.max(stat.avgActual, stat.expected)) * 100}%`,
                          }}
                        />
                        <div
                          className="h-full bg-white opacity-20"
                          style={{
                            width: `${(stat.expected / Math.max(stat.avgActual, stat.expected)) * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {activeSubTab === "achievements" && (
        <div className="p-5 sm:p-8 rounded-[2.5rem] bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-slate-900/50 text-right">
          <div className="flex items-center justify-between mb-8">
            <Flame className="w-6 h-6 text-orange-500" />
            <h3 className="text-lg font-black uppercase tracking-widest text-slate-800 dark:text-slate-100">
              سجل الإنجازات اليومي
            </h3>
          </div>

          <div className="space-y-10">
            {achievementsByDay.length > 0 ? (
              achievementsByDay.slice(0, 15).map((day, idx) => (
                <div key={`day-log-v2-${idx}`} className="relative pr-6">
                  {/* Timeline dot */}
                  <div className="absolute top-2 right-0 w-2.5 h-2.5 rounded-full bg-indigo-500 z-10 shadow-[0_0_10px_rgba(99,102,241,0.5)]" />
                  <div className="absolute top-4 right-[4px] bottom-0 w-0.5 bg-slate-100 dark:bg-slate-800" />

                  <div className="mb-6">
                    <span className="text-[10px] font-black text-white bg-slate-900 px-4 py-1.5 rounded-full uppercase tracking-tighter shadow-md">
                      {new Date(day.date).toLocaleDateString("ar-EG", {
                        weekday: "long",
                        day: "numeric",
                        month: "long",
                      })}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pb-10">
                    {day.entries.map((entry, eIdx) => (
                      <div
                        key={`entry-card-v2-${idx}-${eIdx}`}
                        className="p-5 rounded-[2rem] bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 hover:shadow-xl transition-all group relative overflow-hidden"
                      >
                        <div className="absolute top-0 right-0 w-16 h-16 bg-slate-50 dark:bg-slate-900 rounded-full -translate-y-8 translate-x-8 -z-10 group-hover:scale-150 transition-transform duration-700" />

                        <div className="flex justify-between items-start mb-4">
                          <div className="flex items-center gap-1.5">
                            {entry.details.goalLevel === "exceeded" && (
                              <Zap className="w-3.5 h-3.5 text-emerald-500 fill-current" />
                            )}
                            <span
                              className={`text-[9px] font-black uppercase px-2.5 py-1 rounded-lg ${
                                entry.details.goalLevel === "exceeded"
                                  ? "bg-emerald-50 text-emerald-600"
                                  : entry.details.goalLevel === "min"
                                    ? "bg-amber-50 text-amber-600"
                                    : "bg-indigo-50 text-indigo-600"
                              }`}
                            >
                              {entry.details.goalLevel === "exceeded"
                                ? "إنجاز ممتاز"
                                : entry.details.goalLevel === "min"
                                  ? "الحد الأدنى"
                                  : "الهدف المتوقع"}
                            </span>
                          </div>
                          <h4 className="text-sm font-black text-slate-800 dark:text-slate-100">
                            {entry.habit}
                          </h4>
                        </div>

                        {entry.details.content && (
                          <div className="relative mb-4">
                            <div className="absolute top-0 right-0 w-1 h-full bg-indigo-100 dark:bg-indigo-900/50 rounded-full" />
                            <p className="text-[11px] font-bold text-slate-600 dark:text-slate-400 pr-4 leading-relaxed italic">
                              {entry.details.content}
                            </p>
                          </div>
                        )}

                        <div className="flex flex-wrap gap-2 justify-end mt-auto pt-4 border-t border-slate-50 dark:border-slate-700/50">
                          {entry.details.focus >= 5 && (
                            <span className="text-[7px] font-black text-white bg-indigo-500 uppercase tracking-widest px-2 py-0.5 rounded-full shadow-sm">
                              Elite Focus
                            </span>
                          )}
                          {entry.details.onTime && (
                            <span className="text-[7px] font-black text-emerald-600 bg-emerald-50 uppercase tracking-widest px-2 py-0.5 rounded-full border border-emerald-100">
                              On Time
                            </span>
                          )}
                          {entry.details.recovery && (
                            <span className="text-[7px] font-black text-amber-600 bg-amber-50 uppercase tracking-widest px-2 py-0.5 rounded-full border border-amber-100">
                              Recovery
                            </span>
                          )}
                          <span className="text-[7px] font-black text-slate-400 uppercase tracking-widest px-2 py-0.5 rounded-full bg-slate-50 dark:bg-slate-800">
                            {entry.details.type === "voice"
                              ? "🎙️ voice"
                              : "📝 text"}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-20 bg-slate-50/50 dark:bg-slate-800/10 rounded-[2rem] border-2 border-dashed border-slate-100 dark:border-slate-800">
                <Sparkles className="w-10 h-10 text-slate-200 dark:text-slate-800 mx-auto mb-4" />
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest">
                  مفيش إنجازات مسجلة لسة
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {activeSubTab === "chart" && (
        <div className="p-5 sm:p-8 rounded-[2.5rem] bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-slate-900/50">
          <div className="flex items-center justify-between mb-8 text-right">
            <TrendingUp className="w-5 h-5 text-indigo-500" />
            <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
              نشاط الـ 14 يوم الأخيرة
            </h3>
          </div>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={lineData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#f1f5f9"
                  className="opacity-10"
                />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fill: "#94a3b8", fontWeight: "bold" }}
                  tickFormatter={(val) => {
                    const date = new Date(val);
                    return date.toLocaleDateString("ar-EG", {
                      weekday: "short",
                    });
                  }}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: "16px",
                    border: "none",
                    boxShadow: "0 10px 25px -5px rgb(0 0 0 / 0.1)",
                    fontSize: "10px",
                    fontWeight: "800",
                    backgroundColor: "var(--tooltip-bg, #fff)",
                    color: "var(--tooltip-text, #0f172a)",
                  }}
                  wrapperClassName="recharts-tooltip-dark"
                />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke="#6366f1"
                  strokeWidth={4}
                  dot={{
                    r: 4,
                    fill: "#6366f1",
                    strokeWidth: 2,
                    stroke: "#fff",
                  }}
                  activeDot={{ r: 6, shadowBlur: 10 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {activeSubTab !== "achievements" && (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {[
            {
              label: "إجمالي النقاط",
              value: points,
              icon: Award,
              color: "text-amber-500",
              bg: "bg-amber-50",
            },
            {
              label: "إجمالي الإنجازات",
              value: totalCompletions,
              icon: CheckCircle,
              color: "text-emerald-500",
              bg: "bg-emerald-50",
            },
            {
              label: "أعلى سلسلة",
              value:
                habits.length > 0
                  ? Math.max(...habits.map((h) => h.streak))
                  : 0,
              icon: Flame,
              color: "text-orange-500",
              bg: "bg-orange-50",
            },
            {
              label: "عادات نشطة",
              value: habits.length,
              icon: Target,
              color: "text-indigo-500",
              bg: "bg-indigo-50",
            },
            {
              label: "المستوى الحالي",
              value: `Lvl ${userLevel}`,
              icon: TrendingUp,
              color: "text-purple-500",
              bg: "bg-purple-50",
            },
          ].map((stat, i) => (
            <div
              key={`bottom-stat-v2-${i}`}
              className="p-6 rounded-[2rem] bg-white border border-slate-100 text-right hover:shadow-xl transition-shadow"
            >
              <div
                className={`w-10 h-10 rounded-xl ${stat.bg} ${stat.color} flex items-center justify-center mb-4 ml-auto shadow-sm`}
              >
                <stat.icon className="w-5 h-5" />
              </div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                {stat.label}
              </p>
              <p className="text-2xl font-black text-slate-800 tracking-tighter mt-1">
                {stat.value}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
