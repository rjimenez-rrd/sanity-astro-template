/** A small native dropdown, for compact rows (border width, font weight…). Empty shows the placeholder. */
export function CompactSelect({
  value,
  options,
  onChange,
  placeholder,
  width,
}: {
  value?: string
  options: {title: string; value: string}[]
  onChange: (v: string) => void
  placeholder?: string
  width?: number
}) {
  return (
    <select
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value)}
      style={{
        flex: width ? undefined : 1,
        width: width ?? undefined,
        padding: '6px 8px',
        fontSize: 12,
        fontFamily: 'inherit',
        border: '1px solid var(--card-border-color)',
        borderRadius: 4,
        backgroundColor: 'var(--card-bg-color)',
        color: value ? 'var(--card-fg-color)' : 'var(--card-muted-fg-color)',
        cursor: 'pointer',
      }}
    >
      <option value="">{placeholder ?? '—'}</option>
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.title}
        </option>
      ))}
    </select>
  )
}
