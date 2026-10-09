export default function SearchBar({ value, onChange }) {
  return (
    <label className="flex min-h-12 flex-1 items-center gap-3 rounded-md border border-[#e2dcd7] bg-white px-4 focus-within:border-[#a3141c] focus-within:ring-2 focus-within:ring-[#a3141c]/20">
      <span aria-hidden="true" className="text-lg text-[#5c5252]">⌕</span>
      <span className="sr-only">Buscar por nombre, institución o tema</span>
      <input
        className="w-full bg-transparent text-sm text-[#1f1a1a] outline-none placeholder:text-[#8a807b] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a3141c]"
        onChange={(event) => onChange(event.target.value)}
        placeholder="Buscar por nombre, institución o tema"
        type="search"
        value={value}
      />
    </label>
  );
}