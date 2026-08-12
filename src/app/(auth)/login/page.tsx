import { Metadata } from "next";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = {
  title: "Login — Roshani Public School ERP",
  description: "Sign in to Roshani Public School ERP",
};

export default function LoginPage() {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-xl font-semibold text-slate-900">
          Welcome back
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Please enter your details to sign in
        </p>
      </div>
      <LoginForm />
    </div>
  );
}
