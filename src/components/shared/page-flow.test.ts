import { describe, it, expect } from "vitest";
import { getSubrouteInfo, resolveBackAction } from "@/lib/page-flow/page-flow-resolver";

describe("Page Flow: Subroute Breadcrumbs & Header Morphing", () => {
  it("identifies study subroutes and maps to parent study space", () => {
    const info = getSubrouteInfo("/study/physics-101");
    expect(info).toEqual({
      parentHref: "/study",
      parentLabel: "Study",
    });
  });

  it("identifies nested chapter subroutes and maps to subject space", () => {
    const info = getSubrouteInfo("/study/physics-101/chapter-5");
    expect(info).toEqual({
      parentHref: "/study/physics-101",
      parentLabel: "Subject",
    });
  });

  it("identifies habits/goals detail routes", () => {
    const info = getSubrouteInfo("/goals/gym-cardio");
    expect(info).toEqual({
      parentHref: "/goals",
      parentLabel: "Habits",
    });
  });

  it("maps global utility pages (/settings, /admin, /profile) to /today", () => {
    expect(getSubrouteInfo("/settings")).toEqual({
      parentHref: "/today",
      parentLabel: "Today",
    });
    expect(getSubrouteInfo("/admin")).toEqual({
      parentHref: "/today",
      parentLabel: "Today",
    });
    expect(getSubrouteInfo("/profile")).toEqual({
      parentHref: "/today",
      parentLabel: "Today",
    });
  });

  it("returns null for top-level primary spaces (no back button needed)", () => {
    expect(getSubrouteInfo("/today")).toBeNull();
    expect(getSubrouteInfo("/goals")).toBeNull();
    expect(getSubrouteInfo("/study")).toBeNull();
    expect(getSubrouteInfo("/tasks")).toBeNull();
    expect(getSubrouteInfo("/money")).toBeNull();
    expect(getSubrouteInfo("/analytics")).toBeNull();
  });
});

describe("Page Flow: Native Backstack Priority Resolver", () => {
  it("Priority 1: Closes open modal dialogs before changing routes", () => {
    const action = resolveBackAction("/study/physics-101", true, 0, 1000);
    expect(action).toEqual({ type: "close_modal" });

    const rootAction = resolveBackAction("/today", true, 0, 1000);
    expect(rootAction).toEqual({ type: "close_modal" });
  });

  it("Priority 2: Pops subroutes and secondary pages back to parent", () => {
    const action1 = resolveBackAction("/study/physics", false, 0, 1000);
    expect(action1).toEqual({ type: "navigate_back" });

    const action2 = resolveBackAction("/settings", false, 0, 1000);
    expect(action2).toEqual({ type: "navigate_back" });

    const action3 = resolveBackAction("/goals/123", false, 0, 1000);
    expect(action3).toEqual({ type: "navigate_back" });
  });

  it("Priority 3: Returns non-today root spaces back to /today cockpit", () => {
    expect(resolveBackAction("/goals", false, 0, 1000)).toEqual({ type: "navigate_today" });
    expect(resolveBackAction("/study", false, 0, 1000)).toEqual({ type: "navigate_today" });
    expect(resolveBackAction("/tasks", false, 0, 1000)).toEqual({ type: "navigate_today" });
    expect(resolveBackAction("/money", false, 0, 1000)).toEqual({ type: "navigate_today" });
    expect(resolveBackAction("/analytics", false, 0, 1000)).toEqual({ type: "navigate_today" });
  });

  it("Priority 4: First back press on /today prompts exit toast", () => {
    const action = resolveBackAction("/today", false, 0, 5000);
    expect(action).toEqual({ type: "show_exit_toast" });
  });

  it("Priority 4: Double back press within 2000ms on /today triggers app exit", () => {
    const lastPress = 10000;
    const secondPress = 11200; // 1200ms later
    const action = resolveBackAction("/today", false, lastPress, secondPress);
    expect(action).toEqual({ type: "exit_app" });
  });

  it("Priority 4: Back press after 2000ms expires and prompts toast again", () => {
    const lastPress = 10000;
    const latePress = 12500; // 2500ms later
    const action = resolveBackAction("/today", false, lastPress, latePress);
    expect(action).toEqual({ type: "show_exit_toast" });
  });
});
