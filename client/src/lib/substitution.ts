import type { Exercise } from './db';

/**
 * Exercise substitution recommendations based on muscle groups
 * and movement patterns
 */

export interface SubstitutionRecommendation {
  exercise: Exercise;
  reason: string;
  similarity: 'high' | 'medium' | 'low';
}

/**
 * Get substitution recommendations for an exercise
 * Based on muscle group and movement pattern
 */
export function getSubstitutions(
  currentExercise: Exercise,
  allExercises: Exercise[],
  reason?: 'rotation' | 'injury' | 'preference'
): SubstitutionRecommendation[] {
  const recommendations: SubstitutionRecommendation[] = [];

  // Filter exercises from same muscle group, excluding current
  const sameMuscleGroup = allExercises.filter(
    ex => ex.muscle_group === currentExercise.muscle_group && ex.id !== currentExercise.id
  );

  // Categorize by movement pattern similarity
  for (const exercise of sameMuscleGroup) {
    let similarity: 'high' | 'medium' | 'low' = 'medium';
    let recommendationReason = '';

    // High similarity: same compound/isolation type
    const currentIsCompound = isCompoundMovement(currentExercise.name);
    const candidateIsCompound = isCompoundMovement(exercise.name);

    if (currentIsCompound === candidateIsCompound) {
      similarity = 'high';
      recommendationReason = `Similar ${currentIsCompound ? 'compound' : 'isolation'} movement for ${exercise.muscle_group}`;
    } else {
      similarity = 'medium';
      recommendationReason = `Alternative ${candidateIsCompound ? 'compound' : 'isolation'} movement for ${exercise.muscle_group}`;
    }

    // Adjust reason based on substitution context
    if (reason === 'rotation') {
      recommendationReason = `Fresh alternative after extended use of ${currentExercise.name}`;
    } else if (reason === 'injury') {
      recommendationReason = `Lower-stress alternative for ${exercise.muscle_group}`;
    }

    recommendations.push({
      exercise,
      reason: recommendationReason,
      similarity,
    });
  }

  // Sort by similarity (high first)
  recommendations.sort((a, b) => {
    const order = { high: 0, medium: 1, low: 2 };
    return order[a.similarity] - order[b.similarity];
  });

  return recommendations.slice(0, 5); // Return top 5
}

/**
 * Determine if exercise is compound or isolation
 * Simple heuristic based on common exercise names
 */
function isCompoundMovement(exerciseName: string): boolean {
  const compoundKeywords = [
    'squat', 'deadlift', 'press', 'row', 'pull-up', 'chin-up',
    'lunge', 'dip', 'clean', 'snatch', 'push-up'
  ];

  const lowerName = exerciseName.toLowerCase();
  return compoundKeywords.some(keyword => lowerName.includes(keyword));
}

/**
 * Get rotation recommendations based on exercise age
 */
export function getRotationRecommendations(
  exerciseId: number,
  weeksUsed: number,
  allExercises: Exercise[]
): {
  shouldRotate: boolean;
  urgency: 'high' | 'medium' | 'low';
  alternatives: Exercise[];
  message: string;
} {
  const currentExercise = allExercises.find(ex => ex.id === exerciseId);
  if (!currentExercise) {
    return {
      shouldRotate: false,
      urgency: 'low',
      alternatives: [],
      message: 'Exercise not found',
    };
  }

  let shouldRotate = false;
  let urgency: 'high' | 'medium' | 'low' = 'low';
  let message = '';

  if (weeksUsed >= 8) {
    shouldRotate = true;
    urgency = 'high';
    message = `${currentExercise.name} has been used for ${weeksUsed} weeks. Rotation strongly recommended for continued progress.`;
  } else if (weeksUsed >= 6) {
    shouldRotate = true;
    urgency = 'medium';
    message = `${currentExercise.name} has been used for ${weeksUsed} weeks. Consider rotating to maintain stimulus.`;
  } else {
    shouldRotate = false;
    urgency = 'low';
    message = `${currentExercise.name} is still fresh (${weeksUsed} weeks). Continue as planned.`;
  }

  const substitutions = getSubstitutions(currentExercise, allExercises, 'rotation');
  const alternatives = substitutions.map(sub => sub.exercise);

  return {
    shouldRotate,
    urgency,
    alternatives,
    message,
  };
}
