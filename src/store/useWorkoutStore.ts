import { create } from "zustand";
import { getDB } from "../db/index";
import { useUserStore } from "./useUserStore";
import * as aiService from "../services/ai";

type ActiveSet = {
  id: string;
  exercise_id: string;
  set_number: number;
  weight: number | null;
  reps: number | null;
  completed: number;
};

type ActiveExercise = {
  id: string;
  session_id: string;
  name: string;
  is_timed: number;
  order_index: number;
  sets: ActiveSet[];
};

type ActiveWorkout = {
  id: string;
  day_id: string;
  date: string;
  duration_seconds: number | null;
  total_score: number | null;
  exercises: ActiveExercise[];
};

type AddExerciseData = {
  name: string;
  targetSets?: number;
  targetReps?: number;
  targetWeight?: number;
};

type UpdateSetData = {
  weight?: number | null;
  reps?: number | null;
  completed?: number;
};

interface WorkoutStore {
  activeWorkout: ActiveWorkout | null;
  isHydrated: boolean;
  startWorkout: () => Promise<void>;
  initializeSchedule: (options?: { force?: boolean }) => Promise<void>;
  addExercise: (exerciseData: AddExerciseData) => Promise<void>;
  updateSet: (
    exerciseId: string,
    setId: string,
    data: UpdateSetData
  ) => Promise<void>;
  finishWorkout: () => Promise<void>;
  hydrate: () => Promise<void>;
}

export const useWorkoutStore = create<WorkoutStore>((set, get) => ({
  activeWorkout: null,
  isHydrated: false,

  startWorkout: async () => {
    // TODO: Workouts table schema has changed. Need to re-implement with workout_sessions.
    // For now, throw error to prevent stale data access.
    throw new Error("Workout feature is currently disabled during database migration.");
  },

  initializeSchedule: async (options) => {
    // TODO: Workout days schema has changed. Need to adapt to new structure.
    throw new Error("Workout schedule initialization is disabled during migration.");
  },

  addExercise: async (exerciseData) => {
    // TODO: Exercises table schema has changed.
    throw new Error("Add exercise feature is disabled during migration.");
  },

  updateSet: async (exerciseId, setId, data) => {
    // TODO: Sets table schema has changed.
    throw new Error("Update set feature is disabled during migration.");
  },

  finishWorkout: async () => {
    // TODO: Workout sessions table schema has changed.
    throw new Error("Finish workout feature is disabled during migration.");
  },

  hydrate: async () => {
    // Mark hydration complete but activeWorkout is null
    set({ activeWorkout: null, isHydrated: true });
    console.log("✓ Workout store hydrated (workouts disabled during migration)");
  },
}));
