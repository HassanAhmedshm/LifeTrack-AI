import { View, Text } from "react-native";

export default function HomeScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-dark">
      <Text className="text-3xl font-bold text-white">Home</Text>
      <Text className="mt-2 text-white/60">Workout tracking coming soon</Text>
    </View>
  );
}
