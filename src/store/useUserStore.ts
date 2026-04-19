import { create } from "zustand";
import * as SecureStore from "expo-secure-store";
import { getDB } from "../db/index";
import type { User } from "../db/index";

export type UserProfile = {
  name: string;
  height: number | null;
  currentWeight: number | null;
  primaryGoal: string;
  allergies: string;
  aiTone: string;
};

export type WeightHistoryItem = {
  id: string;
  date: string;
  weight: number;
  notes: string | null;
};

export interface UserStore {
  // State
  id: string | null;
  // Legacy mirror for compatibility with existing selectors.
  name: string;
  profile: UserProfile;
  weightHistory: WeightHistoryItem[];
  groqApiKey: string | null;
  onboardingCompleted: boolean;
  isHydrated: boolean;
  isLoading: boolean;

  // Actions
  setApiKey: (key: string) => Promise<void>;
  updateProfile: (newProfile: UserProfile) => Promise<void>;
  logMorningWeight: (weight: number, notes?: string) => Promise<void>;
  completeOnboarding: (payload: {
    name: string;
    primaryGoal: string;
    allergies?: string;
  }) => Promise<void>;
  hydrate: () => Promise<void>;
}

// Guard against concurrent hydration
let hydratePromise: Promise<void> | null = null;
const GROQ_API_KEY_STORAGE_KEY = "groq_api_key";

export const useUserStore = create<UserStore>((set, get) => ({
  // Initial state
  id: null,
  name: "",
  profile: createDefaultProfile(),
  weightHistory: [],
  groqApiKey: null,
  onboardingCompleted: false,
  isHydrated: false,
  isLoading: false,

  // Update API key in secure storage and sync UI state
  setApiKey: async (key: string) => {
    const { id } = get();
    if (!id) {
      throw new Error("User not initialized. Cannot set API key.");
    }

    const db = getDB();
    const normalizedKey = key.trim();
    const nextKey = normalizedKey ? normalizedKey : null;
    try {
      if (nextKey === null) {
        await SecureStore.deleteItemAsync(GROQ_API_KEY_STORAGE_KEY);
      } else {
        await SecureStore.setItemAsync(GROQ_API_KEY_STORAGE_KEY, nextKey);
      }

      // Clear legacy plaintext value from SQLite.
      await db.runAsync("UPDATE users SET groq_api_key = NULL WHERE id = ?", [id]);
      set({ groqApiKey: nextKey });
    } catch (error) {
      console.error("✗ Failed to set API key:", error);
      throw error;
    }
  },

  updateProfile: async (newProfile) => {
    const { id, profile: currentProfile } = get();
    if (!id) {
      throw new Error("User not initialized. Cannot update profile.");
    }

    const nextProfile = normalizeUserProfile(newProfile, currentProfile);
    const db = getDB();
    try {
      await db.runAsync("UPDATE users SET profile_json = ? WHERE id = ?", [
        JSON.stringify(nextProfile),
        id,
      ]);

      set({
        profile: nextProfile,
        name: nextProfile.name,
      });
    } catch (error) {
      console.error("✗ Failed to update profile:", error);
      throw error;
    }
  },

  logMorningWeight: async (weight, notes) => {
    const { id, profile, weightHistory } = get();
    if (!id) {
      throw new Error("User not initialized. Cannot log morning weight.");
    }

    const normalizedWeight = normalizeNullableNumber(weight);
    if (normalizedWeight === null) {
      throw new Error("Weight must be a number greater than zero.");
    }
    const normalizedNotes = normalizeNullableText(notes ?? null);
    const entry: WeightHistoryItem = {
      id: `wl_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`,
      date: new Date().toISOString().slice(0, 10),
      weight: normalizedWeight,
      notes: normalizedNotes,
    };
    const nextProfile: UserProfile = {
      ...profile,
      currentWeight: normalizedWeight,
    };

    const db = getDB();
    try {
      await db.withExclusiveTransactionAsync(async (txn) => {
        await txn.runAsync(
          `INSERT INTO weight_logs (id, date, weight, notes)
           VALUES (?, ?, ?, ?)
           ON CONFLICT(date) DO UPDATE SET
             id = excluded.id,
             weight = excluded.weight,
             notes = excluded.notes`,
          [entry.id, entry.date, entry.weight, entry.notes]
        );
        await txn.runAsync("UPDATE users SET profile_json = ? WHERE id = ?", [
          JSON.stringify(nextProfile),
          id,
        ]);
      });

      const nextWeightHistory = [
        entry,
        ...weightHistory.filter((item) => item.date !== entry.date),
      ];
      set({
        profile: nextProfile,
        name: nextProfile.name,
        weightHistory: nextWeightHistory,
      });
    } catch (error) {
      console.error("✗ Failed to log morning weight:", error);
      throw error;
    }
  },

  // Mark onboarding complete in store and sync to SQLite
  completeOnboarding: async (payload) => {
    const { id, profile } = get();
    if (!id) {
      throw new Error("User not initialized. Cannot complete onboarding.");
    }

    const name = payload.name.trim();
    const primaryGoal = payload.primaryGoal.trim();
    const allergies = payload.allergies?.trim() ?? "";
    if (!name || !primaryGoal) {
      throw new Error("Name and primary goal are required.");
    }

    const nextProfile: UserProfile = normalizeUserProfile(
      {
        ...profile,
        name,
        primaryGoal,
        allergies,
      },
      profile
    );

    const db = getDB();
    try {
      await db.runAsync(
        "UPDATE users SET onboarding_completed = 1, profile_json = ? WHERE id = ?",
        [JSON.stringify(nextProfile), id]
      );
      set({ onboardingCompleted: true, name: nextProfile.name, profile: nextProfile });
    } catch (error) {
      console.error("✗ Failed to complete onboarding:", error);
      throw error;
    }
  },

  // Load user data from SQLite and populate store
  // Uses a promise guard to prevent concurrent hydration
  hydrate: async () => {
    // If already hydrated, return immediately
    if (get().isHydrated) {
      return;
    }

    // If hydration is in progress, wait for it
    if (hydratePromise) {
      return hydratePromise;
    }

    // Start hydration
    hydratePromise = performHydration(set);
    try {
      await hydratePromise;
    } finally {
      hydratePromise = null;
    }
  },
}));

