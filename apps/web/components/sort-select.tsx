'use client';

const sortOptions: Array<{ value: string; label: string }> = [
  { value: 'recent', label: 'Novedades' },
  { value: 'name', label: 'Nombre A-Z' },
  { value: 'price_asc', label: 'Menor precio' },
  { value: 'price_desc', label: 'Mayor precio' },
];

export function SortSelect({
  value,
  search,
  category,
}: {
  value: string;
  search?: string;
  category?: string;
}) {
  return (
    <form className="ml-auto flex items-center gap-2 text-xs uppercase tracking-[0.12em] text-black/55" action="/shop">
      {search ? <input name="search" type="hidden" value={search} /> : null}
      {category ? <input name="category" type="hidden" value={category} /> : null}
      <label htmlFor="sort">Ordenar por</label>
      <select
        className="border border-black/15 bg-transparent py-2 pl-3 pr-8 outline-none focus:border-gold"
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