/**
 * Calendar Service to manage Aura Google Calendar
 */

import { HabitFrequency } from '../types';

let auraCalendarId: string | null = null;

export const getRRuleFromHabit = (frequency: HabitFrequency, customDays?: string): string => {
  switch (frequency) {
    case HabitFrequency.DAILY: return 'FREQ=DAILY';
    case HabitFrequency.WEEKLY: return 'FREQ=WEEKLY';
    case HabitFrequency.MONTHLY: return 'FREQ=MONTHLY';
    case HabitFrequency.CUSTOM_DAYS: return 'FREQ=DAILY'; // Simplified
    default: return 'FREQ=DAILY';
  }
};

export const initCalendar = async (): Promise<string | null> => {
  if (!gapi.client.calendar) return null;
  // Check if we have it in localStorage
  const cachedId = localStorage.getItem('aura_calendar_id');
  if (cachedId) {
    // verify it exists
    try {
      await gapi.client.calendar.calendars.get({ calendarId: cachedId });
      auraCalendarId = cachedId;
      return cachedId;
    } catch (e: any) {
      if (e.status !== 404) {
        console.error("Failed to fetch calendar", e);
      }
    }
  }

  // List calendars to find "Aura"
  try {
    const response = await gapi.client.calendar.calendarList.list();
    const calendars = response.result.items;
    const auraCal = calendars?.find((c: any) => c.summary === 'Aura');
    
    if (auraCal) {
      auraCalendarId = auraCal.id!;
      localStorage.setItem('aura_calendar_id', auraCal.id!);
      return auraCal.id!;
    }

    // Create if not exists
    const newCal = await gapi.client.calendar.calendars.insert({
      resource: {
        summary: 'Aura',
        description: 'Aura - Progress Your Skills',
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
      }
    });

    auraCalendarId = newCal.result.id!;
    localStorage.setItem('aura_calendar_id', newCal.result.id!);
    return newCal.result.id!;
  } catch (err) {
    console.error("Error initializing calendar", err);
    return null;
  }
};

export const createOrUpdateEvent = async (
  eventId: string | null,
  summary: string,
  description: string,
  timeStr: string, // "HH:MM"
  rrule: string // "FREQ=DAILY" etc
): Promise<string | null> => {
  if (!auraCalendarId) await initCalendar();
  if (!auraCalendarId) return null;

  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  
  // parse timeStr for today
  let startDateTime = new Date();
  if (timeStr) {
    const [hours, mins] = timeStr.split(':').map(Number);
    startDateTime.setHours(hours, mins, 0, 0);
  } else {
    startDateTime.setHours(9, 0, 0, 0); // default 9 AM
  }

  // if start time is in the past, move to tomorrow so first occurrence is valid
  if (startDateTime.getTime() < Date.now()) {
    startDateTime.setDate(startDateTime.getDate() + 1);
  }

  const endDateTime = new Date(startDateTime.getTime() + 30 * 60000); // 30 mins later

  const eventResource = {
    summary,
    description,
    start: {
      dateTime: startDateTime.toISOString(),
      timeZone: timeZone,
    },
    end: {
      dateTime: endDateTime.toISOString(),
      timeZone: timeZone,
    },
    recurrence: [
      `RRULE:${rrule}`
    ],
    reminders: {
      useDefault: false,
      overrides: [
        { method: 'popup', minutes: 5 },
        { method: 'popup', minutes: 0 },
      ],
    },
  };

  try {
    if (eventId) {
      // update
      const res = await gapi.client.calendar.events.update({
        calendarId: auraCalendarId,
        eventId: eventId,
        resource: eventResource
      });
      return res.result.id!;
    } else {
      // create
      const res = await gapi.client.calendar.events.insert({
        calendarId: auraCalendarId,
        resource: eventResource
      });
      return res.result.id!;
    }
  } catch (err) {
    console.error("Failed to create/update event", err);
    return null;
  }
};

export const createOrUpdateGoalEvent = async (
  eventId: string | null,
  summary: string,
  description: string,
  dateStr: string // "YYYY-MM-DD"
): Promise<string | null> => {
  if (!auraCalendarId) await initCalendar();
  if (!auraCalendarId || !dateStr) return null;

  const eventResource = {
    summary,
    description,
    start: {
      date: dateStr,
    },
    end: {
      date: dateStr,
    },
    reminders: {
      useDefault: false,
      overrides: [
        { method: 'popup', minutes: 24 * 60 },
        { method: 'popup', minutes: 60 * 9 },
      ],
    },
  };

  try {
    if (eventId) {
      const res = await gapi.client.calendar.events.update({
        calendarId: auraCalendarId,
        eventId: eventId,
        resource: eventResource
      });
      return res.result.id!;
    } else {
      const res = await gapi.client.calendar.events.insert({
        calendarId: auraCalendarId,
        resource: eventResource
      });
      return res.result.id!;
    }
  } catch (err) {
    console.error("Failed to create/update goal event", err);
    return null;
  }
};

export const deleteEvent = async (eventId: string) => {
  if (!auraCalendarId) return;
  try {
    await gapi.client.calendar.events.delete({
      calendarId: auraCalendarId,
      eventId: eventId
    });
  } catch (err) {
    console.error("Failed to delete event", err);
  }
};
