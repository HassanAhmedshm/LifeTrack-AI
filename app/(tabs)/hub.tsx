import type { ComponentType } from "react";
import { Pressable, Text, View } from "react-native";
import { BarChart3, Scale, UserCircle2 } from "lucide-react-native";

type HubCardProps = {
  title: string;
  subtitle: string;
  icon: ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;
};

function HubCard({ title, subtitle, icon: Icon }: HubCardProps) {
  return (
    <Pressable className="rounded-2xl border border-white/20 bg-white/10 p-4 active:opacity-80">
      <View className="flex-row items-center gap-3">
        <View className="rounded-xl border border-white/20 bg-white/15 p-2.5">
          <Icon size={20} color="#FF7A00" strokeWidth={2.2} />
        </View>
        <View className="flex-1">
          <Text className="text-base font-semibold text-white">{title}</Text>
          <Text className="mt-1 text-xs text-white/70">{subtitle}</Text>
        </View>
      </View>
    </Pressable>
  );
}

export default function HubScreen() {
  return (
    <View className="flex-1 bg-dark px-4 pt-4">
      <View className="rounded-3xl border border-white/15 bg-white/5 p-5">
        <Text className="text-3xl font-bold text-white">Hub</Text>
        <Text className="mt-2 text-sm text-white/70">
          Your bookshelf of core tools. Tap a card to open soon.
        </Text>
      </View>

      <View className="mt-4 gap-3">
        <HubCard
          title="Statistics"
          subtitle="Training trends, streaks, and performance insights."
          icon={BarChart3}
        />
        <HubCard
          title="Morning Weight"
          subtitle="Log your daily weigh-in and track progression."
          icon={Scale}
        />
        <HubCard
          title="Profile"
          subtitle="Manage your personal profile and coaching preferences."
          icon={UserCircle2}
        />
      </View>
    </View>
  );
}
