import { useLiveQuery } from 'dexie-react-hooks';
import { db, type Exercise, type Mesocycle, type Microcycle, type WorkoutSession, type SessionExercise, type Log, type WorkoutTemplate, type PhaseType, type MuscleGroup, calculateE1RM } from '@/lib/db';

// Exercise hooks
export function useExercises() {
  return useLiveQuery(() => db.exercises.orderBy('name').toArray());
}

export function useExercisesByMuscleGroup(muscleGroup?: MuscleGroup) {
  return useLiveQuery(
    () => muscleGroup 
      ? db.exercises.where('muscle_group').equals(muscleGroup).toArray()
      : db.exercises.toArray(),
    [muscleGroup]
  );
}

export function useExercise(id?: number) {
  return useLiveQuery(
    () => id ? db.exercises.get(id) : undefined,
    [id]
  );
}

// Mesocycle hooks
export function useMesocycles() {
  return useLiveQuery(() => db.mesocycles.orderBy('start_date').reverse().toArray());
}

export function useActiveMesocycle() {
  return useLiveQuery(() => db.mesocycles.where('is_active').equals(1).first());
}

export function useMesocycle(id?: number) {
  return useLiveQuery(
    () => id ? db.mesocycles.get(id) : undefined,
    [id]
  );
}

// Microcycle hooks
export function useMicrocycles(mesocycleId?: number) {
  return useLiveQuery(
    () => mesocycleId 
      ? db.microcycles.where('mesocycle_id').equals(mesocycleId).toArray()
      : db.microcycles.toArray(),
    [mesocycleId]
  );
}

export function useMicrocycle(id?: number) {
  return useLiveQuery(
    () => id ? db.microcycles.get(id) : undefined,
    [id]
  );
}

// Workout session hooks
export function useWorkoutSessions(microcycleId?: number) {
  return useLiveQuery(
    () => microcycleId 
      ? db.workout_sessions.where('microcycle_id').equals(microcycleId).toArray()
      : db.workout_sessions.toArray(),
    [microcycleId]
  );
}

export function useUpcomingWorkouts() {
  return useLiveQuery(async () => {
    const now = new Date();
    return await db.workout_sessions
      .where('is_completed')
      .equals(0)
      .and(session => session.scheduled_date <= now)
      .toArray();
  });
}

export function useWorkoutSession(id?: number) {
  return useLiveQuery(
    () => id ? db.workout_sessions.get(id) : undefined,
    [id]
  );
}

// Session exercise hooks
export function useSessionExercises(sessionId?: number) {
  return useLiveQuery(
    async () => {
      if (!sessionId) return [];
      return await db.session_exercises.where('session_id').equals(sessionId).sortBy('order_index');
    },
    [sessionId]
  );
}

// Log hooks
export function useLogs(sessionId?: number) {
  return useLiveQuery(
    () => sessionId 
      ? db.logs.where('session_id').equals(sessionId).toArray()
      : db.logs.toArray(),
    [sessionId]
  );
}

export function useExerciseLogs(exerciseId?: number) {
  return useLiveQuery(
    async () => {
      if (!exerciseId) return [];
      const logs = await db.logs.where('exercise_id').equals(exerciseId).toArray();
      return logs.sort((a, b) => b.session_date.getTime() - a.session_date.getTime());
    },
    [exerciseId]
  );
}

// CRUD operations
export const exerciseOperations = {
  async create(exercise: Omit<Exercise, 'id'>) {
    return await db.exercises.add(exercise);
  },
  
  async update(id: number, changes: Partial<Exercise>) {
    return await db.exercises.update(id, changes);
  },
  
  async delete(id: number) {
    return await db.exercises.delete(id);
  }
};

export const mesocycleOperations = {
  async create(mesocycle: Omit<Mesocycle, 'id'>) {
    // Deactivate all other mesocycles if this one is active
    if (mesocycle.is_active) {
      await db.mesocycles.where('is_active').equals(1).modify({ is_active: false });
    }
    return await db.mesocycles.add(mesocycle);
  },
  
  async update(id: number, changes: Partial<Mesocycle>) {
    // If activating this mesocycle, deactivate others
    if (changes.is_active) {
      await db.mesocycles.where('is_active').equals(1).modify({ is_active: false });
    }
    return await db.mesocycles.update(id, changes);
  },
  
  async delete(id: number) {
    // Delete associated microcycles and sessions
    const microcycles = await db.microcycles.where('mesocycle_id').equals(id).toArray();
    for (const micro of microcycles) {
      const sessions = await db.workout_sessions.where('microcycle_id').equals(micro.id!).toArray();
      for (const session of sessions) {
        await db.session_exercises.where('session_id').equals(session.id!).delete();
        await db.logs.where('session_id').equals(session.id!).delete();
      }
      await db.workout_sessions.where('microcycle_id').equals(micro.id!).delete();
    }
    await db.microcycles.where('mesocycle_id').equals(id).delete();
    return await db.mesocycles.delete(id);
  },
  
  async activate(id: number) {
    await db.mesocycles.where('is_active').equals(1).modify({ is_active: false });
    return await db.mesocycles.update(id, { is_active: true });
  }
};

