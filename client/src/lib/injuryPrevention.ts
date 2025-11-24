import type { Log, Exercise } from './db';

export interface InjuryRisk {
  exerciseId: number;
  exerciseName: string;
  riskLevel: 'high' | 'medium' | 'low';
  avgJointPain: number;
  recentSessions: number;
  recommendation: string;
  alternatives?: Exercise[];
}

/**
 * Analyze joint pain patterns to detect injury risk
 * High risk: Consistent joint pain >= 3 over multiple sessions
 */
export function analyzeInjuryRisk(
  logs: Log[],
  exerciseId: number,
  exerciseName: string
): InjuryRisk | null {
  // Filter logs for this exercise from recent sessions
  const recentLogs = logs
    .filter(log => log.exercise_id === exerciseId)
    .sort((a, b) => b.session_date.getTime() - a.session_date.getTime())
    .slice(0, 9); // Last ~3 sessions (assuming 3 sets each)

  if (recentLogs.length < 3) {
    return null; // Not enough data
  }

  const avgJointPain = recentLogs.reduce((sum, log) => sum + (log.feedback_joint_pain || 0), 0) / recentLogs.length;
  const recentSessions = Math.ceil(recentLogs.length / 3);

  let riskLevel: 'high' | 'medium' | 'low' = 'low';
  let recommendation = '';

  // High risk: Persistent moderate-high joint pain
  if (avgJointPain >= 3.5) {
    riskLevel = 'high';
    recommendation = `High joint pain detected (avg ${avgJointPain.toFixed(1)}/5). Consider stopping this exercise immediately and consulting a healthcare professional. Switch to a lower-stress alternative.`;
  }
  // Medium risk: Moderate joint pain
  else if (avgJointPain >= 2.5) {
    riskLevel = 'medium';
    recommendation = `Moderate joint pain detected (avg ${avgJointPain.toFixed(1)}/5). Consider reducing load, improving technique, or temporarily substituting with a lower-stress variation.`;
  }
  // Low risk: Minimal joint pain
  else if (avgJointPain >= 1.5) {
    riskLevel = 'low';
    recommendation = `Minor joint discomfort detected (avg ${avgJointPain.toFixed(1)}/5). Monitor closely and ensure proper warm-up and technique.`;
  }
  // No risk
  else {
    return null;
  }

  return {
    exerciseId,
    exerciseName,
    riskLevel,
    avgJointPain,
    recentSessions,
    recommendation,
  };
}

/**
 * Get all injury risks from recent training
 */
export function getAllInjuryRisks(
  logs: Log[],
  exercises: Exercise[]
): InjuryRisk[] {
  const risks: InjuryRisk[] = [];

  // Group logs by exercise
  const exerciseIds = Array.from(new Set(logs.map(log => log.exercise_id)));

  for (const exerciseId of exerciseIds) {
    const exercise = exercises.find(e => e.id === exerciseId);
    if (!exercise) continue;

    const risk = analyzeInjuryRisk(logs, exerciseId, exercise.name);
    if (risk) {
      risks.push(risk);
    }
  }

  // Sort by risk level (high first)
  risks.sort((a, b) => {
    const order = { high: 0, medium: 1, low: 2 };
    return order[a.riskLevel] - order[b.riskLevel];
  });

  return risks;
}

/**
 * Suggest lower-stress alternatives for high-risk exercises
 */
export function suggestLowerStressAlternatives(
  exercise: Exercise,
  allExercises: Exercise[]
): Exercise[] {
  // Filter same muscle group
  const sameMuscleGroup = allExercises.filter(
    e => e.muscle_group === exercise.muscle_group && e.id !== exercise.id
  );

  // Prioritize machine/isolation movements over free weight compounds
  const lowerStressKeywords = ['machine', 'cable', 'dumbbell', 'isolation', 'fly', 'raise', 'curl', 'extension'];
  const highStressKeywords = ['barbell', 'squat', 'deadlift', 'press'];

  const alternatives = sameMuscleGroup
    .map(alt => {
      const lowerName = alt.name.toLowerCase();
      const isLowerStress = lowerStressKeywords.some(kw => lowerName.includes(kw));
      const isHighStress = highStressKeywords.some(kw => lowerName.includes(kw));
      
      return {
        exercise: alt,
        score: isLowerStress ? 2 : isHighStress ? 0 : 1,
      };
    })
    .sort((a, b) => b.score - a.score)
    .map(item => item.exercise);

  return alternatives.slice(0, 3);
}
