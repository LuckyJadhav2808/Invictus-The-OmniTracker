import Image from "next/image";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-[#FBEFE0] p-4 md:p-8">
      {/* Background Image Layer */}
      <div className="absolute inset-0 z-0 select-none">
        <Image
          src="/images/login-bg.png"
          alt="Invictus Background"
          fill
          priority
          className="object-cover object-center opacity-30 transition-all duration-700"
        />
        {/* Warm pastel atmospheric gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#FBEFE0]/60 via-transparent to-[#FBEFE0]/70" />
      </div>

      {/* Main Content Area */}
      <div className="relative z-10 w-full max-w-4xl flex items-center justify-center">
        {children}
      </div>
    </div>
  );
}


