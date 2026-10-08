// Figma: Form Field / RABD (245:6), medidas de la vista 07.
export default function FormField({ label, id, suffix, options, ...props }) {
  const controlClasses = "w-full min-w-0 border-0 bg-transparent p-0 text-sm leading-[22px] text-[#171A1F] focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-primary";

  return (
    <label className="flex min-h-[68px] min-w-0 flex-col gap-[5px] rounded-lg border border-[#DCE0E5] bg-white p-3 focus-within:border-primary has-[:disabled]:opacity-60" htmlFor={id}>
      <span className="text-xs leading-[18px] tracking-[0.1px] text-[#68707C]">{label}</span>
      <span className="flex items-center gap-[5px]">
        {options ? (
          <select id={id} className={controlClasses} {...props}>
            {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
        ) : <input id={id} className={controlClasses} style={suffix ? { width: `${Math.max(String(props.value ?? "").length, 3) + 2}ch` } : undefined} {...props} />}
        {suffix && <span className="whitespace-nowrap">{suffix}</span>}
      </span>
    </label>
  );
}
