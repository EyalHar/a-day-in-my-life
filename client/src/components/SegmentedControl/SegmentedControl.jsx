import styles from './SegmentedControl.module.css';

export default function SegmentedControl({ options, value, onChange, ariaLabel }) {
  return (
    <div className={styles.segmented} role="radiogroup" aria-label={ariaLabel}>
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          role="radio"
          aria-checked={value === opt.value}
          className={`${styles.segment} ${value === opt.value ? styles.segmentActive : ''}`}
          onClick={() => onChange(opt.value)}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
