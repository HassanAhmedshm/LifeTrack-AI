import { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { ChevronDown, ChevronUp } from "lucide-react-native";
import { Input } from "./ui/Input";
import { Card } from "./ui/Card";
import { useWorkoutStore } from "../store/useWorkoutStore";

type ExerciseCardSet = {
  id: number;
  set_number: number;
  weight: number | null;
  reps: number | null;
  completed: number;
};

type ExerciseCardExercise = {
  id: number;
  name: string;
  target_sets: number;
  target_reps: number;
  sets: ExerciseCardSet[];
};

type ExerciseCardProps = {
  exercise: ExerciseCardExercise;
};

export function ExerciseCard({ exercise }: ExerciseCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [weightDrafts, setWeightDrafts] = useState<Record<number, string>>({});
  const [repsDrafts, setRepsDrafts] = useState<Record<number, string>>({});

  useEffect(() => {
    setWeightDrafts((previousDrafts) => {
      const nextDrafts = { ...previousDrafts };
      for (const setItem of exercise.sets) {
        if (nextDrafts[setItem.id] === undefined) {
          nextDrafts[setItem.id] =
            setItem.weight === null ? "" : String(setItem.weight);
        }
      }
      return nextDrafts;
    });
    setRepsDrafts((previousDrafts) => {
      const nextDrafts = { ...previousDrafts };
      for (const setItem of exercise.sets) {
        if (nextDrafts[setItem.id] === undefined) {
          nextDrafts[setItem.id] = setItem.reps === null ? "" : String(setItem.reps);
        }
      }
      return nextDrafts;
    });
  }, [exercise.sets]);

  const completedCount = useMemo(
    () => exercise.sets.filter((setItem) => setItem.completed === 1).length,
    [exercise.sets]
  );

  const handleWeightChange = (setId: number, text: string) => {
    setWeightDrafts((prev) => ({ ...prev, [setId]: text }));
    const normalizedText = text.trim();
    if (normalizedText.endsWith(".") || normalizedText.endsWith(",")) {
      return;
    }

    const parsed = parseNullableNumber(text);
    if (parsed.isValid) {
      void useWorkoutStore
        .getState()
        .updateSet(exercise.id, setId, { weight: parsed.value });
    }
  };

  const handleRepsChange = (setId: number, text: string) => {
    setRepsDrafts((prev) => ({ ...prev, [setId]: text }));
    const parsed = parseNullableWholeNumber(text);
    if (parsed.isValid) {
      void useWorkoutStore
        .getState()
        .updateSet(exercise.id, setId, { reps: parsed.value });
    }
  };

  const handleCompletedToggle = (setId: number, currentCompleted: number) => {
    void useWorkoutStore
      .getState()
      .updateSet(exercise.id, setId, { completed: currentCompleted ? 0 : 1 });
  };

  return (
    <Card>
      <Pressable
        className="flex-row items-center justify-between"
        onPress={() => setIsExpanded((prev) => !prev)}
      >
        <View className="flex-1">
          <Text className="text-base font-semibold text-white">{exercise.name}</Text>
          <Text className="mt-1 text-xs text-white/70">
            Target: {exercise.target_sets} sets x {exercise.target_reps} reps
          </Text>
          <Text className="mt-1 text-xs text-white/60">
            Completed: {completedCount}/{exercise.sets.length}
          </Text>
        </View>
        {isExpanded ? (
          <ChevronUp size={18} color="#FFFFFF" />
        ) : (
          <ChevronDown size={18} color="#FFFFFF" />
        )}
      </Pressable>

      {isExpanded ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="mt-4"
          contentContainerClassName="gap-3 pr-2"
        >
          {exercise.sets.map((setItem) => (
            <View
              key={setItem.id}
              className="w-52 rounded-2xl border border-white/10 bg-dark p-3"
            >
              <Text className="text-sm font-semibold text-white">
                Set {setItem.set_number}
              </Text>

              <Text className="mt-3 text-xs text-white/70">Weight</Text>
              <View className="mt-1">
                <Input
                  placeholder="kg"
                  value={weightDrafts[setItem.id] ?? ""}
                  onChangeText={(text) => handleWeightChange(setItem.id, text)}
                  keyboardType="decimal-pad"
                />
              </View>

              <Text className="mt-3 text-xs text-white/70">Reps</Text>
              <View className="mt-1">
                <Input
                  placeholder="reps"
                  value={repsDrafts[setItem.id] ?? ""}
                  onChangeText={(text) => handleRepsChange(setItem.id, text)}
                  keyboardType="number-pad"
                />
              </View>

              <Pressable
                className={`mt-3 rounded-full border px-3 py-2 ${
                  setItem.completed
                    ? "border-brand bg-brand/30"
                    : "border-white/20 bg-card"
                }`}
                onPress={() => handleCompletedToggle(setItem.id, setItem.completed)}
              >
                <Text className="text-center text-xs font-semibold text-white">
                  {setItem.completed ? "Completed" : "Mark Complete"}
                </Text>
              </Pressable>
            </View>
          ))}
        </ScrollView>
      ) : null}
    </Card>
  );
}

function parseNullableNumber(input: string): { isValid: boolean; value: number | null } {
  const trimmed = input.trim();
  if (!trimmed) {
    return { isValid: true, value: null };
  }

  const normalized = normalizeDecimalSeparator(trimmed);
  const value = Number(normalized);
  if (!Number.isFinite(value) || value < 0) {
    return { isValid: false, value: null };
  }

  return { isValid: true, value };
}

function parseNullableWholeNumber(
  input: string
): { isValid: boolean; value: number | null } {
  const parsed = parseNullableNumber(input);
  if (!parsed.isValid || parsed.value === null) {
    return parsed;
  }

  if (!Number.isInteger(parsed.value)) {
    return { isValid: false, value: null };
  }

  return { isValid: true, value: parsed.value };
}

function normalizeDecimalSeparator(value: string): string {
  if (value.includes(".") || !value.includes(",")) {
    return value;
  }
  return value.replace(",", ".");
}
