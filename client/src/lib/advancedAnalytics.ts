import type { Log, WorkoutSession, Exercise } from './db';

/**
 * Training Density Metrics
 * Measure workout efficiency and intensity
 */

export interface TrainingDensityMetrics {
  totalWorkTime: number; // seconds
  totalRestTime: number; // seconds
  densityScore: number; // work/total ratio (0-1)
  avgRestBetweenSets: number; // seconds
  timeUnderTension: number; // seconds (estimated)
}

export function calculateTrainingDensity(
  logs: Log[],
  sessionDuration: number // minutes
): TrainingDensityMetrics {
  const totalSets = logs.length;
  
  // Estimate time under tension: ~3-5 seconds per rep (using 4s average)
  const totalReps = logs.reduce((sum, log) => sum + log.reps, 0);
  const timeUnderTension = totalReps * 4; // seconds
  
  // Estimate rest time: session duration - work time
  const sessionDurationSeconds = sessionDuration * 60;
  const totalWorkTime = timeUnderTension + (totalSets * 10); // Add 10s per set for setup
  const totalRestTime = Math.max(0, sessionDurationSeconds - totalWorkTime);
  
  // Average rest between sets
  const avgRestBetweenSets = totalSets > 1 ? totalRestTime / (totalSets - 1) : 0;
  
  // Density score: work time / total time
  const densityScore = sessionDurationSeconds > 0 
    ? totalWorkTime / sessionDurationSeconds 
    : 0;
  
  return {
    totalWorkTime,
    totalRestTime,
    densityScore,
    avgRestBetweenSets,
    timeUnderTension,
  };
}

/**
 * Fatigue Index
 * Track cumulative fatigue and recovery needs
 */

export interface FatigueMetrics {
  fatigueIndex: number; // 0-100 scale
  fatigueLevel: 'low' | 'moderate' | 'high' | 'severe';
  weeklyVolume: number;
  avgSoreness: number;
  avgJointPain: number;
  performanceTrend: 'improving' | 'stable' | 'declining';
  recommendation: string;
}

export function calculateFatigueIndex(
  recentLogs: Log[], // Last 2 weeks
  weeklyVolumeTrend: number[] // Volume for last 4 weeks
): FatigueMetrics {
  if (recentLogs.length === 0) {
    return {
      fatigueIndex: 0,
      fatigueLevel: 'low',
      weeklyVolume: 0,
      avgSoreness: 0,
      avgJointPain: 0,
      performanceTrend: 'stable',
      recommendation: 'No recent training data available.',
    };
  }

  // Calculate average soreness and joint pain
  const avgSoreness = recentLogs.reduce((sum, log) => sum + (log.feedback_soreness || 0), 0) / recentLogs.length;
  const avgJointPain = recentLogs.reduce((sum, log) => sum + (log.feedback_joint_pain || 0), 0) / recentLogs.length;
  
  // Calculate weekly volume (reps × weight per set)
  const weeklyVolume = recentLogs.reduce((sum, log) => 
    sum + (log.reps * log.weight), 0
  );
  
  // Determine performance trend from volume
  let performanceTrend: 'improving' | 'stable' | 'declining' = 'stable';
  if (weeklyVolumeTrend.length >= 2) {
    const recentAvg = (weeklyVolumeTrend[weeklyVolumeTrend.length - 1] + weeklyVolumeTrend[weeklyVolumeTrend.length - 2]) / 2;
    const olderAvg = weeklyVolumeTrend.length >= 4
      ? (weeklyVolumeTrend[0] + weeklyVolumeTrend[1]) / 2
      : weeklyVolumeTrend[0];
    
    if (recentAvg > olderAvg * 1.1) performanceTrend = 'improving';
    else if (recentAvg < olderAvg * 0.9) performanceTrend = 'declining';
  }
  
  // Calculate fatigue index (0-100)
  // Factors: soreness (30%), joint pain (30%), volume trend (20%), performance trend (20%)
  let fatigueScore = 0;
  fatigueScore += (avgSoreness / 5) * 30; // Soreness contribution
  fatigueScore += (avgJointPain / 5) * 30; // Joint pain contribution
  
  // Volume trend contribution (higher recent volume = more fatigue)
  if (weeklyVolumeTrend.length >= 2) {
    const volumeIncrease = weeklyVolumeTrend[weeklyVolumeTrend.length - 1] / 
      (weeklyVolumeTrend[weeklyVolumeTrend.length - 2] || 1);
    fatigueScore += Math.min((volumeIncrease - 1) * 100, 20); // Max 20 points
  }
  
  // Performance trend contribution
  if (performanceTrend === 'declining') fatigueScore += 20;
  else if (performanceTrend === 'stable') fatigueScore += 10;
  
  const fatigueIndex = Math.min(100, Math.max(0, fatigueScore));
  
  // Determine fatigue level
  let fatigueLevel: 'low' | 'moderate' | 'high' | 'severe';
  if (fatigueIndex < 30) fatigueLevel = 'low';
  else if (fatigueIndex < 50) fatigueLevel = 'moderate';
  else if (fatigueIndex < 70) fatigueLevel = 'high';
  else fatigueLevel = 'severe';
  
  // Generate recommendation
  let recommendation = '';
  if (fatigueLevel === 'severe') {
    recommendation = 'Severe fatigue detected. Immediate deload or rest week strongly recommended.';
  } else if (fatigueLevel === 'high') {
    recommendation = 'High fatigue accumulation. Consider scheduling a deload week soon.';
  } else if (fatigueLevel === 'moderate') {
    recommendation = 'Moderate fatigue levels. Monitor closely and ensure adequate recovery.';
  } else {
    recommendation = 'Low fatigue levels. Continue training as planned.';
  }
  
  return {
    fatigueIndex,
    fatigueLevel,
    weeklyVolume,
    avgSoreness,
    avgJointPain,
    performanceTrend,
    recommendation,
  };
}

