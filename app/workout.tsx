import { useEffect, useState } from "react";
import {
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Text,
  View,
} from "react-native";
import { Inbox, Send } from "lucide-react-native";
import { Button } from "../src/components/ui/Button";
import { Input } from "../src/components/ui/Input";
import { ExerciseCard } from "../src/components/ExerciseCard";
import { WorkoutSlideshowHeader } from "../src/components/workout/WorkoutSlideshowHeader";
import { useWorkoutStore } from "../src/store/useWorkoutStore";
import { useUserStore } from "../src/store/useUserStore";
import { runAssistantPrompt } from "../src/services/assistant";

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
  const [aiStatusMessage, setAiStatusMessage] = useState("");
  const [aiStatusError, setAiStatusError] = useState(false);
  const [expandedExerciseId, setExpandedExerciseId] = useState<number | null>(null);
  const [pulseSetIds, setPulseSetIds] = useState<number[]>([]);
  const [pulseToken, setPulseToken] = useState(0);

  const hasApiKey = Boolean(groqApiKey?.trim());
  const aiPlaceholder = hasApiKey
    ? "Ask AI to add an exercise..."
    : "Enter API Key in Settings";

  useEffect(() => {
    if (!activeWorkout || activeWorkout.exercises.length === 0) {
      setExpandedExerciseId(null);
      return;
    }
    if (
      expandedExerciseId !== null &&
      !activeWorkout.exercises.some((exercise) => exercise.id === expandedExerciseId)
    ) {
      setExpandedExerciseId(null);
    }
  }, [activeWorkout, expandedExerciseId]);

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

    setAiStatusMessage("");
    setAiStatusError(false);
    setIsAiLoading(true);

    try {
      const result = await runAssistantPrompt(trimmedPrompt, "workout");
      setAiPrompt("");
      setAiStatusMessage(result.message);
      const updatedSetIds = result.performedActions
        .map((action) => {
          const match = action.match(/^set:\d+:(\d+)$/);
          if (!match) {
            return null;
          }
          return Number(match[1]);
        })
        .filter((value): value is number => Number.isFinite(value));
      if (updatedSetIds.length > 0) {
        setPulseSetIds(updatedSetIds);
        setPulseToken((current) => current + 1);
      }
    } catch (error) {
      console.error("Workout AI request failed:", error);
      setAiStatusError(true);
      setAiStatusMessage(
        "Could not apply that command. Try: 'Add morning run to workout'."
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

  const focusedExerciseName =
    activeWorkout?.exercises.find((exercise) => exercise.id === expandedExerciseId)
      ?.name ??
    activeWorkout?.exercises[0]?.name ??
    "Select an exercise";

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-dark"
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View className="flex-1 bg-dark px-4 pt-4">
        <WorkoutSlideshowHeader
          title="Workout"
          subtitle="Log quickly with sleek set paging and AI smart updates."
          focusText={focusedExerciseName}
        />

        <View className="flex-1">
          {!activeWorkout ? (
            <View className="mt-6 items-center justify-center gap-3 rounded-2xl bg-card p-6">
              <Inbox size={28} color="#9CA3AF" />
              <Text className="text-center text-base text-gray-200">
                No data yet. Ask the AI to add one!
              </Text>
              <View className="mt-1 w-full gap-2">
                <Button
                  label="Start Workout"
                  onPress={handleStartWorkout}
                  isLoading={isStarting}
                  disabled={isStarting}
                />
                <Button
                  label="Add Manually"
                  onPress={() => setIsManualModalVisible(true)}
                  variant="secondary"
                />
              </View>
            </View>
          ) : activeWorkout.exercises.length === 0 ? (
            <View className="mt-6 items-center justify-center gap-3 rounded-2xl bg-card p-6">
              <Inbox size={28} color="#9CA3AF" />
              <Text className="text-center text-base text-gray-200">
                No data yet. Ask the AI to add one!
              </Text>
              <View className="mt-1 w-full">
                <Button
                  label="Add Manually"
                  onPress={() => setIsManualModalVisible(true)}
                  variant="secondary"
                />
              </View>
            </View>
          ) : (
            <FlatList
              className="mt-4"
              data={activeWorkout.exercises}
              keyExtractor={(item) => item.id.toString()}
              contentContainerClassName="gap-3 pb-8"
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => (
                <ExerciseCard
                  exercise={item}
                  isExpanded={expandedExerciseId === item.id}
                  isDimmed={
                    expandedExerciseId !== null && expandedExerciseId !== item.id
                  }
                  onToggleExpand={() =>
                    setExpandedExerciseId((current) =>
                      current === item.id ? null : item.id
                    )
                  }
                  highlightSetIds={pulseSetIds}
                  highlightToken={pulseToken}
                />
              )}
            />
          )}
        </View>

        <View className="bg-card px-4 py-3">
          {aiStatusMessage ? (
            <Text
              className={`mb-2 text-sm ${
                aiStatusError ? "text-red-400" : "text-white/75"
              }`}
            >
              {aiStatusMessage}
            </Text>
          ) : null}
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
