export interface TimeUnit {
  years?: number;
  months?: number;
  days?: number;
  hours?: number;
  minutes?: number;
  seconds?: number;
  milliseconds?: number;
}

export interface TimeDiff {
  years: number;
  months: number;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  milliseconds: number;
  totalMilliseconds: number;
}

export function formatDate(date: Date, format: string): string {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const seconds = date.getSeconds();
  const milliseconds = date.getMilliseconds();
  
  return format
    .replace(/yyyy/g, year.toString())
    .replace(/yy/g, year.toString().slice(-2))
    .replace(/MM/g, month.toString().padStart(2, '0'))
    .replace(/M/g, month.toString())
    .replace(/dd/g, day.toString().padStart(2, '0'))
    .replace(/d/g, day.toString())
    .replace(/HH/g, hours.toString().padStart(2, '0'))
    .replace(/H/g, hours.toString())
    .replace(/mm/g, minutes.toString().padStart(2, '0'))
    .replace(/m/g, minutes.toString())
    .replace(/ss/g, seconds.toString().padStart(2, '0'))
    .replace(/s/g, seconds.toString())
    .replace(/SSS/g, milliseconds.toString().padStart(3, '0'));
}

export function parseDate(dateString: string, format?: string): Date {
  if (!format) {
    return new Date(dateString);
  }
  
  const formatTokens = format.match(/yyyy|yy|MM?|dd?|HH?|mm?|ss?|SSS/g) || [];
  const dateTokens = dateString.match(/\d+/g) || [];
  
  if (formatTokens.length !== dateTokens.length) {
    throw new Error('Date string does not match format');
  }
  
  let year = new Date().getFullYear();
  let month = 0;
  let day = 1;
  let hours = 0;
  let minutes = 0;
  let seconds = 0;
  let milliseconds = 0;
  
  formatTokens.forEach((token, index) => {
    const value = parseInt(dateTokens[index]!);
    
    switch (token) {
      case 'yyyy':
        year = value;
        break;
      case 'yy':
        year = 2000 + value;
        break;
      case 'MM':
      case 'M':
        month = value - 1;
        break;
      case 'dd':
      case 'd':
        day = value;
        break;
      case 'HH':
      case 'H':
        hours = value;
        break;
      case 'mm':
      case 'm':
        minutes = value;
        break;
      case 'ss':
      case 's':
        seconds = value;
        break;
      case 'SSS':
        milliseconds = value;
        break;
    }
  });
  
  return new Date(year, month, day, hours, minutes, seconds, milliseconds);
}

export function addTime(date: Date, time: TimeUnit): Date {
  const result = new Date(date);
  
  if (time.milliseconds) result.setMilliseconds(result.getMilliseconds() + time.milliseconds);
  if (time.seconds) result.setSeconds(result.getSeconds() + time.seconds);
  if (time.minutes) result.setMinutes(result.getMinutes() + time.minutes);
  if (time.hours) result.setHours(result.getHours() + time.hours);
  if (time.days) result.setDate(result.getDate() + time.days);
  if (time.months) result.setMonth(result.getMonth() + time.months);
  if (time.years) result.setFullYear(result.getFullYear() + time.years);
  
  return result;
}

export function subtractTime(date: Date, time: TimeUnit): Date {
  const negativeTime: TimeUnit = {};
  
  for (const [key, value] of Object.entries(time)) {
    if (typeof value === 'number') {
      negativeTime[key as keyof TimeUnit] = -value;
    }
  }
  
  return addTime(date, negativeTime);
}

export function diffTime(date1: Date, date2: Date): TimeDiff {
  const totalMilliseconds = Math.abs(date1.getTime() - date2.getTime());
  
  let remaining = totalMilliseconds;
  
  const years = Math.floor(remaining / (365.25 * 24 * 60 * 60 * 1000));
  remaining -= years * (365.25 * 24 * 60 * 60 * 1000);
  
  const months = Math.floor(remaining / (30.44 * 24 * 60 * 60 * 1000));
  remaining -= months * (30.44 * 24 * 60 * 60 * 1000);
  
  const days = Math.floor(remaining / (24 * 60 * 60 * 1000));
  remaining -= days * (24 * 60 * 60 * 1000);
  
  const hours = Math.floor(remaining / (60 * 60 * 1000));
  remaining -= hours * (60 * 60 * 1000);
  
  const minutes = Math.floor(remaining / (60 * 1000));
  remaining -= minutes * (60 * 1000);
  
  const seconds = Math.floor(remaining / 1000);
  const milliseconds = remaining % 1000;
  
  return {
    years,
    months,
    days,
    hours,
    minutes,
    seconds,
    milliseconds,
    totalMilliseconds
  };
}

