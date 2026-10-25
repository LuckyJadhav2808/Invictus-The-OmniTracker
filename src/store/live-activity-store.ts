import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export type LiveActivityMode = "none" | "gym_rest" | "pomodoro" | "ambient";

export interface GymRestData {
  secondsLeft: number;
  totalSeconds: number;
  isPaused: boolean;
  targetEndTime: number | null;
  exerciseName: string | null;
}

export interface PomodoroData {
  secondsLeft: number;
  totalSeconds: number;
  isPaused: boolean;
  targetEndTime: number | null;
  subjectName: string;
  phase: "focus" | "break";
}

export interface AmbientData {
  dailyCashLeft: number;
  currencySymbol: string;
  habitsCompleted: number;
  totalHabits: number;
  activeStreak: number;
}

interface LiveActivityStoreState {
  activeActivity: LiveActivityMode;
  isExpanded: boolean;
  isAmbientDismissed: boolean;
  gymRest: GymRestData;
  pomodoro: PomodoroData;
  ambient: AmbientData;

  // UI Actions
  setIsExpanded: (expanded: boolean) => void;
  toggleExpanded: () => void;
  dismissAmbient: () => void;
  restoreAmbient: () => void;

  // Gym Rest Actions
  startGymRest: (seconds: number, exerciseName?: string) => void;
  togglePauseGymRest: () => void;
  addGymRestSeconds: (deltaSeconds: number) => void;
  stopGymRest: () => void;
  tickGymRest: () => void;

  // Pomodoro Actions
  startPomodoro: (minutes: number, subjectName?: string, phase?: "focus" | "break") => void;
  togglePausePomodoro: () => void;
  addPomodoroMinutes: (deltaMinutes: number) => void;
  stopPomodoro: () => void;
  tickPomodoro: () => void;

  // Ambient Telemetry Actions
  updateAmbient: (partial: Partial<AmbientData>) => void;
  setAmbientVisible: () => void;
}

const initialGymRest: GymRestData = {
  secondsLeft: 0,
  totalSeconds: 60,
  isPaused: false,
  targetEndTime: null,
  exerciseName: null,
};

const initialPomodoro: PomodoroData = {
  secondsLeft: 0,
  totalSeconds: 25 * 60,
  isPaused: false,
  targetEndTime: null,
  subjectName: "Focus Session",
  phase: "focus",
};

const initialAmbient: AmbientData = {
  dailyCashLeft: 0,
  currencySymbol: "₹",
  habitsCompleted: 0,
  totalHabits: 0,
  activeStreak: 1,
};

