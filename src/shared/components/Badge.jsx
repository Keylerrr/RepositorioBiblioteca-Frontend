const STATES = {
  success: "bg-[#DDF5E7] text-[#17643A]",
  warning: "bg-[#FFF0C7] text-[#7A4B00]",
  info: "bg-[#DFECFF] text-[#174C92]",
  error: "bg-[#FFE1E3] text-[#820A1F]",
};

// Figma: Status Badge (11:13), con el tamaño usado en las tablas.
export default function Badge({ children, state = "success" }) {
  return (
    <span className={`inline-flex items-center whitespace-nowrap rounded-full p-[7px] text-xs leading-[18px] tracking-[0.1px] ${STATES[state]}`}>
      {children}
    </span>
  );
}
