import { create } from "zustand";
import { getDB } from "../db/index";
import type { Goal } from "../db/index";
import { useUserStore } from "./useUserStore";

interface GoalStore {
  goals: Goal[];
  isHydrated: boolean;
  addGoal: (title: string, target: number) => Promise<void>;
  updateProgress: (id: number, amount: number) => Promise<void>;
  hydrate: () => Promise<void>;
}

export const useGoalStore = create<GoalStore>((set, get) => ({
  goals: [],
  isHydrated: false,

  addGoal: async (title, target) => {
    const db = getDB();
    const userId = useUserStore.getState().id;
    const normalizedTitle = title.trim();
    const normalizedTarget = Number(target);

    if (!userId) {
      throw new Error("User not initialized. Cannot add goal.");
    }
    if (!normalizedTitle) {
      throw new Error("Goal title is required.");
    }
    if (!Number.isFinite(normalizedTarget) || normalizedTarget <= 0) {
      throw new Error("Goal target must be greater than zero.");
    }

    const result = await db.runAsync(
      "INSERT INTO goals (user_id, title, type, target_value, current_value, status) VALUES (?, ?, 'manual', ?, 0, 'active')",
      [userId, normalizedTitle, normalizedTarget]
    );

    const insertedGoal: Goal = {
      id: result.lastInsertRowId,
      user_id: userId,
      title: normalizedTitle,
      type: "manual",
      target_value: normalizedTarget,
      current_value: 0,
      status: "active",
    };

    set((state) => ({ goals: [insertedGoal, ...state.goals] }));
  },

  updateProgress: async (id, amount) => {
    const db = getDB();
    const userId = useUserStore.getState().id;
    const { goals } = get();
    const goal = goals.find((item) => item.id === id);
    const increment = Number(amount);

    if (!userId) {
      throw new Error("User not initialized. Cannot update goal progress.");
    }
    if (!goal) {
      throw new Error("Goal not found.");
    }
    if (!Number.isFinite(increment)) {
      throw new Error("Progress amount must be a number.");
    }

    const nextCurrentValue = Math.min(
      goal.target_value,
      Math.max(0, goal.current_value + increment)
    );

    await db.runAsync(
      "UPDATE goals SET current_value = ? WHERE id = ? AND user_id = ?",
      [nextCurrentValue, id, userId]
    );

    set((state) => ({
      goals: state.goals.map((item) =>
        item.id === id ? { ...item, current_value: nextCurrentValue } : item
      ),
    }));
  },

  hydrate: async () => {
    const db = getDB();
    const userId = useUserStore.getState().id;

    if (!userId) {
      throw new Error("User not initialized. Cannot hydrate goals.");
    }

    const goals = await db.getAllAsync<Goal>(
      "SELECT * FROM goals WHERE user_id = ? AND status = 'active' ORDER BY id DESC",
      [userId]
    );

    set({ goals, isHydrated: true });
  },
}));