export const useLiveActivityStore = create<LiveActivityStoreState>()(
  persist(
    (set, get) => ({
      activeActivity: "none",
      isExpanded: false,
      isAmbientDismissed: false,
      gymRest: initialGymRest,
      pomodoro: initialPomodoro,
      ambient: initialAmbient,

      setIsExpanded: (expanded) => set({ isExpanded: expanded }),
      toggleExpanded: () => set((state) => ({ isExpanded: !state.isExpanded })),
      dismissAmbient: () => set({ isAmbientDismissed: true, isExpanded: false }),
      restoreAmbient: () => set({ isAmbientDismissed: false }),

      // ================= GYM REST =================
      startGymRest: (seconds, exerciseName) => {
        const targetEndTime = Date.now() + seconds * 1000;
        set({
          activeActivity: "gym_rest",
          gymRest: {
            secondsLeft: seconds,
            totalSeconds: seconds,
            isPaused: false,
            targetEndTime,
            exerciseName: exerciseName || null,
          },
        });
      },

      togglePauseGymRest: () => {
        const { gymRest } = get();
        if (gymRest.isPaused) {
          // Resume
          const newTargetEndTime = Date.now() + gymRest.secondsLeft * 1000;
          set({
            gymRest: {
              ...gymRest,
              isPaused: false,
              targetEndTime: newTargetEndTime,
            },
          });
        } else {
          // Pause
          set({
            gymRest: {
              ...gymRest,
              isPaused: true,
              targetEndTime: null,
            },
          });
        }
      },

      addGymRestSeconds: (deltaSeconds) => {
        const { gymRest } = get();
        const newSeconds = Math.max(5, gymRest.secondsLeft + deltaSeconds);
        const newTotal = Math.max(newSeconds, gymRest.totalSeconds + (deltaSeconds > 0 ? deltaSeconds : 0));
        const newTarget = gymRest.isPaused ? null : Date.now() + newSeconds * 1000;
        set({
          gymRest: {
            ...gymRest,
            secondsLeft: newSeconds,
            totalSeconds: newTotal,
            targetEndTime: newTarget,
          },
        });
      },

      stopGymRest: () => {
        set({
          activeActivity: get().pomodoro.targetEndTime ? "pomodoro" : "none",
          gymRest: initialGymRest,
        });
      },

      tickGymRest: () => {
        const { gymRest, activeActivity } = get();
        if (activeActivity !== "gym_rest" || gymRest.isPaused || !gymRest.targetEndTime) return;

        const remaining = Math.max(0, Math.ceil((gymRest.targetEndTime - Date.now()) / 1000));
        if (remaining <= 0) {
          set({
            gymRest: { ...gymRest, secondsLeft: 0, targetEndTime: null },
            activeActivity: get().pomodoro.targetEndTime ? "pomodoro" : "none",
          });
        } else {
          set({
            gymRest: { ...gymRest, secondsLeft: remaining },
          });
        }
      },

      // ================= POMODORO =================
      startPomodoro: (minutes, subjectName, phase = "focus") => {
        const totalSeconds = Math.max(60, minutes * 60);
        const targetEndTime = Date.now() + totalSeconds * 1000;
        set({
          activeActivity: "pomodoro",
          pomodoro: {
            secondsLeft: totalSeconds,
            totalSeconds,
            isPaused: false,
            targetEndTime,
            subjectName: subjectName || (phase === "focus" ? "Deep Study" : "Quick Break"),
            phase,
          },
        });
      },

      togglePausePomodoro: () => {
        const { pomodoro } = get();
        if (pomodoro.isPaused) {
          // Resume
          const newTargetEndTime = Date.now() + pomodoro.secondsLeft * 1000;
          set({
            pomodoro: {
              ...pomodoro,
              isPaused: false,
              targetEndTime: newTargetEndTime,
            },
          });
        } else {
          // Pause
          set({
            pomodoro: {
              ...pomodoro,
              isPaused: true,
              targetEndTime: null,
            },
          });
        }
      },

      addPomodoroMinutes: (deltaMinutes) => {
        const { pomodoro } = get();
        const deltaSeconds = deltaMinutes * 60;
        const newSeconds = Math.max(60, pomodoro.secondsLeft + deltaSeconds);
        const newTotal = Math.max(newSeconds, pomodoro.totalSeconds + (deltaSeconds > 0 ? deltaSeconds : 0));
        const newTarget = pomodoro.isPaused ? null : Date.now() + newSeconds * 1000;
        set({
          pomodoro: {
            ...pomodoro,
            secondsLeft: newSeconds,
            totalSeconds: newTotal,
            targetEndTime: newTarget,
          },
        });
      },

      stopPomodoro: () => {
        set({
          activeActivity: get().gymRest.targetEndTime ? "gym_rest" : "none",
          pomodoro: initialPomodoro,
        });
      },

      tickPomodoro: () => {
        const { pomodoro, activeActivity } = get();
        if (activeActivity !== "pomodoro" || pomodoro.isPaused || !pomodoro.targetEndTime) return;

        const remaining = Math.max(0, Math.ceil((pomodoro.targetEndTime - Date.now()) / 1000));
        if (remaining <= 0) {
          set({
            pomodoro: { ...pomodoro, secondsLeft: 0, targetEndTime: null },
            activeActivity: get().gymRest.targetEndTime ? "gym_rest" : "none",
          });
        } else {
          set({
            pomodoro: { ...pomodoro, secondsLeft: remaining },
          });
        }
      },

      // ================= AMBIENT TELEMETRY =================
      updateAmbient: (partial) => {
        set((state) => ({
          ambient: { ...state.ambient, ...partial },
        }));
      },

      setAmbientVisible: () => {
        if (get().activeActivity === "none") {
          set({ activeActivity: "ambient" });
        }
      },
    }),
    {
      name: "invictus-live-activity-store",
      storage: createJSONStorage(() => {
        if (typeof window !== "undefined" && window.localStorage) {
          return window.localStorage;
        }
        return {
          getItem: () => null,
          setItem: () => {},
          removeItem: () => {},
        };
      }),
      partialize: (state) => ({
        ambient: state.ambient,
        gymRest: {
          ...state.gymRest,
          // Recompute targetEndTime safely on restore
        },
        pomodoro: {
          ...state.pomodoro,
        },
      }),
    }
  )
);
