// Aviso de las vistas 07/08; implementación autorizada fuera del catálogo.
const VARIANTS = {
  neutral: "min-h-16 rounded-lg bg-[#EEF0F3] p-3.5",
  error: "min-h-[72px] rounded-[10px] bg-[#FFE1E3] p-4 text-base leading-[26px] text-[#820A1F]",
  success: "min-h-16 rounded-lg bg-[#DDF5E7] p-3.5 text-[#17643A]",
};

export default function Notice({ children, variant = "neutral", live = false }) {
  return (
    <div className={VARIANTS[variant]} role={live ? "status" : undefined}>
      {children}
    </div>
  );
}
