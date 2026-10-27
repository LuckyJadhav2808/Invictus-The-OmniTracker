"use client";

import React, { useState } from "react";
import { Mail, Copy, Check, ExternalLink, Code2, Sparkles, Heart, ShieldCheck, GraduationCap } from "lucide-react";
import { toast } from "sonner";
import { APP_VERSION_CONFIG } from "@/config/version";

export interface DeveloperInfoCardProps {
  className?: string;
}

export const DeveloperInfoCard: React.FC<DeveloperInfoCardProps> = ({ className = "" }) => {
  const [copied, setCopied] = useState(false);

  const developer = {
    name: "Lucky Jadhav",
    role: "Lead Architect & Founder",
    education: "3rd Year, Computer Engineering",
    college: "Sinhgad College of Engineering Vadgaon (Bk)",
    email: "luckymanojjadhav@gmail.com",
    githubUrl: "https://github.com/LuckyJadhav2808",
    repoUrl: "https://github.com/LuckyJadhav2808/Invictus-The-OmniTracker",
    version: APP_VERSION_CONFIG.version,
    buildNumber: APP_VERSION_CONFIG.buildNumber,
  };

  const handleCopyEmail = async () => {
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(developer.email);
        setCopied(true);
        toast.success("Copied to clipboard!", {
          description: developer.email,
        });
        setTimeout(() => setCopied(false), 2000);
      }
    } catch {
      toast.info("Email: " + developer.email);
    }
  };

  return (
    <div
      data-testid="developer-info-card"
      className={`w-full bg-white rounded-3xl p-5 sm:p-6 border-[2.5px] border-[#161514] shadow-[4px_4px_0px_0px_#161514] space-y-4 ${className}`}
    >
      {/* Header section with Badge & Version */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3.5">
          <div className="relative">
            <div className="h-12 w-12 rounded-2xl bg-[#CEF431] border-2 border-[#161514] flex items-center justify-center text-[#161514] shadow-[2px_2px_0px_0px_#161514] font-black text-lg font-heading">
              LJ
            </div>
            <div
              className="absolute -bottom-1 -right-1 h-5 w-5 bg-amber-400 rounded-full border border-[#161514] flex items-center justify-center shadow-[1px_1px_0px_0px_#161514]"
              title="Verified Lead Architect"
            >
              <Sparkles className="h-2.5 w-2.5 text-[#161514] stroke-[2.5]" />
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="font-black text-base text-[#161514] tracking-tight font-heading">
                {developer.name}
              </h4>
              <span className="bg-[#161514] text-[#CEF431] text-[9px] font-black uppercase px-2 py-0.5 rounded-full border border-[#161514]">
                {developer.role}
              </span>
            </div>
            <p className="text-[11px] text-[#161514]/70 font-bold tracking-tight mt-0.5">
              Creator of Invictus OS • Vibe-Coded with Relentless Passion
            </p>
          </div>
        </div>

        {/* Version Badge */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="bg-[#FAF8F5] text-[#161514] font-mono text-[10px] font-black px-2.5 py-1 rounded-xl border-2 border-[#161514] shadow-[1.5px_1.5px_0px_0px_#161514] flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5 text-[#03D26F] stroke-[2.5]" />
            v{developer.version} (Build {developer.buildNumber})
          </span>
        </div>
      </div>

      {/* Philosophy Callout Slip */}
      <div className="bg-[#FAF8F5] rounded-2xl p-3.5 border-2 border-[#161514] flex items-start gap-2.5">
        <Heart className="h-4 w-4 text-red-500 fill-red-500 shrink-0 mt-0.5" />
        <p className="text-xs font-semibold text-[#161514] leading-relaxed">
          &ldquo;Invictus was born out of a desire for a single, uncompromising life operating system that unites finances, biomechanics, study telemetry, and daily discipline without cloud bloat.&rdquo;
        </p>
      </div>

      {/* Academic & Engineering Background Slip */}
      <div className="bg-[#FAF8F5] rounded-2xl p-3.5 border-2 border-[#161514] flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-amber-400 border-2 border-[#161514] flex items-center justify-center shrink-0 shadow-[1.5px_1.5px_0px_0px_#161514]">
          <GraduationCap className="h-5 w-5 text-[#161514] stroke-[2.5]" />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h5 className="font-heading font-black text-xs sm:text-sm text-[#161514] tracking-tight">
              3rd Year • Computer Engineering
            </h5>
            <span className="bg-[#CEF431] text-[#161514] text-[9px] font-mono font-black uppercase px-2 py-0.5 rounded-full border border-[#161514]">
              SCOE
            </span>
          </div>
          <p className="text-[11px] text-[#161514]/75 font-bold tracking-tight truncate mt-0.5">
            Sinhgad College of Engineering, Vadgaon (Bk)
          </p>
        </div>
      </div>

      {/* Connect & Developer Links */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
        {/* GitHub Button */}
        <a
          href={developer.githubUrl}
          target="_blank"
          rel="noopener noreferrer"
          data-testid="developer-github-link"
          className="w-full bg-[#161514] hover:bg-[#2a2725] text-white font-black text-xs uppercase tracking-wider py-3 px-3 rounded-2xl border-2 border-[#161514] shadow-[3px_3px_0px_0px_#161514] hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none cursor-pointer transition-all flex items-center justify-center gap-2 text-center"
        >
          <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="currentColor">
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
            />
          </svg>
          <span>GitHub</span>
          <ExternalLink className="h-3 w-3 stroke-[2.5] opacity-60 ml-0.5" />
        </a>

        {/* Email Direct Mailto */}
        <a
          href={`mailto:${developer.email}`}
          data-testid="developer-email-link"
          className="w-full bg-white hover:bg-[#FAF8F5] text-[#161514] font-black text-xs uppercase tracking-wider py-3 px-3 rounded-2xl border-2 border-[#161514] shadow-[3px_3px_0px_0px_#161514] hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none cursor-pointer transition-all flex items-center justify-center gap-2 text-center"
        >
          <Mail className="h-4 w-4 stroke-[2.5]" />
          <span>Email</span>
          <ExternalLink className="h-3 w-3 stroke-[2.5] opacity-60 ml-0.5" />
        </a>

        {/* Copy Email Button */}
        <button
          type="button"
          onClick={handleCopyEmail}
          data-testid="developer-copy-email-btn"
          className="w-full bg-[#CEF431] hover:bg-[#bce028] text-[#161514] font-black text-xs uppercase tracking-wider py-3 px-3 rounded-2xl border-2 border-[#161514] shadow-[3px_3px_0px_0px_#161514] hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none cursor-pointer transition-all flex items-center justify-center gap-2 text-center"
          title="Copy email address to clipboard"
        >
          {copied ? (
            <>
              <Check className="h-4 w-4 stroke-[2.5] text-[#161514]" />
              <span>Copied!</span>
            </>
          ) : (
            <>
              <Copy className="h-4 w-4 stroke-[2.5]" />
              <span>Copy Email</span>
            </>
          )}
        </button>
      </div>

      {/* Repository Open Source Footer Pill */}
      <div className="pt-2 border-t-2 border-[#161514]/10 flex items-center justify-between text-[11px] font-bold text-[#161514]/80">
        <span className="flex items-center gap-1.5 font-mono">
          <Code2 className="h-3.5 w-3.5 stroke-[2.5] text-[#161514]" />
          <span>LuckyJadhav2808 / Invictus</span>
        </span>

        <a
          href={developer.repoUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="underline font-black hover:text-[#161514] flex items-center gap-1"
        >
          <span>Source Code</span>
          <ExternalLink className="h-2.5 w-2.5 stroke-[2.5]" />
        </a>
      </div>
    </div>
  );
};
export default DeveloperInfoCard;
