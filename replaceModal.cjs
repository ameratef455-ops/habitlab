const fs = require('fs');

let content = fs.readFileSync('src/components/HabitModal.tsx', 'utf8');

// Tone down background colors for a calmer UI
content = content.replace(/bg-rose-50 dark:bg-rose-900\/20 border border-rose-100 dark:border-rose-900\/30 outline-none focus:border-rose-300/g, 'bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none focus:border-indigo-400');
content = content.replace(/placeholder:text-rose-200 dark:placeholder:text-rose-800/g, 'placeholder:text-slate-300 dark:placeholder:text-slate-600');

content = content.replace(/bg-amber-50 dark:bg-amber-900\/20 border border-amber-100 dark:border-amber-900\/30 outline-none focus:border-amber-300/g, 'bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none focus:border-indigo-400');
content = content.replace(/placeholder:text-amber-200 dark:placeholder:text-amber-800/g, 'placeholder:text-slate-300 dark:placeholder:text-slate-600');

content = content.replace(/bg-indigo-50 dark:bg-indigo-900\/20 rounded-2xl border border-indigo-100 dark:border-indigo-900\/30/g, 'bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700');

content = content.replace(/bg-purple-50 dark:bg-purple-900\/20 rounded-2xl border border-purple-100 dark:border-purple-900\/30 outline-none focus:border-purple-500/g, 'bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 outline-none focus:border-indigo-400');

content = content.replace(/bg-amber-50 dark:bg-amber-900\/20 rounded-2xl border border-amber-100 dark:border-amber-900\/30 outline-none focus:border-amber-500/g, 'bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 outline-none focus:border-amber-500');

content = content.replace(/bg-emerald-50 dark:bg-emerald-900\/20 rounded-2xl border border-emerald-100 dark:border-emerald-900\/30 outline-none focus:border-emerald-500/g, 'bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 outline-none focus:border-emerald-500');

fs.writeFileSync('src/components/HabitModal.tsx', content, 'utf8');
console.log('Done!');
