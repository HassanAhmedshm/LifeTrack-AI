import { useRef } from "react";
import { ImageBackground, Pressable, StyleSheet, Text, View } from "react-native";
import Svg, { Defs, LinearGradient, RadialGradient, Rect, Stop } from "react-native-svg";
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
  snapInterval: number;
  scrollX: SharedValue<number>;
  onPress: (item: FlowItem, imageUri: string, cardRef: View | null) => void;
}

export function FlowCard({
  item,
  index,
  cardWidth,
  snapInterval,
  scrollX,
  onPress,
}: FlowCardProps) {
  const cardRef = useRef<View>(null);
  const imageUri = getCategoryImageUrl(item.category, item.id);
  const gradientId = `flow-vignette-${item.id}`;
  const topFadeId = `flow-top-fade-${item.id}`;

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
        style={[animatedStyle, { width: cardWidth }]}
        className="mr-4 h-[430px] overflow-hidden rounded-3xl border border-white/15 bg-card"
      >
        <ImageBackground source={{ uri: imageUri }} resizeMode="cover" className="h-full w-full">
          <View className="absolute inset-0 bg-black/35" />
          <Svg style={StyleSheet.absoluteFillObject}>
            <Defs>
              <RadialGradient id={gradientId} cx="50%" cy="42%" r="72%">
                <Stop offset="35%" stopColor="rgba(0,0,0,0.08)" />
                <Stop offset="100%" stopColor="rgba(0,0,0,0.82)" />
              </RadialGradient>
              <LinearGradient id={topFadeId} x1="0%" y1="0%" x2="0%" y2="100%">
                <Stop offset="0%" stopColor="rgba(0,0,0,0.55)" />
                <Stop offset="40%" stopColor="rgba(0,0,0,0.12)" />
                <Stop offset="100%" stopColor="rgba(0,0,0,0.8)" />
              </LinearGradient>
            </Defs>
            <Rect width="100%" height="100%" fill={`url(#${gradientId})`} />
            <Rect width="100%" height="100%" fill={`url(#${topFadeId})`} />
          </Svg>

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