async function performHydration(
  set: (state: Partial<UserStore>) => void
): Promise<void> {
  set({ isLoading: true });

  try {
    const db = getDB();
    let user = await db.getFirstAsync<User>(
      "SELECT * FROM users ORDER BY id LIMIT 1"
    );
    let groqApiKey = await SecureStore.getItemAsync(GROQ_API_KEY_STORAGE_KEY);
    const normalizedStoredKey = groqApiKey?.trim() ?? "";
    if (!normalizedStoredKey && groqApiKey !== null) {
      await SecureStore.deleteItemAsync(GROQ_API_KEY_STORAGE_KEY);
    }
    groqApiKey = normalizedStoredKey || null;

    if (!user) {
      const seededUserId = "local-user";
      await db.runAsync(
        "INSERT INTO users (id, onboarding_completed, groq_api_key, profile_json) VALUES (?, 0, NULL, ?)",
        [seededUserId, JSON.stringify(createDefaultProfile())]
      );
      user = await db.getFirstAsync<User>("SELECT * FROM users ORDER BY id LIMIT 1");
    }

    if (!user) {
      throw new Error("User record creation failed. App cannot initialize.");
    }

    const profile = parseUserProfile(user.profile_json);
    const weightHistory = await db.getAllAsync<WeightHistoryItem>(
      "SELECT id, date, weight, notes FROM weight_logs ORDER BY date DESC, id DESC"
    );

    // One-time migration from legacy plaintext SQLite storage.
    const legacyDbKey = user.groq_api_key?.trim() ?? "";
    if (!groqApiKey && legacyDbKey) {
      await SecureStore.setItemAsync(GROQ_API_KEY_STORAGE_KEY, legacyDbKey);
      await db.runAsync("UPDATE users SET groq_api_key = NULL WHERE id = ?", [
        user.id,
      ]);
      groqApiKey = legacyDbKey;
    }

    set({
      id: user.id,
      name: profile.name,
      profile,
      weightHistory,
      groqApiKey,
      onboardingCompleted: Boolean(user.onboarding_completed),
      isHydrated: true,
      isLoading: false,
    });

    console.log("✓ User store hydrated successfully");
  } catch (error) {
    set({ isLoading: false });
    console.error("✗ Failed to hydrate user store:", error);
    throw error;
  }
}

function createDefaultProfile(): UserProfile {
  return {
    name: "",
    height: null,
    currentWeight: null,
    primaryGoal: "",
    allergies: "",
    aiTone: "",
  };
}

function parseUserProfile(rawProfile: string | null): UserProfile {
  if (!rawProfile) {
    return createDefaultProfile();
  }

  try {
    const parsed = JSON.parse(rawProfile) as Record<string, unknown>;
    return normalizeUserProfile(parsed, createDefaultProfile());
  } catch {
    return createDefaultProfile();
  }
}

function normalizeUserProfile(
  input: Partial<UserProfile> | Record<string, unknown>,
  fallback: UserProfile
): UserProfile {
  const source = input as Record<string, unknown>;
  return {
    name: normalizeText(source.name, fallback.name),
    height: normalizeNullableNumber(source.height, fallback.height),
    currentWeight: normalizeNullableNumber(
      source.currentWeight,
      fallback.currentWeight
    ),
    primaryGoal: normalizeText(source.primaryGoal, fallback.primaryGoal),
    allergies: normalizeText(source.allergies, fallback.allergies),
    aiTone: normalizeText(source.aiTone, fallback.aiTone),
  };
}

function normalizeText(value: unknown, fallback: string): string {
  return typeof value === "string" ? value.trim() : fallback;
}

function normalizeNullableText(value: unknown): string | null {
  if (value === null || value === undefined) {
    return null;
  }
  if (typeof value !== "string") {
    return null;
  }
  const normalized = value.trim();
  return normalized ? normalized : null;
}

function normalizeNullableNumber(
  value: unknown,
  fallback: number | null = null
): number | null {
  if (value === null || value === undefined || value === "") {
    return null;
  }
  const normalized = Number(value);
  if (!Number.isFinite(normalized) || normalized <= 0) {
    return fallback;
  }
  return normalized;
}

