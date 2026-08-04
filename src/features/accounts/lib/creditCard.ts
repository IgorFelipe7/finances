/** Next due date on/after `from`, given a fixed day-of-month (1–28). */
export function getNextDueDate(dueDay: number, from: Date = new Date()): Date {
  const candidate = new Date(from.getFullYear(), from.getMonth(), dueDay)
  if (candidate.getTime() < new Date(from.getFullYear(), from.getMonth(), from.getDate()).getTime()) {
    return new Date(from.getFullYear(), from.getMonth() + 1, dueDay)
  }
  return candidate
}

export function formatDueDate(date: Date): string {
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
}
