// Figma: Metric Card / RABD (244:14), variante de la vista 06.
export default function MetricCard({ value, label, delta }) {
  return (
    <div className="flex min-h-[140px] flex-col gap-3 rounded-xl border border-[#DCE0E5] bg-white p-4 min-[541px]:p-5">
      <p className="text-[32px] leading-10 font-bold tracking-[-0.3px] text-[#A90D27]">{value}</p>
      <p>{label}</p>
      {delta && <p className="text-xs leading-[18px] text-[#68707C]">{delta}</p>}
    </div>
  );
}
