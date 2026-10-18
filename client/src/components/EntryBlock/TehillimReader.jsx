import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getTehillimChapter } from '../../api/tehillim';
import { toggleTehillimRead } from '../../api/entries';
import styles from './TehillimReader.module.css';

const TOTAL_CHAPTERS = 150;

function formatChapterRange(chapters) {
  const first = chapters[0];
  const last = chapters[chapters.length - 1];
  return first === last ? `פרק ${first}` : `פרקים ${first}–${last}`;
}

function useToggleRead(entryId, date) {
  const queryClient = useQueryClient();
  const queryKey = ['day', date];

  return useMutation({
    mutationFn: (chapter) => toggleTehillimRead(entryId, date, chapter),
    onMutate: async (chapter) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData(queryKey);
      queryClient.setQueryData(queryKey, (day) => ({
        ...day,
        entries: day.entries.map((e) => {
          if (e.id !== entryId) return e;
          const wasRead = e.tehillimReadToday.includes(chapter);
          return {
            ...e,
            tehillimReadToday: wasRead
              ? e.tehillimReadToday.filter((c) => c !== chapter)
              : [...e.tehillimReadToday, chapter],
          };
        }),
      }));
      return { previous };
    },
    onError: (_err, _chapter, context) => queryClient.setQueryData(queryKey, context.previous),
    onSettled: () => queryClient.invalidateQueries({ queryKey }),
  });
}

function TehillimChapterCard({ chapter, isRead, onToggleRead }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const showText = !isRead || isExpanded;
  const { data, isLoading, isError } = useQuery({
    queryKey: ['tehillim', chapter],
    queryFn: () => getTehillimChapter(chapter),
    staleTime: Infinity,
  });

  return (
    <div className={`${styles.chapter} ${isRead ? styles.chapterRead : ''}`}>
      <div className={styles.chapterHeader}>
        <button
          type="button"
          className={styles.heRef}
          onClick={() => isRead && setIsExpanded((v) => !v)}
          disabled={!isRead}
          aria-expanded={showText}
        >
          {data?.heRef || `תהילים ${chapter}`}
          {isRead && <span className={styles.expandHint}>{isExpanded ? 'הסתר' : 'הצג'}</span>}
        </button>
        <button
          type="button"
          className={`${styles.readButton} ${isRead ? styles.readButtonDone : ''}`}
          onClick={() => {
            setIsExpanded(false);
            onToggleRead(chapter);
          }}
          aria-pressed={isRead}
        >
          {isRead ? '✓ נקרא' : 'סמן/י כנקרא'}
        </button>
      </div>

      {showText &&
        (isLoading ? (
          <div className={styles.status}>טוען פרק {chapter}...</div>
        ) : isError ? (
          <div className={styles.status}>שגיאה בטעינת פרק {chapter}</div>
        ) : (
          <div className={styles.verses}>
            {data.verses.map((verse, i) => (
              <div key={i} className={styles.verse}>
                <span className={styles.verseNumber}>{i + 1}</span>
                <span>{verse}</span>
              </div>
            ))}
          </div>
        ))}
    </div>
  );
}

export default function TehillimReader({ entry }) {
  const chapters = entry.tehillimToday;
  const isBookPlan = entry.tehillimPlan === 'complete';
  const readChapters = entry.tehillimReadToday || [];
  const toggleRead = useToggleRead(entry.id, entry.date);

  if (isBookPlan && !chapters?.length) {
    return <div className={styles.planBanner}>📚 סיום ספר תהילים · אין פרקים לקריאה היום</div>;
  }
  if (!chapters?.length) return null;

  const readCount = chapters.filter((c) => readChapters.includes(c)).length;
  const allRead = readCount === chapters.length;

  return (
    <div className={styles.wrapper}>
      {isBookPlan && (
        <div className={styles.planBanner}>
          📚 סיום ספר תהילים · היום: <strong>{formatChapterRange(chapters)}</strong>
          {chapters[chapters.length - 1] === TOTAL_CHAPTERS && ' · סיום הספר 🎉'}
        </div>
      )}

      <div className={styles.progress}>
        <div className={styles.progressText}>
          <span>{allRead ? '✓ כל הפרקים להיום נקראו' : `נקראו ${readCount} מתוך ${chapters.length} פרקים`}</span>
          {isBookPlan && (
            <span className={styles.bookProgress}>
              בספר כולו: {entry.tehillimBookChaptersRead}/{TOTAL_CHAPTERS}
            </span>
          )}
        </div>
        <div className={styles.progressTrack}>
          <div
            className={`${styles.progressFill} ${allRead ? styles.progressDone : ''}`}
            style={{ width: `${(readCount / chapters.length) * 100}%` }}
          />
        </div>
      </div>

      {chapters.map((chapter) => (
        <TehillimChapterCard
          key={chapter}
          chapter={chapter}
          isRead={readChapters.includes(chapter)}
          onToggleRead={(c) => toggleRead.mutate(c)}
        />
      ))}
    </div>
  );
}
