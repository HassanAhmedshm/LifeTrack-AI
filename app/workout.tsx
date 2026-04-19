import { View, Text } from "react-native";

export default function WorkoutScreen() {
  return (
    <View className="flex-1 bg-dark items-center justify-center px-6">
      <Text className="text-white text-lg font-semibold text-center">
        Workout Feature Temporarily Disabled
      </Text>
      <Text className="text-white/60 text-center mt-4">
        The workout system is being migrated to the new database schema. Please check back soon.
      </Text>
    </View>
  );
}
