'use client'

import { useState, useTransition } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { loginSchema, type LoginInput } from '@/lib/auth/schemas'
import { loginAction } from '@/lib/auth/actions'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { AlertCircle, Loader2 } from 'lucide-react'

export function LoginForm() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [rememberMe, setRememberMe] = useState(true)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  })

  const isLoading = isSubmitting || isPending || !!statusMessage

  const onSubmit = async (data: LoginInput) => {
    setError(null)
    setStatusMessage('Signing you in…')

    const formData = new FormData()
    formData.append('email', data.email)
    formData.append('password', data.password)

    try {
      const result = await loginAction(formData)

      if (result?.error) {
        setStatusMessage(null)
        if (
          result.error.toLowerCase().includes('invalid') ||
          result.error.toLowerCase().includes('credentials') ||
          result.error.toLowerCase().includes('password')
        ) {
          setError('Invalid credentials. Please check your details and try again.')
        } else {
          setError(result.error)
        }
      } else if (result?.redirectUrl) {
        setStatusMessage('Opening your dashboard…')
        startTransition(() => {
          router.replace(result.redirectUrl!)
          router.refresh()
        })

        // Safety fallback if client router doesn't unload within 2.5s
        setTimeout(() => {
          if (window.location.pathname !== result.redirectUrl) {
            window.location.href = result.redirectUrl!
          }
        }, 2500)
      }
    } catch (err: any) {
      setStatusMessage(null)
      setError(err?.message || 'A network error occurred. Please try again.')
    }
  }

  return (
    <div className="w-full bg-white rounded-[16px] overflow-hidden text-slate-900 shadow-xl border border-slate-200">
      {/* admin-login-header design scaled to small standard card */}
      <div className="bg-[#0f2440] py-5 px-5 text-center border-b-[4px] border-[#B91C5C]">
        <Image
          src="/images/logo.webp"
          alt="RPS Logo"
          width={52}
          height={52}
          priority
          className="w-[52px] h-[52px] rounded-full object-cover mb-2 border-[3px] border-white/40 mx-auto shadow-sm"
        />
        <h1 className="font-serif text-white text-xl sm:text-2xl font-extrabold mb-0.5 leading-tight tracking-tight">
          Welcome Back
        </h1>
        <p className="text-slate-200 text-xs font-medium leading-normal">
          Sign in to your school account
        </p>
      </div>

      {/* admin-login-form design scaled to small standard card */}
      <form
        id="login-form"
        onSubmit={(e) => {
          e.preventDefault()
          handleSubmit(onSubmit)(e)
        }}
        className="p-5 sm:p-6"
      >
        {/* error-alert box */}
        {error && (
          <div
            id="error-box"
            className="bg-[#fee2e2] border-l-4 border-[#dc2626] text-[#991b1b] p-3 rounded-[8px] text-xs mb-4 flex items-start gap-2 font-medium"
          >
            <AlertCircle className="w-4 h-4 text-[#dc2626] shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Email / Passcode field */}
        <div className="mb-3.5 space-y-1">
          <label htmlFor="email" className="block text-xs font-bold text-slate-800">
            Admin Email / Passcode
          </label>
          <Input
            id="email"
            type="text"
            placeholder="admin2026 or admin@roshanipublicschool.com"
            {...register('email')}
            error={errors.email?.message}
            className="w-full px-3 py-2 h-[38px] rounded-[8px] border border-[#cbd5e1] bg-white text-[#0f172a] font-medium text-xs sm:text-sm focus:border-[#B91C5C] focus:ring-4 focus:ring-[#B91C5C]/15 transition-all duration-200"
          />
        </div>

        {/* Password field */}
        <div className="mb-3.5 space-y-1">
          <label htmlFor="password" className="block text-xs font-bold text-slate-800">
            Password (for email sign-in)
          </label>
          <Input
            id="password"
            type="password"
            placeholder="••••••••"
            {...register('password')}
            error={errors.password?.message}
            className="w-full px-3 py-2 h-[38px] rounded-[8px] border border-[#cbd5e1] bg-white text-[#0f172a] font-medium text-xs sm:text-sm focus:border-[#B91C5C] focus:ring-4 focus:ring-[#B91C5C]/15 transition-all duration-200"
          />
        </div>

        {/* Form utilities row: Remember Me & Forgot Password */}
        <div className="flex items-center justify-between text-xs mb-4">
          <label className="flex items-center gap-1.5 text-slate-700 cursor-pointer font-semibold select-none">
            <input
              type="checkbox"
              id="remember"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="w-3.5 h-3.5 rounded border-slate-400 text-[#B91C5C] focus:ring-[#B91C5C]/20 cursor-pointer"
            />
            <span>Remember Me</span>
          </label>

          <Link
            href="/forgot-password"
            id="forgot-pass-link"
            className="text-[#B91C5C] hover:text-[#9e144c] font-bold no-underline transition-colors"
          >
            Forgot Password?
          </Link>
        </div>

        {/* Sign In Button */}
        <Button
          type="submit"
          id="submit-btn"
          disabled={isLoading}
          className="w-full justify-center py-2.5 px-3 h-[40px] bg-[#B91C5C] hover:bg-[#9e144c] text-white rounded-[8px] text-xs sm:text-sm font-bold transition-all border-none shadow-none hover:shadow-[0_4px_12px_rgba(185,28,92,0.3)] active:scale-[0.99] cursor-pointer"
          isLoading={isLoading}
        >
          {statusMessage ? statusMessage : 'Sign In to Portal →'}
        </Button>

        {/* Quick Fill Demo Credentials */}
        <div className="mt-4 pt-3.5 border-t border-slate-200" id="demo-quick-fill">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-extrabold tracking-tight text-slate-700 uppercase font-mono">
              ⚡ Quick Demo Logins
            </span>
            <span className="text-[10.5px] font-bold text-slate-500 font-mono">1-Click Fill</span>
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            {[
              { label: 'Admin', email: 'admin@roshanischool.com', badge: 'bg-indigo-50 text-indigo-800 hover:bg-indigo-100 border-indigo-300' },
              { label: 'Principal', email: 'principal@roshanischool.com', badge: 'bg-purple-50 text-purple-800 hover:bg-purple-100 border-purple-300' },
              { label: 'Teacher', email: 'teacher@roshanischool.com', badge: 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border-emerald-300' },
              { label: 'Accountant', email: 'accountant@roshanischool.com', badge: 'bg-amber-50 text-amber-900 hover:bg-amber-100 border-amber-300' },
              { label: 'Parent', email: 'parent@roshanischool.com', badge: 'bg-blue-50 text-blue-800 hover:bg-blue-100 border-blue-300' },
              { label: 'Student', email: 'student@roshanischool.com', badge: 'bg-rose-50 text-rose-800 hover:bg-rose-100 border-rose-300' },
            ].map((account) => (
              <button
                key={account.label}
                type="button"
                onClick={() => {
                  setValue('email', account.email, { shouldValidate: true })
                  setValue('password', 'TestPass123!', { shouldValidate: true })
                }}
                className={`py-1.5 px-2 text-xs font-bold rounded-md border transition-all active:scale-95 text-center cursor-pointer shadow-2xs ${account.badge}`}
              >
                {account.label}
              </button>
            ))}
          </div>
        </div>
      </form>
    </div>
  )
}
