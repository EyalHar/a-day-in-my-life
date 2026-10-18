import { apiDelete, apiGet, apiPutJson } from './client';

export function getDay(date) {
  return apiGet(`/days/${date}`);
}

export function getMonthSummary(month) {
  return apiGet(`/days/summary/month?month=${month}`);
}

export function getPendingCommitments(date) {
  return apiGet(`/days/${date}/pending-commitments`);
}

export function setDayCover(date, photoId) {
  return apiPutJson(`/days/${date}/cover`, { photoId });
}

export function clearDayCover(date) {
  return apiDelete(`/days/${date}/cover`);
}
