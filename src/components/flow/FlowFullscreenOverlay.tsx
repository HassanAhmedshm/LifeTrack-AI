import { useEffect, useMemo } from "react";
import {
  ImageBackground,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { BlurView } from "expo-blur";
import { X } from "lucide-react-native";
import Animated, {
  Extrapolation,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import type { FlowItem } from "./flowData";

export type OverlayOrigin = {
  x: number;
  y: number;
  width: number;
  height: number;
};

interface FlowFullscreenOverlayProps {
  item: FlowItem | null;
  imageUri: string;
  origin: OverlayOrigin | null;
  onClosed: () => void;
}

export function FlowFullscreenOverlay({
  item,
  imageUri,
  origin,
  onClosed,
}: FlowFullscreenOverlayProps) {
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const progress = useSharedValue(0);
  const visible = Boolean(item && origin);

  useEffect(() => {
    if (visible) {
      progress.value = withTiming(1, { duration: 280 });
    } else {
      progress.value = 0;
    }
  }, [progress, visible]);

  const close = () => {
    progress.value = withTiming(0, { duration: 220 }, (finished) => {
      if (finished) {
        runOnJS(onClosed)();
      }
    });
  };

  const originRect = useMemo<OverlayOrigin>(
    () => origin ?? { x: screenWidth * 0.2, y: screenHeight * 0.28, width: screenWidth * 0.6, height: 280 },
    [origin]
  );

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 1], [0, 1], Extrapolation.CLAMP),
  }));

  const cardStyle = useAnimatedStyle(() => ({
    left: interpolate(progress.value, [0, 1], [originRect.x, 0], Extrapolation.CLAMP),
    top: interpolate(progress.value, [0, 1], [originRect.y, 0], Extrapolation.CLAMP),
    width: interpolate(progress.value, [0, 1], [originRect.width, screenWidth], Extrapolation.CLAMP),
    height: interpolate(progress.value, [0, 1], [originRect.height, screenHeight], Extrapolation.CLAMP),
    borderRadius: interpolate(progress.value, [0, 1], [24, 0], Extrapolation.CLAMP),
  }));

  if (!visible || !item) {
    return null;
  }

  return (
    <Animated.View style={[StyleSheet.absoluteFillObject, overlayStyle]} className="z-50">
      <BlurView intensity={65} tint="dark" style={StyleSheet.absoluteFillObject} />
      <View className="absolute inset-0 bg-black/35" />

      <Animated.View style={[cardStyle]} className="absolute overflow-hidden bg-black">
        <ImageBackground
          source={{ uri: imageUri }}
          resizeMode="cover"
          style={StyleSheet.absoluteFillObject}
        >
          <View
            pointerEvents="none"
            style={[StyleSheet.absoluteFillObject, { backgroundColor: "rgba(0,0,0,0.24)" }]}
          />
          <View
            pointerEvents="none"
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              top: 0,
              height: screenHeight * 0.26,
              backgroundColor: "rgba(0,0,0,0.62)",
            }}
          />
          <View
            pointerEvents="none"
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              bottom: 0,
              height: screenHeight * 0.46,
              backgroundColor: "rgba(0,0,0,0.88)",
            }}
          />
          <View
            pointerEvents="none"
            style={{
              position: "absolute",
              left: -screenWidth * 0.2,
              right: -screenWidth * 0.2,
              bottom: -screenHeight * 0.25,
              height: screenHeight * 0.58,
              borderRadius: 999,
              backgroundColor: "rgba(0,0,0,0.45)",
            }}
          />

          <View className="flex-1 px-5 pb-10 pt-16">
            <View className="flex-row items-center justify-between">
              <Text className="text-xs font-semibold uppercase tracking-[2px] text-white/75">
                {item.timeRange}
              </Text>
              <Pressable
                onPress={close}
                className="rounded-full border border-white/30 bg-black/30 p-2"
                accessibilityRole="button"
                accessibilityLabel="Close fullscreen flow card"
              >
                <X size={16} color="#FFFFFF" />
              </Pressable>
            </View>

            <Text className="mt-4 text-4xl font-extrabold text-white">{item.title}</Text>
            <Text className="mt-4 text-base leading-7 text-white/90">{item.suggestion}</Text>

            <View className="mt-8 gap-3 rounded-3xl border border-white/20 bg-black/35 p-4">
              {item.details.map((detail) => (
                <Text key={detail} className="text-sm text-white/90">
                  • {detail}
                </Text>
              ))}
            </View>
          </View>
        </ImageBackground>
      </Animated.View>
    </Animated.View>
  );
}
