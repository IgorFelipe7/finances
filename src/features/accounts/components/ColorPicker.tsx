import { CheckIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ACCOUNT_COLOR_PRESETS } from '@/features/accounts/constants'

interface ColorPickerProps {
  value: string
  onChange: (color: string) => void
  disabled?: boolean
}

export function ColorPicker({ value, onChange, disabled }: ColorPickerProps) {
  const isCustom = !ACCOUNT_COLOR_PRESETS.includes(value as (typeof ACCOUNT_COLOR_PRESETS)[number])

  return (
    <div className="flex flex-wrap items-center gap-2">
      {ACCOUNT_COLOR_PRESETS.map((color) => (
        <button
          key={color}
          type="button"
          disabled={disabled}
          onClick={() => onChange(color)}
          aria-label={`Selecionar cor ${color}`}
          aria-pressed={value === color}
          className={cn(
            'flex size-7 shrink-0 items-center justify-center rounded-full ring-1 ring-border transition-transform hover:scale-110 disabled:pointer-events-none disabled:opacity-50',
            value === color && 'ring-2 ring-foreground ring-offset-2 ring-offset-popover',
          )}
          style={{ backgroundColor: color }}
        >
          {value === color && <CheckIcon className="size-3.5 text-white drop-shadow" />}
        </button>
      ))}

      <label
        className={cn(
          'relative flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-full bg-[conic-gradient(from_0deg,red,yellow,lime,cyan,blue,magenta,red)] ring-1 ring-border transition-transform hover:scale-110',
          isCustom && 'ring-2 ring-foreground ring-offset-2 ring-offset-popover',
        )}
        title="Cor personalizada"
      >
        {isCustom && <CheckIcon className="size-3.5 text-white drop-shadow" />}
        <input
          type="color"
          value={isCustom ? value : '#6366f1'}
          disabled={disabled}
          onChange={(event) => onChange(event.target.value)}
          className="absolute inset-0 size-full cursor-pointer opacity-0"
        />
      </label>
    </div>
  )
}
