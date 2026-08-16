"use client";

import * as React from "react";
import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightSlot?: React.ReactNode;
  isRequired?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className = "",
      type,
      label,
      helperText,
      error,
      leftIcon,
      rightSlot,
      isRequired = false,
      id,
      ...props
    },
    ref
  ) => {
    const [showPassword, setShowPassword] = useState(false);
    const isPassword = type === "password";
    const currentType = isPassword ? (showPassword ? "text" : "password") : type;
    const generatedId = React.useId();
    const inputId = id || generatedId;

    return (
      <div className="w-full space-y-1.5 text-left">
        {label && (
          <div className="flex items-center justify-between">
            <label
              htmlFor={inputId}
              className="block text-xs font-bold text-slate-800 tracking-tight"
            >
              {label} {isRequired && <span className="text-rose-600 font-bold">*</span>}
            </label>
          </div>
        )}

        <div className="relative flex items-center">
          {leftIcon && (
            <div className="absolute left-3 flex items-center pointer-events-none text-slate-500">
              {leftIcon}
            </div>
          )}

          <input
            id={inputId}
            type={currentType}
            className={`flex h-10 w-full rounded-[8px] border border-slate-300 bg-white text-slate-900 font-medium ${
              leftIcon ? "pl-9" : "pl-3"
            } ${isPassword || rightSlot ? "pr-10" : "pr-3"} py-2 text-xs sm:text-sm placeholder:text-slate-500 transition-all duration-150 focus:outline-none focus:border-[#1554C0] focus:ring-3 focus:ring-blue-600/15 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:opacity-60 shadow-2xs ${
              error ? "border-rose-500 focus:border-rose-500 focus:ring-rose-500/15" : ""
            } ${className}`}
            ref={ref}
            aria-invalid={!!error}
            aria-describedby={error ? `${inputId}-error` : helperText ? `${inputId}-help` : undefined}
            {...props}
          />

          {isPassword && (
            <button
              type="button"
              className="absolute right-2 text-slate-500 hover:text-slate-800 transition-colors p-1.5 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1554C0] cursor-pointer"
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

          {rightSlot && !isPassword && (
            <div className="absolute right-2.5 flex items-center">
              {rightSlot}
            </div>
          )}
        </div>

        {error && (
          <p id={`${inputId}-error`} className="text-[11px] font-bold text-rose-600 flex items-center gap-1 mt-1">
            <span>{error}</span>
          </p>
        )}

        {helperText && !error && (
          <p id={`${inputId}-help`} className="text-[11px] text-slate-600 font-medium mt-1">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
