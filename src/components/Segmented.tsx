/** Equal-width options with a white pill that slides to the active one. */
export function Segmented<Id extends string | number>({
  options,
  value,
  onChange,
  label,
}: {
  options: { id: Id; label: string }[]
  value: Id
  onChange: (id: Id) => void
  label: string
}) {
  const count = options.length
  const index = Math.max(
    0,
    options.findIndex((option) => option.id === value),
  )

  return (
    <div
      role="radiogroup"
      aria-label={label}
      className="relative flex gap-0.5 rounded-lg border border-white/[0.08] bg-[#111] p-0.5"
    >
      <span
        aria-hidden
        className="absolute top-0.5 bottom-0.5 left-0.5 rounded-md bg-white transition-transform duration-200 ease-out motion-reduce:transition-none"
        style={{
          width: `calc((100% - 4px - ${(count - 1) * 2}px) / ${count})`,
          transform: `translateX(calc(${index * 100}% + ${index * 2}px))`,
        }}
      />
      {options.map((option) => {
        const active = option.id === value
        return (
          <button
            key={option.id}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(option.id)}
            className={`relative h-[30px] min-w-0 flex-1 rounded-md text-sm leading-[1.4] whitespace-nowrap outline-none transition-colors duration-150 ease-out focus-visible:ring-2 focus-visible:ring-white/40 ${
              active ? 'font-medium text-black' : 'text-[#bbb] hover:text-white'
            }`}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
