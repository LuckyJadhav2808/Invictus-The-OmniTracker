import Image from "next/image";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen w-full flex items-center justify-center overflow-x-hidden bg-[#FAF8F5] dark:bg-[#0D0C0B] bg-graph-grid p-4 sm:p-6 lg:p-8 transition-colors">
      {/* Background Image Layer with Adaptive Studio Atmosphere */}
      <div className="absolute inset-0 z-0 select-none pointer-events-none">
        <Image
          src="/images/login-bg.png"
          alt="Invictus Background"
          fill
          priority
          className="object-cover object-center opacity-[0.06] dark:opacity-[0.03] transition-all duration-700"
        />
        {/* Warm studio atmospheric gradient for light & dark modes */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#FAF8F5]/85 via-[#FAF8F5]/40 to-[#FAF8F5]/95 dark:from-[#0D0C0B]/90 dark:via-[#0D0C0B]/60 dark:to-[#0D0C0B]/95" />
      </div>

      {/* Main Content Area */}
      <div className="relative z-10 w-full max-w-5xl flex items-center justify-center">
        {children}
      </div>
    </div>
  );
}
