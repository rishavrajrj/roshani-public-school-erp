import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { resolveUser } from '@/lib/auth/resolve-user';
import { LogoutButton } from '@/components/auth/logout-button';

export default async function ERPLayout({ children }: { children: React.ReactNode }) {
  const authState = await resolveUser();
  const headersList = await headers();
  const pathname = headersList.get('x-pathname') || '';

  if (authState.state === 'unauthenticated') {
    redirect('/login');
  }

  const isExempt = ['/erp/account-not-provisioned', '/erp/unauthorized', '/erp/select-role'].includes(pathname);

  if (!isExempt) {
    if (authState.state === 'unprovisioned') {
      redirect('/erp/account-not-provisioned');
    }
    if (authState.state === 'disabled') {
      redirect('/erp/unauthorized');
    }
  }

  const isFullyAuthenticated = authState.state === 'authenticated';
  const userName = isFullyAuthenticated ? authState.user.fullName : '';
  const roles = isFullyAuthenticated ? authState.user.roles.join(', ') : '';

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-slate-800 text-white shadow-sm py-4 px-6 flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold">Roshani Public School</h1>
          {isFullyAuthenticated && (
            <div className="text-sm text-slate-300 mt-1">
              <span className="font-semibold">{userName}</span> — {roles}
            </div>
          )}
        </div>
        <div className="bg-white rounded-md">
          <LogoutButton />
        </div>
      </header>
      <main className="flex-1 flex flex-col">
        {children}
      </main>
    </div>
  );
}
