import * as SQLite from "expo-sqlite";

// Database instance
let db: SQLite.SQLiteDatabase | null = null;
let initPromise: Promise<SQLite.SQLiteDatabase> | null = null;

// TypeScript interfaces for type safety
export interface User {
  id: number;
  onboarding_completed: number;
  groq_api_key: string | null;
  preferences_json: string | null;
}

export interface Goal {
  id: number;
  user_id: number;
  title: string;
  type: string;
  target_value: number;
  current_value: number;
  status: string;
}

export interface Workout {
  id: number;
  user_id: number;
  workout_day_id: number | null;
  date: string;
  plan_name: string;
  duration: number;
}

export interface WorkoutDay {
  id: number;
  user_id: number;
  date: string;
  label: string;
}

export interface Exercise {
  id: number;
  workout_id: number;
  name: string;
  target_sets: number;
  target_reps: number;
  target_weight: number;
}

export interface Set {
  id: number;
  exercise_id: number;
  set_number: number;
  weight: number;
  reps: number;
  completed: number;
}

/**
 * Initialize the SQLite database and create tables if they don't exist.
 * Uses modern openDatabaseAsync API for Expo SDK 54+.
 * Prevents race conditions by ensuring initialization happens exactly once.
 */
export async function initDB(): Promise<SQLite.SQLiteDatabase> {
  // If already initialized, return existing instance
  if (db) return db;

  // If initialization is in progress, wait for it
  if (initPromise) return initPromise;

  // Start initialization
  initPromise = performInitialization();

  try {
    return await initPromise;
  } finally {
    initPromise = null;
  }
}

async function performInitialization(): Promise<SQLite.SQLiteDatabase> {
  try {
    db = await SQLite.openDatabaseAsync("lifetrack.db");

    // Create users table
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        onboarding_completed INTEGER DEFAULT 0,
        groq_api_key TEXT,
        preferences_json TEXT
      );
    `);
    await ensureUserSchema(db);

    // Create goals table with user_id foreign key
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS goals (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        type TEXT NOT NULL,
        target_value REAL NOT NULL,
        current_value REAL DEFAULT 0,
        status TEXT DEFAULT 'active',
        FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
      );
    `);

    // Create workouts table with user_id foreign key
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS workouts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        workout_day_id INTEGER,
        date TEXT NOT NULL,
        plan_name TEXT NOT NULL,
        duration INTEGER,
        FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY(workout_day_id) REFERENCES workout_days(id) ON DELETE SET NULL
      );
    `);
    await ensureWorkoutDaySchema(db);
    await ensureWorkoutSchema(db);

    // Create exercises table
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS exercises (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        workout_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        target_sets INTEGER NOT NULL,
        target_reps INTEGER NOT NULL,
        target_weight REAL,
        FOREIGN KEY(workout_id) REFERENCES workouts(id) ON DELETE CASCADE
      );
    `);

    // Create sets table
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS sets (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        exercise_id INTEGER NOT NULL,
        set_number INTEGER NOT NULL,
        weight REAL,
        reps INTEGER,
        completed INTEGER DEFAULT 0,
        FOREIGN KEY(exercise_id) REFERENCES exercises(id) ON DELETE CASCADE
      );
    `);

    // Seed default user if none exists
    await seedDefaultUser(db);

    console.log("✓ Database initialized successfully");
    return db;
  } catch (error) {
    db = null;
    console.error("✗ Database initialization failed:", error);
    throw error;
  }
}

/**
 * Seed a default user record on first app launch.
 */
async function seedDefaultUser(database: SQLite.SQLiteDatabase): Promise<void> {
  try {
    const result = await database.getFirstAsync<{ count: number }>(
      "SELECT COUNT(*) as count FROM users"
    );

    if (!result || result.count === 0) {
      await database.runAsync("INSERT INTO users (onboarding_completed) VALUES (0)");
      console.log("✓ Default user created");
    }
  } catch (error) {
    console.error("✗ Failed to seed default user:", error);
    throw error;
  }
}

async function ensureUserSchema(database: SQLite.SQLiteDatabase): Promise<void> {
  const columns = await database.getAllAsync<{ name: string }>(
    "PRAGMA table_info(users)"
  );
  const hasPreferencesJson = columns.some(
    (column) => column.name === "preferences_json"
  );

  if (!hasPreferencesJson) {
    await database.execAsync(
      "ALTER TABLE users ADD COLUMN preferences_json TEXT;"
    );
  }
}

async function ensureWorkoutSchema(database: SQLite.SQLiteDatabase): Promise<void> {
  const workoutColumns = await database.getAllAsync<{ name: string }>(
    "PRAGMA table_info(workouts)"
  );
  const hasWorkoutDayId = workoutColumns.some(
    (column) => column.name === "workout_day_id"
  );

  if (!hasWorkoutDayId) {
    await database.execAsync(
      "ALTER TABLE workouts ADD COLUMN workout_day_id INTEGER;"
    );
  }

  // Keep only the latest active workout (duration IS NULL) per user before adding invariant index.
  await database.execAsync(`
    UPDATE workouts
    SET duration = 0
    WHERE id IN (
      SELECT w.id
      FROM workouts w
      JOIN (
        SELECT user_id, MAX(id) AS keep_id
        FROM workouts
        WHERE duration IS NULL
        GROUP BY user_id
      ) keep_workout ON keep_workout.user_id = w.user_id
      WHERE w.duration IS NULL AND w.id != keep_workout.keep_id
    );
  `);

  await database.execAsync(`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_workouts_single_active_per_user
    ON workouts(user_id)
    WHERE duration IS NULL;
  `);
  await database.execAsync(`
    CREATE INDEX IF NOT EXISTS idx_workouts_workout_day_id
    ON workouts(workout_day_id);
  `);
}

async function ensureWorkoutDaySchema(
  database: SQLite.SQLiteDatabase
): Promise<void> {
  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS workout_days (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      date TEXT NOT NULL,
      label TEXT NOT NULL,
      UNIQUE(user_id, date),
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);
}

/**
 * Get the database instance. Must call initDB() first.
 */
export function getDB(): SQLite.SQLiteDatabase {
  if (!db) {
    throw new Error("Database not initialized. Call initDB() first.");
  }
  return db;
}

