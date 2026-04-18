import { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  LayoutChangeEvent,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp } from "lucide-react-native";
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
  isExpanded: boolean;
  isDimmed: boolean;
  onToggleExpand: () => void;
  highlightSetIds: number[];
  highlightToken: number;
};

export function ExerciseCard({
  exercise,
  isExpanded,
  isDimmed,
  onToggleExpand,
  highlightSetIds,
  highlightToken,
}: ExerciseCardProps) {
  const [weightDrafts, setWeightDrafts] = useState<Record<number, string>>({});
  const [repsDrafts, setRepsDrafts] = useState<Record<number, string>>({});
  const [setPageIndex, setSetPageIndex] = useState(0);
  const [carouselWidth, setCarouselWidth] = useState(0);
  const carouselRef = useRef<ScrollView>(null);
  const pulseValuesRef = useRef<Record<number, Animated.Value>>({});

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

  useEffect(() => {
    if (!isExpanded) {
      setSetPageIndex(0);
    }
  }, [isExpanded]);

  useEffect(() => {
    const maxIndex = Math.max(0, exercise.sets.length - 1);
    setSetPageIndex((currentIndex) => Math.min(currentIndex, maxIndex));
  }, [exercise.sets.length]);

  useEffect(() => {
    if (!isExpanded || highlightSetIds.length === 0) {
      return;
    }
    for (const setId of highlightSetIds) {
      const pulse = getPulseValue(pulseValuesRef.current, setId);
      pulse.setValue(0);
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 260,
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 520,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [highlightSetIds, highlightToken, isExpanded]);

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

  const goToSet = (index: number) => {
    const clampedIndex = Math.max(0, Math.min(index, exercise.sets.length - 1));
    setSetPageIndex(clampedIndex);
    if (carouselWidth > 0) {
      carouselRef.current?.scrollTo({
        x: clampedIndex * carouselWidth,
        animated: true,
      });
    }
  };

  const onCarouselLayout = (event: LayoutChangeEvent) => {
    const width = event.nativeEvent.layout.width;
    setCarouselWidth(width);
  };

  return (
    <View style={{ opacity: isDimmed ? 0.35 : 1 }}>
      <Card
        className={`border ${
          isExpanded ? "border-brand bg-card/95" : "border-white/10 bg-card"
        }`}
      >
        <Pressable
          className="flex-row items-center justify-between"
          onPress={onToggleExpand}
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
            <ChevronUp size={18} color="#FF7A00" />
          ) : (
            <ChevronDown size={18} color="#FFFFFF" />
          )}
        </Pressable>

        {isExpanded ? (
          <View className="mt-4 rounded-2xl border border-white/10 bg-dark/70 p-3">
            <View className="mb-3 flex-row items-center justify-between">
              <Pressable
                className="flex-row items-center gap-1 rounded-full border border-white/15 bg-card px-3 py-2"
                onPress={() => goToSet(setPageIndex - 1)}
                disabled={setPageIndex === 0}
              >
                <ChevronLeft size={14} color="#FFFFFF" />
                <Text className="text-xs font-semibold text-white">Prev</Text>
              </Pressable>
              <Text className="text-xs font-semibold uppercase tracking-[2px] text-brand">
                Set {setPageIndex + 1}/{exercise.sets.length}
              </Text>
              <Pressable
                className="flex-row items-center gap-1 rounded-full border border-white/15 bg-card px-3 py-2"
                onPress={() => goToSet(setPageIndex + 1)}
                disabled={setPageIndex >= exercise.sets.length - 1}
              >
                <Text className="text-xs font-semibold text-white">Next</Text>
                <ChevronRight size={14} color="#FFFFFF" />
              </Pressable>
            </View>

            <View onLayout={onCarouselLayout}>
              <ScrollView
                ref={carouselRef}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onMomentumScrollEnd={(event) => {
                  if (carouselWidth <= 0) {
                    return;
                  }
                  const page = Math.round(event.nativeEvent.contentOffset.x / carouselWidth);
                  setSetPageIndex(page);
                }}
              >
                {exercise.sets.map((setItem) => {
                  const pulseValue = getPulseValue(pulseValuesRef.current, setItem.id);
                  const glowStyle = {
                    opacity: pulseValue,
                    transform: [
                      {
                        scale: pulseValue.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0.97, 1.03],
                        }),
                      },
                    ],
                  };

                  return (
                    <View
                      key={setItem.id}
                      style={{ width: Math.max(carouselWidth, 1) }}
                      className="px-1"
                    >
                      <View className="relative overflow-visible rounded-2xl border border-white/10 bg-card p-3">
                        <Animated.View
                          pointerEvents="none"
                          style={[
                            {
                              position: "absolute",
                              top: -3,
                              right: -3,
                              bottom: -3,
                              left: -3,
                              borderRadius: 16,
                              borderWidth: 1.5,
                              borderColor: "#FF7A00",
                              shadowColor: "#FF7A00",
                              shadowOffset: { width: 0, height: 0 },
                              shadowOpacity: 0.95,
                              shadowRadius: 12,
                              elevation: 8,
                            },
                            glowStyle,
                          ]}
                        />

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
                    </View>
                  );
                })}
              </ScrollView>
            </View>
          </View>
        ) : null}
      </Card>
    </View>
  );
}

function getPulseValue(
  pulses: Record<number, Animated.Value>,
  setId: number
): Animated.Value {
  if (!pulses[setId]) {
    pulses[setId] = new Animated.Value(0);
  }
  return pulses[setId];
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
