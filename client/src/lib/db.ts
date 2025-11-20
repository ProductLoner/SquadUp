import Dexie, { type EntityTable } from 'dexie';

// Type definitions for database tables
export type PhaseType = 'Hypertrophy' | 'Metabolite' | 'Resensitization' | 'Deload';
export type MuscleGroup = 'Chest' | 'Back' | 'Shoulders' | 'Biceps' | 'Triceps' | 'Quads' | 'Hamstrings' | 'Glutes' | 'Calves' | 'Abs' | 'Forearms';

export interface Exercise {
  id?: number;
  name: string;
  muscle_group: MuscleGroup;
  is_custom: boolean;
  video_url?: string;
  notes?: string;
  created_at: Date;
}

export interface Mesocycle {
  id?: number;
  name: string;
  phase_type: PhaseType;
  start_date: Date;
  end_date: Date;
  set_addition_frequency: number; // Throttle: 1 or 2 weeks
  is_active: boolean;
  created_at: Date;
}

export interface Microcycle {
  id?: number;
  mesocycle_id: number;
  week_number: number;
  start_date: Date;
  end_date: Date;
  created_at: Date;
}

export interface WorkoutSession {
  id?: number;
  microcycle_id: number;
  name: string; // e.g., "Upper A", "Lower B"
  scheduled_date: Date;
  completed_date?: Date;
  is_completed: boolean;
  created_at: Date;
}

export interface SessionExercise {
  id?: number;
  session_id: number;
  exercise_id: number;
  order_index: number;
  target_sets: number;
  target_reps_min: number;
  target_reps_max: number;
  target_rir: number;
  created_at: Date;
}

export interface WorkoutTemplate {
  id?: number;
  name: string;
  description?: string;
  exercises: {
    exercise_id: number;
    order_index: number;
    target_sets: number;
    target_reps_min: number;
    target_reps_max: number;
    target_rir: number;
  }[];
  created_at: Date;
}

export interface Log {
  id?: number;
  session_exercise_id: number;
  session_id: number;
  exercise_id: number;
  set_number: number;
  weight: number;
  reps: number;
  rir: number;
  target_rir: number;
  e1rm?: number; // Calculated estimated 1RM
  session_date: Date;
  feedback_soreness?: number; // 1-5 scale
  feedback_pump?: number; // 1-5 scale
  feedback_joint_pain?: number; // 1-5 scale
  notes?: string;
  created_at: Date;
}

// Database class
class HypertrophyDatabase extends Dexie {
  exercises!: EntityTable<Exercise, 'id'>;
  mesocycles!: EntityTable<Mesocycle, 'id'>;
  microcycles!: EntityTable<Microcycle, 'id'>;
  workout_sessions!: EntityTable<WorkoutSession, 'id'>;
  session_exercises!: EntityTable<SessionExercise, 'id'>;
  logs!: EntityTable<Log, 'id'>;
  workout_templates!: EntityTable<WorkoutTemplate, 'id'>;

  constructor() {
    super('HypertrophyOS');
    
    this.version(1).stores({
      exercises: '++id, name, muscle_group, is_custom, video_url, notes, created_at',
      mesocycles: '++id, name, phase_type, start_date, end_date, is_active, created_at',
      microcycles: '++id, mesocycle_id, week_number, start_date, created_at',
      workout_sessions: '++id, microcycle_id, scheduled_date, is_completed, created_at',
      session_exercises: '++id, session_id, exercise_id, order_index, created_at',
      logs: '++id, session_exercise_id, session_id, exercise_id, session_date, created_at',
      workout_templates: '++id, name, created_at'
    });
  }
}

export const db = new HypertrophyDatabase();

