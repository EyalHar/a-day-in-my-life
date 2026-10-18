import { format, startOfDay, startOfHour, subHours } from 'date-fns';

const LAST_REMINDER_KEY = 'commitmentReminder:lastReminderAt';
const LAST_CHECK_KEY = 'commitmentReminder:lastCheckAt';
// Checks normally run every minute; a gap this long means the computer slept or the browser was closed.
const ASLEEP_GAP_MS = 3 * 60 * 1000;
// A reminder belongs to the round hour; if the tab only became hidden later than this, skip to the next hour
// rather than firing the moment the user switches tabs.
const MAX_MINUTES_LATE = 10;
// Keeps a catch-up reminder (e.g. on waking at 21:58) from being followed straight away by the 22:00 one.
const MIN_GAP_BETWEEN_REMINDERS_MS = 45 * 60 * 1000;

export function getNotificationPermission() {
  return 'Notification' in window ? Notification.permission : 'unsupported';
}

export async function requestNotificationPermission() {
  if (!('Notification' in window)) return 'unsupported';
  return Notification.requestPermission();
}

// startTime/endTime are "HH:mm" or null (= all day). A range like 22:00–02:00 wraps past midnight.
export function isWithinHours(date, startTime, endTime) {
  if (!startTime || !endTime) return true;
  const now = format(date, 'HH:mm');
  return startTime <= endTime ? now >= startTime && now <= endTime : now >= startTime || now <= endTime;
}

// True when a round hour inside the range (earlier today) went by while no check could run.
function hasMissedReminderHour(lastCheckAt, now, startTime, endTime) {
  if (!lastCheckAt || now.getTime() - lastCheckAt < ASLEEP_GAP_MS) return false;
  const dayStart = startOfDay(now).getTime();
  for (let hour = startOfHour(now); hour.getTime() > lastCheckAt && hour.getTime() >= dayStart; hour = subHours(hour, 1)) {
    if (isWithinHours(hour, startTime, endTime)) return true;
  }
  return false;
}

// Whether a reminder is due now (pending commitments aside). However many round hours were missed
// while the computer was off, this allows a single catch-up reminder, then waits for the gap.
export function isReminderDue({ now, lastCheckAt, lastReminderAt, startTime, endTime }) {
  if (now.getTime() - lastReminderAt < MIN_GAP_BETWEEN_REMINDERS_MS) return false;
  const isOnTheHour = now.getMinutes() < MAX_MINUTES_LATE && isWithinHours(startOfHour(now), startTime, endTime);
  return isOnTheHour || hasMissedReminderHour(lastCheckAt, now, startTime, endTime);
}

// Serializes reminder decisions across all open tabs (and overlapping checks in one tab), so the
// read-decide-write sequence can't interleave and produce duplicate reminders.
export function withReminderLock(callback) {
  if (navigator.locks) return navigator.locks.request('commitment-reminder', callback);
  return callback();
}

// Shared through localStorage so several open tabs don't each fire their own reminder, and so the
// last check time survives the browser being closed.
function readStorage(key) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeStorage(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Storage unavailable — worst case a reminder repeats across tabs or a missed hour isn't caught up.
  }
}

export const readLastReminderAt = () => Number(readStorage(LAST_REMINDER_KEY)) || 0;
export const writeLastReminderAt = (timestamp) => writeStorage(LAST_REMINDER_KEY, String(timestamp));
export const readLastCheckAt = () => Number(readStorage(LAST_CHECK_KEY)) || 0;
export const writeLastCheckAt = (timestamp) => writeStorage(LAST_CHECK_KEY, String(timestamp));

// Browsers only let a page focus its own tab from a notification click, so that's where we do it.
export function showReminderNotification(pendingCount, onClick) {
  const notification = new Notification('🌱 תזכורת — קבלה על עצמי', {
    body:
      pendingCount === 1
        ? 'יש קבלה אחת שעוד לא הושלמה היום. לחצו כדי לפתוח את היום.'
        : `יש ${pendingCount} קבלות שעוד לא הושלמו היום. לחצו כדי לפתוח את היום.`,
    tag: 'commitment-reminder',
    renotify: true,
    requireInteraction: true,
    lang: 'he',
    dir: 'rtl',
  });
  notification.onclick = () => {
    window.focus();
    onClick?.();
    notification.close();
  };
  return notification;
}
