import { Text, View } from "react-native";

export default function HomeScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-dark px-6">
      <Text className="text-3xl font-bold text-white">Life Track AI</Text>
      <Text className="mt-2 text-base text-white/80">NativeWind + Expo Router ready</Text>
      <View className="mt-6 h-3 w-28 rounded-full bg-brand" />
    </View>
  );
}
