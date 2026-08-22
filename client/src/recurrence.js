export const RECURRENCE_OPTIONS = [
  { value: 'daily', label: 'כל יום' },
  { value: 'weekly', label: 'פעם בשבוע' },
  { value: 'monthly', label: 'פעם בחודש' },
];

export function getRecurrenceLabel(recurrence) {
  return RECURRENCE_OPTIONS.find((o) => o.value === recurrence)?.label || '';
}
