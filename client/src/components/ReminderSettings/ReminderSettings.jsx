import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getReminderSettings, updateReminderSettings } from '../../api/settings';
import { getNotificationPermission, requestNotificationPermission, showReminderNotification } from '../../reminders';
import SegmentedControl from '../SegmentedControl/SegmentedControl';
import styles from './ReminderSettings.module.css';

const DEFAULT_START = '08:00';
const DEFAULT_END = '22:00';

const RANGE_OPTIONS = [
  { value: 'allDay', label: 'כל היום' },
  { value: 'range', label: 'טווח שעות' },
];

const PERMISSION_MESSAGES = {
  denied: 'הדפדפן חוסם התראות מהאתר. כדי לאפשר: לחצו על סמל המנעול/המידע בשורת הכתובת ← התראות ← אישור.',
  unsupported: 'הדפדפן הזה לא תומך בהתראות.',
};

export default function ReminderSettings() {
  const queryClient = useQueryClient();
  const { data: settings } = useQuery({ queryKey: ['reminderSettings'], queryFn: getReminderSettings });
  const [permission, setPermission] = useState(getNotificationPermission);
  const [error, setError] = useState('');

  const mutation = useMutation({
    mutationFn: updateReminderSettings,
    onSuccess: (saved) => queryClient.setQueryData(['reminderSettings'], saved),
    onError: (err) => setError(err.message),
  });

  if (!settings) return null;

  const save = (changes) => {
    setError('');
    mutation.mutate({ ...settings, ...changes });
  };

  const handleToggle = async () => {
    if (settings.enabled) {
      save({ enabled: false });
      return;
    }
    const result = permission === 'granted' ? 'granted' : await requestNotificationPermission();
    setPermission(result);
    if (result === 'granted') save({ enabled: true });
  };

  const isAllDay = !settings.startTime;

  return (
    <div className={styles.section}>
      <div className={styles.headerRow}>
        <div>
          <div className={styles.sectionTitle}>🔔 תזכורות לקבלות</div>
          <p className={styles.hint}>
            כשהאפליקציה פתוחה בטאב שאינו פעיל ויש היום קבלה שעוד לא סומנה כבוצעה — תקפוץ תזכורת בכל שעה עגולה.
            לחיצה על התזכורת תחזיר אותך לטאב, ליום הנוכחי.
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={settings.enabled}
          aria-label="הפעלת תזכורות"
          className={`${styles.switch} ${settings.enabled ? styles.switchOn : ''}`}
          onClick={handleToggle}
          disabled={mutation.isPending || permission === 'unsupported'}
        >
          <span className={styles.switchThumb} />
        </button>
      </div>

      {PERMISSION_MESSAGES[permission] && <div className={styles.warning}>{PERMISSION_MESSAGES[permission]}</div>}

      {settings.enabled && (
        <div className={styles.body}>
          <SegmentedControl
            options={RANGE_OPTIONS}
            value={isAllDay ? 'allDay' : 'range'}
            onChange={(v) =>
              save(v === 'allDay' ? { startTime: null, endTime: null } : { startTime: DEFAULT_START, endTime: DEFAULT_END })
            }
            ariaLabel="שעות התזכורת"
          />

          {!isAllDay && (
            <div className={styles.timeRow}>
              <label className={styles.timeField}>
                <span>מהשעה</span>
                <input
                  type="time"
                  value={settings.startTime}
                  onChange={(e) => e.target.value && save({ startTime: e.target.value })}
                />
              </label>
              <label className={styles.timeField}>
                <span>עד השעה</span>
                <input
                  type="time"
                  value={settings.endTime}
                  onChange={(e) => e.target.value && save({ endTime: e.target.value })}
                />
              </label>
            </div>
          )}

          <button type="button" className={styles.testButton} onClick={() => showReminderNotification(1)}>
            שליחת התראת בדיקה
          </button>
        </div>
      )}

      {error && <div className={styles.error}>{error}</div>}
    </div>
  );
}
