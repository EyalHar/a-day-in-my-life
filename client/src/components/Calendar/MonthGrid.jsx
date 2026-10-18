import { useMemo } from 'react';
import {
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  isSameMonth,
  isSameDay,
  isToday,
} from 'date-fns';
import { he } from 'date-fns/locale';
import { getHebrewDayLetters, getHebrewMonthName, isRoshChodesh } from '../../hebrewDate';
import styles from './Calendar.module.css';

const WEEKDAYS = ['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ש'];

export default function MonthGrid({
  viewedMonth,
  setViewedMonth,
  selectedDateStr,
  onSelectDate,
  datesWithEntries,
  minDateStr,
}) {
  const selected = selectedDateStr ? new Date(`${selectedDateStr}T00:00:00`) : null;

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(viewedMonth), { weekStartsOn: 0 });
    const end = endOfWeek(endOfMonth(viewedMonth), { weekStartsOn: 0 });
    return eachDayOfInterval({ start, end });
  }, [viewedMonth]);

  return (
    <>
      <div className={styles.monthNav}>
        <button type="button" onClick={() => setViewedMonth((m) => subMonths(m, 1))} aria-label="חודש קודם">
          ‹
        </button>
        <span className={styles.monthTitle}>{format(viewedMonth, 'MMMM yyyy', { locale: he })}</span>
        <button type="button" onClick={() => setViewedMonth((m) => addMonths(m, 1))} aria-label="חודש הבא">
          ›
        </button>
      </div>

      <div className={styles.grid}>
        {WEEKDAYS.map((w) => (
          <div key={w} className={styles.weekday}>
            {w}
          </div>
        ))}
        {days.map((day) => {
          const dateStr = format(day, 'yyyy-MM-dd');
          const outside = !isSameMonth(day, viewedMonth);
          const belowMin = minDateStr && dateStr < minDateStr;
          const isSel = selected && isSameDay(day, selected);
          return (
            <button
              type="button"
              key={dateStr}
              className={`${styles.day} ${outside ? styles.dayOutside : ''} ${
                belowMin ? styles.dayDisabled : ''
              } ${isToday(day) ? styles.dayToday : ''} ${isSel ? styles.daySelected : ''}`}
              onClick={() => !outside && !belowMin && onSelectDate(dateStr)}
              disabled={outside || belowMin}
            >
              <span className={styles.dayGregorian}>{format(day, 'd')}</span>
              <span className={styles.dayHebrew}>
                {isRoshChodesh(day) ? getHebrewMonthName(day) : getHebrewDayLetters(day)}
              </span>
              {datesWithEntries?.has(dateStr) && <span className={styles.dayDot} />}
            </button>
          );
        })}
      </div>
    </>
  );
}
