import { AUTO_COACHING_CUTOFF_DATE } from '../constants/autoCoachingConfig';

/**
 * Get the effective start date for auto-coaching checks
 * (whichever is later: 30 days ago or the cutoff date)
 */
export const getAutoCoachingStartDate = () => {
  const last30Days = new Date();
  last30Days.setDate(last30Days.getDate() - 30);
  return last30Days > AUTO_COACHING_CUTOFF_DATE ? last30Days : AUTO_COACHING_CUTOFF_DATE;
};

/**
 * Format date string to YYYY-MM-DD
 */
export const formatDateToYMD = (date) => {
  if (date instanceof Date) {
    return date.toISOString().split('T')[0];
  } else if (typeof date === 'string') {
    const dateObj = new Date(date);
    if (!isNaN(dateObj.getTime())) {
      return dateObj.toISOString().split('T')[0];
    }
    return date.split('T')[0];
  }
  return null;
};

/**
 * Check if a date is on or after the cutoff date
 */
export const isAfterCutoff = (date) => {
  const recordDate = new Date(date);
  return recordDate >= AUTO_COACHING_CUTOFF_DATE;
};

/**
 * Get day name from date string
 */
export const getDayName = (dateStr) => {
  return new Date(dateStr).toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
};
