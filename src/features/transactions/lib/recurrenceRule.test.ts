import { describe, expect, it } from 'vitest'
import { formatRecurrenceRuleLabel, resolveRecurrenceDate, toIsoDate } from './recurrenceRule'

// August 2026: Aug 1 is a Saturday, so weekdays for the month are known and fixed below.
const YEAR = 2026
const MONTH = 7 // August (0-indexed)

describe('resolveRecurrenceDate', () => {
  it('resolves the 1st, 2nd, 4th occurrence of a weekday in the month', () => {
    const monday = (occurrence: 1 | 2 | 3 | 4) =>
      toIsoDate(resolveRecurrenceDate({ type: 'weekday_occurrence', weekday: 1, occurrence }, YEAR, MONTH))

    expect(monday(1)).toBe('2026-08-03')
    expect(monday(2)).toBe('2026-08-10')
    expect(monday(4)).toBe('2026-08-24')
  })

  it('resolves "última" as the last occurrence, distinct from the 4th when a 5th exists', () => {
    // Sundays in Aug 2026: 2, 9, 16, 23, 30 — five of them, so "última" must be the 5th, not the 4th.
    const fourthSunday = resolveRecurrenceDate({ type: 'weekday_occurrence', weekday: 0, occurrence: 4 }, YEAR, MONTH)
    const lastSunday = resolveRecurrenceDate({ type: 'weekday_occurrence', weekday: 0, occurrence: -1 }, YEAR, MONTH)

    expect(toIsoDate(fourthSunday)).toBe('2026-08-23')
    expect(toIsoDate(lastSunday)).toBe('2026-08-30')
  })

  it('resolves the nth business day, skipping Saturday and Sunday by default', () => {
    // Aug 1 Sat, 2 Sun (skipped) — business days start Aug 3 (Mon): 3,4,5,6,7 are the first five.
    const fifth = resolveRecurrenceDate({ type: 'business_day', n: 5, countSaturday: false }, YEAR, MONTH)
    expect(toIsoDate(fifth)).toBe('2026-08-07')
  })

  it('counts Saturday as a business day when countSaturday is true', () => {
    // With Saturday counted: Aug 1 (Sat)=1st, 2 (Sun) skipped, 3=2nd, 4=3rd, 5=4th, 6=5th.
    const fifth = resolveRecurrenceDate({ type: 'business_day', n: 5, countSaturday: true }, YEAR, MONTH)
    expect(toIsoDate(fifth)).toBe('2026-08-06')
  })

  it('normalizes an out-of-range month (e.g. anchor month + offset) like the Date constructor', () => {
    // Month 19 = August of the following year (7 + 12).
    const resolved = resolveRecurrenceDate({ type: 'business_day', n: 5, countSaturday: false }, YEAR, MONTH + 12)
    expect(toIsoDate(resolved)).toBe('2027-08-06')
  })
})

describe('formatRecurrenceRuleLabel', () => {
  it('describes a weekday-occurrence rule in Portuguese', () => {
    expect(formatRecurrenceRuleLabel({ type: 'weekday_occurrence', weekday: 1, occurrence: 1 })).toBe(
      'Toda 1ª segunda-feira',
    )
    expect(formatRecurrenceRuleLabel({ type: 'weekday_occurrence', weekday: 5, occurrence: -1 })).toBe(
      'Toda última sexta-feira',
    )
  })

  it('describes a business-day rule, noting when Saturday counts', () => {
    expect(formatRecurrenceRuleLabel({ type: 'business_day', n: 5, countSaturday: false })).toBe('5º dia útil do mês')
    expect(formatRecurrenceRuleLabel({ type: 'business_day', n: 5, countSaturday: true })).toBe(
      '5º dia útil do mês (sábado conta como dia útil)',
    )
  })
})
