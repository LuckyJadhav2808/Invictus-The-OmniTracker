import { describe, it, expect } from "vitest";
import { SettingsHeroSummary } from "./SettingsHeroSummary";
import { SettingsDoorTileRow } from "./SettingsDoorTileRow";

describe("Settings Mobile Redesign Components", () => {
  it("exports valid component definitions", () => {
    expect(SettingsHeroSummary).toBeDefined();
    expect(SettingsDoorTileRow).toBeDefined();
  });
});
