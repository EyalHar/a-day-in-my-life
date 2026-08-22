import { apiGet } from './client';

export function getDay(date) {
  return apiGet(`/days/${date}`);
}

export function getMonthSummary(month) {
  return apiGet(`/days/summary/month?month=${month}`);
}
