// Figma: Form Field / RABD (245:6), medidas de la vista 07.
export default function FormField({ label, id, suffix, options, compact = false, ...props }) {
  const controlClasses = "w-full min-w-0 border-0 bg-transparent p-0 text-sm leading-[22px] text-[#171A1F] focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-primary";

  return (
    <label className={`flex min-w-0 flex-col rounded-lg border bg-white focus-within:border-primary has-[:disabled]:opacity-60 ${compact ? "min-h-[58px] gap-0.5 border-[#D1D6E0] px-3 py-2" : "min-h-[68px] gap-[5px] border-[#DCE0E5] p-3"}`} htmlFor={id}>
      <span id={`${id}-label`} className={`${compact ? "text-[11px] leading-4" : "text-xs leading-[18px]"} tracking-[0.1px] text-[#68707C]`}>{label}</span>
      <span className="flex items-center gap-[5px]">
        {options ? (
          <select id={id} aria-labelledby={`${id}-label`} className={controlClasses} {...props}>
            {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
        ) : <input id={id} aria-labelledby={`${id}-label`} className={controlClasses} style={suffix ? { width: `${Math.max(String(props.value ?? "").length, 3) + 2}ch` } : undefined} {...props} />}
        {suffix && <span className="whitespace-nowrap">{suffix}</span>}
      </span>
    </label>
  );
}
