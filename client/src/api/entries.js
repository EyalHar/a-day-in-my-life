import { apiPostForm, apiPostJson, apiPutJson, apiDelete } from './client';

export function createEntry({
  date,
  type,
  title,
  text,
  url,
  recurrence,
  recurrenceUntil,
  recurrenceCount,
  tehillimChapters,
  tehillimPlan,
  isPrivate,
  photos,
}) {
  const formData = new FormData();
  formData.append('date', date);
  formData.append('type', type);
  if (title) formData.append('title', title);
  if (text) formData.append('text', text);
  if (url) formData.append('url', url);
  if (type === 'commitment') {
    formData.append('recurrence', recurrence || 'daily');
    if (recurrenceUntil) formData.append('recurrenceUntil', recurrenceUntil);
    if (recurrenceCount) formData.append('recurrenceCount', recurrenceCount);
    if (tehillimChapters?.length) formData.append('tehillimChapters', JSON.stringify(tehillimChapters));
    if (tehillimPlan) formData.append('tehillimPlan', tehillimPlan);
  }
  formData.append('isPrivate', isPrivate ? 'true' : 'false');

  if (photos?.length) {
    formData.append('captions', JSON.stringify(photos.map((p) => p.caption || '')));
    photos.forEach((p) => formData.append('photos', p.file));
  }

  return apiPostForm('/entries', formData);
}

export function updateEntry(id, data) {
  return apiPutJson(`/entries/${id}`, data);
}

export function deleteEntry(id) {
  return apiDelete(`/entries/${id}`);
}

export function toggleEntryCompletion(id, date) {
  return apiPostJson(`/entries/${id}/toggle-complete`, { date });
}

export function toggleTehillimRead(id, date, chapter) {
  return apiPostJson(`/entries/${id}/tehillim-read`, { date, chapter });
}
