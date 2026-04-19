import "../global.css";
import { Stack, useRouter, useSegments } from "expo-router";
import { View, Text } from "react-native";
import { useEffect, useState } from "react";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { initDB } from "../src/db/index";
import { useUserStore } from "../src/store/useUserStore";
import { useGoalStore } from "../src/store/useGoalStore";
import { useWorkoutStore } from "../src/store/useWorkoutStore";

export default function RootLayout() {
  const router = useRouter();
  const segments = useSegments();
  const [dbReady, setDbReady] = useState(false);
  const [dbError, setDbError] = useState<string | null>(null);
  const isHydrated = useUserStore((state) => state.isHydrated);
  const onboardingCompleted = useUserStore(
    (state) => state.onboardingCompleted
  );
  const goalsHydrated = useGoalStore((state) => state.isHydrated);
  const workoutsHydrated = useWorkoutStore((state) => state.isHydrated);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Step 1: Initialize database
        await initDB();
        setDbReady(true);

        // Step 2: Hydrate user store from database
        await useUserStore.getState().hydrate();

        // Step 3: Hydrate goals store from database
        await useGoalStore.getState().hydrate();

        // Step 4: Hydrate workout store from database
        await useWorkoutStore.getState().hydrate();
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        console.error("Failed to initialize app:", errorMessage);
        setDbError(errorMessage);
      }
    };

    initializeApp();
  }, []);

  if (dbError) {
    return (
      <SafeAreaProvider>
        <SafeAreaView className="flex-1 bg-dark" edges={["top"]}>
          <View className="flex-1 items-center justify-center bg-dark px-6">
            <Text className="text-xl font-bold text-red-500">Error</Text>
            <Text className="mt-4 text-center text-white">
              Failed to initialize app.
            </Text>
            <Text className="mt-2 text-center text-sm text-white/60">{dbError}</Text>
          </View>
        </SafeAreaView>
      </SafeAreaProvider>
    );
  }

  const isReady = dbReady && isHydrated && goalsHydrated && workoutsHydrated;

  useEffect(() => {
    if (!isReady) {
      return;
    }

    const firstSegment = segments[0];
    const inOnboarding = firstSegment === "onboarding";
    const inTabs = firstSegment === "(tabs)";
    const inAllowedStandalone =
      firstSegment === "workout" ||
      firstSegment === "chef" ||
      firstSegment === "settings";

    if (!onboardingCompleted && !inOnboarding) {
      router.replace("/onboarding");
      return;
    }

    if (onboardingCompleted && !inTabs && !inAllowedStandalone) {
      router.replace("/(tabs)");
    }
  }, [isReady, onboardingCompleted, segments, router]);

  return (
    <SafeAreaProvider>
      {!isReady ? (
        <SafeAreaView className="flex-1 bg-dark" edges={["top"]}>
          <View className="flex-1 items-center justify-center">
            <Text className="text-white text-lg">Initializing...</Text>
          </View>
        </SafeAreaView>
      ) : (
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen
            name="workout"
            options={{
              headerShown: true,
              title: "Workout",
              headerBackTitle: "Back",
            }}
          />
          <Stack.Screen
            name="chef"
            options={{
              headerShown: true,
              title: "Chef",
              headerBackTitle: "Back",
            }}
          />
          <Stack.Screen name="onboarding" options={{ headerShown: false }} />
          <Stack.Screen name="settings" options={{ headerShown: true, title: "Settings" }} />
        </Stack>
      )}
    </SafeAreaProvider>
  );
}
