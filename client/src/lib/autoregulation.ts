import type { Log } from './db';

/**
 * Autoregulation Logic for HypertrophyOS
 * Based on the blueprint's algorithmic requirements
 */

export interface SetRecommendation {
  currentSets: number;
  recommendedSets: number;
  change: number; // positive = add sets, negative = reduce sets
  reason: string;
  confidence: 'high' | 'medium' | 'low';
}

export interface PerformanceMetrics {
  avgRIR: number;
  targetRIR: number;
  rirDeviation: number;
  avgSoreness: number;
  avgPump: number;
  avgJointPain: number;
  sessionsAnalyzed: number;
}

/**
 * Calculate performance metrics from recent logs
 */
export function calculatePerformanceMetrics(logs: Log[]): PerformanceMetrics | null {
  if (logs.length === 0) return null;

  const totalRIR = logs.reduce((sum, log) => sum + log.rir, 0);
  const totalTargetRIR = logs.reduce((sum, log) => sum + log.target_rir, 0);
  const avgRIR = totalRIR / logs.length;
  const avgTargetRIR = totalTargetRIR / logs.length;

  // Calculate feedback averages (only from logs with feedback)
  const logsWithSoreness = logs.filter(log => log.feedback_soreness !== null && log.feedback_soreness !== undefined);
  const logsWithPump = logs.filter(log => log.feedback_pump !== null && log.feedback_pump !== undefined);
  const logsWithJointPain = logs.filter(log => log.feedback_joint_pain !== null && log.feedback_joint_pain !== undefined);

  const avgSoreness = logsWithSoreness.length > 0
    ? logsWithSoreness.reduce((sum, log) => sum + log.feedback_soreness!, 0) / logsWithSoreness.length
    : 0;

  const avgPump = logsWithPump.length > 0
    ? logsWithPump.reduce((sum, log) => sum + log.feedback_pump!, 0) / logsWithPump.length
    : 0;

  const avgJointPain = logsWithJointPain.length > 0
    ? logsWithJointPain.reduce((sum, log) => sum + log.feedback_joint_pain!, 0) / logsWithJointPain.length
    : 0;

  return {
    avgRIR,
    targetRIR: avgTargetRIR,
    rirDeviation: avgRIR - avgTargetRIR,
    avgSoreness,
    avgPump,
    avgJointPain,
    sessionsAnalyzed: logs.length,
  };
}

/**
 * Generate set recommendation based on performance metrics
 * 
 * Algorithm:
 * 1. RIR Performance: If consistently hitting RIR < target, add sets
 * 2. Feedback Modulation: High soreness or joint pain = reduce/maintain
 * 3. Pump Quality: Good pump + low RIR = ready for volume increase
 * 4. Progressive Overload: Gradual increases (1 set at a time)
 */
export function generateSetRecommendation(
  currentSets: number,
  metrics: PerformanceMetrics,
  weeksSinceLastIncrease: number = 0
): SetRecommendation {
  let recommendedSets = currentSets;
  let reason = '';
  let confidence: 'high' | 'medium' | 'low' = 'medium';

  // Insufficient data
  if (metrics.sessionsAnalyzed < 2) {
    return {
      currentSets,
      recommendedSets: currentSets,
      change: 0,
      reason: 'Insufficient data for recommendation (need at least 2 sessions)',
      confidence: 'low',
    };
  }

  // RIR-based analysis
  const rirMargin = metrics.rirDeviation;

  // Check for recovery issues
  const hasRecoveryIssues = metrics.avgSoreness >= 4 || metrics.avgJointPain >= 3;
  const hasGoodRecovery = metrics.avgSoreness <= 2 && metrics.avgJointPain <= 1;
  const hasGoodPump = metrics.avgPump >= 4;

  // Decision logic
  if (hasRecoveryIssues) {
    // High soreness or joint pain - maintain or reduce
    if (metrics.avgJointPain >= 4) {
      recommendedSets = Math.max(1, currentSets - 1);
      reason = 'High joint pain detected. Reducing volume for recovery.';
      confidence = 'high';
    } else {
      recommendedSets = currentSets;
      reason = 'High soreness detected. Maintaining current volume for recovery.';
      confidence = 'high';
    }
  } else if (rirMargin <= -1.5 && hasGoodRecovery && hasGoodPump) {
    // Consistently leaving more reps in reserve than target + good recovery + good pump
    // This means they're not pushing hard enough and can handle more volume
    recommendedSets = currentSets + 1;
    reason = 'Consistently exceeding RIR targets with good recovery and pump. Ready for volume increase.';
    confidence = 'high';
  } else if (rirMargin <= -1.0 && hasGoodRecovery) {
    // Good performance with good recovery
    recommendedSets = currentSets + 1;
    reason = 'Good RIR performance with solid recovery. Progressive overload recommended.';
    confidence = 'medium';
  } else if (rirMargin >= 1.5) {
    // Consistently failing to hit RIR targets (going too close to failure)
    if (metrics.avgSoreness >= 3) {
      recommendedSets = Math.max(1, currentSets - 1);
      reason = 'Pushing too hard relative to targets with elevated soreness. Reduce volume.';
      confidence: 'high';
    } else {
      recommendedSets = currentSets;
      reason = 'Consistently pushing beyond RIR targets. Maintain volume and focus on technique.';
      confidence = 'medium';
    }
  } else if (weeksSinceLastIncrease >= 3 && !hasRecoveryIssues && metrics.avgPump >= 3) {
    // Time-based progression: if stable for 3+ weeks with decent indicators
    recommendedSets = currentSets + 1;
    reason = 'Stable performance for 3+ weeks with good indicators. Time for progression.';
    confidence = 'medium';
  } else {
    // Maintain current volume
    recommendedSets = currentSets;
    reason = 'Performance is stable. Continue with current volume.';
    confidence = 'medium';
  }

  // Safety cap: don't recommend more than +2 sets at once
  if (recommendedSets > currentSets + 2) {
    recommendedSets = currentSets + 2;
    reason += ' (Capped at +2 sets for safety)';
  }

  // Don't go below 1 set
  if (recommendedSets < 1) {
    recommendedSets = 1;
  }

  return {
    currentSets,
    recommendedSets,
    change: recommendedSets - currentSets,
    reason,
    confidence,
  };
}

/**
 * Get set recommendation for a specific exercise based on recent performance
 */
export function getExerciseSetRecommendation(
  exerciseId: number,
  currentSets: number,
  recentLogs: Log[],
  weeksSinceLastIncrease: number = 0
): SetRecommendation | null {
  // Filter logs for this exercise
  const exerciseLogs = recentLogs.filter(log => log.exercise_id === exerciseId);

  if (exerciseLogs.length === 0) {
    return null;
  }

  const metrics = calculatePerformanceMetrics(exerciseLogs);
  if (!metrics) {
    return null;
  }

  return generateSetRecommendation(currentSets, metrics, weeksSinceLastIncrease);
}
