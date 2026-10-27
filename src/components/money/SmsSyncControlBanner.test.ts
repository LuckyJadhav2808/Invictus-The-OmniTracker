import { describe, it, expect } from "vitest";
import { SmsSyncControlBanner } from "./SmsSyncControlBanner";
import fs from "node:fs";
import path from "node:path";

describe("SmsSyncControlBanner Responsive & Telemetry Architecture", () => {
  it("exports SmsSyncControlBanner as a valid functional component", () => {
    expect(SmsSyncControlBanner).toBeDefined();
    expect(typeof SmsSyncControlBanner).toBe("function");
  });

  it("verifies mobile zero-clipping CSS classes on subtitle description", () => {
    const filePath = path.resolve(__dirname, "./SmsSyncControlBanner.tsx");
    const source = fs.readFileSync(filePath, "utf-8");

    // Must have break-words and whitespace-normal so text does not overflow 360px screens
    expect(source).toContain("break-words");
    expect(source).toContain("whitespace-normal");

    // The description paragraph must NOT have 'truncate' on the subtitle
    const subtitleParagraphMatch = source.match(/<p className="([^"]*)"[^>]*>\s*\{isNative/);
    expect(subtitleParagraphMatch).not.toBeNull();
    const classList = subtitleParagraphMatch ? subtitleParagraphMatch[1] : "";
    expect(classList).not.toContain("truncate");
    expect(classList).toContain("break-words");
    expect(classList).toContain("whitespace-normal");
  });

  it("ensures primary action buttons wrap gracefully on small screens", () => {
    const filePath = path.resolve(__dirname, "./SmsSyncControlBanner.tsx");
    const source = fs.readFileSync(filePath, "utf-8");

    // Action button container must support flex-wrap and responsive alignment
    expect(source).toContain("justify-start sm:justify-end");
    expect(source).toContain("flex-wrap sm:flex-nowrap");
  });
});
