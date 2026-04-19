import { useCallback, useEffect, useRef, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import Animated, { useAnimatedScrollHandler, useSharedValue } from "react-native-reanimated";
import { Send, Sparkles } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Button } from "../../src/components/ui/Button";
import { Input } from "../../src/components/ui/Input";
import { ScreenHeader } from "../../src/components/ui/ScreenHeader";
import { runAssistantPrompt } from "../../src/services/assistant";
import { getDB } from "../../src/db/index";
import { useUserStore } from "../../src/store/useUserStore";
import { type FlowCategory, type FlowItem } from "../../src/components/flow/flowData";
import { FlowCard } from "../../src/components/flow/FlowCard";
import { FlowSlider } from "../../src/components/flow/FlowSlider";
import {
  FlowFullscreenOverlay,
  type OverlayOrigin,
} from "../../src/components/flow/FlowFullscreenOverlay";

type SelectedCard = {
  item: FlowItem;
  imageUri: string;
};

const AnimatedScrollView = Animated.createAnimatedComponent(ScrollView);

export default function FlowScreen() {
  const insets = useSafeAreaInsets();
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const scrollRef = useRef<ScrollView>(null);
  const userId = useUserStore((state) => state.id);
  const [selectedCard, setSelectedCard] = useState<SelectedCard | null>(null);
  const [selectedOrigin, setSelectedOrigin] = useState<OverlayOrigin | null>(null);
  const [aiPrompt, setAiPrompt] = useState("");
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiStatus, setAiStatus] = useState("");
  const [aiStatusError, setAiStatusError] = useState(false);
  const [flowItems, setFlowItems] = useState<FlowItem[]>([]);
  const scrollX = useSharedValue(0);

  const cardWidth = Math.max(250, Math.min(screenWidth * 0.72, 360));
  const cardHeight = Math.max(360, Math.min(screenHeight * 0.56, 520));
  const itemGap = Math.max(12, Math.min(screenWidth * 0.04, 20));
  const snapInterval = cardWidth + itemGap;
  const sidePadding = Math.max(16, (screenWidth - cardWidth) / 2);
  const maxScroll = Math.max((flowItems.length - 1) * snapInterval, 0);
  const snapToOffsets = flowItems.map((_, index) => index * snapInterval);

  const refreshFlowItems = useCallback(async () => {
    if (!userId) {
      setFlowItems([]);
      return;
    }

    const db = getDB();
    const days = await db.getAllAsync<{
      id: string;
      name: string;
      last_played: string | null;
    }>(
      "SELECT id, name, last_played FROM workout_days WHERE TRIM(COALESCE(name, '')) != '' ORDER BY COALESCE(last_played, '') DESC, name ASC LIMIT 7"
    );

    const dynamicItems: FlowItem[] = [];
    // Workout feature is disabled during database migration
    // if (activeWorkout) {
    //   dynamicItems.push({
    //     id: `active-workout-${activeWorkout.id}`,
    //     category: "gym",
    //     timeRange: "Today",
    //     title: activeWorkout.plan_name,
    //     ...
    //   });
    // }

    for (const day of days) {
      dynamicItems.push({
        id: `day-${day.id}`,
        category: inferCategory(day.name),
        timeRange: formatFlowDay(day.last_played),
        title: day.name,
        suggestion: `AI can add and modify workouts for ${day.name.toLowerCase()} directly.`,
        details: ["Linked to your persistent workout-day schedule."],
      });
    }

    setFlowItems(dynamicItems);
  }, [userId]);

  useEffect(() => {
    void refreshFlowItems();
  }, [refreshFlowItems]);

  const onScroll = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollX.value = event.contentOffset.x;
    },
  });

  const openFullscreen = (item: FlowItem, imageUri: string, cardNode: View | null) => {
    if (!cardNode) {
      return;
    }
    cardNode.measureInWindow((x, y, width, height) => {
      setSelectedOrigin({ x, y, width, height });
      setSelectedCard({ item, imageUri });
    });
  };

  const onSeek = (targetX: number) => {
    const clamped = Math.max(0, Math.min(targetX, maxScroll));
    scrollRef.current?.scrollTo({ x: clamped, animated: false });
  };

  const onAskAI = async () => {
    const trimmedPrompt = aiPrompt.trim();
    if (!trimmedPrompt || isAiLoading) {
      return;
    }
    setAiStatus("");
    setAiStatusError(false);
    setIsAiLoading(true);
    try {
      const result = await runAssistantPrompt(trimmedPrompt, "flow");
      setAiPrompt("");
      setAiStatus(result.message);
      await refreshFlowItems();
    } catch (error) {
      console.error("Flow AI request failed:", error);
      setAiStatusError(true);
      setAiStatus("Could not apply that command. Try: 'Add morning run to workout'.");
    } finally {
      setIsAiLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-[#0f0f0f]"
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View className="px-4 pt-4">
        <ScreenHeader
          title="Flow"
          subtitle="Cinematic timeline with focus-depth transitions and precision navigation."
          showBack={false}
        />
      </View>

      {flowItems.length > 0 ? (
        <>
          <AnimatedScrollView
            ref={scrollRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            bounces={false}
            className="mt-5"
            contentContainerStyle={{ paddingHorizontal: sidePadding }}
            snapToOffsets={snapToOffsets}
            snapToEnd={false}
            disableIntervalMomentum
            decelerationRate="fast"
            onScroll={onScroll}
            scrollEventThrottle={16}
          >
            {flowItems.map((item, index) => (
              <FlowCard
                key={item.id}
                item={item}
                index={index}
                cardWidth={cardWidth}
                cardHeight={cardHeight}
                itemGap={itemGap}
                isLast={index === flowItems.length - 1}
                snapInterval={snapInterval}
                scrollX={scrollX}
                onPress={openFullscreen}
              />
            ))}
          </AnimatedScrollView>

          <View className="mt-4">
            <FlowSlider
              scrollX={scrollX}
              maxScroll={maxScroll}
              onSeek={onSeek}
            />
          </View>
        </>
      ) : (
        <View className="mx-4 mt-6 rounded-2xl border border-white/12 bg-card p-4">
          <Text className="text-base font-semibold text-white">Flow is not set up yet</Text>
          <Text className="mt-2 text-sm text-white/70">
            Ask AI: "Set up my flow schedule" to create your first weekly plan.
          </Text>
        </View>
      )}

      <View
        className="mx-4 mt-4 rounded-2xl bg-card px-4 py-3"
        style={{ marginBottom: insets.bottom + 60 }}
      >
        {aiStatus ? (
          <Text
            className={`mb-2 text-sm ${
              aiStatusError ? "text-red-400" : "text-white/75"
            }`}
          >
            {aiStatus}
          </Text>
        ) : null}
        <View className="mb-2 flex-row items-center gap-2">
          <View className="rounded-full bg-brand/20 p-1.5">
            <Sparkles size={15} color="#FF7A00" />
          </View>
          <Text className="text-xs font-semibold uppercase tracking-[2px] text-white/70">
            Ask AI
          </Text>
        </View>
        <View className="flex-row items-center gap-2">
          <View className="flex-1">
            <Input
              placeholder="Ask AI or log something in your flow..."
              value={aiPrompt}
              onChangeText={setAiPrompt}
              editable={!isAiLoading}
              returnKeyType="send"
              onSubmitEditing={onAskAI}
            />
          </View>
          <Button
            onPress={onAskAI}
            accessibilityLabel="Send flow prompt"
            icon={<Send size={18} color="white" />}
            size="icon"
            isLoading={isAiLoading}
            disabled={!aiPrompt.trim() || isAiLoading}
          />
        </View>
      </View>

      <FlowFullscreenOverlay
        item={selectedCard?.item ?? null}
        imageUri={selectedCard?.imageUri ?? ""}
        origin={selectedOrigin}
        onClosed={() => {
          setSelectedCard(null);
          setSelectedOrigin(null);
        }}
      />
    </KeyboardAvoidingView>
  );
}

function inferCategory(label: string): FlowCategory {
  const normalized = label.toLowerCase();
  if (normalized.includes("run") || normalized.includes("cardio") || normalized.includes("interval")) {
    return "gym";
  }
  if (normalized.includes("recover") || normalized.includes("sleep")) {
    return "sleep";
  }
  if (normalized.includes("meal") || normalized.includes("nutrition")) {
    return "food";
  }
  if (normalized.includes("focus") || normalized.includes("work")) {
    return "work";
  }
  return "mind";
}

function formatFlowDay(isoDate: string | null): string {
  if (!isoDate) {
    return "Planned";
  }
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) {
    return "Planned";
  }
  return date.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
}
