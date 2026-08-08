import { useUIPreferencesStore } from '@/features/settings/store/useUIPreferencesStore'
import { formatCompactCurrency, formatCurrency } from '@/lib/currency'
import { MASKED_AMOUNT, MASKED_AMOUNT_COMPACT, maskCurrencyInText } from '@/lib/maskCurrency'

/** Formats money respecting the "hide values" preference — swaps digits for dots when it's on. */
export function useMoneyFormatter() {
  const hideValues = useUIPreferencesStore((state) => state.hideValues)

  return {
    hideValues,
    formatMoney: (value: number) => (hideValues ? MASKED_AMOUNT : formatCurrency(value)),
    formatMoneyCompact: (value: number) => (hideValues ? MASKED_AMOUNT_COMPACT : formatCompactCurrency(value)),
    maskText: (text: string) => (hideValues ? maskCurrencyInText(text) : text),
  }
}
