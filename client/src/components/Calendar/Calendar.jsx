import { useEffect, useMemo, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
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
import { getMonthSummary } from '../../api/days';
import styles from './Calendar.module.css';

const WEEKDAYS = ['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ש'];

export default function Calendar({ selectedDate }) {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const selected = useMemo(() => new Date(`${selectedDate}T00:00:00`), [selectedDate]);
  const [viewedMonth, setViewedMonth] = useState(startOfMonth(selected));
  const wrapperRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const monthKey = format(viewedMonth, 'yyyy-MM');
  const { data } = useQuery({
    queryKey: ['monthSummary', monthKey],
    queryFn: () => getMonthSummary(monthKey),
  });
  const datesWithEntries = useMemo(() => new Set(data?.dates || []), [data]);

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(viewedMonth), { weekStartsOn: 0 });
    const end = endOfWeek(endOfMonth(viewedMonth), { weekStartsOn: 0 });
    return eachDayOfInterval({ start, end });
  }, [viewedMonth]);

  return (
    <div className={styles.wrapper} ref={wrapperRef}>
      <button
        className={`${styles.trigger} ${isOpen ? styles.triggerOpen : ''}`}
        onClick={() => setIsOpen((v) => !v)}
        aria-label="לוח שנה"
      >
        <span>📅</span>
        <span className={styles.triggerDate}>{format(selected, 'd בMMM', { locale: he })}</span>
      </button>

      {isOpen && (
        <div className={styles.panel}>
          <div className={styles.monthNav}>
            <button onClick={() => setViewedMonth((m) => subMonths(m, 1))} aria-label="חודש קודם">
              ‹
            </button>
            <span className={styles.monthTitle}>{format(viewedMonth, 'MMMM yyyy', { locale: he })}</span>
            <button onClick={() => setViewedMonth((m) => addMonths(m, 1))} aria-label="חודש הבא">
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
              const isSel = isSameDay(day, selected);
              return (
                <button
                  key={dateStr}
                  className={`${styles.day} ${outside ? styles.dayOutside : ''} ${
                    isToday(day) ? styles.dayToday : ''
                  } ${isSel ? styles.daySelected : ''}`}
                  onClick={() => {
                    if (outside) return;
                    navigate(`/day/${dateStr}`);
                    setIsOpen(false);
                  }}
                  disabled={outside}
                >
                  {format(day, 'd')}
                  {datesWithEntries.has(dateStr) && <span className={styles.dayDot} />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
