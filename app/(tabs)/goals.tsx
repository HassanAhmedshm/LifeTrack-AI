import { Text, View } from "react-native";

export default function GoalsScreen() {
  return (
    <View className="flex-1 bg-dark items-center justify-center px-6">
      <Text className="text-white text-lg font-semibold text-center">
        Goals Feature Temporarily Disabled
      </Text>
      <Text className="text-white/60 text-center mt-4">
        The goals system is being redesigned for the new database schema. Please check back soon.
      </Text>
    </View>
  );
}
