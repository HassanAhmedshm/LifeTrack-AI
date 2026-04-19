import { create } from "zustand";
import { useUserStore } from "./useUserStore";

interface GoalStore {
  goals: [];
  isHydrated: boolean;
  addGoal: (title: string, target: number) => Promise<void>;
  updateProgress: (id: number, amount: number) => Promise<void>;
  hydrate: () => Promise<void>;
}

export const useGoalStore = create<GoalStore>((set, get) => ({
  goals: [],
  isHydrated: false,

  addGoal: async (title, target) => {
    // TODO: Goals table has been removed from the new schema.
    // This method is disabled until goals are re-implemented with the new relational schema.
    throw new Error("Goals feature is currently disabled.");
  },

  updateProgress: async (id, amount) => {
    // TODO: Goals table has been removed from the new schema.
    // This method is disabled until goals are re-implemented with the new relational schema.
    throw new Error("Goals feature is currently disabled.");
  },

  hydrate: async () => {
    // Goals table removed; mark hydration complete but goals array empty
    set({ goals: [], isHydrated: true });
    console.log("✓ Goal store hydrated (goals table disabled)");
  },
}));
