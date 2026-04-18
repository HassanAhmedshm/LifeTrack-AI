import { BlurView } from "expo-blur";
import { Sparkles, Mic, SendHorizontal } from "lucide-react-native";
import { Pressable, StyleSheet, Text, View } from "react-native";

interface FloatingAIPillProps {
  onPress: () => void;
}

export function FloatingAIPill({ onPress }: FloatingAIPillProps) {
  return (
    <View className="overflow-hidden rounded-full border border-white/20 bg-white/10">
      <BlurView intensity={42} tint="dark" style={StyleSheet.absoluteFillObject} />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Ask AI"
        className="flex-row items-center gap-3 px-5 py-4"
        onPress={onPress}
      >
        <View className="rounded-full bg-brand/25 p-1.5">
          <Sparkles size={16} color="#FF7A00" />
        </View>
        <Text className="flex-1 text-sm font-medium text-white/90">
          Ask AI for your next move...
        </Text>
        <Mic size={16} color="#FFFFFF" />
        <SendHorizontal size={16} color="#FFFFFF" />
      </Pressable>
    </View>
  );
}
