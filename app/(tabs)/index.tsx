import { Pressable, ScrollView, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { ArrowUpRight, ChefHat, Dumbbell, Settings2, Zap } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useUserStore } from "../../src/store/useUserStore";
import { useGoalStore } from "../../src/store/useGoalStore";
import { CinematicHeader } from "../../src/components/home/CinematicHeader";
import { MacroGauge } from "../../src/components/home/MacroGauge";
import { FlowPill } from "../../src/components/home/FlowPill";
import { FloatingAIPill } from "../../src/components/home/FloatingAIPill";

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const userName = useUserStore((state) => state.name);
  const goals = useGoalStore((state) => state.goals);
  const topGoals = goals.slice(0, 3);
  const greetingName = userName || "Athlete";
  const macroTargets = [
    { label: "Protein", value: 140, target: 180 },
    { label: "Carbs", value: 220, target: 300 },
    { label: "Fat", value: 65, target: 90 },
  ];
  const flowActions = [
    { label: "Workout", icon: Dumbbell, onPress: () => router.push("/workout") },
    { label: "Chef AI", icon: ChefHat, onPress: () => router.push("/chef") },
    { label: "Flow", icon: Zap, onPress: () => router.push("/(tabs)/flow") },
    { label: "Settings", icon: Settings2, onPress: () => router.push("/settings") },
  ];

  return (
    <View className="flex-1 bg-[#0f0f0f]">
      <ScrollView
        className="flex-1"
        contentContainerClassName="gap-4 p-4 pb-40"
        showsVerticalScrollIndicator={false}
      >
        <CinematicHeader name={greetingName} />

        <View className="rounded-3xl border border-white/10 bg-white/5 p-4">
          <View className="flex-row items-center justify-between">
            <Text className="text-lg font-semibold text-white">Today&apos;s Focus</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Open goals"
              onPress={() => router.push("/(tabs)/goals")}
              className="rounded-full border border-white/15 bg-white/10 p-2"
            >
              <ArrowUpRight size={18} color="#FF7A00" />
            </Pressable>
          </View>
          <View className="mt-4 gap-3">
            {topGoals.length > 0 ? (
              topGoals.map((goal) => {
                const safeTarget = goal.target_value > 0 ? goal.target_value : 1;
                const rawPercent = (goal.current_value / safeTarget) * 100;
                const progressPercent = Math.max(0, Math.min(100, rawPercent));
                return (
                  <View
                    key={goal.id}
                    className="rounded-2xl border border-white/10 bg-black/20 px-3 py-3"
                  >
                    <View className="flex-row items-center justify-between">
                      <Text className="flex-1 text-sm font-semibold text-white">
                        {goal.title}
                      </Text>
                      <Text className="text-xs font-medium text-white/70">
                        {Math.round(progressPercent)}%
                      </Text>
                    </View>
                    <Text className="mt-1 text-xs text-white/60">
                      {goal.current_value} / {goal.target_value}
                    </Text>
                  </View>
                );
              })
            ) : (
              <Text className="text-sm text-white/70">
                Add goals to define your focus for today.
              </Text>
            )}
          </View>
        </View>

        <View className="gap-3">
          <Text className="text-lg font-semibold text-white">Flow Pills</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerClassName="pr-2"
          >
            {flowActions.map((item) => (
              <FlowPill
                key={item.label}
                label={item.label}
                icon={item.icon}
                onPress={item.onPress}
              />
            ))}
          </ScrollView>
        </View>

        <View className="rounded-3xl border border-white/10 bg-white/5 p-4">
          <Text className="text-lg font-semibold text-white">Nutrition Gauges</Text>
          <Text className="mt-1 text-xs uppercase tracking-[2px] text-white/55">
            Performance dashboard
          </Text>
          <View className="mt-4 flex-row gap-2">
            {macroTargets.map((macro) => (
              <View key={macro.label} className="flex-1">
                <MacroGauge
                  label={macro.label}
                  value={macro.value}
                  target={macro.target}
                />
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      <View
        className="absolute left-4 right-4"
        style={{ bottom: insets.bottom + 64 }}
      >
        <FloatingAIPill onPress={() => router.push("/(tabs)/chatbot")} />
      </View>
    </View>
  );
}
