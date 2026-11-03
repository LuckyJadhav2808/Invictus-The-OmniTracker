import { describe, it, expect } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { InvictusLoadingScreen, InvictusInlineLoader } from "./InvictusLoadingScreen";
import {
  SpaceCockpitSkeleton,
  MoneyCockpitSkeleton,
  HabitsCockpitSkeleton,
  StudyCockpitSkeleton,
  TasksCockpitSkeleton,
  SettingsSkeleton,
  SpaceHeroSkeleton,
  TelemetryGridSkeleton,
  HabitsListSkeleton,
  SubjectsGridSkeleton,
} from "./NeobrutalistSkeleton";

describe("Loading States Architecture: Spinner vs. Skeletons", () => {
  describe("InvictusLoadingScreen (Unknown Layout Gate)", () => {
    it("renders default initializing message and telemetry badge", () => {
      const html = renderToStaticMarkup(React.createElement(InvictusLoadingScreen));
      expect(html).toContain("INITIALIZING INVICTUS OS");
      expect(html).toContain("Hydrating encrypted vault &amp; offline cache");
      expect(html).toContain("Vault Active • Offline-First");
      // Contains the Sovereign Monolith polygon vector
      expect(html).toContain("polygon points=\"12,2 22,22 12,17 2,22\"");
      // Contains dark mode classes
      expect(html).toContain("dark:bg-[#121110]");
      expect(html).toContain("dark:bg-[#1C1A18]");
    });

    it("renders custom message and submessage accurately", () => {
      const html = renderToStaticMarkup(
        React.createElement(InvictusLoadingScreen, {
          message: "Authenticating Explorer…",
          submessage: "Verifying secure cryptographic handshake",
          fullscreen: false,
        })
      );
      expect(html).toContain("Authenticating Explorer…");
      expect(html).toContain("Verifying secure cryptographic handshake");
      expect(html).not.toContain("min-h-screen");
    });

    it("renders InvictusInlineLoader with correct size variants", () => {
      const sm = renderToStaticMarkup(React.createElement(InvictusInlineLoader, { size: "sm" }));
      const lg = renderToStaticMarkup(React.createElement(InvictusInlineLoader, { size: "lg" }));
      expect(sm).toContain("size-8");
      expect(lg).toContain("size-12");
    });
  });

  describe("Neobrutalist Skeletons (Known Layout Spatial Continuity)", () => {
    it("renders SpaceCockpitSkeleton with dual-theme wireframe cards", () => {
      const html = renderToStaticMarkup(React.createElement(SpaceCockpitSkeleton));
      expect(html).toContain("animate-pulse");
      expect(html).toContain("dark:bg-[#1C1A18]");
      expect(html).toContain("dark:border-[#383531]");
    });

    it("renders MoneyCockpitSkeleton with 4-tab control placeholders", () => {
      const html = renderToStaticMarkup(React.createElement(MoneyCockpitSkeleton));
      expect(html).toContain("animate-pulse");
      expect(html).toContain("rounded-xl");
      // Contains category card grid wireframes
      expect(html).toContain("grid-cols-1 md:grid-cols-2 lg:grid-cols-3");
    });

    it("renders HabitsCockpitSkeleton and HabitsListSkeleton", () => {
      const cockpit = renderToStaticMarkup(React.createElement(HabitsCockpitSkeleton));
      const list = renderToStaticMarkup(React.createElement(HabitsListSkeleton, { count: 3 }));
      expect(cockpit).toContain("animate-pulse");
      expect(list).toContain("animate-pulse");
    });

    it("renders StudyCockpitSkeleton and SubjectsGridSkeleton", () => {
      const study = renderToStaticMarkup(React.createElement(StudyCockpitSkeleton));
      const subjects = renderToStaticMarkup(React.createElement(SubjectsGridSkeleton, { count: 2 }));
      expect(study).toContain("animate-pulse");
      expect(subjects).toContain("grid-cols-1 md:grid-cols-2");
    });

    it("renders TasksCockpitSkeleton with 3 Kanban column wireframes", () => {
      const html = renderToStaticMarkup(React.createElement(TasksCockpitSkeleton));
      expect(html).toContain("grid-cols-1 md:grid-cols-3");
      expect(html).toContain("animate-pulse");
    });

    it("renders SettingsSkeleton with header and profile card wireframes", () => {
      const html = renderToStaticMarkup(React.createElement(SettingsSkeleton));
      expect(html).toContain("max-w-3xl");
      expect(html).toContain("animate-pulse");
    });
  });
});
