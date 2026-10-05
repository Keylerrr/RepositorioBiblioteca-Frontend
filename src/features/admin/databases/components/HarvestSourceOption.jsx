// Opciones de origen de la vista 07 (191:739–191:758).
export default function HarvestSourceOption({ source, description, checked, onChange }) {
  return (
    <label className={`flex min-h-[86px] cursor-pointer items-center gap-2.5 rounded-lg p-3 ${checked ? "bg-[#DDF5E7]" : "bg-[#EEF0F3]"}`}>
      <input className="size-[17px] shrink-0 accent-[#17643A] focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-primary" type="radio" name="source" value={source} checked={checked} onChange={onChange} />
      <span>
        <span className="block leading-5 font-semibold tracking-[0.1px]">{source}</span>
        <span className="mt-[3px] block text-xs leading-[18px] tracking-[0.1px] text-[#68707C]">{description}</span>
      </span>
    </label>
  );
}
