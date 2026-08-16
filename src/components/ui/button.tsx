import * as React from "react";
import { Loader2 } from "lucide-react";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "destructive" | "ghost" | "outline" | "success" | "link";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
  loadingText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className = "",
      variant = "primary",
      size = "md",
      isLoading = false,
      loadingText,
      leftIcon,
      rightIcon,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      "inline-flex items-center justify-center font-semibold transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1554C0] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.99] cursor-pointer select-none";

    const variants = {
      primary:
        "bg-[#1554C0] text-white hover:bg-[#0F44A3] shadow-xs hover:shadow-md shadow-blue-950/15 border border-blue-700/50",
      secondary:
        "bg-slate-100 text-slate-800 hover:bg-slate-200 border border-slate-200/80 shadow-2xs",
      outline:
        "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900 shadow-2xs",
      destructive:
        "bg-rose-600 text-white hover:bg-rose-700 shadow-xs border border-rose-700/50",
      success:
        "bg-emerald-600 text-white hover:bg-emerald-700 shadow-xs border border-emerald-700/50",
      ghost:
        "bg-transparent hover:bg-slate-100 text-slate-700 hover:text-slate-900",
      link:
        "bg-transparent text-[#1554C0] hover:underline p-0 h-auto font-medium shadow-none",
    };

    const sizes = {
      sm: "h-8 px-2.5 text-xs rounded-[6px] gap-1.5",
      md: "h-10 px-4 text-xs sm:text-sm rounded-[8px] gap-2",
      lg: "h-11 px-5 text-sm sm:text-base rounded-[10px] gap-2.5",
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
        {...props}
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin shrink-0" />
            {loadingText ? <span>{loadingText}</span> : children ? <span>{children}</span> : <span>Loading...</span>}
          </>
        ) : (
          <>
            {leftIcon && <span className="shrink-0">{leftIcon}</span>}
            {children}
            {rightIcon && <span className="shrink-0">{rightIcon}</span>}
          </>
        )}
      </button>
    );
  }
);

Button.displayName = "Button";
