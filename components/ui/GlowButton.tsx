"use client";

import type {
  ButtonHTMLAttributes,
  AnchorHTMLAttributes,
  ReactNode,
} from "react";
import clsx from "clsx";
import { Loader2 } from "lucide-react";

type BaseProps = {
  className?: string;
  loading?: boolean;
  disabled?: boolean;
  variant?: "primary" | "secondary" | "ghost" | "gradient";
  iconLeft?: ReactNode;
  iconRight?: ReactNode;
  children: ReactNode;
};

type ButtonAsButton = BaseProps & {
  as?: "button";
} & ButtonHTMLAttributes<HTMLButtonElement>;
type ButtonAsAnchor = BaseProps & {
  as: "a";
} & AnchorHTMLAttributes<HTMLAnchorElement>;
type Props = ButtonAsButton | ButtonAsAnchor;

export default function GlowButton({
  className,
  children,
  as = "button",
  loading,
  disabled,
  variant = "primary",
  iconLeft,
  iconRight,
  ...rest
}: Props) {
  const isActuallyDisabled = disabled || loading;

  const styles: Record<string, string> = {
    primary: [
      "bg-gradient-to-br from-[#d97757] to-[#c96846]",
      "hover:from-[#e89a7a] hover:to-[#d97757]",
      "text-white shadow-md shadow-[#d97757]/20 hover:shadow-lg hover:shadow-[#d97757]/30",
      "border border-[#e89a7a]/30 hover:border-[#e89a7a]/50",
      "relative overflow-hidden",
      "before:absolute before:inset-0 before:bg-gradient-to-t before:from-transparent before:via-white/10 before:to-white/20",
      "after:absolute after:inset-0 after:rounded-2xl after:opacity-0 hover:after:opacity-100 after:transition-opacity after:duration-300",
      "after:bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.3),transparent_50%)]",
    ].join(" "),
    secondary: [
      "bg-[#2a2520]/70 backdrop-blur-sm",
      "hover:bg-[#2a2520]/90",
      "text-[#f5f1ed]",
      "border border-[#e89a7a]/20",
      "hover:border-[#e89a7a]/40",
      "shadow-sm shadow-[#2a2520]/5 hover:shadow-md hover:shadow-[#d97757]/10",
      "relative overflow-hidden",
      "before:absolute before:inset-0 before:bg-gradient-to-br before:from-[#d97757]/0 before:to-[#7a9b88]/0",
      "hover:before:from-[#d97757]/5 hover:before:to-[#7a9b88]/5 before:transition-all before:duration-300",
    ].join(" "),
    ghost: [
      "bg-transparent hover:bg-[#d97757]/8 active:bg-[#d97757]/12",
      "text-[#e89a7a]",
      "hover:text-[#d97757]",
      "border border-transparent hover:border-[#e89a7a]/20",
      "relative overflow-hidden",
      "after:absolute after:inset-0 after:rounded-2xl after:border after:border-[#d97757]/0",
      "hover:after:border-[#d97757]/30 after:transition-all after:duration-300",
    ].join(" "),
    gradient: [
      "relative text-white overflow-hidden",
      "bg-gradient-to-br from-[#d97757] via-[#7a9b88] to-[#b8957a]",
      "hover:from-[#e89a7a] hover:via-[#8faf9d] hover:to-[#c9a68a]",
      "shadow-lg shadow-[#d97757]/20 hover:shadow-xl hover:shadow-[#d97757]/30",
      "border border-white/20 hover:border-white/40",
      "before:absolute before:inset-0 before:bg-gradient-to-br before:from-white/20 before:via-transparent before:to-transparent",
      "after:absolute after:inset-0 after:bg-gradient-to-t after:from-black/10 after:to-transparent",
      "before:opacity-0 hover:before:opacity-100 before:transition-opacity before:duration-500",
      "[&>*]:relative [&>*]:z-10",
    ].join(" "),
  };

  const base = clsx(
    "group inline-flex items-center justify-center gap-2.5 rounded-xl px-5 py-2.5 font-semibold text-sm select-none",
    "transition-all duration-300 ease-out",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d97757] focus-visible:ring-offset-2",
    "focus-visible:ring-offset-[#1a1714]",
    "active:scale-[0.97]",
    isActuallyDisabled ? "cursor-not-allowed opacity-60 pointer-events-none" : "hover:scale-[1.02] active:translate-y-[1px]",
    styles[variant],
    className
  );

  if (as === "a") {
    const anchorProps = rest as AnchorHTMLAttributes<HTMLAnchorElement>;
    return (
      <a 
        className={base} 
        aria-disabled={isActuallyDisabled}
        {...anchorProps}
      >
        {iconLeft}
        <span className="relative flex items-center gap-2">
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          <span className="relative z-10">{children}</span>
        </span>
        {iconRight}
      </a>
    );
  }

  const buttonProps = rest as ButtonHTMLAttributes<HTMLButtonElement>;
  return (
    <button
      className={base}
      {...buttonProps}
      disabled={isActuallyDisabled}
    >
      {iconLeft}
      <span className="relative flex items-center gap-2">
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        <span className="relative z-10">{children}</span>
      </span>
      {iconRight}
    </button>
  );
}
