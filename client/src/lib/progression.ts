import type { Log } from './db';

export interface ProgressionRecommendation {
  shouldProgress: boolean;
  recommendedWeight: number;
  currentWeight: number;
  confidence: 'high' | 'medium' | 'low';
  reason: string;
  increasePercent: number;
}

/**
 * Analyze recent performance and recommend weight progression
 * 
 * Logic:
 * - If last 2-3 sessions had RIR >= 3 consistently, suggest weight increase
 * - If hitting target reps with RIR 0-1, definitely increase
 * - Consider rep performance trend
 * - Recommend 2.5-5% increase for upper body, 5-10% for lower body
 */
export function analyzeProgression(
  recentLogs: Log[],
  exerciseName: string,
  muscleGroup: string
): ProgressionRecommendation | null {
  if (recentLogs.length < 3) {
    return null; // Need at least 3 sets of data
  }

  // Sort by date descending (most recent first)
  const sortedLogs = [...recentLogs].sort((a, b) => 
    b.session_date.getTime() - a.session_date.getTime()
  );

  // Get last 3 sessions worth of data
  const recentSets = sortedLogs.slice(0, 9); // Assuming ~3 sets per session
  
  if (recentSets.length === 0) return null;

  const currentWeight = recentSets[0].weight;
  const avgRIR = recentSets.reduce((sum, log) => sum + log.rir, 0) / recentSets.length;
  const avgReps = recentSets.reduce((sum, log) => sum + log.reps, 0) / recentSets.length;
  const targetRIR = recentSets[0].target_rir;

  // Check if performance is consistently good
  const consistentlyEasyRIR = recentSets.filter(log => log.rir >= targetRIR + 1).length >= recentSets.length * 0.7;
  const hittingTargetReps = avgReps >= 8; // Assuming typical hypertrophy range
  const lowRIR = avgRIR <= 1;

  // Determine if should progress
  let shouldProgress = false;
  let confidence: 'high' | 'medium' | 'low' = 'low';
  let reason = '';

  if (consistentlyEasyRIR && hittingTargetReps) {
    shouldProgress = true;
    confidence = 'high';
    reason = `Consistently leaving ${Math.round(avgRIR)} RIR. Ready for more weight.`;
  } else if (avgRIR >= targetRIR + 2 && hittingTargetReps) {
    shouldProgress = true;
    confidence = 'medium';
    reason = `Average RIR of ${avgRIR.toFixed(1)} is higher than target. Consider increasing weight.`;
  } else if (lowRIR && avgReps < 6) {
    shouldProgress = false;
    confidence = 'high';
    reason = `Low reps with low RIR. Focus on technique and rep quality first.`;
  } else if (avgRIR < targetRIR) {
    shouldProgress = false;
    confidence = 'high';
    reason = `Currently working at RIR ${avgRIR.toFixed(1)}, below target of ${targetRIR}. Maintain current weight.`;
  } else {
    shouldProgress = false;
    confidence = 'low';
    reason = `Performance is stable. Continue monitoring.`;
  }

  // Calculate recommended weight increase
  // Lower body (legs, glutes) can handle larger jumps
  const isLowerBody = ['Quadriceps', 'Hamstrings', 'Glutes', 'Calves'].includes(muscleGroup);
  const increasePercent = isLowerBody ? 5 : 2.5;
  
  // Round to nearest 2.5kg increment
  const rawIncrease = currentWeight * (increasePercent / 100);
  const roundedIncrease = Math.ceil(rawIncrease / 2.5) * 2.5;
  const recommendedWeight = currentWeight + roundedIncrease;

  return {
    shouldProgress,
    recommendedWeight,
    currentWeight,
    confidence,
    reason,
    increasePercent,
  };
}

/**
 * Check if exercise has been used for too long and should be rotated
 * Staleness threshold: 6-8 weeks
 */
export function checkExerciseStaleness(
  firstUsedDate: Date,
  lastUsedDate: Date
): {
  isStale: boolean;
  weeksUsed: number;
  recommendation: string;
} {
  const weeksDiff = Math.floor(
    (lastUsedDate.getTime() - firstUsedDate.getTime()) / (7 * 24 * 60 * 60 * 1000)
  );

  const isStale = weeksDiff >= 6;
  
  let recommendation = '';
  if (weeksDiff >= 8) {
    recommendation = 'Consider rotating this exercise. 8+ weeks may lead to diminishing returns.';
  } else if (weeksDiff >= 6) {
    recommendation = 'Exercise has been used for 6+ weeks. Consider rotation for continued progress.';
  } else {
    recommendation = `Exercise is fresh (${weeksDiff} weeks). Continue as planned.`;
  }

  return {
    isStale,
    weeksUsed: weeksDiff,
    recommendation,
  };
}
