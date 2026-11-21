import { describe, it, expect } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { InvictusLoadingScreen, InvictusInlineLoader } from "./InvictusLoadingScreen";
import {
  SpaceCockpitSkeleton,
  TodayCockpitSkeleton,
  MoneyCockpitSkeleton,
  HabitsCockpitSkeleton,
  StudyCockpitSkeleton,
  TasksCockpitSkeleton,
  TasksKanbanSkeleton,
  SettingsSkeleton,
  AnalyticsSkeleton,
  ProfileSkeleton,
  HabitsListSkeleton,
  SubjectsGridSkeleton,
} from "./NeobrutalistSkeleton";

describe("Loading States Architecture: Spinner vs. Skeletons", () => {
  describe("InvictusLoadingScreen (Unknown Layout Gate)", () => {
    it("renders clean sovereign icon splash screen without terminal bootloader text", () => {
      const html = renderToStaticMarkup(React.createElement(InvictusLoadingScreen));
      // Bootloader terminal clutter is cleanly removed
      expect(html).not.toContain("INITIALIZING INVICTUS OS");
      expect(html).not.toContain("Loading encrypted offline state…");
      // Contains the Sovereign Monolith vector SVG mark
      expect(html).toContain("<svg viewBox=\"0 0 512 512\"");
      // Contains squircle splash styling & dark mode tokens
      expect(html).toContain("rounded-3xl");
      expect(html).toContain("dark:bg-[#121110]");
      expect(html).toContain("dark:bg-[#1E1C1A]");
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
      expect(sm).toContain("size-4");
      expect(lg).toContain("size-6");
    });
  });

  describe("Neobrutalist Skeletons (Known Layout Spatial Continuity)", () => {
    it("renders SpaceCockpitSkeleton with dual-theme wireframe cards", () => {
      const html = renderToStaticMarkup(React.createElement(SpaceCockpitSkeleton));
      expect(html).toContain("animate-pulse");
      expect(html).toContain("dark:bg-[#1C1A18]");
      expect(html).toContain("dark:border-[#383531]");
    });

    it("renders MoneyCockpitSkeleton with Belanje card deck, 4-launcher grid, and ledger rows", () => {
      const html = renderToStaticMarkup(React.createElement(MoneyCockpitSkeleton));
      expect(html).toContain("animate-pulse");
      expect(html).toContain("rounded-3xl");
      // Contains 4-column squircle quick action launchers
      expect(html).toContain("grid-cols-4");
      // Contains dark luxury card deck wireframe
      expect(html).toContain("dark:bg-[#0D0C0B]");
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

    it("renders TodayCockpitSkeleton with 5-slot flow wireframes", () => {
      const html = renderToStaticMarkup(React.createElement(TodayCockpitSkeleton));
      expect(html).toContain("animate-pulse");
      expect(html).toContain("grid-cols-2 sm:grid-cols-4");
    });

    it("renders TasksCockpitSkeleton with studio rapid dock and checklist wireframes", () => {
      const html = renderToStaticMarkup(React.createElement(TasksCockpitSkeleton));
      expect(html).toContain("animate-pulse");
      expect(html).toContain("grid-cols-2 sm:grid-cols-4");
    });

    it("renders TasksKanbanSkeleton with 3 Kanban column wireframes", () => {
      const html = renderToStaticMarkup(React.createElement(TasksKanbanSkeleton));
      expect(html).toContain("grid-cols-1 md:grid-cols-3");
      expect(html).toContain("animate-pulse");
    });

    it("renders SettingsSkeleton with header and profile card wireframes", () => {
      const html = renderToStaticMarkup(React.createElement(SettingsSkeleton));
      expect(html).toContain("max-w-3xl");
      expect(html).toContain("animate-pulse");
    });

    it("renders AnalyticsSkeleton and ProfileSkeleton with Neobrutalist wireframes", () => {
      const analytics = renderToStaticMarkup(React.createElement(AnalyticsSkeleton));
      const profile = renderToStaticMarkup(React.createElement(ProfileSkeleton));
      expect(analytics).toContain("animate-pulse");
      expect(profile).toContain("animate-pulse");
    });
  });
});
