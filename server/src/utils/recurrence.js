const VALID_RECURRENCES = ['once', 'daily', 'weekly', 'monthly'];

function daysInMonth(year, month1Indexed) {
  return new Date(Date.UTC(year, month1Indexed, 0)).getUTCDate();
}

// Whether a commitment that started on originDate (and recurs by `recurrence` until
// recurrenceUntil, if any) also shows up on targetDate. Assumes targetDate > originDate.
function matchesRecurrence(originDate, recurrence, targetDate, recurrenceUntil) {
  if (targetDate <= originDate) return false;
  if (recurrenceUntil && targetDate > recurrenceUntil) return false;
  if (recurrence === 'once') return false;
  if (recurrence === 'daily') return true;

  const [oy, om, od] = originDate.split('-').map(Number);
  const [ty, tm, td] = targetDate.split('-').map(Number);

  if (recurrence === 'weekly') {
    const originUTC = Date.UTC(oy, om - 1, od);
    const targetUTC = Date.UTC(ty, tm - 1, td);
    const diffDays = Math.round((targetUTC - originUTC) / 86400000);
    return diffDays % 7 === 0;
  }

  if (recurrence === 'monthly') {
    const lastDayOfTargetMonth = daysInMonth(ty, tm);
    if (td === od) return true;
    return td === lastDayOfTargetMonth && od > lastDayOfTargetMonth;
  }

  return false;
}

function parseDate(dateStr) {
  return dateStr.split('-').map(Number);
}

function toDateStr(utcMs) {
  return new Date(utcMs).toISOString().slice(0, 10);
}

function daysBetween(fromDate, toDate) {
  const [fy, fm, fd] = parseDate(fromDate);
  const [ty, tm, td] = parseDate(toDate);
  return Math.round((Date.UTC(ty, tm - 1, td) - Date.UTC(fy, fm - 1, fd)) / 86400000);
}

// 1-based index of the occurrence on (or most recently before) targetDate.
function occurrenceIndex(originDate, recurrence, targetDate) {
  if (recurrence === 'daily') return daysBetween(originDate, targetDate) + 1;
  if (recurrence === 'weekly') return Math.floor(daysBetween(originDate, targetDate) / 7) + 1;
  if (recurrence === 'monthly') {
    const [oy, om, od] = parseDate(originDate);
    const [ty, tm, td] = parseDate(targetDate);
    let months = (ty - oy) * 12 + (tm - om);
    if (td < Math.min(od, daysInMonth(ty, tm))) months--;
    return months + 1;
  }
  return null;
}

// Date of the n-th occurrence (n = 1 is originDate itself).
function nthOccurrenceDate(originDate, recurrence, n) {
  const [oy, om, od] = parseDate(originDate);
  if (recurrence === 'daily') return toDateStr(Date.UTC(oy, om - 1, od + n - 1));
  if (recurrence === 'weekly') return toDateStr(Date.UTC(oy, om - 1, od + 7 * (n - 1)));
  if (recurrence === 'monthly') {
    const first = new Date(Date.UTC(oy, om - 1 + n - 1, 1));
    const y = first.getUTCFullYear();
    const m = first.getUTCMonth() + 1;
    return toDateStr(Date.UTC(y, m - 1, Math.min(od, daysInMonth(y, m))));
  }
  return originDate;
}

module.exports = { VALID_RECURRENCES, matchesRecurrence, occurrenceIndex, nthOccurrenceDate };
