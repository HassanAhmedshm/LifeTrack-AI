import * as SQLite from "expo-sqlite";

// Database instance
let db: SQLite.SQLiteDatabase | null = null;
let initPromise: Promise<SQLite.SQLiteDatabase> | null = null;
const DB_SCHEMA_VERSION = 2;

// TypeScript interfaces for new schema
export interface User {
  id: string;
  onboarding_completed: number;
  groq_api_key: string | null;
  profile_json: string | null;
}

export interface WeightLog {
  id: string;
  date: string;
  weight: number;
  notes: string | null;
}

export interface WorkoutDay {
  id: string;
  name: string;
  last_played: string | null;
}

export interface Exercise {
  id: string;
  day_id: string;
  name: string;
  is_timed: number;
  order_index: number;
}

export interface WorkoutSession {
  id: string;
  day_id: string;
  date: string;
  duration_seconds: number;
  total_score: number;
}

export interface Set {
  id: string;
  session_id: string;
  exercise_id: string;
  set_number: number;
  weight: number | null;
  reps: number | null;
  score: number | null;
  is_pr: number;
  is_failure: number;
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

    const versionRow = await db.getFirstAsync<{ user_version: number }>(
      "PRAGMA user_version"
    );
    const currentVersion = versionRow?.user_version ?? 0;

    if (currentVersion < DB_SCHEMA_VERSION) {
      // One-time reset while migrating from legacy schema.
      await db.execAsync(`
        DROP TABLE IF EXISTS sets;
        DROP TABLE IF EXISTS exercises;
        DROP TABLE IF EXISTS workouts;
        DROP TABLE IF EXISTS goals;
        DROP TABLE IF EXISTS workout_days;
        DROP TABLE IF EXISTS workout_sessions;
        DROP TABLE IF EXISTS weight_logs;
        DROP TABLE IF EXISTS users;
      `);
    }

    // Create users table (app-wide settings, single-user)
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        onboarding_completed INTEGER DEFAULT 0,
        groq_api_key TEXT,
        profile_json TEXT
      );
    `);

    // Create weight_logs table (daily morning weight tracking)
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS weight_logs (
        id TEXT PRIMARY KEY,
        date TEXT NOT NULL UNIQUE,
        weight REAL NOT NULL,
        notes TEXT
      );
    `);

    // Create workout_days table (recurring gym day templates)
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS workout_days (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        last_played TEXT
      );
    `);

    // Create exercises table (exercises per day template)
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS exercises (
        id TEXT PRIMARY KEY,
        day_id TEXT NOT NULL,
        name TEXT NOT NULL,
        is_timed INTEGER DEFAULT 0,
        order_index INTEGER NOT NULL,
        FOREIGN KEY(day_id) REFERENCES workout_days(id) ON DELETE CASCADE
      );
    `);

    // Create workout_sessions table (completed workout sessions)
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS workout_sessions (
        id TEXT PRIMARY KEY,
        day_id TEXT NOT NULL,
        date TEXT NOT NULL,
        duration_seconds INTEGER,
        total_score REAL,
        FOREIGN KEY(day_id) REFERENCES workout_days(id) ON DELETE CASCADE
      );
    `);

    // Create sets table (individual set performance data)
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS sets (
        id TEXT PRIMARY KEY,
        session_id TEXT NOT NULL,
        exercise_id TEXT NOT NULL,
        set_number INTEGER NOT NULL,
        weight REAL,
        reps INTEGER,
        score REAL,
        is_pr INTEGER DEFAULT 0,
        is_failure INTEGER DEFAULT 0,
        completed INTEGER DEFAULT 0,
        FOREIGN KEY(session_id) REFERENCES workout_sessions(id) ON DELETE CASCADE,
        FOREIGN KEY(exercise_id) REFERENCES exercises(id) ON DELETE CASCADE
      );
    `);

    await db.execAsync(`PRAGMA user_version = ${DB_SCHEMA_VERSION};`);

    console.log("✓ Database initialized successfully with new schema");
    return db;
  } catch (error) {
    db = null;
    console.error("✗ Database initialization failed:", error);
    throw error;
  }
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

