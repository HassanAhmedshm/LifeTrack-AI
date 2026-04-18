import { useRef, useState } from "react";
import { ScrollView, Text, useWindowDimensions, View } from "react-native";
import Animated, { useAnimatedScrollHandler, useSharedValue } from "react-native-reanimated";
import { Sparkles } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { FLOW_ITEMS, type FlowItem } from "../../src/components/flow/flowData";
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
  const { width: screenWidth } = useWindowDimensions();
  const scrollRef = useRef<ScrollView>(null);
  const [selectedCard, setSelectedCard] = useState<SelectedCard | null>(null);
  const [selectedOrigin, setSelectedOrigin] = useState<OverlayOrigin | null>(null);
  const scrollX = useSharedValue(0);

  const cardWidth = Math.min(screenWidth * 0.74, 320);
  const itemGap = 16;
  const snapInterval = cardWidth + itemGap;
  const sidePadding = (screenWidth - cardWidth) / 2;
  const maxScroll = Math.max((FLOW_ITEMS.length - 1) * snapInterval, 0);

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

  return (
    <View className="flex-1 bg-[#0f0f0f]">
      <View className="px-4 pt-4">
        <Text className="text-3xl font-extrabold text-white">Flow</Text>
        <Text className="mt-2 text-sm leading-6 text-white/75">
          Cinematic timeline with focus-depth transitions and precision navigation.
        </Text>
      </View>

      <AnimatedScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        bounces={false}
        className="mt-5"
        contentContainerStyle={{ paddingHorizontal: sidePadding }}
        snapToInterval={snapInterval}
        snapToAlignment="center"
        decelerationRate="fast"
        onScroll={onScroll}
        scrollEventThrottle={16}
      >
        {FLOW_ITEMS.map((item, index) => (
          <FlowCard
            key={item.id}
            item={item}
            index={index}
            cardWidth={cardWidth}
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

      <View
        className="mx-4 mt-4 flex-row items-center gap-3 overflow-hidden rounded-full border border-white/20 bg-white/10 px-4 py-3"
        style={{ marginBottom: insets.bottom + 60 }}
      >
        <View className="rounded-full bg-brand/20 p-1.5">
          <Sparkles size={15} color="#FF7A00" />
        </View>
        <Text className="flex-1 text-sm text-white/90">Ask AI or log something in your flow...</Text>
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
    </View>
  );
}
