export default function SearchBar({ value, onChange }) {
  return (
    <label className="flex min-h-12 flex-1 items-center gap-3 rounded-md border border-[#d9dfd5] bg-white px-4 focus-within:border-[#577550] focus-within:ring-2 focus-within:ring-[#577550]/15">
      <span aria-hidden="true" className="text-lg text-[#748075]">⌕</span>
      <span className="sr-only">Buscar por nombre, institución o tema</span>
      <input
        className="w-full bg-transparent text-sm text-[#19251c] outline-none placeholder:text-[#909a90]"
        onChange={(event) => onChange(event.target.value)}
        placeholder="Buscar por nombre, institución o tema"
        type="search"
        value={value}
      />
    </label>
  );
}