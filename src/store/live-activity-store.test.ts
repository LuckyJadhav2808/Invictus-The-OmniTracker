import { describe, it, expect, beforeEach, vi } from "vitest";
import { useLiveActivityStore } from "./live-activity-store";

describe("useLiveActivityStore", () => {
  beforeEach(() => {
    const store = useLiveActivityStore.getState();
    store.stopGymRest();
    store.stopPomodoro();
    store.setIsExpanded(false);
  });

  it("should initialize with default idle state", () => {
    const state = useLiveActivityStore.getState();
    expect(state.activeActivity).toBe("none");
    expect(state.isExpanded).toBe(false);
  });

  it("should start and control a gym rest timer", () => {
    const store = useLiveActivityStore.getState();
    store.startGymRest(60, "Barbell Bench Press");

    let current = useLiveActivityStore.getState();
    expect(current.activeActivity).toBe("gym_rest");
    expect(current.gymRest.secondsLeft).toBe(60);
    expect(current.gymRest.exerciseName).toBe("Barbell Bench Press");
    expect(current.gymRest.isPaused).toBe(false);

    // Pause
    store.togglePauseGymRest();
    current = useLiveActivityStore.getState();
    expect(current.gymRest.isPaused).toBe(true);
    expect(current.gymRest.targetEndTime).toBeNull();

    // Resume
    store.togglePauseGymRest();
    current = useLiveActivityStore.getState();
    expect(current.gymRest.isPaused).toBe(false);
    expect(current.gymRest.targetEndTime).toBeGreaterThan(Date.now());

    // Add +30 seconds
    store.addGymRestSeconds(30);
    current = useLiveActivityStore.getState();
    expect(current.gymRest.secondsLeft).toBe(90);

    // Stop
    store.stopGymRest();
    current = useLiveActivityStore.getState();
    expect(current.activeActivity).toBe("none");
    expect(current.gymRest.secondsLeft).toBe(0);
  });

  it("should start and control a Pomodoro study session", () => {
    const store = useLiveActivityStore.getState();
    store.startPomodoro(25, "Organic Chemistry", "focus");

    let current = useLiveActivityStore.getState();
    expect(current.activeActivity).toBe("pomodoro");
    expect(current.pomodoro.secondsLeft).toBe(25 * 60);
    expect(current.pomodoro.subjectName).toBe("Organic Chemistry");
    expect(current.pomodoro.phase).toBe("focus");

    // Add 5 minutes
    store.addPomodoroMinutes(5);
    current = useLiveActivityStore.getState();
    expect(current.pomodoro.secondsLeft).toBe(30 * 60);

    // Pause & Resume
    store.togglePausePomodoro();
    expect(useLiveActivityStore.getState().pomodoro.isPaused).toBe(true);
    store.togglePausePomodoro();
    expect(useLiveActivityStore.getState().pomodoro.isPaused).toBe(false);

    // Stop
    store.stopPomodoro();
    expect(useLiveActivityStore.getState().activeActivity).toBe("none");
  });

  it("should update ambient telemetry", () => {
    const store = useLiveActivityStore.getState();
    store.updateAmbient({
      dailyCashLeft: 550,
      habitsCompleted: 4,
      totalHabits: 5,
      activeStreak: 14,
    });

    const current = useLiveActivityStore.getState();
    expect(current.ambient.dailyCashLeft).toBe(550);
    expect(current.ambient.habitsCompleted).toBe(4);
    expect(current.ambient.activeStreak).toBe(14);
  });
});
