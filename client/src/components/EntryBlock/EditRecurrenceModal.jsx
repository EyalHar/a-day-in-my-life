import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import { updateEntry } from '../../api/entries';
import { RECURRENCE_OPTIONS } from '../../recurrence';
import styles from './EditRecurrenceModal.module.css';

export default function EditRecurrenceModal({ entry, onClose }) {
  const originDate = entry.originDate || entry.date;
  const [recurrence, setRecurrence] = useState(entry.recurrence || 'daily');
  const [recurrenceUntil, setRecurrenceUntil] = useState(entry.recurrenceUntil || '');
  const [error, setError] = useState('');
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: () => updateEntry(entry.id, { recurrence, recurrenceUntil: recurrenceUntil || null }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['day'] });
      queryClient.invalidateQueries({ queryKey: ['monthSummary'] });
      onClose();
    },
    onError: (err) => setError(err.message),
  });

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h2 className={styles.title}>🔁 חזרתיות הקבלה</h2>
        <p className={styles.hint}>
          נקבעה בתאריך {format(new Date(`${originDate}T00:00:00`), 'd בMMMM yyyy', { locale: he })}
        </p>

        <label className={styles.field}>
          <span>יופיע</span>
          <select value={recurrence} onChange={(e) => setRecurrence(e.target.value)}>
            {RECURRENCE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </label>

        <label className={styles.field}>
          <span>עד תאריך (ריק = ללא הגבלה)</span>
          <input
            type="date"
            min={originDate}
            value={recurrenceUntil}
            onChange={(e) => setRecurrenceUntil(e.target.value)}
          />
        </label>

        {error && <div className={styles.error}>{error}</div>}

        <div className={styles.actions}>
          <button type="button" className={`${styles.button} ${styles.secondary}`} onClick={onClose}>
            ביטול
          </button>
          <button
            type="button"
            className={`${styles.button} ${styles.primary}`}
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending}
          >
            {mutation.isPending ? 'שומר...' : 'שמור'}
          </button>
        </div>
      </div>
    </div>
  );
}
