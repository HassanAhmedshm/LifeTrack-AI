import { getDB } from "../db/index";
import { useGoalStore } from "../store/useGoalStore";
import { useUserStore } from "../store/useUserStore";
import { useWorkoutStore } from "../store/useWorkoutStore";
import * as aiService from "./ai";

type AssistantSource = "chat" | "workout" | "flow" | "chef";

type AssistantAction =
  | {
      type: "ADD_EXERCISE";
      payload: {
        name: string;
        targetSets?: number;
        targetReps?: number;
        targetWeight?: number;
      };
    }
  | {
      type: "UPDATE_SET";
      payload: {
        exerciseName: string;
        setNumber: number;
        weight?: number;
        reps?: number;
        completed?: boolean;
      };
    }
  | {
      type: "ADD_GOAL";
      payload: {
        title: string;
        targetValue?: number;
      };
    }
  | {
      type: "SETUP_SCHEDULE";
      payload?: {
        force?: boolean;
      };
    }
  | {
      type: "MESSAGE";
      payload?: Record<string, never>;
    };

type AssistantResponse = {
  message: string;
  actions?: AssistantAction[];
};

type AssistantResult = {
  message: string;
  performedActions: string[];
};

export async function runAssistantPrompt(
  prompt: string,
  source: AssistantSource
): Promise<AssistantResult> {
  const normalizedPrompt = prompt.trim();
  if (!normalizedPrompt) {
    throw new Error("Prompt is required.");
  }

  const context = await buildAssistantContext();
  let aiResponse: unknown = null;
  try {
    aiResponse = await requestAssistantActions(normalizedPrompt, context, source);
  } catch {
    aiResponse = null;
  }
  const response = parseAssistantResponse(aiResponse, normalizedPrompt);
  const performedActions = await executeAssistantActions(response.actions ?? []);

  return {
    message: response.message,
    performedActions,
  };
}

async function buildAssistantContext(): Promise<string> {
  const db = getDB();
  const user = useUserStore.getState();
  const activeWorkout = useWorkoutStore.getState().activeWorkout;
  const userId = user.id;
  if (!userId) {
    throw new Error("User not initialized.");
  }
  const userProfile = await db.getFirstAsync<{ profile_json: string | null }>(
    "SELECT profile_json FROM users WHERE id = ?",
    [userId]
  );
  const profile = parseProfile(userProfile?.profile_json ?? null);

  // Goals feature disabled during migration
  const topGoals: Array<{title: string; current: number; target: number}> = [];

  // Recent exercises query updated for new schema (disabled for now)
  const recentExercises: Array<{name: string}> = [];

  const context = {
    userName: user.name || "Athlete",
    profile,
    activeWorkoutExerciseCount: activeWorkout?.exercises.length ?? 0,
    goals: topGoals,
    recentExercises: recentExercises.map((exercise) => exercise.name),
  };

  return JSON.stringify(context);
}

function parseProfile(raw: string | null): Record<string, unknown> {
  if (!raw) {
    return {};
  }
  try {
    const parsed = JSON.parse(raw);
    return typeof parsed === "object" && parsed !== null
      ? (parsed as Record<string, unknown>)
      : {};
  } catch {
    return {};
  }
}

async function requestAssistantActions(
  prompt: string,
  context: string,
  source: AssistantSource
): Promise<unknown> {
  return aiService.sendPrompt(
    prompt,
    `You are LifeTrack's global action assistant.
Current screen source: ${source}.
Context JSON: ${context}
Return strictly this JSON shape:
{
  "message": "short user-facing response",
  "actions": [
    {
      "type": "ADD_EXERCISE" | "UPDATE_SET" | "ADD_GOAL" | "SETUP_SCHEDULE" | "MESSAGE",
      "payload": {}
    }
  ]
}
Rules:
- If user asks to add a workout exercise (e.g. "add morning run"), include ADD_EXERCISE.
- If user asks to update a set (weight/reps/completed), include UPDATE_SET with payload exerciseName,setNumber and changed fields.
- If user asks to set up flow/schedule from scratch, include SETUP_SCHEDULE with {"force": true}.
- For ADD_EXERCISE payload include name and optionally targetSets,targetReps,targetWeight.
- Never return non-JSON text.`
  );
}

