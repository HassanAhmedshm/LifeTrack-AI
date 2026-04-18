import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
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
  const [age, setAge] = useState("");
  const [allergies, setAllergies] = useState("");
  const [dietaryPreference, setDietaryPreference] = useState("");
  const [activityLevel, setActivityLevel] = useState("");
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
    const normalizedAge = age.trim() ? Number(age.trim()) : null;
    if (
      normalizedAge !== null &&
      (!Number.isFinite(normalizedAge) || normalizedAge <= 0 || normalizedAge > 120)
    ) {
      setErrorMessage("Age must be between 1 and 120.");
      return;
    }

    setErrorMessage("");
    setIsSubmitting(true);

    try {
      await useUserStore.getState().completeOnboarding({
        name: normalizedName,
        primaryGoal: normalizedGoal,
        age: normalizedAge,
        allergies,
        dietaryPreference,
        activityLevel,
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
      <ScrollView
        className="flex-1"
        contentContainerClassName="px-6 py-8"
        showsVerticalScrollIndicator={false}
      >
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

          <Text className="mt-4 text-xs text-white/60">Age</Text>
          <View className="mt-2">
            <Input
              placeholder="e.g. 28"
              value={age}
              onChangeText={setAge}
              keyboardType="number-pad"
              returnKeyType="done"
            />
          </View>

          <Text className="mt-4 text-xs text-white/60">Allergies / restrictions</Text>
          <View className="mt-2">
            <Input
              placeholder="e.g. peanuts, lactose"
              value={allergies}
              onChangeText={setAllergies}
              autoCapitalize="none"
              returnKeyType="done"
            />
          </View>

          <Text className="mt-4 text-xs text-white/60">Dietary preference</Text>
          <View className="mt-2">
            <Input
              placeholder="e.g. high-protein, halal, vegetarian"
              value={dietaryPreference}
              onChangeText={setDietaryPreference}
              autoCapitalize="sentences"
              returnKeyType="done"
            />
          </View>

          <Text className="mt-4 text-xs text-white/60">Activity level</Text>
          <View className="mt-2">
            <Input
              placeholder="e.g. beginner, intermediate, advanced"
              value={activityLevel}
              onChangeText={setActivityLevel}
              autoCapitalize="none"
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
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
