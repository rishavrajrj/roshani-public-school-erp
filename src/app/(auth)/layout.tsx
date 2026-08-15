export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen w-full bg-[#031B3A] text-slate-900 font-sans antialiased selection:bg-[#1554C0] selection:text-white">
      {children}
    </div>
  );
}
