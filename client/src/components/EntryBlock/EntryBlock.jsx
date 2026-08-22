import { useState } from 'react';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import { getEntryTypeMeta } from '../../entryTypes';
import { getRecurrenceLabel } from '../../recurrence';
import { usePrivateSession } from '../../hooks/PrivateSessionContext';
import EditRecurrenceModal from './EditRecurrenceModal';
import styles from './EntryBlock.module.css';

function getUrlDisplayText(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}

export default function EntryBlock({ entry, onDelete }) {
  const { openUnlockModal } = usePrivateSession();
  const meta = getEntryTypeMeta(entry.type);
  const [isEditingRecurrence, setIsEditingRecurrence] = useState(false);

  if (entry.locked) {
    return (
      <div className={styles.lockedCard} onClick={openUnlockModal}>
        <span>🔒</span>
        <span>תוכן פרטי — לחץ/י כדי לפתוח</span>
      </div>
    );
  }

  const time = !entry.recurring && entry.createdAt ? format(new Date(entry.createdAt.replace(' ', 'T')), 'HH:mm') : '';

  return (
    <div
      className={styles.card}
      style={{
        '--accent-color': `var(--type-${entry.type}-accent)`,
        '--accent-tint': `var(--type-${entry.type}-tint)`,
      }}
    >
      <div className={styles.header}>
        <span className={styles.typeChip}>
          <span>{meta.icon}</span>
          <span>{meta.label}</span>
          {entry.isPrivate && <span title="פרטי">🔒</span>}
        </span>
        <div className={styles.actions}>
          <span className={styles.time}>{time}</span>
          <button
            className={styles.iconButton}
            onClick={() => onDelete?.(entry.id)}
            title={entry.type === 'commitment' ? 'מחיקת כל הסדרה' : 'מחיקה'}
          >
            🗑
          </button>
        </div>
      </div>

      {entry.title && <div className={styles.title}>{entry.title}</div>}
      {entry.text && <div className={styles.text}>{entry.text}</div>}

      {entry.type === 'commitment' && (
        <button className={styles.recurrenceBadge} onClick={() => setIsEditingRecurrence(true)}>
          <span>🔁</span>
          <span>{getRecurrenceLabel(entry.recurrence)}</span>
          {entry.recurrenceUntil && (
            <span>
              עד {format(new Date(`${entry.recurrenceUntil}T00:00:00`), 'd.M.yy', { locale: he })}
            </span>
          )}
          <span className={styles.recurrenceEdit}>✏️</span>
        </button>
      )}

      {entry.url && (
        <a className={styles.linkBox} href={entry.url} target="_blank" rel="noopener noreferrer">
          <span>🔗</span>
          <span className={styles.linkText}>{getUrlDisplayText(entry.url)}</span>
        </a>
      )}

      {entry.photos?.length > 0 && (
        <div className={styles.photoGrid}>
          {entry.photos.map((photo) => (
            <div key={photo.id} className={styles.photoItem}>
              <img src={`/uploads/${photo.filePath}`} alt={photo.caption || meta.label} loading="lazy" />
              {photo.caption && <div className={styles.photoCaption}>{photo.caption}</div>}
            </div>
          ))}
        </div>
      )}

      {isEditingRecurrence && (
        <EditRecurrenceModal entry={entry} onClose={() => setIsEditingRecurrence(false)} />
      )}
    </div>
  );
}
