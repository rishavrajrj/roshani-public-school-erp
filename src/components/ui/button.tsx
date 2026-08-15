import * as React from "react";
import { Loader2 } from "lucide-react";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "destructive" | "ghost" | "outline";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = "", variant = "primary", size = "md", isLoading, children, disabled, ...props }, ref) => {
    const baseStyles = "inline-flex items-center justify-center rounded-[8px] font-bold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1554C0] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-60 active:scale-[0.99]";
    
    const variants = {
      primary: "bg-[#1554C0] text-white hover:bg-[#0F44A3] shadow-md hover:shadow-lg shadow-blue-900/20",
      secondary: "bg-slate-100 text-slate-900 hover:bg-slate-200",
      outline: "border border-slate-300 bg-transparent text-slate-700 hover:bg-slate-50",
      destructive: "bg-red-600 text-white hover:bg-red-700 shadow-sm",
      ghost: "hover:bg-slate-100 hover:text-slate-900 text-slate-700",
    };

    const sizes = {
      sm: "h-8 px-3 text-xs rounded-md",
      md: "h-[44px] px-4 text-xs sm:text-sm",
      lg: "h-[44px] px-5 text-xs sm:text-sm",
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
            <Loader2 className="mr-2 h-4 w-4 animate-spin text-white" />
            <span>Signing in...</span>
          </>
        ) : (
          children
        )}
      </button>
    );
  }
);
Button.displayName = "Button";
