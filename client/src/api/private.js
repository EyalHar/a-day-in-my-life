import { apiGet, apiPostJson } from './client';

export function getPrivateStatus() {
  return apiGet('/private/status');
}

export function setupPrivatePassword(password) {
  return apiPostJson('/private/setup', { password });
}

export function unlockPrivate(password) {
  return apiPostJson('/private/unlock', { password });
}

export function changePrivatePassword(currentPassword, newPassword) {
  return apiPostJson('/private/change', { currentPassword, newPassword });
}
