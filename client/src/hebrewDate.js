import { HDate, gematriya, Locale } from '@hebcal/hdate';

export function getHebrewDayLetters(date) {
  return gematriya(new HDate(date).getDate());
}

export function getHebrewMonthName(date) {
  const hd = new HDate(date);
  return Locale.gettext(hd.getMonthName(), 'he-x-NoNikud');
}

export function isRoshChodesh(date) {
  return new HDate(date).getDate() === 1;
}

export function getHebrewFullDate(date) {
  const hd = new HDate(date);
  const day = gematriya(hd.getDate());
  const month = Locale.gettext(hd.getMonthName(), 'he-x-NoNikud');
  const year = gematriya(hd.getFullYear());
  return `${day} ב${month} ${year}`;
}
