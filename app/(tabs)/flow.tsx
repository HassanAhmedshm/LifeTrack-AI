import { FlatList, Text, useWindowDimensions, View } from "react-native";

type FlowItem = {
  id: string;
  timeRange: string;
  title: string;
  suggestion: string;
};

const FLOW_ITEMS: FlowItem[] = [
  {
    id: "sleep",
    timeRange: "00:00 - 07:00",
    title: "Sleep & Recovery",
    suggestion: "AI tip: Keep your room cool and dark for deeper recovery.",
  },
  {
    id: "work",
    timeRange: "08:00 - 12:00",
    title: "Deep Work",
    suggestion: "AI tip: Focus in 50-minute blocks, then take a short walk.",
  },
  {
    id: "gym",
    timeRange: "18:00 - 19:30",
    title: "Gym Session",
    suggestion: "AI tip: Prioritize compound lifts and progressive overload.",
  },
  {
    id: "relax",
    timeRange: "21:00 - 22:30",
    title: "Relax & Reset",
    suggestion: "AI tip: Limit screen time and prep tomorrow's priorities.",
  },
];

export default function FlowScreen() {
  const { width: screenWidth } = useWindowDimensions();
  const cardWidth = screenWidth * 0.75;
  const itemGap = 16;
  const snapInterval = cardWidth + itemGap;
  const sidePadding = (screenWidth - cardWidth) / 2;

  return (
    <View className="flex-1 bg-dark pt-4">
      <View className="px-4">
        <Text className="text-3xl font-bold text-white">Flow</Text>
        <Text className="mt-2 text-white/70">
          Your daily schedule blocks, optimized for consistency.
        </Text>
      </View>

      <FlatList
        className="mt-6"
        data={FLOW_ITEMS}
        keyExtractor={(item) => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: sidePadding }}
        ItemSeparatorComponent={() => <View style={{ width: itemGap }} />}
        snapToAlignment="center"
        snapToInterval={snapInterval}
        decelerationRate="fast"
        bounces={false}
        renderItem={({ item }) => (
          <View
            className="h-[400px] rounded-3xl border border-white/12 bg-card p-6"
            style={{ width: cardWidth }}
          >
            <View className="absolute inset-0 rounded-3xl border border-white/5" />
            <Text className="text-sm font-semibold uppercase tracking-widest text-white/60">
              {item.timeRange}
            </Text>
            <Text className="mt-3 text-2xl font-bold text-white">{item.title}</Text>

            <View className="mt-6 rounded-2xl bg-dark/60 p-4">
              <Text className="text-xs font-semibold uppercase tracking-widest text-white/50">
                AI Suggestions
              </Text>
              <Text className="mt-2 text-sm leading-6 text-white/80">
                {item.suggestion}
              </Text>
            </View>
          </View>
        )}
      />
    </View>
  );
}
