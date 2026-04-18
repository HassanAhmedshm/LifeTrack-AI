import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  View,
} from "react-native";
import { router } from "expo-router";
import { Input } from "../src/components/ui/Input";
import { Button } from "../src/components/ui/Button";
import { useUserStore } from "../src/store/useUserStore";

const PRESET_GOALS = ["Build Muscle", "Lose Weight", "Stay Healthy"] as const;

export default function OnboardingScreen() {
  const [name, setName] = useState("");
  const [selectedGoal, setSelectedGoal] = useState<string>("");
  const [customGoal, setCustomGoal] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleComplete = async () => {
    const normalizedName = name.trim();
    const normalizedCustomGoal = customGoal.trim();
    const normalizedGoal = normalizedCustomGoal || selectedGoal.trim();

    if (!normalizedName || !normalizedGoal) {
      setErrorMessage("Please enter your name and primary goal.");
      return;
    }

    setErrorMessage("");
    setIsSubmitting(true);

    try {
      await useUserStore.getState().completeOnboarding({
        name: normalizedName,
        primaryGoal: normalizedGoal,
      });
      router.replace("/(tabs)");
    } catch (error) {
      console.error("Failed to complete onboarding:", error);
      setErrorMessage("Could not save your onboarding details. Try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-dark"
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View className="flex-1 justify-center px-6">
        <View className="rounded-2xl bg-card p-6">
          <Text className="text-3xl font-bold text-white">Welcome to Life Track AI</Text>
          <Text className="mt-3 text-base text-white/80">
            Tell us a little about you to personalize your dashboard.
          </Text>

          <Text className="mt-6 text-sm font-semibold text-white/80">Name</Text>
          <View className="mt-2">
            <Input
              placeholder="Enter your name"
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
              returnKeyType="done"
            />
          </View>

          <Text className="mt-6 text-sm font-semibold text-white/80">
            Primary Goal
          </Text>
          <View className="mt-3 flex-row flex-wrap gap-2">
            {PRESET_GOALS.map((goal) => {
              const isActive = goal === selectedGoal && !customGoal.trim();
              return (
                <Pressable
                  key={goal}
                  onPress={() => {
                    setSelectedGoal(goal);
                    setCustomGoal("");
                  }}
                  className={`rounded-full px-4 py-2 ${
                    isActive ? "bg-brand" : "bg-dark border border-white/15"
                  }`}
                >
                  <Text className="font-medium text-white">{goal}</Text>
                </Pressable>
              );
            })}
          </View>

          <Text className="mt-4 text-xs text-white/60">
            Or type a custom goal
          </Text>
          <View className="mt-2">
            <Input
              placeholder="e.g. Improve endurance"
              value={customGoal}
              onChangeText={setCustomGoal}
              autoCapitalize="sentences"
              returnKeyType="done"
            />
          </View>

          {errorMessage ? (
            <Text className="mt-4 text-sm text-red-400">{errorMessage}</Text>
          ) : null}

          <View className="mt-6">
            <Button
              label="Let's Go!"
              onPress={handleComplete}
              isLoading={isSubmitting}
              disabled={isSubmitting}
            />
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
