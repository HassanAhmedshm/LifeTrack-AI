import { useMemo, useState } from "react";
import {
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  Text,
  View,
} from "react-native";
import { Input } from "../../src/components/ui/Input";
import { Button } from "../../src/components/ui/Button";
import { Card } from "../../src/components/ui/Card";
import { useGoalStore } from "../../src/store/useGoalStore";

export default function GoalsScreen() {
  const goals = useGoalStore((state) => state.goals);
  const addGoal = useGoalStore((state) => state.addGoal);

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [titleInput, setTitleInput] = useState("");
  const [targetInput, setTargetInput] = useState("");
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const activeGoals = useMemo(
    () => goals.filter((goal) => goal.status === "active"),
    [goals]
  );

  const closeModal = () => {
    setIsModalVisible(false);
    setTitleInput("");
    setTargetInput("");
    setFormError("");
  };

  const handleAddGoal = async () => {
    const normalizedTitle = titleInput.trim();
    const normalizedTarget = Number(targetInput.trim());

    if (!normalizedTitle) {
      setFormError("Please enter a goal title.");
      return;
    }

    if (!Number.isFinite(normalizedTarget) || normalizedTarget <= 0) {
      setFormError("Please enter a valid target greater than 0.");
      return;
    }

    setFormError("");
    setIsSubmitting(true);
    try {
      await addGoal(normalizedTitle, normalizedTarget);
      closeModal();
    } catch (error) {
      console.error("Failed to add goal:", error);
      setFormError("Could not save goal. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-dark"
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View className="flex-1 bg-dark px-4 pt-4">
        <Text className="text-3xl font-bold text-white">Goals</Text>
        <Text className="mt-2 text-white/60">Track progress with daily consistency.</Text>

        <FlatList
          data={activeGoals}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={{ paddingTop: 16, paddingBottom: 110 }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <Card>
              <Text className="text-base text-white/80">
                No active goals yet. Tap + to add your first goal.
              </Text>
            </Card>
          }
          renderItem={({ item }) => {
            const safeTarget = item.target_value > 0 ? item.target_value : 1;
            const rawPercent = (item.current_value / safeTarget) * 100;
            const progressPercent = Math.max(0, Math.min(100, rawPercent));

            return (
              <Card className="mb-3">
                <Text className="text-lg font-semibold text-white">{item.title}</Text>
                <Text className="mt-1 text-sm text-white/70">
                  {item.current_value} / {item.target_value}
                </Text>
                <View className="mt-4 h-3 overflow-hidden rounded-full bg-gray-800">
                  <View
                    className="h-full rounded-full bg-brand"
                    style={{ width: `${progressPercent}%` }}
                  />
                </View>
              </Card>
            );
          }}
        />
      </View>

      <Pressable
        onPress={() => setIsModalVisible(true)}
        className="absolute bottom-8 right-6 h-14 w-14 items-center justify-center rounded-full bg-brand"
        accessibilityRole="button"
        accessibilityLabel="Add goal"
      >
        <Text className="text-3xl font-bold text-white">+</Text>
      </Pressable>

      <Modal
        visible={isModalVisible}
        animationType="slide"
        transparent
        onRequestClose={closeModal}
      >
        <View className="flex-1 justify-end bg-black/60 px-4 pb-6">
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : undefined}
          >
            <View className="rounded-2xl bg-card p-4">
              <Text className="text-xl font-bold text-white">Add Goal</Text>

              <Text className="mt-4 text-sm font-semibold text-white/80">Title</Text>
              <View className="mt-2">
                <Input
                  placeholder="e.g. Lose 3kg"
                  value={titleInput}
                  onChangeText={setTitleInput}
                  returnKeyType="next"
                  editable={!isSubmitting}
                />
              </View>

              <Text className="mt-4 text-sm font-semibold text-white/80">Target</Text>
              <View className="mt-2">
                <Input
                  placeholder="e.g. 3"
                  value={targetInput}
                  onChangeText={setTargetInput}
                  keyboardType="decimal-pad"
                  returnKeyType="done"
                  editable={!isSubmitting}
                />
              </View>

              {formError ? (
                <Text className="mt-3 text-sm text-red-400">{formError}</Text>
              ) : null}

              <View className="mt-5 flex-row gap-2">
                <View className="flex-1">
                  <Button
                    label="Cancel"
                    onPress={closeModal}
                    variant="secondary"
                    disabled={isSubmitting}
                  />
                </View>
                <View className="flex-1">
                  <Button
                    label="Save Goal"
                    onPress={handleAddGoal}
                    isLoading={isSubmitting}
                    disabled={isSubmitting}
                  />
                </View>
              </View>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}
