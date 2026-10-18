import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createEntry } from '../../api/entries';
import { getEntryTypeMeta } from '../../entryTypes';
import { RECURRENCE_OPTIONS, getOccurrenceUnit, getTotalOccurrences } from '../../recurrence';
import TehillimChapterPicker from '../TehillimChapterPicker/TehillimChapterPicker';
import RecurrenceEndPicker from '../RecurrenceEndPicker/RecurrenceEndPicker';
import styles from './AddEntryForm.module.css';

export default function AddEntryForm({ date, type, onClose }) {
  const meta = getEntryTypeMeta(type);
  const isCommitment = type === 'commitment';
  const queryClient = useQueryClient();
  const [title, setTitle] = useState('');
  const [text, setText] = useState('');
  const [url, setUrl] = useState('');
  const [recurrence, setRecurrence] = useState('daily');
  const [endMode, setEndMode] = useState('none');
  const [recurrenceUntil, setRecurrenceUntil] = useState('');
  const [recurrenceCount, setRecurrenceCount] = useState('');
  const [tehillimChapters, setTehillimChapters] = useState([]);
  const [tehillimPlan, setTehillimPlan] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [photos, setPhotos] = useState([]); // { file, previewUrl, caption }
  const [error, setError] = useState('');

  const mutation = useMutation({
    mutationFn: () =>
      createEntry({
        date,
        type,
        title,
        text,
        url,
        recurrence,
        recurrenceUntil: endMode === 'until' ? recurrenceUntil : '',
        recurrenceCount: endMode === 'count' ? recurrenceCount : '',
        tehillimChapters: tehillimPlan ? [] : tehillimChapters,
        tehillimPlan,
        isPrivate,
        photos,
      }),
    onSuccess: () => {
      // A commitment can recur onto other already-cached future days, so invalidate broadly.
      queryClient.invalidateQueries({ queryKey: ['day'] });
      queryClient.invalidateQueries({ queryKey: ['monthSummary'] });
      onClose();
    },
    onError: (err) => setError(err.message),
  });

  const totalOccurrences = getTotalOccurrences({
    originDate: date,
    recurrence,
    endMode,
    until: recurrenceUntil,
    count: recurrenceCount,
  });

  const handleFilesSelected = (e) => {
    const files = Array.from(e.target.files || []);
    setPhotos((prev) => [
      ...prev,
      ...files.map((file) => ({ file, previewUrl: URL.createObjectURL(file), caption: '' })),
    ]);
    e.target.value = '';
  };

  const updateCaption = (index, caption) => {
    setPhotos((prev) => prev.map((p, i) => (i === index ? { ...p, caption } : p)));
  };

  const removePhoto = (index) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    if (!text.trim() && !title.trim() && !url.trim() && photos.length === 0) {
      setError('הוסף/י טקסט, קישור או תמונה לפחות');
      return;
    }
    if (isCommitment && recurrence !== 'once' && endMode === 'count' && !(Number(recurrenceCount) >= 1)) {
      setError('הזן/י מספר ימים (1 ומעלה)');
      return;
    }
    if (isCommitment && tehillimPlan === 'complete' && !totalOccurrences) {
      setError('כדי לחלק את ספר תהילים צריך להגדיר מספר ימים או תאריך סיום');
      return;
    }
    mutation.mutate();
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <span>{meta.icon}</span>
          <span>{meta.label}</span>
        </div>

        <form className={styles.form} onSubmit={handleSubmit}>
          <input
            className={styles.input}
            placeholder="כותרת (אופציונלי)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            autoFocus
          />
          <textarea
            className={styles.textarea}
            placeholder="מה קרה?"
            value={text}
            onChange={(e) => setText(e.target.value)}
          />

          <input
            className={styles.input}
            type="text"
            placeholder="🔗 קישור (אופציונלי)"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />

          {isCommitment && (
            <div className={styles.recurrenceRow}>
              <label className={styles.recurrenceField}>
                <span>🔁 יופיע</span>
                <select
                  className={styles.select}
                  value={recurrence}
                  onChange={(e) => setRecurrence(e.target.value)}
                >
                  {RECURRENCE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </label>
              {recurrence !== 'once' && (
                <div className={styles.recurrenceField}>
                  <span>🏁 עד מתי</span>
                  <RecurrenceEndPicker
                    originDate={date}
                    recurrence={recurrence}
                    endMode={endMode}
                    onEndModeChange={setEndMode}
                    until={recurrenceUntil}
                    onUntilChange={setRecurrenceUntil}
                    count={recurrenceCount}
                    onCountChange={setRecurrenceCount}
                  />
                </div>
              )}
            </div>
          )}

          {isCommitment && (
            <TehillimChapterPicker
              chapters={tehillimChapters}
              onChange={setTehillimChapters}
              plan={tehillimPlan}
              onPlanChange={setTehillimPlan}
              totalDays={totalOccurrences}
              unit={getOccurrenceUnit(recurrence)}
            />
          )}

          <label className={styles.photoInputLabel}>
            <span>📷</span>
            <span>הוסף/י תמונות</span>
            <input type="file" accept="image/*" multiple hidden onChange={handleFilesSelected} />
          </label>

          {photos.length > 0 && (
            <div className={styles.photoPreviewGrid}>
              {photos.map((photo, i) => (
                <div key={photo.previewUrl} className={styles.photoPreview}>
                  <img src={photo.previewUrl} alt="" />
                  <input
                    className={styles.captionInput}
                    placeholder="כיתוב"
                    value={photo.caption}
                    onChange={(e) => updateCaption(i, e.target.value)}
                  />
                  <button type="button" className={styles.button} onClick={() => removePhoto(i)}>
                    הסר
                  </button>
                </div>
              ))}
            </div>
          )}

          <label className={styles.privateToggle}>
            <input type="checkbox" checked={isPrivate} onChange={(e) => setIsPrivate(e.target.checked)} />
            <span>🔒 שמור/י לעצמי (תוכן פרטי)</span>
          </label>

          {error && <div className={styles.error}>{error}</div>}

          <div className={styles.actions}>
            <button type="button" className={`${styles.button} ${styles.secondary}`} onClick={onClose}>
              ביטול
            </button>
            <button type="submit" className={`${styles.button} ${styles.primary}`} disabled={mutation.isPending}>
              {mutation.isPending ? 'שומר...' : 'שמור'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
