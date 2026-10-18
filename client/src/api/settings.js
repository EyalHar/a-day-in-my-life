import { apiGet, apiPutJson } from './client';

export function getReminderSettings() {
  return apiGet('/settings/reminders');
}

export function updateReminderSettings(settings) {
  return apiPutJson('/settings/reminders', settings);
}
