import { useRouter } from "expo-router";
import { ChevronLeft, Settings } from "lucide-react-native";
import { Pressable, Text, View } from "react-native";

interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
}

export function ScreenHeader({
  title,
  subtitle,
  showBack = true,
}: ScreenHeaderProps) {
  const router = useRouter();

  return (
    <View className="pb-2">
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center gap-2">
          {showBack ? (
            <Pressable
              onPress={() => router.back()}
              className="rounded-full border border-white/20 bg-card p-2"
              accessibilityRole="button"
              accessibilityLabel="Go back"
            >
              <ChevronLeft size={18} color="#FFFFFF" />
            </Pressable>
          ) : (
            <View className="w-10" />
          )}
          <Text className="text-3xl font-bold text-white">{title}</Text>
        </View>

        <Pressable
          onPress={() => router.push("/settings")}
          className="rounded-full border border-white/20 bg-card p-2"
          accessibilityRole="button"
          accessibilityLabel="Open settings"
        >
          <Settings size={18} color="#FFFFFF" />
        </Pressable>
      </View>

      {subtitle ? <Text className="mt-2 text-white/70">{subtitle}</Text> : null}
    </View>
  );
}
