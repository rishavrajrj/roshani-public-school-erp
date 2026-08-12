import Link from "next/link";
import { redirect } from "next/navigation";
import { resolveUser } from "@/lib/auth/resolve-user";
import { ROLE_ROUTES, ROLE_PRIORITY } from "@/lib/auth/constants";
import type { RoleName } from "@/types/auth";

export default async function SelectRolePage() {
  const authState = await resolveUser();

  if (authState.state !== 'authenticated') {
    redirect('/login');
  }

  const sortedRoles = [...authState.user.roles].sort((a, b) => {
    const priorityA = ROLE_PRIORITY[a as RoleName] ?? 99;
    const priorityB = ROLE_PRIORITY[b as RoleName] ?? 99;
    return priorityA - priorityB;
  });

  return (
    <div className="flex-1 flex flex-col items-center p-8 bg-slate-50">
      <div className="max-w-4xl w-full">
        <h2 className="text-3xl font-bold text-slate-900 mb-2">Select Your Role</h2>
        <p className="text-slate-600 mb-8">
          You have multiple roles assigned. Please choose which portal you want to access.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedRoles.map((role) => (
            <Link
              key={role}
              href={ROLE_ROUTES[role as RoleName] || '/erp'}
              className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md hover:border-blue-300 transition-all group"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-slate-800 group-hover:text-blue-700">
                  {role}
                </h3>
                <svg className="h-5 w-5 text-slate-400 group-hover:text-blue-600 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
              <p className="text-slate-500 text-sm">
                Access the {role} portal to manage your tasks and responsibilities.
              </p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
