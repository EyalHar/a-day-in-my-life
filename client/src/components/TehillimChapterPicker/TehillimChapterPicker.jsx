import { useState } from 'react';
import SegmentedControl from '../SegmentedControl/SegmentedControl';
import styles from './TehillimChapterPicker.module.css';

const TOTAL_CHAPTERS = 150;

const PLAN_OPTIONS = [
  { value: '', label: 'פרקים לבחירה' },
  { value: 'complete', label: 'סיום ספר תהילים' },
];

function getSplitSummary(totalDays, unit) {
  if (totalDays === 1) return `כל הספר (${TOTAL_CHAPTERS} פרקים) ב${unit.singular} אחד`;
  if (totalDays >= TOTAL_CHAPTERS) {
    return `פרק אחד בכל ${unit.singular} — הספר יסתיים ב${unit.singular} ה־${TOTAL_CHAPTERS}`;
  }
  const min = Math.floor(TOTAL_CHAPTERS / totalDays);
  const max = Math.ceil(TOTAL_CHAPTERS / totalDays);
  const range = min === max ? `${min}` : `${min}–${max}`;
  return `${range} פרקים בכל ${unit.singular}, לאורך ${totalDays} ${unit.plural}`;
}

function FixedChaptersInput({ chapters, onChange }) {
  const [inputValue, setInputValue] = useState('');

  const addChapter = () => {
    const chapter = Number(inputValue);
    if (!Number.isInteger(chapter) || chapter < 1 || chapter > TOTAL_CHAPTERS) return;
    if (!chapters.includes(chapter)) {
      onChange([...chapters, chapter].sort((a, b) => a - b));
    }
    setInputValue('');
  };

  return (
    <>
      <div className={styles.addRow}>
        <input
          type="number"
          min={1}
          max={TOTAL_CHAPTERS}
          placeholder="מספר פרק (1-150)"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              addChapter();
            }
          }}
        />
        <button type="button" className={styles.addButton} onClick={addChapter}>
          הוסף פרק
        </button>
      </div>

      {chapters.length > 0 && (
        <div className={styles.chips}>
          {chapters.map((chapter) => (
            <span key={chapter} className={styles.chip}>
              <span>פרק {chapter}</span>
              <button
                type="button"
                onClick={() => onChange(chapters.filter((c) => c !== chapter))}
                aria-label={`הסר פרק ${chapter}`}
              >
                ✕
              </button>
            </span>
          ))}
        </div>
      )}
    </>
  );
}

export default function TehillimChapterPicker({ chapters, onChange, plan, onPlanChange, totalDays, unit }) {
  return (
    <div className={styles.wrapper}>
      <span className={styles.label}>📖 תהילים לקריאה (אופציונלי)</span>
      <SegmentedControl options={PLAN_OPTIONS} value={plan} onChange={onPlanChange} ariaLabel="סוג קריאת תהילים" />

      {plan === 'complete' ? (
        totalDays ? (
          <div className={styles.planSummary}>📚 {getSplitSummary(totalDays, unit)}</div>
        ) : (
          <div className={styles.planWarning}>כדי לחלק את הספר, בחר/י למעלה מספר {unit.plural} או תאריך סיום</div>
        )
      ) : (
        <FixedChaptersInput chapters={chapters} onChange={onChange} />
      )}
    </div>
  );
}