export const microcycleOperations = {
  async create(microcycle: Omit<Microcycle, 'id'>) {
    return await db.microcycles.add(microcycle);
  },
  
  async update(id: number, changes: Partial<Microcycle>) {
    return await db.microcycles.update(id, changes);
  },
  
  async delete(id: number) {
    // Delete associated sessions
    const sessions = await db.workout_sessions.where('microcycle_id').equals(id).toArray();
    for (const session of sessions) {
      await db.session_exercises.where('session_id').equals(session.id!).delete();
      await db.logs.where('session_id').equals(session.id!).delete();
    }
    await db.workout_sessions.where('microcycle_id').equals(id).delete();
    return await db.microcycles.delete(id);
  }
};

export const workoutSessionOperations = {
  async create(session: Omit<WorkoutSession, 'id'>) {
    return await db.workout_sessions.add(session);
  },
  
  async update(id: number, changes: Partial<WorkoutSession>) {
    return await db.workout_sessions.update(id, changes);
  },
  
  async complete(id: number) {
    return await db.workout_sessions.update(id, {
      is_completed: true,
      completed_date: new Date()
    });
  },
  
  async delete(id: number) {
    await db.session_exercises.where('session_id').equals(id).delete();
    await db.logs.where('session_id').equals(id).delete();
    return await db.workout_sessions.delete(id);
  }
};

export const sessionExerciseOperations = {
  async create(sessionExercise: Omit<SessionExercise, 'id'>) {
    return await db.session_exercises.add(sessionExercise);
  },
  
  async update(id: number, changes: Partial<SessionExercise>) {
    return await db.session_exercises.update(id, changes);
  },
  
  async delete(id: number) {
    await db.logs.where('session_exercise_id').equals(id).delete();
    return await db.session_exercises.delete(id);
  }
};

export const workoutTemplateOperations = {
  async create(template: Omit<WorkoutTemplate, 'id'>) {
    return await db.workout_templates.add(template);
  },
  
  async update(id: number, changes: Partial<WorkoutTemplate>) {
    return await db.workout_templates.update(id, changes);
  },
  
  async delete(id: number) {
    return await db.workout_templates.delete(id);
  },
  
  async applyToSession(templateId: number, sessionId: number) {
    const template = await db.workout_templates.get(templateId);
    if (!template) throw new Error('Template not found');
    
    // Create session exercises from template
    for (const ex of template.exercises) {
      await sessionExerciseOperations.create({
        session_id: sessionId,
        exercise_id: ex.exercise_id,
        order_index: ex.order_index,
        target_sets: ex.target_sets,
        target_reps_min: ex.target_reps_min,
        target_reps_max: ex.target_reps_max,
        target_rir: ex.target_rir,
        created_at: new Date(),
      });
    }
  },
};

export function useWorkoutTemplates() {
  return useLiveQuery(() => db.workout_templates.orderBy('name').toArray());
}

export function useWorkoutTemplate(id?: number) {
  return useLiveQuery(
    () => id ? db.workout_templates.get(id) : undefined,
    [id]
  );
}

export const logOperations = {
  async create(log: Omit<Log, 'id' | 'e1rm'>) {
    const e1rm = calculateE1RM(log.weight, log.reps);
    return await db.logs.add({ ...log, e1rm });
  },
  
  async update(id: number, changes: Partial<Log>) {
    // Recalculate e1RM if weight or reps changed
    if (changes.weight !== undefined || changes.reps !== undefined) {
      const log = await db.logs.get(id);
      if (log) {
        const weight = changes.weight ?? log.weight;
        const reps = changes.reps ?? log.reps;
        changes.e1rm = calculateE1RM(weight, reps);
      }
    }
    return await db.logs.update(id, changes);
  },
  
  async delete(id: number) {
    return await db.logs.delete(id);
  }
};