/**
 * Muscle Group Balance Analysis
 * Detect training imbalances
 */

export interface MuscleGroupBalance {
  muscleGroup: string;
  totalSets: number;
  totalVolume: number;
  percentage: number;
}

export interface BalanceAnalysis {
  distribution: MuscleGroupBalance[];
  pushPullRatio: number;
  imbalances: Array<{
    issue: string;
    recommendation: string;
  }>;
}

export function analyzeMuscleGroupBalance(
  logs: Log[],
  exercises: Exercise[]
): BalanceAnalysis {
  // Group logs by muscle group
  const muscleGroupData = new Map<string, { sets: number; volume: number }>();
  
  for (const log of logs) {
    const exercise = exercises.find(e => e.id === log.exercise_id);
    if (!exercise) continue;
    
    const mg = exercise.muscle_group;
    const current = muscleGroupData.get(mg) || { sets: 0, volume: 0 };
    
    muscleGroupData.set(mg, {
      sets: current.sets + 1, // Each log entry is one set
      volume: current.volume + (log.reps * log.weight),
    });
  }
  
  // Calculate total for percentages
  const totalSets = Array.from(muscleGroupData.values()).reduce((sum, data) => sum + data.sets, 0);
  const totalVolume = Array.from(muscleGroupData.values()).reduce((sum, data) => sum + data.volume, 0);
  
  // Build distribution
  const distribution: MuscleGroupBalance[] = Array.from(muscleGroupData.entries()).map(([mg, data]) => ({
    muscleGroup: mg,
    totalSets: data.sets,
    totalVolume: data.volume,
    percentage: totalSets > 0 ? (data.sets / totalSets) * 100 : 0,
  })).sort((a, b) => b.totalSets - a.totalSets);
  
  // Calculate push/pull ratio
  const pushGroups = ['Chest', 'Shoulders', 'Triceps'];
  const pullGroups = ['Back', 'Biceps', 'Rear Delts'];
  
  const pushSets = distribution
    .filter(d => pushGroups.includes(d.muscleGroup))
    .reduce((sum, d) => sum + d.totalSets, 0);
  
  const pullSets = distribution
    .filter(d => pullGroups.includes(d.muscleGroup))
    .reduce((sum, d) => sum + d.totalSets, 0);
  
  const pushPullRatio = pullSets > 0 ? pushSets / pullSets : 0;
  
  // Detect imbalances
  const imbalances: Array<{ issue: string; recommendation: string }> = [];
  
  // Check push/pull ratio (ideal: 1:1 to 1:1.5)
  if (pushPullRatio > 1.5) {
    imbalances.push({
      issue: `Push/pull ratio is ${pushPullRatio.toFixed(2)}:1 (too much pushing)`,
      recommendation: 'Increase pulling exercises (rows, pull-ups) to balance shoulder health.',
    });
  } else if (pushPullRatio < 0.67) {
    imbalances.push({
      issue: `Push/pull ratio is ${pushPullRatio.toFixed(2)}:1 (too much pulling)`,
      recommendation: 'Increase pushing exercises to balance upper body development.',
    });
  }
  
  // Check for neglected muscle groups (< 5% of total volume)
  for (const mg of distribution) {
    if (mg.percentage < 5 && mg.percentage > 0) {
      imbalances.push({
        issue: `${mg.muscleGroup} only receives ${mg.percentage.toFixed(1)}% of training volume`,
        recommendation: `Consider adding more ${mg.muscleGroup.toLowerCase()} exercises for balanced development.`,
      });
    }
  }
  
  return {
    distribution,
    pushPullRatio,
    imbalances,
  };
}
