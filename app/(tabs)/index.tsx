import { Pressable, ScrollView, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { Card } from "../../src/components/ui/Card";
import { useUserStore } from "../../src/store/useUserStore";
import { useGoalStore } from "../../src/store/useGoalStore";

export default function HomeScreen() {
  const router = useRouter();
  const userName = useUserStore((state) => state.name);
  const goals = useGoalStore((state) => state.goals);

  const topGoals = goals.slice(0, 3);
  const greetingName = userName || "Athlete";

  return (
    <ScrollView
      className="flex-1 bg-dark"
      contentContainerClassName="gap-4 p-4 pb-8"
      showsVerticalScrollIndicator={false}
    >
      <View>
        <Text className="text-sm font-semibold uppercase tracking-widest text-white/60">
          Welcome Back
        </Text>
        <Text className="mt-1 text-3xl font-bold text-white">{greetingName}</Text>
      </View>

      <Card>
        <Text className="text-lg font-semibold text-white">Today&apos;s Focus</Text>
        <View className="mt-4 gap-3">
          {topGoals.length > 0 ? (
            topGoals.map((goal) => {
              const safeTarget = goal.target_value > 0 ? goal.target_value : 1;
              const rawPercent = (goal.current_value / safeTarget) * 100;
              const progressPercent = Math.max(0, Math.min(100, rawPercent));

              return (
                <View key={goal.id} className="gap-1.5">
                  <View className="flex-row items-center justify-between">
                    <Text className="flex-1 text-sm font-medium text-white">
                      {goal.title}
                    </Text>
                    <Text className="text-xs text-white/70">
                      {goal.current_value} / {goal.target_value}
                    </Text>
                  </View>
                  <View className="h-2 overflow-hidden rounded-full bg-gray-800">
                    <View
                      className="h-full rounded-full bg-brand"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </View>
                </View>
              );
            })
          ) : (
            <Text className="text-sm text-white/70">
              Add goals to define your focus for today.
            </Text>
          )}
        </View>
      </Card>

      <View className="gap-3">
        <Text className="text-lg font-semibold text-white">Quick Start</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerClassName="gap-2 pr-2"
        >
          {[
            { label: "Log Workout", onPress: () => router.push("/workout") },
            { label: "Chef AI" },
            { label: "Flow Scheduler" },
          ].map((item) => (
            <Pressable
              key={item.label}
              className="rounded-full bg-card px-4 py-2"
              accessibilityRole="button"
              accessibilityLabel={item.label}
              onPress={item.onPress}
            >
              <Text className="text-sm font-medium text-white">{item.label}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      <Card>
        <Text className="text-lg font-semibold text-white">Daily Macros</Text>
        <View className="mt-4 gap-2">
          <View className="flex-row items-center justify-between">
            <Text className="text-sm text-white/80">Protein</Text>
            <Text className="text-sm font-medium text-white">140g</Text>
          </View>
          <View className="flex-row items-center justify-between">
            <Text className="text-sm text-white/80">Carbs</Text>
            <Text className="text-sm font-medium text-white">220g</Text>
          </View>
          <View className="flex-row items-center justify-between">
            <Text className="text-sm text-white/80">Fat</Text>
            <Text className="text-sm font-medium text-white">65g</Text>
          </View>
        </View>
      </Card>
    </ScrollView>
  );
}
