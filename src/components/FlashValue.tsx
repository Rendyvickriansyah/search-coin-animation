import { useEffect, useRef, type ReactNode } from 'react'

const UP = 'rgb(71 187 100 / 0.2)'
const DOWN = 'rgb(226 71 86 / 0.2)'

/**
 * Flashes a tinted background behind a value when it changes — green when it
 * rises, red when it falls — then fades to nothing over 0.8s ease-out. The text
 * itself swaps instantly. Same treatment as the OpenSea tokens table.
 *
 * Pass `value={null}` while the number is still a placeholder to skip the flash.
 */
export function FlashValue({
  value,
  className = '',
  children,
}: {
  value: number | null
  className?: string
  children: ReactNode
}) {
  const ref = useRef<HTMLSpanElement>(null)
  const previous = useRef(value)

  useEffect(() => {
    const before = previous.current
    previous.current = value
    if (before === null || value === null || before === value) return
    // WAAPI restarts cleanly on every tick, unlike re-adding a keyframe class.
    ref.current?.animate(
      [{ backgroundColor: value > before ? UP : DOWN }, { backgroundColor: 'transparent' }],
      { duration: 800, easing: 'ease-out' },
    )
  }, [value])

  return (
    <span ref={ref} className={`inline-flex ${className}`}>
      {children}
    </span>
  )
}
