"use client";

import * as React from "react";
import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className = "", type, label, error, leftIcon, ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false);
    const isPassword = type === "password";
    const currentType = isPassword ? (showPassword ? "text" : "password") : type;

    return (
      <div className="w-full space-y-1">
        {label && (
          <label className="block text-[11px] font-semibold text-[#102A43]">
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {leftIcon && (
            <div className="absolute left-3 flex items-center pointer-events-none text-[#667085]">
              {leftIcon}
            </div>
          )}
          <input
            type={currentType}
            className={`flex h-[44px] w-full rounded-[8px] border border-[#D9DEE8] bg-white text-[#102A43] font-medium ${
              leftIcon ? "pl-9" : "pl-3"
            } ${isPassword ? "pr-9" : "pr-3"} py-2 text-xs sm:text-sm placeholder:text-[#667085] transition-all duration-200 focus:outline-none focus:border-[#1554C0] focus:ring-4 focus:ring-blue-600/10 disabled:cursor-not-allowed disabled:opacity-50 ${
              error ? "border-red-500 focus:border-red-500 focus:ring-red-500/10" : ""
            } ${className}`}
            ref={ref}
            {...props}
          />
          {isPassword && (
            <button
              type="button"
              tabIndex={-1}
              className="absolute right-2.5 text-[#667085] hover:text-[#102A43] transition-colors p-1 rounded focus:outline-none"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          )}
        </div>
        {error && (
          <p className="text-[10px] font-semibold text-red-600 flex items-center gap-1 mt-0.5">
            <span>{error}</span>
          </p>
        )}
      </div>
    );
  }
);
Input.displayName = "Input";
