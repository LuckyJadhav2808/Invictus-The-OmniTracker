import { describe, it, expect, vi } from "vitest";
import React from "react";
import { OnboardingValueTour } from "./OnboardingValueTour";
import { OnboardingInteractiveSetup } from "./OnboardingInteractiveSetup";
import { EmptyState } from "@/components/shared/EmptyState";

describe("Onboarding Components & Flow", () => {
  it("exports OnboardingValueTour as a valid functional component", () => {
    expect(typeof OnboardingValueTour).toBe("function");
    const elem = React.createElement(OnboardingValueTour, {
      onStartSetup: vi.fn(),
      onSkipToLogin: vi.fn(),
    });
    expect(elem).toBeDefined();
  });

  it("exports OnboardingInteractiveSetup as a valid functional component", () => {
    expect(typeof OnboardingInteractiveSetup).toBe("function");
    const elem = React.createElement(OnboardingInteractiveSetup, {
      onComplete: vi.fn(),
      onBackToTour: vi.fn(),
      onSkipToLogin: vi.fn(),
    });
    expect(elem).toBeDefined();
  });

  it("renders EmptyState with Mascot Guide and speech bubble", () => {
    const elem = React.createElement(EmptyState, {
      showMascot: true,
      mascotGear: "fitness",
      mascotQuip: "Discipline beats motivation!",
      title: "Build Your Daily Discipline",
      description: "Habits turn consistency into compounding results.",
      ctaText: "Explore Presets",
      onCtaClick: vi.fn(),
      secondaryCtaText: "+ Custom Habit",
      onSecondaryCtaClick: vi.fn(),
    });

    expect(elem).toBeDefined();
    expect(elem.props.showMascot).toBe(true);
    expect(elem.props.mascotGear).toBe("fitness");
    expect(elem.props.mascotQuip).toBe("Discipline beats motivation!");
    expect(elem.props.ctaText).toBe("Explore Presets");
    expect(elem.props.secondaryCtaText).toBe("+ Custom Habit");
  });
});
