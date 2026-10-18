import { useState } from 'react';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import { getHebrewFullDate } from '../../hebrewDate';
import Lightbox from '../Lightbox/Lightbox';
import styles from './DayCover.module.css';

export default function DayCover({ cover, date, onRemove }) {
  const [isOpen, setIsOpen] = useState(false);
  const day = new Date(`${date}T00:00:00`);
  const photo = { id: cover.photoId, filePath: cover.filePath, caption: cover.caption };

  return (
    <div className={styles.cover}>
      <button className={styles.imageButton} onClick={() => setIsOpen(true)} aria-label="הגדלת תמונת היום">
        <img className={styles.image} src={`/uploads/${cover.filePath}`} alt={cover.caption || 'תמונת היום'} />
      </button>

      <div className={styles.text}>
        <div className={styles.date}>{format(day, 'EEEE, d בMMMM yyyy', { locale: he })}</div>
        <div className={styles.hebrewDate}>{getHebrewFullDate(day)}</div>
      </div>

      <button className={styles.removeButton} onClick={onRemove} title="הסרת תמונת היום">
        ✕
      </button>

      {isOpen && <Lightbox photos={[photo]} index={0} onIndexChange={() => {}} onClose={() => setIsOpen(false)} />}
    </div>
  );
}
