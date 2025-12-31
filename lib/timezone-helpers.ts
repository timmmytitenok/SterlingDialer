/**
 * Timezone Helper Functions
 * Fixes the issue where day resets at 7pm instead of midnight in user's timezone
 */

/**
 * Get the start of today in the user's timezone (midnight)
 * @param userTimezone - IANA timezone string (e.g., "America/Los_Angeles")
 * @returns ISO string representing midnight today in user's timezone
 */
export function getStartOfTodayInUserTimezone(userTimezone: string): string {
  const now = new Date();
  
  // Get the current date components in the user's timezone
  const userDate = new Intl.DateTimeFormat('en-US', {
    timeZone: userTimezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);
  
  // Parse the date (MM/DD/YYYY format)
  const [month, day, year] = userDate.split('/');
  
  // Create a date string in ISO format for midnight in user's timezone
  // Using a trick: create the date string and parse it with timezone
  const midnightStr = `${year}-${month}-${day}T00:00:00`;
  
  // Convert to ISO string accounting for timezone offset
  const userMidnight = new Date(midnightStr + getTimezoneOffset(userTimezone));
  
  return userMidnight.toISOString();
}

/**
 * Get timezone offset string (e.g., "-08:00" for PST)
 */
function getTimezoneOffset(userTimezone: string): string {
  const date = new Date();
  const utcDate = new Date(date.toLocaleString('en-US', { timeZone: 'UTC' }));
  const tzDate = new Date(date.toLocaleString('en-US', { timeZone: userTimezone }));
  const offset = (utcDate.getTime() - tzDate.getTime()) / (1000 * 60); // minutes
  
  const hours = Math.floor(Math.abs(offset) / 60);
  const minutes = Math.abs(offset) % 60;
  const sign = offset <= 0 ? '+' : '-';
  
  return `${sign}${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

/**
 * Get start of N days ago in user's timezone
 */
export function getDaysAgoInUserTimezone(userTimezone: string, daysAgo: number): string {
  const now = new Date();
  const targetDate = new Date(now);
  targetDate.setDate(targetDate.getDate() - daysAgo);
  
  // Get the date components in the user's timezone
  const userDate = new Intl.DateTimeFormat('en-US', {
    timeZone: userTimezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(targetDate);
  
  const [month, day, year] = userDate.split('/');
  const midnightStr = `${year}-${month}-${day}T00:00:00`;
  const userMidnight = new Date(midnightStr + getTimezoneOffset(userTimezone));
  
  return userMidnight.toISOString();
}

/**
 * Get current date string in user's timezone (YYYY-MM-DD)
 * NOTE: This is used for display purposes only
 */
export function getTodayDateString(userTimezone: string): string {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat('en-CA', { // en-CA uses YYYY-MM-DD format
    timeZone: userTimezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  
  return formatter.format(now);
}

/**
 * Get current date string in EST timezone (YYYY-MM-DD)
 * ALWAYS uses America/New_York so ALL users reset at midnight EST
 * This is used for daily counter resets (calls_made_today, today_spend, etc.)
 */
export function getEstDateString(): string {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat('en-CA', { // en-CA uses YYYY-MM-DD format
    timeZone: 'America/New_York', // ALWAYS EST - midnight reset for ALL users
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  
  return formatter.format(now);
}

/**
 * Check if a timestamp is today in the user's timezone
 */
export function isToday(timestamp: string, userTimezone: string): boolean {
  const todayStr = getTodayDateString(userTimezone);
  const timestampDate = new Date(timestamp);
  
  const timestampStr = new Intl.DateTimeFormat('en-CA', {
    timeZone: userTimezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(timestampDate);
  
  return timestampStr === todayStr;
}

/**
 * Get date string for N days ago in user's timezone (YYYY-MM-DD)
 */
export function getDateStringDaysAgo(userTimezone: string, daysAgo: number): string {
  const now = new Date();
  const targetDate = new Date(now);
  targetDate.setDate(targetDate.getDate() - daysAgo);
  
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: userTimezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  
  return formatter.format(targetDate);
}

