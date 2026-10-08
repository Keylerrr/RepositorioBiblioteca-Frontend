import Link from "next/link";

const VARIANTS = {
  primary: "border-primary bg-primary text-white hover:border-[#A90D27] hover:bg-[#A90D27]",
  outline: "border-primary bg-white text-primary hover:bg-primary/5",
  secondary: "border-primary bg-white text-primary hover:bg-primary/5",
  quiet: "border-[#DCE0E5] bg-white text-primary hover:bg-primary/5",
};

const SIZES = {
  md: "h-11 min-w-28 rounded-lg px-5 text-sm leading-5 tracking-[0.1px]",
  sm: "h-8 rounded-[7px] px-3 text-[11px]",
  small: "h-8 rounded-[7px] px-3 text-xs",
};

export default function Button({
  variant = "primary",
  size = "md",
  href,
  className = "",
  children,
  type = "button",
  ...props
}) {
  const classes = [
    "inline-flex cursor-pointer items-center justify-center whitespace-nowrap border font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:pointer-events-none disabled:opacity-50",
    VARIANTS[variant],
    SIZES[size],
    className,
  ].filter(Boolean).join(" ");

  return href ? (
    <Link href={href} className={classes} {...props}>{children}</Link>
  ) : (
    <button type={type} className={classes} {...props}>{children}</button>
  );
}