export function isExpired(timestamp: number | Date, maxAge: number): boolean {
  const time = timestamp instanceof Date ? timestamp.getTime() : timestamp;
  return Date.now() - time > maxAge;
}

export function getTimezone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

export function convertTimezone(date: Date, fromTimezone: string, toTimezone: string): Date {
  const fromOffset = getTimezoneOffset(date, fromTimezone);
  const toOffset = getTimezoneOffset(date, toTimezone);
  const diffOffset = toOffset - fromOffset;
  
  return new Date(date.getTime() + diffOffset);
}

export function startOfDay(date: Date): Date {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
}

export function endOfDay(date: Date): Date {
  const result = new Date(date);
  result.setHours(23, 59, 59, 999);
  return result;
}

export function startOfWeek(date: Date, weekStartsOn = 0): Date {
  const result = new Date(date);
  const day = result.getDay();
  const diff = (day < weekStartsOn ? 7 : 0) + day - weekStartsOn;
  result.setDate(result.getDate() - diff);
  return startOfDay(result);
}

export function endOfWeek(date: Date, weekStartsOn = 0): Date {
  const result = startOfWeek(date, weekStartsOn);
  result.setDate(result.getDate() + 6);
  return endOfDay(result);
}

export function startOfMonth(date: Date): Date {
  const result = new Date(date);
  result.setDate(1);
  return startOfDay(result);
}

export function endOfMonth(date: Date): Date {
  const result = new Date(date);
  result.setMonth(result.getMonth() + 1, 0);
  return endOfDay(result);
}

export function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

export function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

export function getWeekOfYear(date: Date): number {
  const startOfYear = new Date(date.getFullYear(), 0, 1);
  const diffInMs = date.getTime() - startOfYear.getTime();
  const diffInDays = Math.floor(diffInMs / (24 * 60 * 60 * 1000));
  return Math.ceil((diffInDays + startOfYear.getDay() + 1) / 7);
}

export function formatRelativeTime(date: Date, baseDate = new Date()): string {
  const diff = diffTime(date, baseDate);
  const isPast = date < baseDate;
  
  const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
  
  if (diff.years > 0) {
    return rtf.format(isPast ? -diff.years : diff.years, 'year');
  } else if (diff.months > 0) {
    return rtf.format(isPast ? -diff.months : diff.months, 'month');
  } else if (diff.days > 0) {
    return rtf.format(isPast ? -diff.days : diff.days, 'day');
  } else if (diff.hours > 0) {
    return rtf.format(isPast ? -diff.hours : diff.hours, 'hour');
  } else if (diff.minutes > 0) {
    return rtf.format(isPast ? -diff.minutes : diff.minutes, 'minute');
  } else {
    return rtf.format(isPast ? -diff.seconds : diff.seconds, 'second');
  }
}

function getTimezoneOffset(date: Date, timezone: string): number {
  const utc = date.getTime() + (date.getTimezoneOffset() * 60000);
  const targetTime = new Date(utc + getTimezoneOffsetMinutes(timezone) * 60000);
  return targetTime.getTime() - date.getTime();
}

function getTimezoneOffsetMinutes(timezone: string): number {
  const now = new Date();
  const utcTime = now.getTime() + (now.getTimezoneOffset() * 60000);
  const targetTime = new Date(utcTime);
  
  try {
    const formatter = new Intl.DateTimeFormat('en', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
    
    const parts = formatter.formatToParts(targetTime);
    const localTime = new Date(
      parseInt(parts.find(p => p.type === 'year')?.value || '0'),
      parseInt(parts.find(p => p.type === 'month')?.value || '1') - 1,
      parseInt(parts.find(p => p.type === 'day')?.value || '1'),
      parseInt(parts.find(p => p.type === 'hour')?.value || '0'),
      parseInt(parts.find(p => p.type === 'minute')?.value || '0'),
      parseInt(parts.find(p => p.type === 'second')?.value || '0')
    );
    
    return (localTime.getTime() - utcTime) / 60000;
  } catch {
    return 0;
  }
}