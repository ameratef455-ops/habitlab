import { Habit } from "../types";

export async function getMotivationalMessage(habit: Habit, note?: string) {
  return "استمر في التقدم، أنت تبلي بلاءً حسناً!";
}

export async function getProgressSummary(habits: Habit[]) {
  return "أنت تحقق تقدماً ملحوظاً في عاداتك.";
}
