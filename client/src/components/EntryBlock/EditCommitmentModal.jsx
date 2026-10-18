import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import { updateEntry } from '../../api/entries';
import { RECURRENCE_OPTIONS, getOccurrenceUnit, getTotalOccurrences } from '../../recurrence';
import TehillimChapterPicker from '../TehillimChapterPicker/TehillimChapterPicker';
import RecurrenceEndPicker, { getInitialEndMode } from '../RecurrenceEndPicker/RecurrenceEndPicker';
import styles from './EditCommitmentModal.module.css';

export default function EditCommitmentModal({ entry, onClose }) {
  const originDate = entry.originDate || entry.date;
  const [recurrence, setRecurrence] = useState(entry.recurrence || 'daily');
  const [endMode, setEndMode] = useState(getInitialEndMode(entry));
  const [recurrenceUntil, setRecurrenceUntil] = useState(entry.recurrenceUntil || '');
  const [recurrenceCount, setRecurrenceCount] = useState(entry.recurrenceCount ? String(entry.recurrenceCount) : '');
  const [tehillimChapters, setTehillimChapters] = useState(entry.tehillimChapters || []);
  const [tehillimPlan, setTehillimPlan] = useState(entry.tehillimPlan || '');
  const [error, setError] = useState('');
  const totalOccurrences = getTotalOccurrences({
    originDate,
    recurrence,
    endMode,
    until: recurrenceUntil,
    count: recurrenceCount,
  });
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: () =>
      updateEntry(entry.id, {
        recurrence,
        recurrenceUntil: endMode === 'until' && recurrenceUntil ? recurrenceUntil : null,
        recurrenceCount: endMode === 'count' ? Number(recurrenceCount) : null,
        tehillimChapters: JSON.stringify(tehillimPlan ? [] : tehillimChapters),
        tehillimPlan: tehillimPlan || null,
      }),
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
        <h2 className={styles.title}>🌱 הגדרות הקבלה</h2>
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

        {recurrence !== 'once' && (
          <div className={styles.field}>
            <span>עד מתי</span>
            <RecurrenceEndPicker
              originDate={originDate}
              recurrence={recurrence}
              endMode={endMode}
              onEndModeChange={setEndMode}
              until={recurrenceUntil}
              onUntilChange={setRecurrenceUntil}
              count={recurrenceCount}
              onCountChange={setRecurrenceCount}
            />
          </div>
        )}

        <TehillimChapterPicker
          chapters={tehillimChapters}
          onChange={setTehillimChapters}
          plan={tehillimPlan}
          onPlanChange={setTehillimPlan}
          totalDays={totalOccurrences}
          unit={getOccurrenceUnit(recurrence)}
        />

        {error && <div className={styles.error}>{error}</div>}

        <div className={styles.actions}>
          <button type="button" className={`${styles.button} ${styles.secondary}`} onClick={onClose}>
            ביטול
          </button>
          <button
            type="button"
            className={`${styles.button} ${styles.primary}`}
            onClick={() => {
              if (recurrence !== 'once' && endMode === 'count' && !(Number(recurrenceCount) >= 1)) {
                setError('הזן/י מספר ימים (1 ומעלה)');
                return;
              }
              if (tehillimPlan === 'complete' && !totalOccurrences) {
                setError('כדי לחלק את ספר תהילים צריך להגדיר מספר ימים או תאריך סיום');
                return;
              }
              mutation.mutate();
            }}
            disabled={mutation.isPending}
          >
            {mutation.isPending ? 'שומר...' : 'שמור'}
          </button>
        </div>
      </div>
    </div>
  );
}
