const TOTAL_CHAPTERS = 150;
const VALID_TEHILLIM_PLANS = ['complete'];

// Chapters to read on day `dayNumber` (1-based) when the whole book is split as evenly as
// possible over `totalDays` days: every day gets floor(150 / totalDays) chapters, and the first
// (150 % totalDays) days get one extra. With more than 150 days, the later days get none.
function chaptersForDay(dayNumber, totalDays) {
  if (!totalDays || dayNumber < 1 || dayNumber > totalDays) return [];
  const base = Math.floor(TOTAL_CHAPTERS / totalDays);
  const extra = TOTAL_CHAPTERS % totalDays;
  const start = (dayNumber - 1) * base + Math.min(dayNumber - 1, extra) + 1;
  const length = base + (dayNumber <= extra ? 1 : 0);
  return Array.from({ length }, (_, i) => start + i);
}

module.exports = { VALID_TEHILLIM_PLANS, chaptersForDay };
