import { Tabs } from "expo-router";
import { View } from "react-native";
import { House, Zap, Target, MessageCircle } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

function TabBarIcon({
  name,
  color,
  size = 24,
}: {
  name: "home" | "flow" | "goals" | "chat";
  color: string;
  size?: number;
}) {
  const iconProps = { size, color, strokeWidth: 2 };

  const icons = {
    home: <House {...iconProps} />,
    flow: <Zap {...iconProps} />,
    goals: <Target {...iconProps} />,
    chat: <MessageCircle {...iconProps} />,
  };

  return <View>{icons[name]}</View>;
}

export default function TabsLayout() {
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#FF7A00",
        tabBarInactiveTintColor: "#666666",
        tabBarStyle: {
          backgroundColor: "#121212",
          borderTopColor: "#1E1E1E",
          paddingBottom: Math.max(8, insets.bottom),
          paddingTop: 8,
          height: 56 + Math.max(8, insets.bottom),
        },
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color }) => (
            <TabBarIcon name="home" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="flow"
        options={{
          title: "Flow",
          tabBarIcon: ({ color }) => (
            <TabBarIcon name="flow" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="goals"
        options={{
          title: "Goals",
          tabBarIcon: ({ color }) => (
            <TabBarIcon name="goals" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="chatbot"
        options={{
          title: "Chat",
          tabBarIcon: ({ color }) => (
            <TabBarIcon name="chat" color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
