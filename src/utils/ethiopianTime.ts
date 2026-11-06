// Ethiopian Time & Calendar helper functions

export const ETHIOPIAN_DAYS = [
  'እሑድ',    // Sunday (0)
  'ሰኞ',      // Monday (1)
  'ማክሰኞ',    // Tuesday (2)
  'ረቡዕ',     // Wednesday (3)
  'ሐሙስ',     // Thursday (4)
  'አርብ',     // Friday (5)
  'ቅዳሜ',    // Saturday (6)
];

export const ETHIOPIAN_MONTHS = [
  'መስከረም', 'ጥቅምት', 'ኅዳር', 'ታኅሣሥ', 'ጥር', 'የካቲት',
  'መጋቢት', 'ሚያዝያ', 'ግንቦት', 'ሰኔ', 'ሐምሌ', 'ነሐሴ', 'ጳጉሜ'
];

/**
 * Checks if a given date is a working day (ከሰኞ እስከ አርብ: Monday to Friday)
 */
export function isWorkingDay(date: Date = new Date()): boolean {
  const day = date.getDay();
  return day >= 1 && day <= 5; // Monday=1 to Friday=5
}

/**
 * Converts standard 24-hr time (HH:MM:SS) to Ethiopian Time format (12-hr shifted by 6 hours)
 * In Ethiopia, 06:00 is 12:00 morning (ጧት 12፡00)
 * 08:30 AM is 02:30 morning (ጧት 02፡30)
 * 09:00 AM is 03:00 morning (ጧት 03፡00)
 * 17:00 (5 PM) is 11:00 afternoon (ከቀኑ 11፡00)
 */
export function toEthiopianTime(date: Date = new Date()): {
  ethiopianHour: number;
  ethiopianMinute: number;
  periodAmharic: string;
  formatted: string;
  rawTime: string;
} {
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const seconds = date.getSeconds();

  let ethHour = (hours - 6) % 12;
  if (ethHour <= 0) ethHour += 12;

  let period = 'ጠዋት';
  if (hours >= 6 && hours < 12) {
    period = 'ጠዋት';
  } else if (hours >= 12 && hours < 18) {
    period = 'ከቀኑ';
  } else if (hours >= 18 && hours < 23) {
    period = 'ምሽት';
  } else {
    period = 'ሌሊት';
  }

  const mm = minutes.toString().padStart(2, '0');
  const ss = seconds.toString().padStart(2, '0');
  const hh = ethHour.toString().padStart(2, '0');

  return {
    ethiopianHour: ethHour,
    ethiopianMinute: minutes,
    periodAmharic: period,
    formatted: `${period} ${hh}:${mm}:${ss}`,
    rawTime: `${hours.toString().padStart(2, '0')}:${mm}:${ss}`,
  };
}

/**
 * Evaluate morning check-in punctuality:
 * "ሰራተኞቹ ጠዋት 2፡30 እስከ 3፡00 ሰዓት ድረስ ከገቡ ከፍተኛ ይሰጣል፡፡ ከዛ ከ3፡01 በኃላ የሚመጣ ሰራተኛ ዝቅተኛ ብሎ ይመዘግባል፡፡"
 * Standard 24h equivalents:
 * 2:30 Ethiopian = 08:30 (8 * 60 + 30 = 510 minutes)
 * 3:00 Ethiopian = 09:00 (9 * 60 + 00 = 540 minutes)
 * 3:01 Ethiopian = 09:01 (541 minutes)
 */
export function evaluateCheckInPunctuality(date: Date = new Date()): {
  status: 'high' | 'low';
  label: string;
  color: string;
} {
  const totalMinutes = date.getHours() * 60 + date.getMinutes();
  
  // 08:30 (2:30 Eth) to 09:00 (3:00 Eth) inclusive
  // Also if someone arrives earlier (e.g. before 8:30 AM), it is still considered early/high
  if (totalMinutes <= 9 * 60) {
    return {
      status: 'high',
      label: 'ከፍተኛ (በሰዓቱ የገባ)',
      color: 'emerald',
    };
  } else {
    return {
      status: 'low',
      label: 'ዝቅተኛ (ዘግይቶ የገባ)',
      color: 'rose',
    };
  }
}

/**
 * Evaluate evening check-out punctuality:
 * "ማታ መዉጪያ ሰዓት ደግሞ 11 ሰዓት በኋላ የሚወጣን በጣም ከፍተኛ ደረጃ ትሰጣለህ፡፡ ከ11 ሠኣት በፊት የሚወጣን ሰራተኛ ዝቅተና ብለህ ትመዘግባለህ፡፡"
 * Standard 24h equivalent:
 * 11:00 Ethiopian afternoon = 17:00 (5:00 PM) (17 * 60 = 1020 minutes)
 */
export function evaluateCheckOutPunctuality(date: Date = new Date()): {
  status: 'very_high' | 'low';
  label: string;
  color: string;
} {
  const totalMinutes = date.getHours() * 60 + date.getMinutes();

  // 17:00 (11:00 Eth) or later
  if (totalMinutes >= 17 * 60) {
    return {
      status: 'very_high',
      label: 'በጣም ከፍተኛ (ሙሉ ሰዓት ያጠናቀቀ)',
      color: 'blue',
    };
  } else {
    return {
      status: 'low',
      label: 'ዝቅተኛ (ከስራ ሰዓት በፊት የወጣ)',
      color: 'amber',
    };
  }
}

/**
 * Returns formatted date in Amharic & standard Gregorian format
 */
export function getFormattedDateLabels(date: Date = new Date()): {
  gregorianDate: string;
  monthString: string;
  amharicDay: string;
  formattedAmharic: string;
} {
  const yyyy = date.getFullYear();
  const mm = (date.getMonth() + 1).toString().padStart(2, '0');
  const dd = date.getDate().toString().padStart(2, '0');
  const gregorianDate = `${yyyy}-${mm}-${dd}`;
  const monthString = `${yyyy}-${mm}`;
  const dayName = ETHIOPIAN_DAYS[date.getDay()];

  return {
    gregorianDate,
    monthString,
    amharicDay: dayName,
    formattedAmharic: `${dayName}፣ ${dd}/${mm}/${yyyy} ዓ.ም`,
  };
}
