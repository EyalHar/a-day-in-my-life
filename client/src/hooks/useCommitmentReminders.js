import { useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { getReminderSettings } from '../api/settings';
import { getPendingCommitments } from '../api/days';
import {
  getNotificationPermission,
  isReminderDue,
  readLastCheckAt,
  readLastReminderAt,
  showReminderNotification,
  withReminderLock,
  writeLastCheckAt,
  writeLastReminderAt,
} from '../reminders';

// Hidden tabs get their timers throttled to about once a minute anyway, so polling more often is pointless.
const CHECK_INTERVAL_MS = 60 * 1000;

function todayStr() {
  return format(new Date(), 'yyyy-MM-dd');
}

export function useCommitmentReminders() {
  const navigate = useNavigate();
  const { data: settings } = useQuery({ queryKey: ['reminderSettings'], queryFn: getReminderSettings });
  const settingsRef = useRef(settings);
  const checkRef = useRef(null);
  const remindedWhileHiddenRef = useRef(false);

  useEffect(() => {
    settingsRef.current = settings;
    // Run right away once settings load, so a reminder missed while the browser was closed fires on open.
    checkRef.current?.();
  }, [settings]);

  useEffect(() => {
    const originalTitle = document.title;
    const goToToday = () => navigate(`/day/${todayStr()}`);

    const check = async () => {
      const current = settingsRef.current;
      if (!current) return;

      const now = new Date();
      const lastCheckAt = readLastCheckAt();
      writeLastCheckAt(now.getTime());

      if (!current.enabled || !document.hidden || getNotificationPermission() !== 'granted') return;
      const isDue = isReminderDue({
        now,
        lastCheckAt,
        lastReminderAt: readLastReminderAt(),
        startTime: current.startTime,
        endTime: current.endTime,
      });
      if (!isDue) return;

      const { count } = await getPendingCommitments(todayStr());
      if (!count) return;

      writeLastReminderAt(Date.now());
      remindedWhileHiddenRef.current = true;
      document.title = `🔔 (${count}) קבלה ממתינה · ${originalTitle}`;
      showReminderNotification(count, goToToday);
    };
    checkRef.current = () => withReminderLock(check).catch(() => {});

    const handleVisibility = () => {
      if (document.hidden || !remindedWhileHiddenRef.current) return;
      remindedWhileHiddenRef.current = false;
      document.title = originalTitle;
      goToToday();
    };

    const interval = setInterval(checkRef.current, CHECK_INTERVAL_MS);
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibility);
      document.title = originalTitle;
      checkRef.current = null;
    };
  }, [navigate]);
}
