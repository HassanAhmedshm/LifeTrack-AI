import { create } from "zustand";
import { getDB } from "../db/index";
import { useUserStore } from "./useUserStore";

type ActiveSet = {
  id: number;
  exercise_id: number;
  set_number: number;
  weight: number | null;
  reps: number | null;
  completed: number;
};

type ActiveExercise = {
  id: number;
  workout_id: number;
  name: string;
  target_sets: number;
  target_reps: number;
  target_weight: number | null;
  sets: ActiveSet[];
};

type ActiveWorkout = {
  id: number;
  user_id: number;
  date: string;
  plan_name: string;
  duration: number | null;
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
  addExercise: (exerciseData: AddExerciseData) => Promise<void>;
  updateSet: (
    exerciseId: number,
    setId: number,
    data: UpdateSetData
  ) => Promise<void>;
  finishWorkout: () => Promise<void>;
  hydrate: () => Promise<void>;
}

export const useWorkoutStore = create<WorkoutStore>((set, get) => ({
  activeWorkout: null,
  isHydrated: false,

  startWorkout: async () => {
    const db = getDB();
    const userId = useUserStore.getState().id;
    if (!userId) {
      throw new Error("User not initialized. Cannot start workout.");
    }

    const existingWorkout = await db.getFirstAsync<{ id: number; date: string; plan_name: string; duration: number | null }>(
      "SELECT id, date, plan_name, duration FROM workouts WHERE user_id = ? AND duration IS NULL ORDER BY id DESC LIMIT 1",
      [userId]
    );

    if (existingWorkout) {
      await hydrateActiveWorkout(userId, set);
      return;
    }

    const startedAt = new Date().toISOString();
    let result: { lastInsertRowId: number };
    try {
      result = await db.runAsync(
        "INSERT INTO workouts (user_id, date, plan_name, duration) VALUES (?, ?, ?, NULL)",
        [userId, startedAt, "Active Workout"]
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message.toLowerCase() : "";
      const isActiveWorkoutUniquenessError =
        (message.includes("unique constraint failed") &&
          message.includes("workouts.user_id")) ||
        message.includes("idx_workouts_single_active_per_user");
      if (isActiveWorkoutUniquenessError) {
        await hydrateActiveWorkout(userId, set);
        return;
      }
      throw error;
    }

    set({
      activeWorkout: {
        id: result.lastInsertRowId,
        user_id: userId,
        date: startedAt,
        plan_name: "Active Workout",
        duration: null,
        exercises: [],
      },
    });
  },

  addExercise: async (exerciseData) => {
    const db = getDB();
    const { activeWorkout } = get();
    if (!activeWorkout) {
      throw new Error("No active workout. Start a workout first.");
    }

    const name = exerciseData.name.trim();
    const targetSets = normalizePositiveInt(exerciseData.targetSets, 3);
    const targetReps = normalizePositiveInt(exerciseData.targetReps, 10);
    const targetWeight =
      exerciseData.targetWeight !== undefined
        ? normalizeOptionalNumber(exerciseData.targetWeight)
        : null;

    if (!name) {
      throw new Error("Exercise name is required.");
    }

    let exerciseId = 0;
    const defaultSets: ActiveSet[] = [];
    await db.withExclusiveTransactionAsync(async (txn) => {
      const exerciseInsert = await txn.runAsync(
        "INSERT INTO exercises (workout_id, name, target_sets, target_reps, target_weight) VALUES (?, ?, ?, ?, ?)",
        [activeWorkout.id, name, targetSets, targetReps, targetWeight]
      );
      exerciseId = exerciseInsert.lastInsertRowId;

      for (let setNumber = 1; setNumber <= targetSets; setNumber += 1) {
        const setInsert = await txn.runAsync(
          "INSERT INTO sets (exercise_id, set_number, weight, reps, completed) VALUES (?, ?, NULL, NULL, 0)",
          [exerciseId, setNumber]
        );
        defaultSets.push({
          id: setInsert.lastInsertRowId,
          exercise_id: exerciseId,
          set_number: setNumber,
          weight: null,
          reps: null,
          completed: 0,
        });
      }
    });

    const insertedExercise: ActiveExercise = {
      id: exerciseId,
      workout_id: activeWorkout.id,
      name,
      target_sets: targetSets,
      target_reps: targetReps,
      target_weight: targetWeight,
      sets: defaultSets,
    };

    set((state) => ({
      activeWorkout: state.activeWorkout
        ? {
            ...state.activeWorkout,
            exercises: [...state.activeWorkout.exercises, insertedExercise],
          }
        : state.activeWorkout,
    }));
  },

  updateSet: async (exerciseId, setId, data) => {
    const db = getDB();
    const { activeWorkout } = get();
    if (!activeWorkout) {
      throw new Error("No active workout to update.");
    }

    const currentExercise = activeWorkout.exercises.find(
      (exercise) => exercise.id === exerciseId
    );
    if (!currentExercise) {
      throw new Error("Exercise not found in active workout.");
    }

    const currentSet = currentExercise.sets.find((setItem) => setItem.id === setId);
    if (!currentSet) {
      throw new Error("Set not found in active workout.");
    }

    const setClauses: string[] = [];
    const params: Array<number | null> = [];
    const nextValues: Partial<ActiveSet> = {};

    if (data.weight !== undefined) {
      const nextWeight = normalizeOptionalNumber(data.weight);
      setClauses.push("weight = ?");
      params.push(nextWeight);
      nextValues.weight = nextWeight;
    }
    if (data.reps !== undefined) {
      const nextReps = normalizeOptionalNumber(data.reps);
      setClauses.push("reps = ?");
      params.push(nextReps);
      nextValues.reps = nextReps;
    }
    if (data.completed !== undefined) {
      const nextCompleted = normalizeCompletedValue(data.completed);
      setClauses.push("completed = ?");
      params.push(nextCompleted);
      nextValues.completed = nextCompleted;
    }

    if (setClauses.length === 0) {
      return;
    }

    await db.runAsync(
      `UPDATE sets SET ${setClauses.join(", ")} WHERE id = ? AND exercise_id = ?`,
      [...params, setId, exerciseId]
    );

    set((state) => ({
      activeWorkout: state.activeWorkout
        ? {
            ...state.activeWorkout,
            exercises: state.activeWorkout.exercises.map((exercise) =>
              exercise.id === exerciseId
                ? {
                    ...exercise,
                    sets: exercise.sets.map((setItem) =>
                      setItem.id === setId
                        ? { ...setItem, ...nextValues }
                        : setItem
                    ),
                  }
                : exercise
            ),
          }
        : state.activeWorkout,
    }));
  },

  finishWorkout: async () => {
    const db = getDB();
    const { activeWorkout } = get();
    if (!activeWorkout) {
      throw new Error("No active workout to finish.");
    }

    const startedAt = new Date(activeWorkout.date).getTime();
    const elapsedMs = Date.now() - startedAt;
    const computedDurationMinutes = Math.max(1, Math.round(elapsedMs / 60000));

    await db.runAsync("UPDATE workouts SET duration = ? WHERE id = ?", [
      computedDurationMinutes,
      activeWorkout.id,
    ]);

    set({ activeWorkout: null });
  },

  hydrate: async () => {
    const userId = useUserStore.getState().id;
    if (!userId) {
      throw new Error("User not initialized. Cannot hydrate workouts.");
    }

    await hydrateActiveWorkout(userId, set);
    set({ isHydrated: true });
  },
}));

async function hydrateActiveWorkout(
  userId: number,
  set: (state: Partial<WorkoutStore> | ((state: WorkoutStore) => Partial<WorkoutStore>)) => void
): Promise<void> {
  const db = getDB();
  const workout = await db.getFirstAsync<{
    id: number;
    user_id: number;
    date: string;
    plan_name: string;
    duration: number | null;
  }>(
    "SELECT id, user_id, date, plan_name, duration FROM workouts WHERE user_id = ? AND duration IS NULL ORDER BY id DESC LIMIT 1",
    [userId]
  );

  if (!workout) {
    set({ activeWorkout: null });
    return;
  }

  const exercises = await db.getAllAsync<{
    id: number;
    workout_id: number;
    name: string;
    target_sets: number;
    target_reps: number;
    target_weight: number | null;
  }>("SELECT * FROM exercises WHERE workout_id = ? ORDER BY id ASC", [workout.id]);

  const hydratedExercises: ActiveExercise[] = [];
  for (const exercise of exercises) {
    const sets = await db.getAllAsync<ActiveSet>(
      "SELECT id, exercise_id, set_number, weight, reps, completed FROM sets WHERE exercise_id = ? ORDER BY set_number ASC",
      [exercise.id]
    );

    hydratedExercises.push({
      ...exercise,
      sets,
    });
  }

  set({
    activeWorkout: {
      ...workout,
      exercises: hydratedExercises,
    },
  });
}

function normalizePositiveInt(value: number | undefined, fallback: number): number {
  if (value === undefined) {
    return fallback;
  }

  const normalized = Math.round(Number(value));
  if (!Number.isFinite(normalized) || normalized <= 0) {
    throw new Error("Numeric value must be a positive number.");
  }
  return normalized;
}

function normalizeOptionalNumber(value: number | null): number | null {
  if (value === null) {
    return null;
  }

  const normalized = Number(value);
  if (!Number.isFinite(normalized) || normalized < 0) {
    throw new Error("Numeric value must be zero or greater.");
  }
  return normalized;
}

function normalizeCompletedValue(value: number): number {
  return value ? 1 : 0;
}
