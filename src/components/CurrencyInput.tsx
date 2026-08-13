import * as React from 'react'
import { Input } from '@/components/ui/input'

const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

function formatCents(cents: number) {
  return currencyFormatter.format(cents / 100)
}

interface CurrencyInputProps
  extends Omit<React.ComponentProps<typeof Input>, 'type' | 'inputMode' | 'value' | 'onChange' | 'defaultValue'> {
  value: number
  onValueChange: (value: number) => void
}

/**
 * Money input where the user only ever types digits: they fill in from the right
 * (e.g. "1050" -> "10,50"), like most BR finance apps. This sidesteps iOS's
 * decimal numeric keypad, which is locale-locked to "." and often lacks a "," key
 * entirely, making `type="number"` unusable for reais/centavos entry.
 */
export const CurrencyInput = React.forwardRef<HTMLInputElement, CurrencyInputProps>(
  ({ value, onValueChange, placeholder, ...props }, ref) => {
    const cents = Math.round((Number.isFinite(value) ? value : 0) * 100)

    function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
      const digits = event.target.value.replace(/\D/g, '')
      const nextCents = digits === '' ? 0 : parseInt(digits, 10)
      onValueChange(nextCents / 100)
    }

    return (
      <Input
        {...props}
        ref={ref}
        type="text"
        inputMode="numeric"
        placeholder={placeholder ?? '0,00'}
        value={cents === 0 ? '' : formatCents(cents)}
        onChange={handleChange}
      />
    )
  },
)
CurrencyInput.displayName = 'CurrencyInput'
