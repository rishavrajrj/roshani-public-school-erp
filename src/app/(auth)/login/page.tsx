import { Metadata } from "next";
import Image from "next/image";
import { LoginForm } from "@/components/auth/login-form";
import { SchoolLogo } from "@/components/ui/school-logo";
import { GraduationCap, Users, CreditCard, BookOpen, Bell, ShieldCheck, Shield } from "lucide-react";

export const metadata: Metadata = {
  title: "Login — Roshani Public School ERP",
  description: "Official Sign-In Portal for Roshani Public School ERP System",
};

export default function LoginPage() {
  const FEATURES = [
    {
      title: "Students",
      subtitle: "Management",
      icon: GraduationCap,
    },
    {
      title: "Attendance",
      subtitle: "Tracking",
      icon: Users,
    },
    {
      title: "Fees",
      subtitle: "Management",
      icon: CreditCard,
    },
    {
      title: "Examinations",
      subtitle: "& Reports",
      icon: BookOpen,
    },
    {
      title: "Communication",
      subtitle: "& Notices",
      icon: Bell,
    },
    {
      title: "Secure",
      subtitle: "& Reliable",
      icon: ShieldCheck,
    },
  ];

  return (
    <div className="min-h-screen w-full flex flex-col justify-between relative overflow-hidden bg-[#031B3A] selection:bg-[#1554C0] selection:text-white">
      {/* Full-Screen School Building Background Photograph (Aligned Top) */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <Image
          src="/images/BuildingViewFront.webp"
          alt="Roshani Public School Front Building and Glass Tower"
          fill
          priority
          quality={95}
          className="object-cover object-top scale-100"
        />
        {/* Royal Navy Directional Gradient Overlay */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(105deg, rgba(3, 27, 58, 0.85) 0%, rgba(3, 27, 58, 0.60) 45%, rgba(3, 27, 58, 0.25) 100%), linear-gradient(to bottom, rgba(3, 27, 58, 0.4) 0%, rgba(3, 27, 58, 0.7) 100%)",
          }}
        ></div>
      </div>

      {/* Main Viewport Content Layout (Vertical Padding: 24px, Horizontal Padding: 48px on Desktop) */}
      <div className="relative z-10 w-full min-h-screen flex flex-col justify-between py-6 px-6 sm:px-8 lg:px-12 max-w-[1440px] mx-auto">
        {/* Top-Left School Branding Header */}
        <header className="w-full flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4">
            <SchoolLogo size="lg" priority />
            <div className="text-white drop-shadow-[0_2px_6px_rgba(0,0,0,0.6)]">
              <span className="font-extrabold text-xl sm:text-2xl tracking-tight font-serif uppercase block leading-none">
                ROSHANI
              </span>
              <span className="font-extrabold text-xl sm:text-2xl tracking-tight font-serif uppercase block leading-tight">
                PUBLIC SCHOOL
              </span>
              <span className="text-xs font-bold uppercase tracking-widest text-[#F4C542] block mt-0.5 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
                SCHOOL MANAGEMENT ERP
              </span>
            </div>
          </div>
        </header>

        {/* Center Grid — Two Column Composition */}
        <main className="w-full my-auto py-2 sm:py-3 lg:py-2 grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-8 items-center">
          {/* Left-Side Hero Content — Decreased Size */}
          <div className="order-2 lg:order-1 lg:col-span-7 xl:col-span-7 space-y-3 text-white text-center lg:text-left flex flex-col items-center lg:items-start">
            {/* Main Headline */}
            <div className="space-y-0.5 drop-shadow-[0_3px_8px_rgba(0,0,0,0.8)]">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight font-sans leading-tight">
                One School.
              </h1>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight font-sans leading-tight text-[#F4C542]">
                One Platform.
              </h1>
            </div>

            {/* Gold Horizontal Line Accent */}
            <div className="w-12 h-[2.5px] bg-[#F4C542] rounded-full my-2.5 shadow-sm"></div>

            {/* Paragraph Description */}
            <p className="text-xs sm:text-sm lg:text-base text-white leading-relaxed font-medium max-w-[450px] drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
              Manage academics, students, attendance, fees, examinations and communication from one secure platform.
            </p>

            {/* Feature Grid (2 rows x 3 cols) */}
            <div className="pt-1.5 grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-w-[480px] w-full text-left">
              {FEATURES.map((feat, idx) => {
                const Icon = feat.icon;
                return (
                  <div
                    key={idx}
                    className="p-2.5 rounded-xl bg-[#031B3A]/60 backdrop-blur-md border border-white/20 shadow-md flex flex-col items-start gap-2 hover:border-[#F4C542]/50 transition-colors"
                  >
                    <div className="p-1.5 rounded-lg bg-white/10 border border-white/20 text-[#F4C542]">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white leading-tight">
                        {feat.title}
                      </div>
                      <div className="text-[11px] text-white/80 font-medium leading-tight">
                        {feat.subtitle}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Login Card — Small Standard admin-login-card design from admin/login.html */}
          <div className="order-1 lg:order-2 lg:col-span-5 xl:col-span-5 flex justify-center lg:justify-end">
            <div
              className="w-full max-w-[360px] rounded-[16px] overflow-hidden bg-white text-slate-900 shadow-[0_20px_40px_-12px_rgba(0,0,0,0.45)] border border-slate-100/50"
              style={{
                boxShadow: "0 20px 40px -12px rgba(0, 0, 0, 0.45)",
              }}
            >
              <LoginForm />
            </div>
          </div>
        </main>

        {/* Bottom Left Security / Brand Line */}
        <footer className="w-full flex flex-col sm:flex-row items-center justify-between pt-4 text-xs text-white/90 border-t border-white/20 gap-2 shrink-0 drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)]">
          <div className="flex items-center gap-2 font-medium">
            <Shield className="w-4 h-4 text-[#F4C542] shrink-0" />
            <span>Secure Access • Trusted Platform • Better Education</span>
          </div>
          <p className="text-white/75 font-semibold">© 2026 Roshani Public School</p>
        </footer>
      </div>
    </div>
  );
}
