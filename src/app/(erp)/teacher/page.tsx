import { redirect } from 'next/navigation';
import Link from 'next/link';
import { resolveUser, hasAnyRole } from '@/lib/auth/resolve-user';
import { ROUTE_ALLOWED_ROLES } from '@/lib/auth/constants';
import { LogoutButton } from '@/components/auth/logout-button';

export default async function TeacherPortalPage() {
  const authState = await resolveUser();

  if (authState.state !== 'authenticated') {
    redirect('/login');
  }

  const allowedRoles = ROUTE_ALLOWED_ROLES['/erp/teacher'] || [];
  if (!hasAnyRole(authState.user, allowedRoles)) {
    redirect('/erp/unauthorized');
  }

  const { user } = authState;
  const hasMultipleRoles = user.roles.length > 1;

  return (
    <div className="flex-1 flex flex-col bg-slate-50">
      <div className="h-2 w-full bg-emerald-600"></div>
      <div className="p-8 max-w-5xl mx-auto w-full">
        <div className="mb-8 flex justify-between items-end">
          <div>
            <h2 className="text-3xl font-bold text-slate-900">Teacher Portal</h2>
            <p className="text-slate-500 mt-1">Phase 2 Authentication Complete</p>
          </div>
          {hasMultipleRoles && (
            <Link href="/erp/select-role" className="text-sm font-medium text-blue-600 hover:text-blue-800">
              &larr; Back to Role Selection
            </Link>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 max-w-md">
          <h3 className="text-lg font-semibold text-slate-800 mb-4 border-b pb-2">User Information</h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500">Name:</span>
              <span className="font-medium text-slate-900">{user.fullName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">School ID:</span>
              <span className="font-medium text-slate-900">{user.schoolId}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Status:</span>
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                {user.status}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Roles:</span>
              <span className="font-medium text-slate-900 text-right">
                {user.roles.join(', ')}
              </span>
            </div>
          </div>
          <div className="mt-6 pt-4 border-t border-slate-100 flex justify-end">
            <LogoutButton />
          </div>
        </div>
      </div>
    </div>
  );
}
