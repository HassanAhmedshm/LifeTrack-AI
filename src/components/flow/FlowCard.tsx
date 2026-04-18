import { useRef } from "react";
import { ImageBackground, Pressable, StyleSheet, Text, View } from "react-native";
import Animated, {
  Extrapolation,
  interpolate,
  SharedValue,
  useAnimatedStyle,
} from "react-native-reanimated";
import { Expand } from "lucide-react-native";
import type { FlowItem } from "./flowData";
import { getCategoryImageUrl } from "./flowData";

interface FlowCardProps {
  item: FlowItem;
  index: number;
  cardWidth: number;
  cardHeight: number;
  itemGap: number;
  isLast: boolean;
  snapInterval: number;
  scrollX: SharedValue<number>;
  onPress: (item: FlowItem, imageUri: string, cardRef: View | null) => void;
}

export function FlowCard({
  item,
  index,
  cardWidth,
  cardHeight,
  itemGap,
  isLast,
  snapInterval,
  scrollX,
  onPress,
}: FlowCardProps) {
  const cardRef = useRef<View>(null);
  const imageUri = getCategoryImageUrl(item.category, item.id);

  const animatedStyle = useAnimatedStyle(() => {
    const position = index * snapInterval;
    const inputRange = [position - snapInterval, position, position + snapInterval];
    const scale = interpolate(scrollX.value, inputRange, [0.86, 1, 0.86], Extrapolation.CLAMP);
    const opacity = interpolate(scrollX.value, inputRange, [0.45, 1, 0.45], Extrapolation.CLAMP);
    const rotateY = interpolate(scrollX.value, inputRange, [12, 0, -12], Extrapolation.CLAMP);
    const translateY = interpolate(scrollX.value, inputRange, [16, 0, 16], Extrapolation.CLAMP);

    return {
      opacity,
      transform: [{ perspective: 1000 }, { translateY }, { rotateY: `${rotateY}deg` }, { scale }],
    };
  });

  return (
    <Pressable
      ref={cardRef}
      onPress={() => onPress(item, imageUri, cardRef.current)}
      accessibilityRole="button"
      accessibilityLabel={`${item.title} card`}
    >
      <Animated.View
        style={[animatedStyle, { width: cardWidth, height: cardHeight, marginRight: isLast ? 0 : itemGap }]}
        className="overflow-hidden rounded-3xl border border-white/15 bg-card"
      >
        <ImageBackground source={{ uri: imageUri }} resizeMode="cover" className="h-full w-full">
          <View
            pointerEvents="none"
            style={[StyleSheet.absoluteFillObject, { backgroundColor: "rgba(0,0,0,0.22)" }]}
          />
          <View
            pointerEvents="none"
            style={[
              {
                position: "absolute",
                left: 0,
                right: 0,
                top: 0,
                height: cardHeight * 0.22,
                backgroundColor: "rgba(0,0,0,0.45)",
              },
            ]}
          />
          <View
            pointerEvents="none"
            style={[
              {
                position: "absolute",
                left: 0,
                right: 0,
                bottom: 0,
                height: cardHeight * 0.42,
                backgroundColor: "rgba(0,0,0,0.8)",
              },
            ]}
          />
          <View
            pointerEvents="none"
            style={[
              {
                position: "absolute",
                left: -cardWidth * 0.15,
                right: -cardWidth * 0.15,
                bottom: -cardHeight * 0.26,
                height: cardHeight * 0.62,
                borderRadius: 999,
                backgroundColor: "rgba(0,0,0,0.42)",
              },
            ]}
          />

          <View className="h-full justify-between p-5">
            <View className="self-end rounded-full border border-white/30 bg-black/30 p-2">
              <Expand size={14} color="#FFFFFF" />
            </View>

            <View>
              <Text className="text-xs font-semibold uppercase tracking-[2px] text-white/75">
                {item.timeRange}
              </Text>
              <Text className="mt-2 text-3xl font-extrabold text-white">{item.title}</Text>
              <Text className="mt-3 text-sm leading-6 text-white/90">{item.suggestion}</Text>
            </View>
          </View>
        </ImageBackground>
      </Animated.View>
    </Pressable>
  );
}
