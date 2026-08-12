import Link from "next/link";
import { LogoutButton } from "@/components/auth/logout-button";

export default function AccountNotProvisionedPage() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8 text-center border border-slate-200">
        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-amber-100 mb-4">
          <svg className="h-6 w-6 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Account Not Provisioned</h2>
        <p className="text-slate-600 mb-8">
          Your account has not been provisioned for the ERP system. Please contact your school administrator to grant you access.
        </p>
        <div className="flex flex-col space-y-4">
          <Link href="/login" className="text-blue-600 hover:text-blue-800 text-sm font-medium">
            Return to Login
          </Link>
          <div className="w-full flex justify-center">
            <LogoutButton />
          </div>
        </div>
      </div>
    </div>
  );
}