function parseAssistantResponse(
  response: unknown,
  prompt: string
): AssistantResponse {
  if (!response || typeof response !== "object") {
    return parseLocalFallback(prompt);
  }

  const parsed = response as Record<string, unknown>;
  const message =
    typeof parsed.message === "string" && parsed.message.trim()
      ? parsed.message.trim()
      : "Done.";
  const rawActions = Array.isArray(parsed.actions) ? parsed.actions : [];
  const actions: AssistantAction[] = [];

  for (const rawAction of rawActions) {
    if (!rawAction || typeof rawAction !== "object") {
      continue;
    }
    const record = rawAction as Record<string, unknown>;
    const type = record.type;
    const payload = record.payload;

    if (type === "ADD_EXERCISE" && payload && typeof payload === "object") {
      const p = payload as Record<string, unknown>;
      const name = typeof p.name === "string" ? p.name.trim() : "";
      if (name) {
        actions.push({
          type: "ADD_EXERCISE",
          payload: {
            name,
            targetSets:
              typeof p.targetSets === "number" ? p.targetSets : undefined,
            targetReps:
              typeof p.targetReps === "number" ? p.targetReps : undefined,
            targetWeight:
              typeof p.targetWeight === "number" ? p.targetWeight : undefined,
          },
        });
      }
    }

    if (type === "ADD_GOAL" && payload && typeof payload === "object") {
      const p = payload as Record<string, unknown>;
      const title = typeof p.title === "string" ? p.title.trim() : "";
      if (title) {
        actions.push({
          type: "ADD_GOAL",
          payload: {
            title,
            targetValue:
              typeof p.targetValue === "number" ? p.targetValue : undefined,
          },
        });
      }
    }

    if (type === "UPDATE_SET" && payload && typeof payload === "object") {
      const p = payload as Record<string, unknown>;
      const exerciseName =
        typeof p.exerciseName === "string" ? p.exerciseName.trim() : "";
      const setNumber =
        typeof p.setNumber === "number" ? Math.round(p.setNumber) : 0;
      if (exerciseName && setNumber > 0) {
        actions.push({
          type: "UPDATE_SET",
          payload: {
            exerciseName,
            setNumber,
            weight: typeof p.weight === "number" ? p.weight : undefined,
            reps: typeof p.reps === "number" ? p.reps : undefined,
            completed:
              typeof p.completed === "boolean" ? p.completed : undefined,
          },
        });
      }
    }

    if (type === "SETUP_SCHEDULE") {
      const p =
        payload && typeof payload === "object"
          ? (payload as Record<string, unknown>)
          : {};
      actions.push({
        type: "SETUP_SCHEDULE",
        payload: {
          force: Boolean(p.force),
        },
      });
    }
  }

  if (actions.length === 0) {
    return parseLocalFallback(prompt);
  }

  return { message, actions };
}

function parseLocalFallback(prompt: string): AssistantResponse {
  const normalized = prompt
    .toLowerCase()
    .replace(/[?.!,;:]+$/g, "")
    .replace(/\s+/g, " ")
    .trim();
  const setupMatch = normalized.match(
    /\b(set\s?up|setup|initialize|create)\b.*\b(flow|schedule|plan)\b/
  );
  if (setupMatch) {
    return {
      message: "Setting up your flow schedule with AI.",
      actions: [
        {
          type: "SETUP_SCHEDULE",
          payload: { force: true },
        },
      ],
    };
  }

  const addMatch = normalized.match(
    /(?:add|log|create)\s+(?:an?\s+)?(.+?)(?:\s+(?:to|in|on|for)\s+(?:workout|flow|chat|schedule|today|tomorrow))?$/i
  );

  if (addMatch) {
    const rawName = sanitizeExerciseName(addMatch[1] ?? "");
    if (rawName) {
      const cleanedName = capitalizeWords(rawName);
      return {
        message: `Added ${cleanedName} to your workout.`,
        actions: [
          {
            type: "ADD_EXERCISE",
            payload: {
              name: capitalizeWords(cleanedName),
              targetSets: 1,
              targetReps: 1,
            },
          },
        ],
      };
    }
  }

  return {
    message:
      "I couldn't detect a concrete action. Try: 'Add morning run' or 'Add morning run to flow'.",
    actions: [{ type: "MESSAGE" }],
  };
}

function sanitizeExerciseName(value: string): string {
  return value
    .replace(
      /\b(to|in|on|for)\s+(?:my\s+)?(workout|flow|chat|schedule)(?:\s+plan)?\b/g,
      ""
    )
    .replace(/\b(today|tomorrow)\b/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

async function executeAssistantActions(
  actions: AssistantAction[]
): Promise<string[]> {
  const performed: string[] = [];

  for (const action of actions) {
    if (action.type === "ADD_EXERCISE") {
      const workoutStore = useWorkoutStore.getState();
      await workoutStore.startWorkout();
      await workoutStore.addExercise({
        name: action.payload.name,
        targetSets: action.payload.targetSets,
        targetReps: action.payload.targetReps,
        targetWeight: action.payload.targetWeight,
      });
      performed.push(`exercise:${action.payload.name}`);
      continue;
    }

    if (action.type === "ADD_GOAL") {
      const goalStore = useGoalStore.getState();
      await goalStore.addGoal(
        action.payload.title,
        action.payload.targetValue ?? 1
      );
      performed.push(`goal:${action.payload.title}`);
    }

    if (action.type === "SETUP_SCHEDULE") {
      const workoutStore = useWorkoutStore.getState();
      await workoutStore.initializeSchedule({
        force: action.payload?.force ?? false,
      });
      performed.push("schedule:initialized");
    }

    if (action.type === "UPDATE_SET") {
      const workoutStore = useWorkoutStore.getState();
      const activeWorkout = workoutStore.activeWorkout;
      if (!activeWorkout) {
        continue;
      }

      const exercise = activeWorkout.exercises.find(
        (item) =>
          item.name.toLowerCase() === action.payload.exerciseName.toLowerCase()
      );
      if (!exercise) {
        continue;
      }

      const targetSet = exercise.sets.find(
        (setItem) => setItem.set_number === action.payload.setNumber
      );
      if (!targetSet) {
        continue;
      }

      await workoutStore.updateSet(exercise.id, targetSet.id, {
        weight:
          action.payload.weight !== undefined ? action.payload.weight : undefined,
        reps: action.payload.reps !== undefined ? action.payload.reps : undefined,
        completed:
          action.payload.completed !== undefined
            ? action.payload.completed
              ? 1
              : 0
            : undefined,
      });
      performed.push(`set:${exercise.id}:${targetSet.id}`);
    }
  }

  return performed;
}

function capitalize(value: string): string {
  if (!value) {
    return value;
  }
  return value[0].toUpperCase() + value.slice(1);
}

function capitalizeWords(value: string): string {
  return value
    .split(" ")
    .map((word) => capitalize(word))
    .join(" ");
}
