export const ENTRY_TYPES = [
  { value: 'photo', label: 'תמונה', icon: '📷' },
  { value: 'note', label: 'כתיבה', icon: '✍️' },
  { value: 'thought', label: 'מחשבה', icon: '💭' },
  { value: 'recipe', label: 'מתכון', icon: '🍲' },
  { value: 'commitment', label: 'קבלה על עצמי', icon: '🌱' },
  { value: 'plan', label: 'תכנון', icon: '🗺️' },
  { value: 'dream', label: 'חלום', icon: '🌙' },
  { value: 'other', label: 'אחר', icon: '✨' },
];

export function getEntryTypeMeta(type) {
  return ENTRY_TYPES.find((t) => t.value === type) || ENTRY_TYPES[ENTRY_TYPES.length - 1];
}
