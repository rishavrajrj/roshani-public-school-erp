import { redirect } from 'next/navigation'

/**
 * Root page — redirects to login.
 * The ERP is an authenticated application.
 */
export default function Home() {
  redirect('/login')
}
