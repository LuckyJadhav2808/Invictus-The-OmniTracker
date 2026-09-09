import Image from "next/image";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-[#FAF8F5] bg-graph-grid p-4 sm:p-6 md:p-8">
      {/* Background Image Layer */}
      <div className="absolute inset-0 z-0 select-none">
        <Image
          src="/images/login-bg.png"
          alt="Invictus Background"
          fill
          priority
          className="object-cover object-center opacity-[0.08] transition-all duration-700"
        />
        {/* Warm studio atmospheric gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#FAF8F5]/80 via-transparent to-[#FAF8F5]/90" />
      </div>

      {/* Main Content Area */}
      <div className="relative z-10 w-full max-w-4xl flex items-center justify-center">
        {children}
      </div>
    </div>
  );
}
