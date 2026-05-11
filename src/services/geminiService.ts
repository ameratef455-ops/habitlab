import { GoogleGenAI } from "@google/genai";
import { Habit } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function getMotivationalMessage(habit: Habit, note?: string) {
  try {
    const prompt = `
      You are an AI motivator for a habit tracker called "Habit Lab".
      The user just completed a habit: "${habit.name}".
      Their current streak is: ${habit.streak} days.
      ${note ? `They left a note: "${note}"` : "They didn't leave a note today."}
      
      Provide an extremely short (ONE SENTENCE MAX), minimalist, dopamine-inducing motivational message in Egyptian Arabic Slang (Ammiya). 
      Use only the most powerful encouraging words.
      Help them feel satisfied and encourage them to keep going.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });

    return response.text;
  } catch (error) {
    console.error("Gemini Error:", error);
    return "استمر في التقدم، أنت تبلي بلاءً حسناً!";
  }
}

export async function getProgressSummary(habits: Habit[]) {
  try {
    const context = habits.map(h => ({
      name: h.name,
      streak: h.streak,
      notes: h.notes.slice(-3).map(n => n.content)
    }));

    const prompt = `
      Review the following habit progress for the user:
      ${JSON.stringify(context)}
      
      Summarize their overall progress and provide a strategic encouragement in Arabic.
      Keep it minimalist and ADHD-friendly (short paragraphs, bullet points if needed).
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });

    return response.text;
  } catch (error) {
    console.error("Gemini Error:", error);
    return "أنت تحقق تقدماً ملحوظاً في عاداتك.";
  }
}
