import type { Microcycle, SessionExercise } from './db';

/**
 * Generate a deload week by reducing volume by 50%
 * Strategy: Reduce sets by ~50%, maintain weight and reps
 */
export interface DeloadWeekPlan {
  originalMicrocycle: Microcycle;
  deloadMicrocycle: Partial<Microcycle>;
  exerciseAdjustments: Array<{
    exerciseId: number;
    originalSets: number;
    deloadSets: number;
    reduction: number;
  }>;
  totalVolumeReduction: number;
}

export function generateDeloadWeek(
  microcycle: Microcycle,
  sessionExercises: SessionExercise[]
): DeloadWeekPlan {
  const exerciseAdjustments = sessionExercises.map(se => {
    const originalSets = se.target_sets;
    // Reduce sets by 50%, minimum 1 set
    const deloadSets = Math.max(1, Math.round(originalSets * 0.5));
    const reduction = ((originalSets - deloadSets) / originalSets) * 100;

    return {
      exerciseId: se.exercise_id,
      originalSets,
      deloadSets,
      reduction,
    };
  });

  // Calculate total volume reduction
  const originalTotalSets = exerciseAdjustments.reduce((sum, adj) => sum + adj.originalSets, 0);
  const deloadTotalSets = exerciseAdjustments.reduce((sum, adj) => sum + adj.deloadSets, 0);
  const totalVolumeReduction = ((originalTotalSets - deloadTotalSets) / originalTotalSets) * 100;

  // Create deload microcycle (copy with adjusted dates)
  const deloadMicrocycle: Partial<Microcycle> = {
    mesocycle_id: microcycle.mesocycle_id,
    week_number: microcycle.week_number + 1, // Next week
    start_date: new Date(microcycle.end_date.getTime() + 24 * 60 * 60 * 1000), // Day after current week ends
    end_date: new Date(microcycle.end_date.getTime() + 7 * 24 * 60 * 60 * 1000), // 7 days later
    created_at: new Date(),
  };

  return {
    originalMicrocycle: microcycle,
    deloadMicrocycle,
    exerciseAdjustments,
    totalVolumeReduction,
  };
}

/**
 * Apply deload adjustments to session exercises
 */
export function applyDeloadToExercises(
  sessionExercises: SessionExercise[],
  adjustments: Array<{ exerciseId: number; deloadSets: number }>
): Partial<SessionExercise>[] {
  return sessionExercises.map(se => {
    const adjustment = adjustments.find(adj => adj.exerciseId === se.exercise_id);
    if (!adjustment) return se;

    return {
      ...se,
      target_sets: adjustment.deloadSets,
      // Maintain reps and RIR targets - only reduce volume via sets
    };
  });
}

/**
 * Check if a deload week is recommended based on fatigue metrics
 */
export function shouldRecommendDeload(
  weeksSinceLastDeload: number,
  avgSoreness: number,
  avgJointPain: number,
  performanceTrend: 'improving' | 'stable' | 'declining'
): {
  shouldDeload: boolean;
  urgency: 'high' | 'medium' | 'low';
  reason: string;
} {
  let shouldDeload = false;
  let urgency: 'high' | 'medium' | 'low' = 'low';
  let reason = '';

  // High urgency: Multiple red flags
  if (
    (weeksSinceLastDeload >= 6 && avgSoreness >= 4) ||
    avgJointPain >= 4 ||
    (weeksSinceLastDeload >= 8 && performanceTrend === 'declining')
  ) {
    shouldDeload = true;
    urgency = 'high';
    reason = 'High fatigue accumulation detected. Immediate deload strongly recommended to prevent injury and overtraining.';
  }
  // Medium urgency: Some warning signs
  else if (
    (weeksSinceLastDeload >= 4 && avgSoreness >= 3.5) ||
    (weeksSinceLastDeload >= 6 && avgJointPain >= 3) ||
    (weeksSinceLastDeload >= 6 && performanceTrend === 'declining')
  ) {
    shouldDeload = true;
    urgency = 'medium';
    reason = 'Fatigue is building up. Consider scheduling a deload week to optimize recovery and performance.';
  }
  // Low urgency: Time-based recommendation
  else if (weeksSinceLastDeload >= 8) {
    shouldDeload = true;
    urgency = 'low';
    reason = '8+ weeks since last deload. Proactive deload recommended for long-term progress.';
  }
  // No deload needed
  else {
    shouldDeload = false;
    urgency = 'low';
    reason = `Recovery metrics are good. Continue training (${weeksSinceLastDeload} weeks since last deload).`;
  }

  return {
    shouldDeload,
    urgency,
    reason,
  };
}
