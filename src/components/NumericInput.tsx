import { useId, useState, type ReactNode } from 'react'
import { fmtNum, parseNum } from '../lib/format'

/**
 * A text field for numbers. While focused it keeps exactly what was typed; when
 * not focused it shows the value in the app's number style (1.234,5).
 * `value` of null means empty.
 */
export function NumericInput({
  value,
  onValueChange,
  label,
  placeholder,
  digits = 2,
  disabled = false,
  prefix,
  suffix,
  invalid = false,
  className = '',
}: {
  value: number | null
  onValueChange: (value: number | null) => void
  label: string
  placeholder?: string
  digits?: number
  disabled?: boolean
  prefix?: ReactNode
  suffix?: ReactNode
  invalid?: boolean
  className?: string
}) {
  const id = useId()
  const [draft, setDraft] = useState<string | null>(null)
  const shown = draft ?? (value === null ? '' : fmtNum(value, digits))

  return (
    <div
      className={`flex h-10 items-center gap-2 rounded-lg border bg-[#161616] px-3 transition-colors duration-150 ease-out ${
        invalid ? 'border-[#ef4444]/60' : 'border-white/[0.06] focus-within:border-white/25'
      } ${className}`}
    >
      {prefix}
      <input
        id={id}
        type="text"
        inputMode="decimal"
        aria-label={label}
        aria-invalid={invalid || undefined}
        autoComplete="off"
        spellCheck={false}
        disabled={disabled}
        placeholder={placeholder}
        value={shown}
        onFocus={(event) => {
          setDraft(value === null ? '' : fmtNum(value, digits).replace(/\./g, ''))
          event.currentTarget.select()
        }}
        onChange={(event) => {
          setDraft(event.target.value)
          onValueChange(parseNum(event.target.value))
        }}
        onBlur={() => setDraft(null)}
        className="h-full min-w-0 flex-1 bg-transparent text-sm leading-[1.4] text-white tabular-nums outline-none placeholder:text-[#bbb] disabled:cursor-default"
      />
      {suffix}
    </div>
  )
}
