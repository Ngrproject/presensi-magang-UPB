/**
 * Utility functions for local timezone-safe date operations.
 * Resolves the issue where new Date().toISOString().split('T')[0]
 * causes the date to be yesterday during morning hours (00:00 - 06:59 WIB, UTC+7).
 */

/**
 * Returns YYYY-MM-DD formatted date string in user's LOCAL timezone.
 * @param {Date|string|number} [date=new Date()]
 * @returns {string} e.g. "2026-11-11"
 */
export function getLocalDateStr(date = new Date()) {
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return '';
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Returns YYYY-MM formatted month string in user's LOCAL timezone.
 * @param {Date|string|number} [date=new Date()]
 * @returns {string} e.g. "2026-11"
 */
export function getLocalMonthStr(date = new Date()) {
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return '';
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

