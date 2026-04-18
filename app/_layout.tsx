import "../global.css";
import { Slot, useRouter } from "expo-router";
import { View, Text } from "react-native";
import { useEffect, useState } from "react";
import { initDB } from "../src/db/index";
import { useUserStore } from "../src/store/useUserStore";

export default function RootLayout() {
  const router = useRouter();
  const [dbReady, setDbReady] = useState(false);
  const [dbError, setDbError] = useState<string | null>(null);
  const isHydrated = useUserStore((state) => state.isHydrated);
  const onboardingCompleted = useUserStore(
    (state) => state.onboardingCompleted
  );

  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Step 1: Initialize database
        await initDB();
        setDbReady(true);

        // Step 2: Hydrate user store from database
        await useUserStore.getState().hydrate();
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        console.error("Failed to initialize app:", errorMessage);
        setDbError(errorMessage);
      }
    };

    initializeApp();
  }, []);

  useEffect(() => {
    if (isHydrated) {
      if (!onboardingCompleted) {
        // Route to onboarding if not completed
        router.replace("/onboarding");
      } else {
        // Route to tabs if onboarding is completed
        router.replace("/(tabs)");
      }
    }
  }, [isHydrated, onboardingCompleted, router]);

  if (dbError) {
    return (
      <View className="flex-1 items-center justify-center bg-dark px-6">
        <Text className="text-xl font-bold text-red-500">Error</Text>
        <Text className="mt-4 text-center text-white">
          Failed to initialize app.
        </Text>
        <Text className="mt-2 text-center text-sm text-white/60">{dbError}</Text>
      </View>
    );
  }

  const isReady = dbReady && isHydrated;

  return (
    <View className="flex-1 bg-dark">
      {!isReady ? (
        <View className="flex-1 items-center justify-center">
          <Text className="text-white text-lg">Initializing...</Text>
        </View>
      ) : (
        <Slot />
      )}
    </View>
  );
}
