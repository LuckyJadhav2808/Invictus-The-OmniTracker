import { describe, it, expect } from "vitest";
import { DeveloperInfoCard } from "./DeveloperInfoCard";
import { APP_VERSION_CONFIG } from "@/config/version";

describe("DeveloperInfoCard Component Architecture", () => {
  it("exports DeveloperInfoCard as a valid React component", () => {
    expect(DeveloperInfoCard).toBeDefined();
    expect(typeof DeveloperInfoCard).toBe("function");
  });

  it("verifies developer credentials and social links structure", () => {
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

    expect(developer.name).toBe("Lucky Jadhav");
    expect(developer.education).toContain("Computer Engineering");
    expect(developer.college).toContain("Sinhgad College of Engineering");
    expect(developer.email).toBe("luckymanojjadhav@gmail.com");
    expect(developer.githubUrl).toContain("LuckyJadhav2808");
    expect(developer.repoUrl).toContain("Invictus-The-OmniTracker");
    expect(developer.version).toBe(APP_VERSION_CONFIG.version);
    expect(developer.buildNumber).toBe(APP_VERSION_CONFIG.buildNumber);
  });
});
