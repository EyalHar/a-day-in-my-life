import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import { getOccurrenceUnit, nthOccurrenceDate } from '../../recurrence';
import DatePicker from '../DatePicker/DatePicker';
import SegmentedControl from '../SegmentedControl/SegmentedControl';
import styles from './RecurrenceEndPicker.module.css';

export function getInitialEndMode(entry) {
  if (entry?.recurrenceCount) return 'count';
  if (entry?.recurrenceUntil) return 'until';
  return 'none';
}

export default function RecurrenceEndPicker({
  originDate,
  recurrence,
  endMode,
  onEndModeChange,
  until,
  onUntilChange,
  count,
  onCountChange,
}) {
  const unit = getOccurrenceUnit(recurrence);
  const countNum = Number(count);
  const validCount = Number.isInteger(countNum) && countNum >= 1;

  const modes = [
    { value: 'none', label: 'ללא הגבלה' },
    { value: 'until', label: 'עד תאריך' },
    { value: 'count', label: `מספר ${unit.plural}` },
  ];

  return (
    <div className={styles.wrapper}>
      <SegmentedControl options={modes} value={endMode} onChange={onEndModeChange} ariaLabel="סיום הקבלה" />

      {endMode === 'until' && <DatePicker value={until} onChange={onUntilChange} minDateStr={originDate} />}

      {endMode === 'count' && (
        <div className={styles.countRow}>
          <input
            className={styles.countInput}
            type="number"
            inputMode="numeric"
            min="1"
            step="1"
            value={count}
            onChange={(e) => onCountChange(e.target.value)}
            placeholder="40"
          />
          <span>{unit.plural}</span>
          {validCount && (
            <span className={styles.hint}>
              · מסתיים ב־{format(nthOccurrenceDate(originDate, recurrence, countNum), 'd בMMMM yyyy', { locale: he })}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
