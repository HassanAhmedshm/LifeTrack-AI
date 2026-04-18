import { useEffect, useRef, useState } from "react";
import { Animated, ImageBackground, Text, View } from "react-native";

const HEADER_IMAGES = [
  "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=1600&q=80",
  "https://images.unsplash.com/photo-1571019613540-9965f4f6d12f?auto=format&fit=crop&w=1600&q=80",
  "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=1600&q=80",
  "https://images.unsplash.com/photo-1517964603305-11c0f6f66012?auto=format&fit=crop&w=1600&q=80",
  "https://images.unsplash.com/photo-1599058917765-a780eda07a3e?auto=format&fit=crop&w=1600&q=80",
];

interface WorkoutSlideshowHeaderProps {
  title: string;
  subtitle: string;
  focusText: string;
}

export function WorkoutSlideshowHeader({
  title,
  subtitle,
  focusText,
}: WorkoutSlideshowHeaderProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [nextIndex, setNextIndex] = useState(1);
  const crossFade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const timer = setInterval(() => {
      const targetNextIndex = (activeIndex + 1) % HEADER_IMAGES.length;
      setNextIndex(targetNextIndex);
      crossFade.setValue(0);
      Animated.timing(crossFade, {
        toValue: 1,
        duration: 850,
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished) {
          setActiveIndex(targetNextIndex);
        }
      });
    }, 4200);

    return () => clearInterval(timer);
  }, [activeIndex, crossFade]);

  return (
    <View className="h-56 overflow-hidden rounded-3xl border border-white/10 bg-card">
      <ImageBackground
        source={{ uri: HEADER_IMAGES[activeIndex] }}
        resizeMode="cover"
        className="absolute inset-0"
      />
      <Animated.View className="absolute inset-0" style={{ opacity: crossFade }}>
        <ImageBackground
          source={{ uri: HEADER_IMAGES[nextIndex] }}
          resizeMode="cover"
          className="h-full w-full"
        />
      </Animated.View>

      <View className="absolute inset-0 bg-black/35" />
      <View className="absolute left-0 right-0 top-0 h-24 bg-black/55" />
      <View className="absolute bottom-0 left-0 right-0 h-32 bg-black/82" />

      <View className="flex-1 justify-end p-4">
        <Text className="text-3xl font-extrabold text-white">{title}</Text>
        <Text className="mt-1 text-sm text-white/80">{subtitle}</Text>
        <Text
          className="mt-2 text-base font-semibold text-brand"
          style={{
            textShadowColor: "rgba(255,122,0,0.75)",
            textShadowOffset: { width: 0, height: 0 },
            textShadowRadius: 12,
          }}
        >
          Focusing On: {focusText}
        </Text>
      </View>
    </View>
  );
}
