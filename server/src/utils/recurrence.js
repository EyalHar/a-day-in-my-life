const VALID_RECURRENCES = ['daily', 'weekly', 'monthly'];

function daysInMonth(year, month1Indexed) {
  return new Date(Date.UTC(year, month1Indexed, 0)).getUTCDate();
}

// Whether a commitment that started on originDate (and recurs by `recurrence`)
// also shows up on targetDate. Assumes targetDate > originDate.
function matchesRecurrence(originDate, recurrence, targetDate) {
  if (targetDate <= originDate) return false;
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

module.exports = { VALID_RECURRENCES, matchesRecurrence };
