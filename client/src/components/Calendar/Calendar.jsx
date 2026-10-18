import { useEffect, useMemo, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { startOfMonth, format } from 'date-fns';
import { he } from 'date-fns/locale';
import { getMonthSummary } from '../../api/days';
import { getHebrewFullDate } from '../../hebrewDate';
import MonthGrid from './MonthGrid';
import styles from './Calendar.module.css';

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
          <div className={styles.hebrewDateLine}>{getHebrewFullDate(selected)}</div>

          <MonthGrid
            viewedMonth={viewedMonth}
            setViewedMonth={setViewedMonth}
            selectedDateStr={selectedDate}
            datesWithEntries={datesWithEntries}
            onSelectDate={(dateStr) => {
              navigate(`/day/${dateStr}`);
              setIsOpen(false);
            }}
          />
        </div>
      )}
    </div>
  );
}
