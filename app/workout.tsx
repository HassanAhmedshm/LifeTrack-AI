import { useState } from "react";
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Text,
  View,
} from "react-native";
import { Button } from "../src/components/ui/Button";
import { Card } from "../src/components/ui/Card";
import { ExerciseCard } from "../src/components/ExerciseCard";
import { useWorkoutStore } from "../src/store/useWorkoutStore";

export default function WorkoutScreen() {
  const activeWorkout = useWorkoutStore((state) => state.activeWorkout);
  const startWorkout = useWorkoutStore((state) => state.startWorkout);
  const [isStarting, setIsStarting] = useState(false);

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
    </KeyboardAvoidingView>
  );
}
