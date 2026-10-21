/**
 * Spaced Repetition Algorithm (Benchmark: Anki / SuperMemo SM-2)
 * Models memory retention decay to schedule optimal revision dates based on recall quality.
 */

export interface SM2State {
  easinessFactor: number; // Default 2.5, min 1.3
  intervalDays: number; // Days until next review
  repetitionNumber: number; // Consecutive successful recalls
  nextRevisionDate: string; // ISO date YYYY-MM-DD
}

export const DEFAULT_SM2_STATE: SM2State = {
  easinessFactor: 2.5,
  intervalDays: 1,
  repetitionNumber: 0,
  nextRevisionDate: new Date().toISOString().split("T")[0],
};

/**
 * Calculates new SM-2 interval and easiness factor based on recall score (1 to 5)
 * Quality ratings:
 * 5: Perfect recall ("Peak Focus / Mastered")
 * 4: Correct response after hesitation ("Good Flow")
 * 3: Correct response recalled with serious difficulty ("Moderate")
 * 2: Incorrect response; where the correct one seemed easy to recall
 * 1: Complete blackout / struggled
 */
export function calculateSM2Review(
  prevState: Partial<SM2State> = {},
  qualityRating: number // 1 to 5
): SM2State {
  const currentEF = prevState.easinessFactor || 2.5;
  const currentInterval = prevState.intervalDays || 1;
  const currentReps = prevState.repetitionNumber || 0;

  // Clamp quality between 1 and 5
  const q = Math.max(1, Math.min(5, Math.round(qualityRating)));

  // Calculate new Easiness Factor
  let newEF = currentEF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02));
  if (newEF < 1.3) newEF = 1.3;

  let newInterval = 1;
  let newReps = currentReps;

  if (q >= 3) {
    // Successful recall
    if (currentReps === 0) {
      newInterval = 1;
    } else if (currentReps === 1) {
      newInterval = 6;
    } else {
      newInterval = Math.round(currentInterval * newEF);
    }
    newReps = currentReps + 1;
  } else {
    // Failed recall -> reset to beginning
    newReps = 0;
    newInterval = 1;
  }

  // Calculate target date
  const targetDate = new Date();
  targetDate.setDate(targetDate.getDate() + newInterval);
  const nextRevisionDate = targetDate.toISOString().split("T")[0];

  return {
    easinessFactor: parseFloat(newEF.toFixed(2)),
    intervalDays: newInterval,
    repetitionNumber: newReps,
    nextRevisionDate,
  };
}

/**
 * Checks if a topic is due for spaced revision today or overdue
 */
export function isTopicDueForRevision(
  topic: { nextRevisionDate?: string; lastRevisedAt?: string; confidence?: number },
  currentDateStr: string = new Date().toISOString().split("T")[0]
): { isDue: boolean; daysRemaining: number } {
  if (!topic.nextRevisionDate) {
    // If not scheduled and confidence is low (< 3), mark as due
    const confidence = topic.confidence || 1;
    return { isDue: confidence <= 2, daysRemaining: 0 };
  }

  const targetDate = new Date(topic.nextRevisionDate);
  const today = new Date(currentDateStr);
  const diffTime = targetDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return {
    isDue: diffDays <= 0,
    daysRemaining: diffDays,
  };
}
