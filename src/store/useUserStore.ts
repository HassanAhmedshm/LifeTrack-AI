import { create } from "zustand";
import * as SecureStore from "expo-secure-store";
import { getDB } from "../db/index";
import type { User } from "../db/index";

export interface UserStore {
  // State
  id: number | null;
  name: string;
  groqApiKey: string | null;
  onboardingCompleted: boolean;
  isHydrated: boolean;
  isLoading: boolean;

  // Actions
  setApiKey: (key: string) => Promise<void>;
  completeOnboarding: (payload: {
    name: string;
    primaryGoal: string;
    age?: number | null;
    allergies?: string;
    dietaryPreference?: string;
    activityLevel?: string;
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

  // Mark onboarding complete in store and sync to SQLite
  completeOnboarding: async (payload) => {
    const { id } = get();
    if (!id) {
      throw new Error("User not initialized. Cannot complete onboarding.");
    }

    const name = payload.name.trim();
    const primaryGoal = payload.primaryGoal.trim();
    const allergies = payload.allergies?.trim() ?? "";
    const dietaryPreference = payload.dietaryPreference?.trim() ?? "";
    const activityLevel = payload.activityLevel?.trim() ?? "";
    const age =
      payload.age !== undefined && payload.age !== null
        ? Math.round(Number(payload.age))
        : null;
    if (!name || !primaryGoal) {
      throw new Error("Name and primary goal are required.");
    }
    if (age !== null && (!Number.isFinite(age) || age <= 0 || age > 120)) {
      throw new Error("Age must be between 1 and 120.");
    }

    const db = getDB();
    try {
      await db.runAsync(
        "UPDATE users SET onboarding_completed = 1, preferences_json = ? WHERE id = ?",
        [
          JSON.stringify({
            name,
            primaryGoal,
            age,
            allergies,
            dietaryPreference,
            activityLevel,
          }),
          id,
        ]
      );
      set({ onboardingCompleted: true, name });
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
    const user = await db.getFirstAsync<User>(
      "SELECT * FROM users ORDER BY id LIMIT 1"
    );
    let groqApiKey = await SecureStore.getItemAsync(GROQ_API_KEY_STORAGE_KEY);
    const normalizedStoredKey = groqApiKey?.trim() ?? "";
    if (!normalizedStoredKey && groqApiKey !== null) {
      await SecureStore.deleteItemAsync(GROQ_API_KEY_STORAGE_KEY);
    }
    groqApiKey = normalizedStoredKey || null;

    if (!user) {
      throw new Error(
        "User record not found in database. App cannot initialize."
      );
    }

    const preferences = parseUserPreferences(user.preferences_json);

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
      name: preferences.name,
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

type UserPreferences = {
  name: string;
};

function parseUserPreferences(rawPreferences: string | null): UserPreferences {
  if (!rawPreferences) {
    return { name: "" };
  }

  try {
    const parsed = JSON.parse(rawPreferences) as Record<string, unknown>;
    const name = typeof parsed.name === "string" ? parsed.name.trim() : "";
    return { name };
  } catch {
    return { name: "" };
  }
}

