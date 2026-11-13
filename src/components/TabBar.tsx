export type Tab<Id extends string> = { id: Id; label: string }

/** Two-or-more equal tabs with a pill that slides to the active one. */
export function TabBar<Id extends string>({
  tabs,
  active,
  onChange,
}: {
  tabs: Tab<Id>[]
  active: Id
  onChange: (id: Id) => void
}) {
  const index = Math.max(
    0,
    tabs.findIndex((tab) => tab.id === active),
  )

  return (
    <div
      role="tablist"
      aria-label="Halaman"
      className="relative grid rounded-full border border-white/10 bg-[#0c0c0c] p-1"
      style={{ gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))` }}
    >
      <span
        aria-hidden
        className="absolute top-1 bottom-1 left-1 rounded-full bg-white/10 transition-transform duration-200 ease-out motion-reduce:transition-none"
        style={{
          width: `calc((100% - 8px) / ${tabs.length})`,
          transform: `translateX(${index * 100}%)`,
        }}
      />
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          role="tab"
          aria-selected={tab.id === active}
          onClick={() => onChange(tab.id)}
          className={`relative h-8 rounded-full px-4 text-sm leading-none whitespace-nowrap outline-none transition-colors duration-150 ease-out focus-visible:ring-2 focus-visible:ring-white/40 ${
            tab.id === active ? 'font-medium text-white' : 'text-[#bbb] hover:text-white'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}
