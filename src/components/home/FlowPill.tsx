import type { LucideIcon } from "lucide-react-native";
import { Animated, Pressable, Text, View } from "react-native";
import { useRef } from "react";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface FlowPillProps {
  label: string;
  icon: LucideIcon;
  onPress: () => void;
}

export function FlowPill({ label, icon: Icon, onPress }: FlowPillProps) {
  const scale = useRef(new Animated.Value(1)).current;

  const onPressIn = () => {
    Animated.spring(scale, {
      toValue: 0.96,
      speed: 25,
      bounciness: 0,
      useNativeDriver: true,
    }).start();
  };

  const onPressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      speed: 22,
      bounciness: 6,
      useNativeDriver: true,
    }).start();
  };

  return (
    <AnimatedPressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      className="mr-3 overflow-hidden rounded-full border border-white/20 bg-white/10 px-4 py-3"
      style={{ transform: [{ scale }] }}
    >
      <View className="flex-row items-center gap-2">
        <View className="rounded-full bg-white/15 p-1.5">
          <Icon size={16} color="#FF7A00" strokeWidth={2.2} />
        </View>
        <Text className="text-sm font-semibold text-white">{label}</Text>
      </View>
    </AnimatedPressable>
  );
}
