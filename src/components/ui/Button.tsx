import type { ComponentProps } from "react";

type Variant = "primary" | "outline" | "ghost";
type Size = "sm" | "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2 rounded-button font-bold tracking-[0.02em] text-center " +
  "transition-[background-color,color,border-color,transform] duration-200 ease-out " +
  "active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100 " +
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";

const variants: Record<Variant, string> = {
  primary: "bg-primary text-white shadow-soft hover:bg-primary-hover",
  outline: "border border-primary bg-surface text-primary hover:bg-blush",
  ghost: "text-ink-soft underline-offset-4 hover:text-primary hover:underline",
};

const sizes: Record<Size, string> = {
  sm: "min-h-11 px-4 text-[13px]",
  md: "min-h-11 px-4 py-2 text-[14px]",
  lg: "min-h-[52px] px-5 py-3 text-[14px] uppercase md:text-[15px]",
};

/** Classes do botão, para usar também em <a> (links de download). */
export function buttonClass({
  variant = "primary",
  size = "lg",
  fullWidth = false,
}: { variant?: Variant; size?: Size; fullWidth?: boolean } = {}) {
  return `${base} ${variants[variant]} ${sizes[size]} ${fullWidth ? "w-full" : ""}`;
}

type Props = ComponentProps<"button"> & {
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
};

export function Button({ variant, size, fullWidth, className = "", ...props }: Props) {
  return <button type="button" className={`${buttonClass({ variant, size, fullWidth })} ${className}`} {...props} />;
}
