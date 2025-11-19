import type { Log } from './db';
import { subDays } from 'date-fns';

/**
 * Deload Detection Logic for HypertrophyOS
 * Detects when the user needs a deload week based on fatigue accumulation
 */

export interface DeloadRecommendation {
  needsDeload: boolean;
  severity: 'none' | 'mild' | 'moderate' | 'high';
  reason: string;
  indicators: string[];
  confidence: 'low' | 'medium' | 'high';
}

export interface FatigueMetrics {
  avgSoreness: number;
  avgJointPain: number;
  avgPump: number;
  avgRIR: number;
  performanceDecline: boolean;
  consecutiveHighFatigue: number;
  sessionsAnalyzed: number;
}

/**
 * Calculate fatigue metrics from recent logs
 */
export function calculateFatigueMetrics(logs: Log[], days: number = 14): FatigueMetrics | null {
  const cutoffDate = subDays(new Date(), days);
  const recentLogs = logs.filter(log => log.session_date >= cutoffDate);

  if (recentLogs.length < 3) return null;

  // Calculate averages
  const logsWithSoreness = recentLogs.filter(log => log.feedback_soreness !== null && log.feedback_soreness !== undefined);
  const logsWithJointPain = recentLogs.filter(log => log.feedback_joint_pain !== null && log.feedback_joint_pain !== undefined);
  const logsWithPump = recentLogs.filter(log => log.feedback_pump !== null && log.feedback_pump !== undefined);

  const avgSoreness = logsWithSoreness.length > 0
    ? logsWithSoreness.reduce((sum, log) => sum + log.feedback_soreness!, 0) / logsWithSoreness.length
    : 0;

  const avgJointPain = logsWithJointPain.length > 0
    ? logsWithJointPain.reduce((sum, log) => sum + log.feedback_joint_pain!, 0) / logsWithJointPain.length
    : 0;

  const avgPump = logsWithPump.length > 0
    ? logsWithPump.reduce((sum, log) => sum + log.feedback_pump!, 0) / logsWithPump.length
    : 0;

  const avgRIR = recentLogs.reduce((sum, log) => sum + log.rir, 0) / recentLogs.length;

  // Check for performance decline (compare first half vs second half)
  const midpoint = Math.floor(recentLogs.length / 2);
  const firstHalf = recentLogs.slice(0, midpoint);
  const secondHalf = recentLogs.slice(midpoint);

  const firstHalfAvgE1RM = firstHalf
    .filter(log => log.e1rm)
    .reduce((sum, log) => sum + log.e1rm!, 0) / firstHalf.filter(log => log.e1rm).length;

  const secondHalfAvgE1RM = secondHalf
    .filter(log => log.e1rm)
    .reduce((sum, log) => sum + log.e1rm!, 0) / secondHalf.filter(log => log.e1rm).length;

  const performanceDecline = secondHalfAvgE1RM < firstHalfAvgE1RM * 0.95; // 5% decline

  // Count consecutive high-fatigue sessions
  let consecutiveHighFatigue = 0;
  for (let i = recentLogs.length - 1; i >= 0; i--) {
    const log = recentLogs[i];
    const isFatigued = (log.feedback_soreness || 0) >= 4 || (log.feedback_joint_pain || 0) >= 3;
    if (isFatigued) {
      consecutiveHighFatigue++;
    } else {
      break;
    }
  }

  return {
    avgSoreness,
    avgJointPain,
    avgPump,
    avgRIR,
    performanceDecline,
    consecutiveHighFatigue,
    sessionsAnalyzed: recentLogs.length,
  };
}

/**
 * Generate deload recommendation based on fatigue metrics
 */
export function generateDeloadRecommendation(metrics: FatigueMetrics): DeloadRecommendation {
  const indicators: string[] = [];
  let severity: 'none' | 'mild' | 'moderate' | 'high' = 'none';
  let needsDeload = false;
  let confidence: 'low' | 'medium' | 'high' = 'medium';

  // Insufficient data
  if (metrics.sessionsAnalyzed < 3) {
    return {
      needsDeload: false,
      severity: 'none',
      reason: 'Insufficient data to assess deload need',
      indicators: [],
      confidence: 'low',
    };
  }

  // Check indicators
  if (metrics.avgSoreness >= 4) {
    indicators.push('High muscle soreness (≥4/5)');
    severity = 'moderate';
  }

  if (metrics.avgJointPain >= 3) {
    indicators.push('Elevated joint pain (≥3/5)');
    severity = severity === 'moderate' ? 'high' : 'moderate';
  }

  if (metrics.avgPump <= 2) {
    indicators.push('Poor muscle pump (≤2/5)');
  }

  if (metrics.performanceDecline) {
    indicators.push('Performance decline detected (>5% drop in e1RM)');
    severity = severity === 'none' ? 'mild' : 'high';
  }

  if (metrics.consecutiveHighFatigue >= 3) {
    indicators.push(`${metrics.consecutiveHighFatigue} consecutive high-fatigue sessions`);
    severity = 'high';
  }

  if (metrics.avgRIR < 1) {
    indicators.push('Consistently training too close to failure');
  }

  // Decision logic
  if (severity === 'high') {
    needsDeload = true;
    confidence = 'high';
  } else if (severity === 'moderate' && indicators.length >= 2) {
    needsDeload = true;
    confidence = 'medium';
  } else if (severity === 'mild' && indicators.length >= 3) {
    needsDeload = true;
    confidence = 'medium';
  }

  let reason = '';
  if (needsDeload) {
    reason = `Deload recommended due to ${severity} fatigue accumulation. ${indicators.length} indicator${indicators.length !== 1 ? 's' : ''} detected.`;
  } else if (indicators.length > 0) {
    reason = `Some fatigue indicators present, but not severe enough to warrant immediate deload. Monitor closely.`;
  } else {
    reason = 'No significant fatigue detected. Continue with current training.';
  }

  return {
    needsDeload,
    severity,
    reason,
    indicators,
    confidence,
  };
}

/**
 * Check if user needs a deload based on recent training
 */
export function checkDeloadNeed(logs: Log[]): DeloadRecommendation | null {
  const metrics = calculateFatigueMetrics(logs, 14);
  if (!metrics) return null;
  
  return generateDeloadRecommendation(metrics);
}
