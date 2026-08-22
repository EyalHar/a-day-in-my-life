import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getPrivateStatus, changePrivatePassword } from '../../api/private';
import { usePrivateSession } from '../../hooks/PrivateSessionContext';
import styles from './SettingsPage.module.css';

export default function SettingsPage() {
  const { isUnlocked, lock } = usePrivateSession();
  const { data } = useQuery({ queryKey: ['privateStatus'], queryFn: getPrivateStatus });
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState(null); // { type: 'error' | 'success', text }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage(null);
    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'הסיסמאות החדשות אינן תואמות' });
      return;
    }
    try {
      await changePrivatePassword(currentPassword, newPassword);
      setMessage({ type: 'success', text: 'הסיסמה עודכנה בהצלחה' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>
        <span>⚙️</span>
        <span>הגדרות</span>
      </h1>

      <div className={styles.section}>
        <div className={styles.sectionTitle}>🔒 תוכן פרטי</div>
        {isUnlocked && (
          <>
            <p className={styles.hint}>התוכן הפרטי כרגע פתוח בדפדפן הזה.</p>
            <button className={styles.secondaryButton} onClick={lock}>
              נעל עכשיו
            </button>
          </>
        )}
      </div>

      {data?.isConfigured ? (
        <div className={styles.section}>
          <div className={styles.sectionTitle}>שינוי סיסמה</div>
          <form className={styles.form} onSubmit={handleSubmit}>
            <input
              type="password"
              className={styles.input}
              placeholder="סיסמה נוכחית"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
            />
            <input
              type="password"
              className={styles.input}
              placeholder="סיסמה חדשה"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
            <input
              type="password"
              className={styles.input}
              placeholder="אימות סיסמה חדשה"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
            {message && (
              <div className={message.type === 'error' ? styles.error : styles.success}>{message.text}</div>
            )}
            <button type="submit" className={styles.button}>
              עדכן/י סיסמה
            </button>
          </form>
        </div>
      ) : (
        <div className={styles.section}>
          <p className={styles.hint}>
            עדיין לא הוגדרה סיסמה לתוכן פרטי. היא תוגדר אוטומטית בפעם הראשונה שתסמנו פריט כ"שמור/י לעצמי".
          </p>
        </div>
      )}
    </div>
  );
}
