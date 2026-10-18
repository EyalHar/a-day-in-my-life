import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import { getEntryTypeMeta } from '../../entryTypes';
import { getOccurrenceUnit, getRecurrenceLabel } from '../../recurrence';
import { toggleEntryCompletion } from '../../api/entries';
import { usePrivateSession } from '../../hooks/PrivateSessionContext';
import EditCommitmentModal from './EditCommitmentModal';
import TehillimReader from './TehillimReader';
import PhotoGallery from '../PhotoGallery/PhotoGallery';
import styles from './EntryBlock.module.css';

function getUrlDisplayText(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}

export default function EntryBlock({ entry, onDelete, coverPhotoId, onToggleCover }) {
  const { openUnlockModal } = usePrivateSession();
  const meta = getEntryTypeMeta(entry.type);
  const [isEditingCommitment, setIsEditingCommitment] = useState(false);
  const queryClient = useQueryClient();

  const completeMutation = useMutation({
    mutationFn: () => toggleEntryCompletion(entry.id, entry.date),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['day', entry.date] }),
  });

  if (entry.locked) {
    return (
      <div className={styles.lockedCard} onClick={openUnlockModal}>
        <span>🔒</span>
        <span>תוכן פרטי — לחץ/י כדי לפתוח</span>
      </div>
    );
  }

  const time = !entry.recurring && entry.createdAt ? format(new Date(entry.createdAt.replace(' ', 'T')), 'HH:mm') : '';

  const isCommitment = entry.type === 'commitment';

  return (
    <div
      className={`${styles.card} ${isCommitment && entry.completed ? styles.cardCompleted : ''}`}
      style={{
        '--accent-color': `var(--type-${entry.type}-accent)`,
        '--accent-tint': `var(--type-${entry.type}-tint)`,
      }}
    >
      <div className={styles.header}>
        <div className={styles.headerStart}>
          {isCommitment && (
            <button
              className={styles.completeCheckbox}
              onClick={() => completeMutation.mutate()}
              disabled={completeMutation.isPending}
              title={entry.completed ? 'בטל/י סימון ביצוע' : 'סמן/י שביצעת'}
              aria-label={entry.completed ? 'בוצע' : 'סמן/י שביצעת'}
            >
              {entry.completed ? '✅' : '⬜'}
            </button>
          )}
          <span className={styles.typeChip}>
            <span>{meta.icon}</span>
            <span>{meta.label}</span>
            {entry.isPrivate && <span title="פרטי">🔒</span>}
          </span>
          {entry.occurrenceNumber && (
            <span className={styles.dayCounter}>
              {getOccurrenceUnit(entry.recurrence).singular} {entry.occurrenceNumber}
              {entry.occurrenceTotal && <span className={styles.dayCounterTotal}> מתוך {entry.occurrenceTotal}</span>}
            </span>
          )}
        </div>
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
        <>
          <button className={styles.recurrenceBadge} onClick={() => setIsEditingCommitment(true)}>
            <span>{entry.recurrence === 'once' ? '☑️' : '🔁'}</span>
            <span>{getRecurrenceLabel(entry.recurrence)}</span>
            {entry.recurrenceUntil && (
              <span>
                עד {format(new Date(`${entry.recurrenceUntil}T00:00:00`), 'd.M.yy', { locale: he })}
              </span>
            )}
            <span className={styles.recurrenceEdit}>✏️</span>
          </button>
          <TehillimReader entry={entry} />
        </>
      )}

      {entry.url && (
        <a className={styles.linkBox} href={entry.url} target="_blank" rel="noopener noreferrer">
          <span>🔗</span>
          <span className={styles.linkText}>{getUrlDisplayText(entry.url)}</span>
        </a>
      )}

      {entry.photos?.length > 0 && (
        <PhotoGallery
          photos={entry.photos}
          alt={meta.label}
          coverPhotoId={coverPhotoId}
          onToggleCover={entry.recurring ? undefined : onToggleCover}
        />
      )}

      {isEditingCommitment && (
        <EditCommitmentModal entry={entry} onClose={() => setIsEditingCommitment(false)} />
      )}
    </div>
  );
}
