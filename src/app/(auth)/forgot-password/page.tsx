"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { forgotPasswordSchema, type ForgotPasswordInput } from "@/lib/auth/schemas";
import { forgotPasswordAction } from "@/lib/auth/actions";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SchoolLogo } from "@/components/ui/school-logo";
import { Mail, ArrowLeft, CheckCircle2 } from "lucide-react";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordInput) => {
    setError(null);
    const formData = new FormData();
    formData.append("email", data.email);

    const result = await forgotPasswordAction(formData);

    if (result?.error) {
      setError(result.error);
    } else {
      setIsSuccess(true);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-4 py-12 bg-slate-950 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-950/40 via-slate-950 to-slate-950">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200/80 dark:border-slate-800 p-8 space-y-6">
        <div className="text-center space-y-3">
          <div className="flex justify-center">
            <SchoolLogo size="lg" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
              Reset Password
            </h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Roshani Public School ERP
            </p>
          </div>
        </div>

        {isSuccess ? (
          <div className="space-y-6 text-center py-4">
            <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-950/50 rounded-full flex items-center justify-center mx-auto text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div className="space-y-2">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Check your email</h2>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                If an account exists for that email, we have sent instructions to reset your password.
              </p>
            </div>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to login</span>
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {error && (
              <div className="p-3.5 text-sm font-medium text-red-600 bg-red-50 dark:bg-red-950/40 dark:text-red-400 rounded-xl border border-red-200 dark:border-red-900">
                {error}
              </div>
            )}

            <Input
              label="Email Address"
              type="email"
              placeholder="Enter your registered email"
              leftIcon={<Mail className="w-4 h-4" />}
              {...register("email")}
              error={errors.email?.message}
            />

            <Button type="submit" className="w-full h-11" isLoading={isSubmitting}>
              Send Reset Link
            </Button>

            <div className="text-center pt-2">
              <Link
                href="/login"
                className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to login</span>
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
