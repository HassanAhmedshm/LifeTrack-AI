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
const AI_TONES = ["Formal", "Casual", "Hardcore"] as const;

export default function OnboardingScreen() {
  const [name, setName] = useState("");
  const [primaryGoal, setPrimaryGoal] = useState<string>("");
  const [height, setHeight] = useState("");
  const [currentWeight, setCurrentWeight] = useState("");
  const [allergies, setAllergies] = useState("");
  const [aiTone, setAiTone] = useState<string>("");
  const [step, setStep] = useState(1);
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const goToNextStep = () => {
    if (step === 1) {
      if (!name.trim() || !primaryGoal.trim()) {
        setErrorMessage("Please enter your name and select a primary goal.");
        return;
      }
    }

    if (step === 2) {
      const parsedHeight = parsePositiveNumber(height);
      const parsedWeight = parsePositiveNumber(currentWeight);
      if (parsedHeight === null || parsedWeight === null) {
        setErrorMessage("Please enter valid height and current weight.");
        return;
      }
    }

    setErrorMessage("");
    setStep((current) => Math.min(current + 1, 3));
  };

  const goToPreviousStep = () => {
    setErrorMessage("");
    setStep((current) => Math.max(current - 1, 1));
  };

  const handleComplete = async () => {
    const normalizedName = name.trim();
    const normalizedGoal = primaryGoal.trim();
    const normalizedAiTone = aiTone.trim();
    const parsedHeight = parsePositiveNumber(height);
    const parsedWeight = parsePositiveNumber(currentWeight);

    if (!normalizedName || !normalizedGoal || !normalizedAiTone) {
      setErrorMessage("Please complete all required fields before submitting.");
      return;
    }

    if (parsedHeight === null || parsedWeight === null) {
      setErrorMessage("Please provide valid height and current weight.");
      return;
    }

    setErrorMessage("");
    setIsSubmitting(true);

    try {
      const profile = {
        name: normalizedName,
        height: parsedHeight,
        currentWeight: parsedWeight,
        primaryGoal: normalizedGoal,
        allergies: allergies.trim(),
        aiTone: normalizedAiTone,
      };

      await useUserStore.getState().updateProfile(profile);
      await useUserStore.getState().completeOnboarding();
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
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        className="flex-1"
        contentContainerClassName="px-6 py-8"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View className="rounded-2xl bg-card p-6">
          <Text className="text-3xl font-bold text-white">Welcome to Life Track AI</Text>
          <Text className="mt-3 text-base text-white/80">
            Tell us a little about you to personalize your dashboard.
          </Text>
          <Text className="mt-4 text-sm text-white/60">Step {step} of 3</Text>

          {step === 1 ? (
            <View className="mt-4">
              <Text className="text-sm font-semibold text-white/80">Name</Text>
              <View className="mt-2">
                <Input
                  placeholder="Enter your name"
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                  returnKeyType="next"
                />
              </View>

              <Text className="mt-6 text-sm font-semibold text-white/80">Primary Goal</Text>
              <View className="mt-3 flex-row flex-wrap gap-2">
                {PRESET_GOALS.map((goal) => {
                  const isActive = goal === primaryGoal;
                  return (
                    <Pressable
                      key={goal}
                      onPress={() => setPrimaryGoal(goal)}
                      className={`rounded-full px-4 py-2 ${
                        isActive ? "bg-brand" : "border border-white/15 bg-dark"
                      }`}
                    >
                      <Text className="font-medium text-white">{goal}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          ) : null}

          {step === 2 ? (
            <View className="mt-4">
              <Text className="text-sm font-semibold text-white/80">Height (cm)</Text>
              <View className="mt-2">
                <Input
                  placeholder="e.g. 175"
                  value={height}
                  onChangeText={setHeight}
                  keyboardType="numeric"
                  returnKeyType="next"
                />
              </View>

              <Text className="mt-6 text-sm font-semibold text-white/80">
                Current Weight (kg)
              </Text>
              <View className="mt-2">
                <Input
                  placeholder="e.g. 72"
                  value={currentWeight}
                  onChangeText={setCurrentWeight}
                  keyboardType="numeric"
                  returnKeyType="done"
                />
              </View>
            </View>
          ) : null}

          {step === 3 ? (
            <View className="mt-4">
              <Text className="text-sm font-semibold text-white/80">
                Food Allergies / Restrictions
              </Text>
              <View className="mt-2">
                <Input
                  placeholder="e.g. peanuts, lactose"
                  value={allergies}
                  onChangeText={setAllergies}
                  autoCapitalize="none"
                  returnKeyType="next"
                />
              </View>

              <Text className="mt-6 text-sm font-semibold text-white/80">
                Preferred AI Tone
              </Text>
              <View className="mt-3 flex-row flex-wrap gap-2">
                {AI_TONES.map((tone) => {
                  const isActive = tone === aiTone;
                  return (
                    <Pressable
                      key={tone}
                      onPress={() => setAiTone(tone)}
                      className={`rounded-full px-4 py-2 ${
                        isActive ? "bg-brand" : "border border-white/15 bg-dark"
                      }`}
                    >
                      <Text className="font-medium text-white">{tone}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          ) : null}

          {errorMessage ? (
            <Text className="mt-4 text-sm text-red-400">{errorMessage}</Text>
          ) : null}

          <View className="mt-8 flex-row items-center justify-between gap-3">
            <View className="flex-1">
              {step > 1 ? (
                <Button
                  label="Back"
                  variant="secondary"
                  onPress={goToPreviousStep}
                  disabled={isSubmitting}
                />
              ) : (
                <View />
              )}
            </View>
            <View className="flex-1">
              {step < 3 ? (
                <Button label="Next" onPress={goToNextStep} disabled={isSubmitting} />
              ) : (
                <Button
                  label="Finish"
                  onPress={handleComplete}
                  isLoading={isSubmitting}
                  disabled={isSubmitting}
                />
              )}
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function parsePositiveNumber(value: string): number | null {
  const normalized = Number(value.trim());
  if (!Number.isFinite(normalized) || normalized <= 0) {
    return null;
  }
  return normalized;
}
