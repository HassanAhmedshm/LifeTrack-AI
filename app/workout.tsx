import { useState } from "react";
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Text,
  View,
} from "react-native";
import { Send } from "lucide-react-native";
import { Button } from "../src/components/ui/Button";
import { Card } from "../src/components/ui/Card";
import { Input } from "../src/components/ui/Input";
import { ExerciseCard } from "../src/components/ExerciseCard";
import { useWorkoutStore } from "../src/store/useWorkoutStore";
import { useUserStore } from "../src/store/useUserStore";
import * as aiService from "../src/services/ai";

const MAX_EXERCISE_SETS = 12;
const MAX_SET_REPS = 100;

export default function WorkoutScreen() {
  const activeWorkout = useWorkoutStore((state) => state.activeWorkout);
  const startWorkout = useWorkoutStore((state) => state.startWorkout);
  const addExercise = useWorkoutStore((state) => state.addExercise);
  const groqApiKey = useUserStore((state) => state.groqApiKey);

  const [isStarting, setIsStarting] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [isManualModalVisible, setIsManualModalVisible] = useState(false);
  const [manualName, setManualName] = useState("");
  const [manualSets, setManualSets] = useState("");
  const [manualReps, setManualReps] = useState("");
  const [manualError, setManualError] = useState("");
  const [isManualAdding, setIsManualAdding] = useState(false);

  const hasApiKey = Boolean(groqApiKey?.trim());
  const aiPlaceholder = hasApiKey
    ? "Ask AI to add an exercise..."
    : "Enter API Key in Settings";

  const handleStartWorkout = async () => {
    setIsStarting(true);
    try {
      await startWorkout();
    } catch (error) {
      console.error("Failed to start workout:", error);
    } finally {
      setIsStarting(false);
    }
  };

  const runAiPrompt = async (promptText: string) => {
    const trimmedPrompt = promptText.trim();
    if (!trimmedPrompt || isAiLoading || !hasApiKey) {
      return;
    }

    setIsAiLoading(true);

    try {
      const response = await aiService.sendPrompt(
        trimmedPrompt,
        "You are a workout assistant. Respond strictly in JSON: { action: 'ADD_EXERCISE' | 'MESSAGE', payload: { name: string, sets: number, reps: number }, message: string }"
      );
      const parsed = parseWorkoutAssistantResponse(response);

      if (parsed.action === "ADD_EXERCISE") {
        await startWorkout();
        await addExercise({
          name: parsed.payload.name,
          targetSets: parsed.payload.sets,
          targetReps: parsed.payload.reps,
        });
      }

      Alert.alert("Workout Assistant", parsed.message);
      setAiPrompt("");
    } catch (error) {
      console.error("Workout AI request failed:", error);
      Alert.alert(
        "AI Input Error",
        "Network error or invalid AI response. Please choose how to continue.",
        [
          {
            text: "Try Again",
            onPress: () => {
              void runAiPrompt(trimmedPrompt);
            },
          },
          {
            text: "Add Manually",
            onPress: () => setIsManualModalVisible(true),
          },
        ]
      );
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleAiSend = () => {
    void runAiPrompt(aiPrompt);
  };

  const closeManualModal = () => {
    setIsManualModalVisible(false);
    setManualName("");
    setManualSets("");
    setManualReps("");
    setManualError("");
  };

  const handleManualAdd = async () => {
    if (isManualAdding) {
      return;
    }

    const name = manualName.trim();
    const sets = Number(manualSets.trim());
    const reps = Number(manualReps.trim());

    if (!name) {
      setManualError("Exercise name is required.");
      return;
    }
    if (!Number.isFinite(sets) || sets <= 0 || sets > MAX_EXERCISE_SETS) {
      setManualError(`Sets must be between 1 and ${MAX_EXERCISE_SETS}.`);
      return;
    }
    if (!Number.isFinite(reps) || reps <= 0 || reps > MAX_SET_REPS) {
      setManualError(`Reps must be between 1 and ${MAX_SET_REPS}.`);
      return;
    }

    try {
      setIsManualAdding(true);
      await startWorkout();
      await addExercise({
        name,
        targetSets: Math.round(sets),
        targetReps: Math.round(reps),
      });
      closeManualModal();
    } catch (error) {
      console.error("Failed to add exercise manually:", error);
      setManualError("Could not add exercise. Please try again.");
    } finally {
      setIsManualAdding(false);
    }
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-dark"
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View className="flex-1 bg-dark px-4 pt-4">
        <Text className="text-3xl font-bold text-white">Workout</Text>
        <Text className="mt-2 text-white/70">
          Expand an exercise to update set-level progress.
        </Text>

        <View className="flex-1">
          {!activeWorkout ? (
          <Card className="mt-4">
            <Text className="text-base text-white/80">
              No active workout yet. Start one to begin logging sets.
            </Text>
            <View className="mt-4">
              <Button
                label="Start Workout"
                onPress={handleStartWorkout}
                isLoading={isStarting}
                disabled={isStarting}
              />
            </View>
          </Card>
          ) : activeWorkout.exercises.length === 0 ? (
          <Card className="mt-4">
            <Text className="text-base text-white/80">
              Workout started. Add exercises from your workout flow to track sets
              here.
            </Text>
          </Card>
          ) : (
          <FlatList
            className="mt-4"
            data={activeWorkout.exercises}
            keyExtractor={(item) => item.id.toString()}
            contentContainerClassName="gap-3 pb-8"
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => <ExerciseCard exercise={item} />}
          />
          )}
        </View>

        <View className="bg-card px-4 py-3">
          <View className="flex-row items-center gap-2">
            <View className="flex-1">
              <Input
                placeholder={aiPlaceholder}
                value={aiPrompt}
                onChangeText={setAiPrompt}
                editable={!isAiLoading && hasApiKey}
                returnKeyType="send"
                onSubmitEditing={handleAiSend}
              />
            </View>
            <Button
              onPress={handleAiSend}
              label="Send workout prompt"
              accessibilityLabel="Send workout prompt"
              icon={<Send size={18} color="white" />}
              size="icon"
              isLoading={isAiLoading}
              disabled={!aiPrompt.trim() || isAiLoading || !hasApiKey}
            />
          </View>
        </View>
      </View>

      <Modal
        visible={isManualModalVisible}
        animationType="slide"
        transparent
        onRequestClose={closeManualModal}
      >
        <View className="flex-1 justify-end bg-black/60 px-4 pb-6">
          <View className="rounded-2xl bg-card p-4">
            <Text className="text-xl font-bold text-white">Add Exercise Manually</Text>

            <Text className="mt-4 text-sm font-semibold text-white/80">Name</Text>
            <View className="mt-2">
              <Input
                placeholder="e.g. Bench Press"
                value={manualName}
                onChangeText={setManualName}
              />
            </View>

            <Text className="mt-4 text-sm font-semibold text-white/80">Sets</Text>
            <View className="mt-2">
              <Input
                placeholder="e.g. 3"
                value={manualSets}
                onChangeText={setManualSets}
                keyboardType="number-pad"
              />
            </View>

            <Text className="mt-4 text-sm font-semibold text-white/80">Reps</Text>
            <View className="mt-2">
              <Input
                placeholder="e.g. 10"
                value={manualReps}
                onChangeText={setManualReps}
                keyboardType="number-pad"
              />
            </View>

            {manualError ? (
              <Text className="mt-3 text-sm text-red-400">{manualError}</Text>
            ) : null}

            <View className="mt-5 flex-row gap-2">
              <View className="flex-1">
                <Button
                  label="Cancel"
                  onPress={closeManualModal}
                  variant="secondary"
                  disabled={isAiLoading || isManualAdding}
                />
              </View>
              <View className="flex-1">
                <Button
                  label="Add"
                  onPress={handleManualAdd}
                  isLoading={isManualAdding}
                  disabled={isAiLoading || isManualAdding}
                />
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

type WorkoutAssistantResponse = {
  action: "MESSAGE";
  message: string;
} | {
  action: "ADD_EXERCISE";
  payload: {
    name: string;
    sets: number;
    reps: number;
  };
  message: string;
};

function parseWorkoutAssistantResponse(response: unknown): WorkoutAssistantResponse {
  if (!response || typeof response !== "object") {
    throw new Error("Invalid AI response shape.");
  }

  const parsed = response as Record<string, unknown>;
  const action = parsed.action;
  const payload = parsed.payload;
  const message = parsed.message;

  if (action !== "ADD_EXERCISE" && action !== "MESSAGE") {
    throw new Error("Invalid AI action.");
  }
  if (typeof message !== "string" || !message.trim()) {
    throw new Error("Missing AI message.");
  }

  if (action === "MESSAGE") {
    return {
      action,
      message: message.trim(),
    };
  }

  if (!payload || typeof payload !== "object") {
    throw new Error("Missing AI payload.");
  }

  const payloadRecord = payload as Record<string, unknown>;
  const name = payloadRecord.name;
  const sets = payloadRecord.sets;
  const reps = payloadRecord.reps;

  if (typeof name !== "string" || !name.trim()) {
    throw new Error("Invalid AI payload name.");
  }
  if (
    typeof sets !== "number" ||
    !Number.isFinite(sets) ||
    sets <= 0 ||
    sets > MAX_EXERCISE_SETS
  ) {
    throw new Error("Invalid AI payload sets.");
  }
  if (
    typeof reps !== "number" ||
    !Number.isFinite(reps) ||
    reps <= 0 ||
    reps > MAX_SET_REPS
  ) {
    throw new Error("Invalid AI payload reps.");
  }

  return {
    action,
    message: message.trim(),
    payload: {
      name: name.trim(),
      sets: Math.round(sets),
      reps: Math.round(reps),
    },
  };
}
