export const MASKED_AMOUNT = '••••••'
export const MASKED_AMOUNT_COMPACT = '••••'

/** Matches pt-BR/BRL currency substrings, e.g. "R$ 1.234,56", "-R$ 1.234,56", "R$ 1,2 mil". */
const CURRENCY_IN_TEXT = /-?R\$\s?\d[\d.,]*(?:\s(?:mil|mi|bi))?/g

export function maskCurrencyInText(text: string): string {
  return text.replace(CURRENCY_IN_TEXT, MASKED_AMOUNT)
}
