export interface CircadianPredictorResult {
  energyScore: number;
  focusRating: "PEAK FOCUS" | "OPTIMAL" | "MODERATE MODULATION" | "LOW RECOVERY";
  peakFocusWindow: string;
  caffeineCutoff: string;
  recommendation: string;
  badgeColor: string;
}

export function predictCircadianProductivity(sleepHours: number, bedtimeStr: string = "23:00"): CircadianPredictorResult {
  const hours = Math.max(0, Math.min(14, sleepHours || 7.5));
  let baseScore = 0;

  // Optimal Sleep Curve (7.5h peak)
  if (hours >= 7 && hours <= 8.5) {
    baseScore = 95;
  } else if (hours > 8.5 && hours <= 10) {
    baseScore = 85;
  } else if (hours >= 6 && hours < 7) {
    baseScore = 75;
  } else if (hours >= 5 && hours < 6) {
    baseScore = 58;
  } else if (hours > 0 && hours < 5) {
    baseScore = 38;
  } else {
    baseScore = 50;
  }

  // Bedtime penalty calculation
  const [bedHour] = bedtimeStr.split(":").map(Number);
  let bedtimePenalty = 0;
  if (bedHour >= 1 && bedHour <= 4) {
    bedtimePenalty = 12; // Late night sleep penalty
  } else if (bedHour >= 0 && bedHour < 1) {
    bedtimePenalty = 6;
  }

  const finalScore = Math.max(20, Math.min(100, baseScore - bedtimePenalty));

  let focusRating: CircadianPredictorResult["focusRating"] = "OPTIMAL";
  let badgeColor = "bg-emerald-400 text-navy-950";
  let peakFocusWindow = "9:30 AM – 1:30 PM";
  let caffeineCutoff = "2:30 PM";
  let recommendation = "Great circadian alignment! Expect high mental clarity and focus capacity today.";

  if (finalScore >= 88) {
    focusRating = "PEAK FOCUS";
    badgeColor = "bg-emerald-400 text-navy-950";
    peakFocusWindow = "9:00 AM – 1:30 PM";
    caffeineCutoff = "2:30 PM";
    recommendation = "⚡ Peak Circadian State! Tackling high-priority deep work or study tasks this morning is ideal.";
  } else if (finalScore >= 70) {
    focusRating = "OPTIMAL";
    badgeColor = "bg-amber-400 text-navy-950";
    peakFocusWindow = "10:00 AM – 2:00 PM";
    caffeineCutoff = "2:00 PM";
    recommendation = "👍 Steady Energy Levels. Good recovery; maintain light afternoon walks and stay hydrated.";
  } else if (finalScore >= 50) {
    focusRating = "MODERATE MODULATION";
    badgeColor = "bg-orange-400 text-navy-950";
    peakFocusWindow = "10:30 AM – 12:30 PM";
    caffeineCutoff = "1:00 PM";
    recommendation = "⚠️ Mild Sleep Debt Detected. Take a 20-minute power nap or light walk around 2 PM.";
  } else {
    focusRating = "LOW RECOVERY";
    badgeColor = "bg-rose-400 text-navy-950";
    peakFocusWindow = "11:00 AM – 12:30 PM";
    caffeineCutoff = "12:00 PM";
    recommendation = "💤 High Fatigue State. Prioritize rest, light routine tasks, and aim for an earlier bedtime tonight.";
  }

  return {
    energyScore: finalScore,
    focusRating,
    peakFocusWindow,
    caffeineCutoff,
    recommendation,
    badgeColor,
  };
}
