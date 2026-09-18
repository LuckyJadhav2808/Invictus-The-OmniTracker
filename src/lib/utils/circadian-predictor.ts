export interface CircadianPredictorResult {
  energyScore: number;
  focusRating: "PEAK FOCUS" | "OPTIMAL" | "MODERATE" | "LOW ENERGY";
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
  } else if (hours >= 4 && hours < 5) {
    baseScore = 40;
  } else {
    baseScore = 25;
  }

  // Bedtime shift penalty (ideal 10 PM - 12 AM)
  let bedtimePenalty = 0;
  const [bedHour] = bedtimeStr.split(":").map(Number);
  if (bedHour >= 2 && bedHour <= 6) {
    bedtimePenalty = 15;
  } else if (bedHour >= 0 && bedHour < 2) {
    bedtimePenalty = 8;
  } else if (bedHour >= 18 && bedHour < 21) {
    bedtimePenalty = 6;
  }

  const finalScore = Math.max(20, Math.min(100, baseScore - bedtimePenalty));

  let focusRating: CircadianPredictorResult["focusRating"] = "OPTIMAL";
  let badgeColor = "bg-emerald-400 text-navy-950";
  let peakFocusWindow = "9:30 AM – 1:30 PM";
  let caffeineCutoff = "2:30 PM";
  let recommendation = "Great rest! Expect good mental clarity and focus today.";

  if (finalScore >= 88) {
    focusRating = "PEAK FOCUS";
    badgeColor = "bg-emerald-400 text-navy-950";
    peakFocusWindow = "9:00 AM – 1:30 PM";
    caffeineCutoff = "2:30 PM";
    recommendation = "⚡ High Energy! Great morning for focused work or study.";
  } else if (finalScore >= 70) {
    focusRating = "OPTIMAL";
    badgeColor = "bg-amber-400 text-navy-950";
    peakFocusWindow = "10:00 AM – 2:00 PM";
    caffeineCutoff = "2:00 PM";
    recommendation = "👍 Steady Energy. Good recovery; stay hydrated and take regular breaks.";
  } else if (finalScore >= 50) {
    focusRating = "MODERATE";
    badgeColor = "bg-orange-400 text-navy-950";
    peakFocusWindow = "10:30 AM – 12:30 PM";
    caffeineCutoff = "1:00 PM";
    recommendation = "⚠️ Mild sleep deficit. Take a short walk or power nap around 2 PM.";
  } else {
    focusRating = "LOW ENERGY";
    badgeColor = "bg-rose-400 text-navy-950";
    peakFocusWindow = "11:00 AM – 12:30 PM";
    caffeineCutoff = "12:00 PM";
    recommendation = "💤 High fatigue. Take it easy today and aim for an earlier bedtime tonight.";
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
