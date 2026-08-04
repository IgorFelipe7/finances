export const MONTH_NAMES_PT_BR = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
]

export function formatMonthYear(month: number, year: number): string {
  return `${MONTH_NAMES_PT_BR[month]} ${year}`
}

export interface MonthOption {
  month: number
  year: number
  value: string
  label: string
}

/** Shifts an ISO `YYYY-MM-DD` date by `months`, clamping the day to the target month's last day (e.g. Jan 31 + 1 month → Feb 28). */
export function addMonthsToIsoDate(dateIso: string, months: number): string {
  const [year, month, day] = dateIso.split('-').map(Number)
  const targetMonthIndex = month - 1 + months
  const lastDayOfTargetMonth = new Date(year, targetMonthIndex + 1, 0).getDate()
  const clampedDay = Math.min(day, lastDayOfTargetMonth)
  const shifted = new Date(year, targetMonthIndex, clampedDay)
  return `${shifted.getFullYear()}-${String(shifted.getMonth() + 1).padStart(2, '0')}-${String(shifted.getDate()).padStart(2, '0')}`
}

/** Next calendar date (>= referenceDate) sharing the anchor's day-of-month — when a fixed recurrence next charges. */
export function nextMonthlyOccurrence(anchorDateIso: string, referenceDate: Date = new Date()): string {
  const day = Number(anchorDateIso.split('-')[2])
  const refTime = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), referenceDate.getDate()).getTime()

  for (let offset = 0; offset < 2; offset++) {
    const lastDayOfMonth = new Date(referenceDate.getFullYear(), referenceDate.getMonth() + offset + 1, 0).getDate()
    const candidate = new Date(referenceDate.getFullYear(), referenceDate.getMonth() + offset, Math.min(day, lastDayOfMonth))
    if (candidate.getTime() >= refTime) {
      return `${candidate.getFullYear()}-${String(candidate.getMonth() + 1).padStart(2, '0')}-${String(candidate.getDate()).padStart(2, '0')}`
    }
  }

  return addMonthsToIsoDate(anchorDateIso, 1)
}

/** Generates a chronological range of selectable months around today, for the Time Travel selector. */
export function generateMonthOptions(monthsBefore = 6, monthsAfter = 6): MonthOption[] {
  const now = new Date()
  const options: MonthOption[] = []

  for (let offset = -monthsBefore; offset <= monthsAfter; offset++) {
    const date = new Date(now.getFullYear(), now.getMonth() + offset, 1)
    const month = date.getMonth()
    const year = date.getFullYear()
    options.push({ month, year, value: `${year}-${month}`, label: formatMonthYear(month, year) })
  }

  return options
}
