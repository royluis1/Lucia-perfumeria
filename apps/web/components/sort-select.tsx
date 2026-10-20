'use client';

const sortOptions: Array<{ value: string; label: string }> = [
  { value: 'recent', label: 'Novedades' },
  { value: 'name', label: 'Nombre A-Z' },
  { value: 'price_asc', label: 'Menor precio' },
  { value: 'price_desc', label: 'Mayor precio' },
];

export function SortSelect({
  value,
  action = '/shop',
  hidden = {},
}: {
  value: string;
  action?: string;
  hidden?: Record<string, string | undefined>;
}) {
  return (
    <form className="ml-auto flex items-center gap-2 text-xs uppercase tracking-[0.12em] text-muted" action={action}>
      {Object.entries(hidden).map(([name, hiddenValue]) =>
        hiddenValue ? <input key={name} name={name} type="hidden" value={hiddenValue} /> : null,
      )}
      <label htmlFor="sort">Ordenar por</label>
      <select
        className="border border-line bg-transparent py-2 pl-3 pr-8 outline-none focus:border-black"
        defaultValue={value}
        id="sort"
        name="sort"
        onChange={(event) => event.currentTarget.form?.requestSubmit()}
      >
        {sortOptions.map((option) => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>
      <noscript><button type="submit">→</button></noscript>
    </form>
  );
}
