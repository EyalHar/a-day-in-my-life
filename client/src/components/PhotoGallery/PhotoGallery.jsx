import { useState } from 'react';
import Lightbox from '../Lightbox/Lightbox';
import styles from './PhotoGallery.module.css';

const MAX_TILES = 3;

function SinglePhoto({ photo, alt, isCover, onOpen }) {
  const src = `/uploads/${photo.filePath}`;
  return (
    <button className={styles.single} onClick={onOpen} aria-label="הגדלת התמונה">
      <img className={styles.backdrop} src={src} alt="" aria-hidden="true" />
      <img className={styles.singleImage} src={src} alt={photo.caption || alt} loading="lazy" />
      {isCover && <span className={styles.coverBadge}>★ תמונת היום</span>}
      {photo.caption && <span className={styles.overlayCaption}>{photo.caption}</span>}
    </button>
  );
}

export default function PhotoGallery({ photos, alt, coverPhotoId, onToggleCover }) {
  const [openIndex, setOpenIndex] = useState(null);
  const visible = photos.slice(0, MAX_TILES);
  const hiddenCount = photos.length - visible.length;
  const layoutClass = photos.length === 1 ? '' : photos.length === 2 ? styles.two : styles.many;

  return (
    <>
      {photos.length === 1 ? (
        <div className={styles.gallery}>
          <SinglePhoto
            photo={photos[0]}
            alt={alt}
            isCover={coverPhotoId === photos[0].id}
            onOpen={() => setOpenIndex(0)}
          />
        </div>
      ) : (
        <div className={`${styles.gallery} ${styles.grid} ${layoutClass}`}>
          {visible.map((photo, i) => (
            <button
              key={photo.id}
              className={styles.tile}
              onClick={() => setOpenIndex(i)}
              aria-label="הגדלת התמונה"
            >
              <img src={`/uploads/${photo.filePath}`} alt={photo.caption || alt} loading="lazy" />
              {coverPhotoId === photo.id && <span className={styles.coverBadge}>★</span>}
              {hiddenCount > 0 && i === visible.length - 1 && (
                <span className={styles.moreOverlay}>+{hiddenCount}</span>
              )}
            </button>
          ))}
        </div>
      )}

      {openIndex !== null && (
        <Lightbox
          photos={photos}
          index={openIndex}
          onIndexChange={setOpenIndex}
          onClose={() => setOpenIndex(null)}
          coverPhotoId={coverPhotoId}
          onToggleCover={onToggleCover}
        />
      )}
    </>
  );
}
