"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { resetPasswordSchema, type ResetPasswordInput } from "@/lib/auth/schemas";
import { resetPasswordAction } from "@/lib/auth/actions";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SchoolLogo } from "@/components/ui/school-logo";
import { Lock, CheckCircle2 } from "lucide-react";
import Link from "next/link";

export default function ResetPasswordPage() {
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const onSubmit = async (data: ResetPasswordInput) => {
    setError(null);
    const formData = new FormData();
    formData.append("password", data.password);
    formData.append("confirmPassword", data.confirmPassword);

    const result = await resetPasswordAction(formData);

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
              Set New Password
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
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Password Updated</h2>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Your password has been successfully updated.
              </p>
            </div>
            <Link href="/login" className="block">
              <Button className="w-full">Sign In Now</Button>
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
              label="New Password"
              type="password"
              placeholder="Enter new password"
              leftIcon={<Lock className="w-4 h-4" />}
              {...register("password")}
              error={errors.password?.message}
            />

            <Input
              label="Confirm Password"
              type="password"
              placeholder="Confirm new password"
              leftIcon={<Lock className="w-4 h-4" />}
              {...register("confirmPassword")}
              error={errors.confirmPassword?.message}
            />

            <Button type="submit" className="w-full h-11" isLoading={isSubmitting}>
              Update Password
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
