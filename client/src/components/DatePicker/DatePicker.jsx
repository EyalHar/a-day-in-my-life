import { useEffect, useRef, useState } from 'react';
import { startOfMonth, format } from 'date-fns';
import { he } from 'date-fns/locale';
import MonthGrid from '../Calendar/MonthGrid';
import { getHebrewFullDate } from '../../hebrewDate';
import styles from './DatePicker.module.css';

export default function DatePicker({ value, onChange, minDateStr, placeholder = 'בחר/י תאריך' }) {
  const [isOpen, setIsOpen] = useState(false);
  const [viewedMonth, setViewedMonth] = useState(
    startOfMonth(value ? new Date(`${value}T00:00:00`) : new Date())
  );
  const wrapperRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const selectedDate = value ? new Date(`${value}T00:00:00`) : null;

  return (
    <div className={styles.wrapper} ref={wrapperRef}>
      <button type="button" className={styles.trigger} onClick={() => setIsOpen((v) => !v)}>
        <span className={selectedDate ? '' : styles.placeholder}>
          {selectedDate ? format(selectedDate, 'd בMMMM yyyy', { locale: he }) : placeholder}
        </span>
        <span>📅</span>
      </button>

      {isOpen && (
        <div className={styles.panel}>
          <div className={styles.hebrewDateLine}>
            {selectedDate ? getHebrewFullDate(selectedDate) : 'טרם נבחר תאריך'}
          </div>

          <MonthGrid
            viewedMonth={viewedMonth}
            setViewedMonth={setViewedMonth}
            selectedDateStr={value}
            minDateStr={minDateStr}
            onSelectDate={(dateStr) => {
              onChange(dateStr);
              setIsOpen(false);
            }}
          />

          {value && (
            <button
              type="button"
              className={styles.clearButton}
              onClick={() => {
                onChange('');
                setIsOpen(false);
              }}
            >
              נקה תאריך
            </button>
          )}
        </div>
      )}
    </div>
  );
}
