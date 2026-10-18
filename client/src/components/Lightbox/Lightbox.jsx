import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import styles from './Lightbox.module.css';

const SWIPE_THRESHOLD = 50;

export default function Lightbox({ photos, index, onIndexChange, onClose, coverPhotoId, onToggleCover }) {
  const touchStartX = useRef(null);
  const photo = photos[index];
  const hasMany = photos.length > 1;

  // RTL: the "next" photo sits to the left.
  const goNext = () => onIndexChange((index + 1) % photos.length);
  const goPrev = () => onIndexChange((index - 1 + photos.length) % photos.length);

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose();
      else if (hasMany && e.key === 'ArrowLeft') goNext();
      else if (hasMany && e.key === 'ArrowRight') goPrev();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  });

  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, []);

  const handleTouchEnd = (e) => {
    if (touchStartX.current === null || !hasMany) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (dx > SWIPE_THRESHOLD) goNext();
    else if (dx < -SWIPE_THRESHOLD) goPrev();
    touchStartX.current = null;
  };

  const isCover = coverPhotoId === photo.id;

  return createPortal(
    <div
      className={styles.overlay}
      onClick={onClose}
      onTouchStart={(e) => (touchStartX.current = e.touches[0].clientX)}
      onTouchEnd={handleTouchEnd}
      role="dialog"
      aria-modal="true"
    >
      <div className={styles.toolbar} onClick={(e) => e.stopPropagation()}>
        <button className={styles.toolButton} onClick={onClose} aria-label="סגירה">
          ✕
        </button>
        {hasMany && (
          <span className={styles.counter}>
            {index + 1} / {photos.length}
          </span>
        )}
        {onToggleCover && (
          <button
            className={`${styles.coverButton} ${isCover ? styles.coverActive : ''}`}
            onClick={() => onToggleCover(photo.id)}
          >
            {isCover ? '★ תמונת היום' : '☆ קבע/י כתמונת היום'}
          </button>
        )}
      </div>

      {hasMany && (
        <>
          <button
            className={`${styles.navButton} ${styles.navPrev}`}
            onClick={(e) => {
              e.stopPropagation();
              goPrev();
            }}
            aria-label="התמונה הקודמת"
          >
            ›
          </button>
          <button
            className={`${styles.navButton} ${styles.navNext}`}
            onClick={(e) => {
              e.stopPropagation();
              goNext();
            }}
            aria-label="התמונה הבאה"
          >
            ‹
          </button>
        </>
      )}

      <figure className={styles.figure} onClick={(e) => e.stopPropagation()}>
        <img key={photo.id} className={styles.image} src={`/uploads/${photo.filePath}`} alt={photo.caption || ''} />
        {photo.caption && <figcaption className={styles.caption}>{photo.caption}</figcaption>}
      </figure>
    </div>,
    document.body
  );
}
