export const SALON = {
  name: 'BeauDesk',
  currency: 'QAR',
  locale: 'en-QA',
  openHour: 9,
  closeHour: 20,
  slotMinutes: 30,
  /** Visit tokens read like BD-042. */
  tokenPrefix: 'BD',
  /** `Date.getDay()` values the salon is closed on (5 = Friday). */
  closedWeekdays: [5] as number[],
  openDaysLabel: 'Sat – Thu',
  closedDaysLabel: 'Fridays',
  pointsPerCurrencyUnit: 0.1,
  /** Share of the bill that must be paid (online or at the salon); the rest may be kept as due. */
  minPaidPercent: 65,
}

export interface Country {
  code: string
  dial: string
  name: string
  flag: string
  digits: number
  pattern: RegExp
}

export const COUNTRIES: Country[] = [
  { code: 'QA', dial: '974', name: 'Qatar', flag: '🇶🇦', digits: 8, pattern: /^[3-7]\d{7}$/ },
  { code: 'IN', dial: '91', name: 'India', flag: '🇮🇳', digits: 10, pattern: /^[6-9]\d{9}$/ },
  { code: 'AE', dial: '971', name: 'UAE', flag: '🇦🇪', digits: 9, pattern: /^5\d{8}$/ },
  { code: 'SA', dial: '966', name: 'Saudi Arabia', flag: '🇸🇦', digits: 9, pattern: /^5\d{8}$/ },
]

export const DEFAULT_COUNTRY = COUNTRIES[0]
