import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getPrivateStatus, setupPrivatePassword, unlockPrivate } from '../../api/private';
import { usePrivateSession } from '../../hooks/PrivateSessionContext';
import styles from './PrivateLock.module.css';

export default function PrivateLock() {
  const { isModalOpen, closeUnlockModal, unlock } = usePrivateSession();
  const { data, isLoading } = useQuery({
    queryKey: ['privateStatus'],
    queryFn: getPrivateStatus,
    enabled: isModalOpen,
  });
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isModalOpen || isLoading) return null;

  const isConfigured = data?.isConfigured;

  const handleClose = () => {
    setPassword('');
    setConfirmPassword('');
    setError('');
    closeUnlockModal();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!isConfigured && password !== confirmPassword) {
      setError('הסיסמאות אינן תואמות');
      return;
    }

    setIsSubmitting(true);
    try {
      if (!isConfigured) {
        await setupPrivatePassword(password);
      }
      const { token } = await unlockPrivate(password);
      unlock(token);
      setPassword('');
      setConfirmPassword('');
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.overlay} onClick={handleClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.icon}>🔒</div>
        <h2 className={styles.title}>{isConfigured ? 'תוכן פרטי' : 'הגדרת סיסמה'}</h2>
        <p className={styles.subtitle}>
          {isConfigured ? 'הזן/י את הסיסמה כדי לצפות בתוכן הפרטי' : 'בחר/י סיסמה שתגן על התוכן שתסמן/י כפרטי'}
        </p>
        <form className={styles.form} onSubmit={handleSubmit}>
          <input
            type="password"
            className={styles.input}
            placeholder="סיסמה"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoFocus
          />
          {!isConfigured && (
            <input
              type="password"
              className={styles.input}
              placeholder="אימות סיסמה"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          )}
          {error && <div className={styles.error}>{error}</div>}
          <div className={styles.actions}>
            <button type="button" className={`${styles.button} ${styles.secondary}`} onClick={handleClose}>
              ביטול
            </button>
            <button type="submit" className={`${styles.button} ${styles.primary}`} disabled={isSubmitting}>
              {isConfigured ? 'פתח' : 'שמור והפעל'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