// Seed initial exercise library
export async function seedExercises() {
  const count = await db.exercises.count();
  if (count > 0) return; // Already seeded

  const defaultExercises: Omit<Exercise, 'id'>[] = [
    // Chest
    { name: 'Barbell Bench Press', muscle_group: 'Chest', is_custom: false, created_at: new Date() },
    { name: 'Incline Dumbbell Press', muscle_group: 'Chest', is_custom: false, created_at: new Date() },
    { name: 'Cable Fly', muscle_group: 'Chest', is_custom: false, created_at: new Date() },
    { name: 'Dips (Chest Focus)', muscle_group: 'Chest', is_custom: false, created_at: new Date() },
    
    // Back
    { name: 'Barbell Row', muscle_group: 'Back', is_custom: false, created_at: new Date() },
    { name: 'Pull-ups', muscle_group: 'Back', is_custom: false, created_at: new Date() },
    { name: 'Lat Pulldown', muscle_group: 'Back', is_custom: false, created_at: new Date() },
    { name: 'Seated Cable Row', muscle_group: 'Back', is_custom: false, created_at: new Date() },
    { name: 'Deadlift', muscle_group: 'Back', is_custom: false, created_at: new Date() },
    
    // Shoulders
    { name: 'Overhead Press', muscle_group: 'Shoulders', is_custom: false, created_at: new Date() },
    { name: 'Lateral Raise', muscle_group: 'Shoulders', is_custom: false, created_at: new Date() },
    { name: 'Face Pull', muscle_group: 'Shoulders', is_custom: false, created_at: new Date() },
    { name: 'Arnold Press', muscle_group: 'Shoulders', is_custom: false, created_at: new Date() },
    
    // Biceps
    { name: 'Barbell Curl', muscle_group: 'Biceps', is_custom: false, created_at: new Date() },
    { name: 'Hammer Curl', muscle_group: 'Biceps', is_custom: false, created_at: new Date() },
    { name: 'Preacher Curl', muscle_group: 'Biceps', is_custom: false, created_at: new Date() },
    
    // Triceps
    { name: 'Close-Grip Bench Press', muscle_group: 'Triceps', is_custom: false, created_at: new Date() },
    { name: 'Overhead Tricep Extension', muscle_group: 'Triceps', is_custom: false, created_at: new Date() },
    { name: 'Cable Pushdown', muscle_group: 'Triceps', is_custom: false, created_at: new Date() },
    
    // Quads
    { name: 'Barbell Squat', muscle_group: 'Quads', is_custom: false, created_at: new Date() },
    { name: 'Leg Press', muscle_group: 'Quads', is_custom: false, created_at: new Date() },
    { name: 'Leg Extension', muscle_group: 'Quads', is_custom: false, created_at: new Date() },
    { name: 'Bulgarian Split Squat', muscle_group: 'Quads', is_custom: false, created_at: new Date() },
    
    // Hamstrings
    { name: 'Romanian Deadlift', muscle_group: 'Hamstrings', is_custom: false, created_at: new Date() },
    { name: 'Leg Curl', muscle_group: 'Hamstrings', is_custom: false, created_at: new Date() },
    { name: 'Nordic Curl', muscle_group: 'Hamstrings', is_custom: false, created_at: new Date() },
    
    // Glutes
    { name: 'Hip Thrust', muscle_group: 'Glutes', is_custom: false, created_at: new Date() },
    { name: 'Glute Bridge', muscle_group: 'Glutes', is_custom: false, created_at: new Date() },
    
    // Calves
    { name: 'Standing Calf Raise', muscle_group: 'Calves', is_custom: false, created_at: new Date() },
    { name: 'Seated Calf Raise', muscle_group: 'Calves', is_custom: false, created_at: new Date() },
    
    // Abs
    { name: 'Cable Crunch', muscle_group: 'Abs', is_custom: false, created_at: new Date() },
    { name: 'Hanging Leg Raise', muscle_group: 'Abs', is_custom: false, created_at: new Date() },
  ];

  await db.exercises.bulkAdd(defaultExercises);
}

// Utility function to calculate e1RM using Brzycki formula
export function calculateE1RM(weight: number, reps: number): number {
  if (reps === 1) return weight;
  return weight * (36 / (37 - reps));
}

// Initialize database and seed data
export async function initializeDatabase() {
  await db.open();
  await seedExercises();
}
