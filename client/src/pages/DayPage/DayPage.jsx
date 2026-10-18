import { useParams } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useDay, useDayCover } from '../../hooks/useDay';
import { deleteEntry } from '../../api/entries';
import Calendar from '../../components/Calendar/Calendar';
import DayCover from '../../components/DayCover/DayCover';
import EntryBlock from '../../components/EntryBlock/EntryBlock';
import AddEntryMenu from '../../components/AddEntryMenu/AddEntryMenu';
import styles from './DayPage.module.css';

export default function DayPage() {
  const { date } = useParams();
  const { data, isLoading } = useDay(date);
  const { coverPhotoId, toggleCover, clearCover } = useDayCover(date);
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: (id) => deleteEntry(id),
    onSuccess: () => {
      // Broad invalidation: a deleted commitment can disappear from many future dates at once.
      queryClient.invalidateQueries({ queryKey: ['day'] });
      queryClient.invalidateQueries({ queryKey: ['monthSummary'] });
    },
  });

  return (
    <div className={styles.page}>
      <Calendar selectedDate={date} />

      {data?.cover && <DayCover cover={data.cover} date={date} onRemove={clearCover} />}

      {isLoading ? (
        <div className={styles.loading}>טוען...</div>
      ) : data.entries.length === 0 ? (
        <div className={styles.empty}>
          <div className={styles.emptyIcon}>📖</div>
          <div className={styles.emptyTitle}>מה קרה היום?</div>
          <p>לחצו על + כדי להוסיף תמונה, מחשבה, מתכון או כל דבר אחר שבא לכם לשמור</p>
        </div>
      ) : (
        <div className={styles.feed}>
          {data.entries.map((entry) => (
            <EntryBlock
              key={entry.id}
              entry={entry}
              onDelete={(id) => deleteMutation.mutate(id)}
              coverPhotoId={coverPhotoId}
              onToggleCover={toggleCover}
            />
          ))}
        </div>
      )}

      <AddEntryMenu date={date} />
    </div>
  );
}
