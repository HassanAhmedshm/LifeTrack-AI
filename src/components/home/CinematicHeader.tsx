import { Text, View } from "react-native";

interface CinematicHeaderProps {
  name: string;
}

export function CinematicHeader({ name }: CinematicHeaderProps) {
  return (
    <View className="relative overflow-hidden rounded-3xl border border-white/10 bg-[#0f0f0f] px-5 py-6">
      <View className="absolute -right-20 -top-20 h-52 w-52 rounded-full bg-brand/20" />
      <View className="absolute -left-10 bottom-0 h-24 w-24 rounded-full bg-white/10" />

      <Text className="text-xs font-semibold uppercase tracking-[3px] text-white/60">
        Welcome back
      </Text>

      <Text className="mt-2 text-5xl font-extrabold tracking-tight text-white" numberOfLines={1}>
        {name}
      </Text>
      <View className="mt-2 h-0.5 w-36 rounded-full bg-white/20" />

      <Text className="mt-2 text-sm text-white/70">
        High-performance momentum starts with one clean move.
      </Text>
    </View>
  );
}
