import { redirect } from 'next/navigation';
import { resolveUser } from '@/lib/auth/resolve-user';
import { ROLE_ROUTES } from '@/lib/auth/constants';

export default async function ERPRootPage() {
  const authState = await resolveUser();

  if (authState.state === 'unauthenticated') {
    redirect('/login');
  }

  if (authState.state === 'unprovisioned') {
    redirect('/erp/account-not-provisioned');
  }

  if (authState.state === 'disabled') {
    redirect('/erp/unauthorized');
  }

  if (authState.state === 'authenticated') {
    const roles = authState.user.roles;
    if (roles.length === 1) {
      const defaultRoute = ROLE_ROUTES[roles[0] as keyof typeof ROLE_ROUTES] || '/erp/select-role';
      redirect(defaultRoute);
    } else if (roles.length > 1) {
      redirect('/erp/select-role');
    } else {
      // Fallback if no roles found somehow (should be caught by unprovisioned but just in case)
      redirect('/erp/account-not-provisioned');
    }
  }

  // Fallback
  return null;
}
