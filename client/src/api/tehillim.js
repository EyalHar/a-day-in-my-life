import { apiGet } from './client';

export function getTehillimChapter(chapter) {
  return apiGet(`/tehillim/${chapter}`);
}
