import { differenceInCalendarDays, differenceInCalendarMonths, getDaysInMonth } from 'date-fns';

export const RECURRENCE_OPTIONS = [
  { value: 'once', label: 'חד פעמי' },
  { value: 'daily', label: 'כל יום' },
  { value: 'weekly', label: 'פעם בשבוע' },
  { value: 'monthly', label: 'פעם בחודש' },
];

export function getRecurrenceLabel(recurrence) {
  return RECURRENCE_OPTIONS.find((o) => o.value === recurrence)?.label || '';
}

const OCCURRENCE_UNITS = {
  daily: { singular: 'יום', plural: 'ימים' },
  weekly: { singular: 'שבוע', plural: 'שבועות' },
  monthly: { singular: 'חודש', plural: 'חודשים' },
};

export function getOccurrenceUnit(recurrence) {
  return OCCURRENCE_UNITS[recurrence] || OCCURRENCE_UNITS.daily;
}

// Mirrors server/src/utils/recurrence.js occurrenceIndex — used only for form previews.
function occurrenceIndex(originDate, recurrence, targetDate) {
  const origin = new Date(`${originDate}T00:00:00`);
  const target = new Date(`${targetDate}T00:00:00`);
  if (recurrence === 'weekly') return Math.floor(differenceInCalendarDays(target, origin) / 7) + 1;
  if (recurrence === 'monthly') {
    let months = differenceInCalendarMonths(target, origin);
    if (target.getDate() < Math.min(origin.getDate(), getDaysInMonth(target))) months--;
    return months + 1;
  }
  return differenceInCalendarDays(target, origin) + 1;
}

// Total number of occurrences a commitment will have, or null when it's open-ended.
export function getTotalOccurrences({ originDate, recurrence, endMode, until, count }) {
  if (recurrence === 'once') return 1;
  if (endMode === 'count') {
    const n = Number(count);
    return Number.isInteger(n) && n >= 1 ? n : null;
  }
  if (endMode === 'until' && until) return occurrenceIndex(originDate, recurrence, until);
  return null;
}

// Mirrors server/src/utils/recurrence.js nthOccurrenceDate — used only for the preview hint.
export function nthOccurrenceDate(originDate, recurrence, n) {
  const [oy, om, od] = originDate.split('-').map(Number);
  if (recurrence === 'weekly') return new Date(oy, om - 1, od + 7 * (n - 1));
  if (recurrence === 'monthly') {
    const lastDay = new Date(oy, om - 1 + n, 0).getDate();
    return new Date(oy, om - 1 + n - 1, Math.min(od, lastDay));
  }
  return new Date(oy, om - 1, od + n - 1);
}
