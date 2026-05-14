
// This is a simplified Analytics service for Habit Lab
// In a real production app, this would wrap Google Analytics 4 (gtag.js)

export const trackEvent = (eventName: string, params?: Record<string, any>) => {
  console.log(`[Analytics] Event: ${eventName}`, params);
  
  // Example of how to integrate with real gtag:
  // if (typeof window !== 'undefined' && (window as any).gtag) {
  //   (window as any).gtag('event', eventName, params);
  // }
};

export const trackHabitCompletion = (habitName: string, streak: number) => {
  trackEvent('habit_completed', {
    habit_name: habitName,
    current_streak: streak,
    timestamp: new Date().toISOString()
  });
};

export const trackRelapse = (habitName: string, reason: string) => {
  trackEvent('habit_relapse', {
    habit_name: habitName,
    reason: reason,
    timestamp: new Date().toISOString()
  });
};

export const trackKhalwaCompletion = (activityName: string) => {
  trackEvent('khalwa_activity_completed', {
    activity_name: activityName,
    timestamp: new Date().toISOString()
  });
};
