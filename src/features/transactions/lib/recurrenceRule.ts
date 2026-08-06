import type { RecurrenceRule } from '@/features/transactions/schemas/transaction.schema'
import { nextMonthlyOccurrence } from '@/lib/date'

const WEEKDAY_LABELS_PT = ['domingo', 'segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado']
const OCCURRENCE_LABELS_PT: Record<number, string> = { 1: '1ª', 2: '2ª', 3: '3ª', 4: '4ª', [-1]: 'última' }

export function toIsoDate(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function isBusinessDay(date: Date, countSaturday: boolean): boolean {
  const day = date.getDay()
  if (day === 0) return false
  if (day === 6) return countSaturday
  return true
}

/**
 * Resolves a recurrence rule to a concrete date within the given month. `month` may be outside
 * 0-11 (e.g. 14) — the Date constructor normalizes it, which is exactly what lets callers do
 * `resolveRecurrenceDate(rule, year, anchorMonth + offset)` without pre-normalizing themselves.
 */
export function resolveRecurrenceDate(rule: RecurrenceRule, year: number, month: number): Date {
  if (rule.type === 'weekday_occurrence') {
    if (rule.occurrence === -1) {
      const lastDayOfMonth = new Date(year, month + 1, 0)
      const diff = (lastDayOfMonth.getDay() - rule.weekday + 7) % 7
      return new Date(year, month, lastDayOfMonth.getDate() - diff)
    }
    const firstOfMonth = new Date(year, month, 1)
    const diff = (rule.weekday - firstOfMonth.getDay() + 7) % 7
    return new Date(year, month, 1 + diff + (rule.occurrence - 1) * 7)
  }

  const lastDay = new Date(year, month + 1, 0).getDate()
  let count = 0
  let lastBusinessDay = new Date(year, month, 1)
  for (let day = 1; day <= lastDay; day++) {
    const candidate = new Date(year, month, day)
    if (!isBusinessDay(candidate, rule.countSaturday)) continue
    lastBusinessDay = candidate
    count++
    if (count === rule.n) return candidate
  }
  // n exceeds the month's business days (extremely unlikely at the UI-capped range) — clamp.
  return lastBusinessDay
}

/** Rule-aware equivalent of `nextMonthlyOccurrence` — falls back to it when no rule is set. */
export function nextOccurrenceForTransaction(
  transaction: { date: string; recurrence_rule?: RecurrenceRule | null },
  referenceDate: Date = new Date(),
): string {
  if (!transaction.recurrence_rule) return nextMonthlyOccurrence(transaction.date, referenceDate)

  const rule = transaction.recurrence_rule
  const refTime = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), referenceDate.getDate()).getTime()

  for (let offset = 0; offset < 2; offset++) {
    const candidate = resolveRecurrenceDate(rule, referenceDate.getFullYear(), referenceDate.getMonth() + offset)
    if (candidate.getTime() >= refTime) return toIsoDate(candidate)
  }
  return toIsoDate(resolveRecurrenceDate(rule, referenceDate.getFullYear(), referenceDate.getMonth() + 2))
}

export function formatRecurrenceRuleLabel(rule: RecurrenceRule): string {
  if (rule.type === 'weekday_occurrence') {
    return `Toda ${OCCURRENCE_LABELS_PT[rule.occurrence]} ${WEEKDAY_LABELS_PT[rule.weekday]}`
  }
  const suffix = rule.countSaturday ? ' (sábado conta como dia útil)' : ''
  return `${rule.n}º dia útil do mês${suffix}`
}
