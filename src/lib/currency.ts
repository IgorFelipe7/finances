const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
})

const compactCurrencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  notation: 'compact',
  maximumFractionDigits: 1,
})

export function formatCurrency(value: number): string {
  return currencyFormatter.format(value)
}

/** Axis-tick friendly currency: R$ 1,2 mil instead of R$ 1.234,56. */
export function formatCompactCurrency(value: number): string {
  return compactCurrencyFormatter.format(value)
}
