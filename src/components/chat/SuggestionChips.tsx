import { useEffect, useRef } from "react";
import { Animated, Pressable, Text, View } from "react-native";

type SuggestionChipsProps = {
  chips: string[];
  disabled?: boolean;
  onSelect: (value: string) => void;
};

export function SuggestionChips({
  chips,
  disabled = false,
  onSelect,
}: SuggestionChipsProps) {
  const animationsRef = useRef(chips.map(() => new Animated.Value(0)));

  useEffect(() => {
    const animations = animationsRef.current.map((value) =>
      Animated.timing(value, {
        toValue: 1,
        duration: 360,
        useNativeDriver: true,
      })
    );

    Animated.stagger(70, animations).start();
  }, []);

  return (
    <View className="mb-4 flex-row flex-wrap gap-2">
      {chips.map((chip, index) => {
        const animatedValue = animationsRef.current[index];
        const translateY = animatedValue.interpolate({
          inputRange: [0, 1],
          outputRange: [12, 0],
        });

        return (
          <Animated.View
            key={chip}
            style={{ opacity: animatedValue, transform: [{ translateY }] }}
          >
            <Pressable
              onPress={() => onSelect(chip)}
              disabled={disabled}
              className={`rounded-full border border-white/20 bg-white/10 px-4 py-2 ${
                disabled ? "opacity-50" : "opacity-100"
              }`}
            >
              <Text className="text-xs text-white">{chip}</Text>
            </Pressable>
          </Animated.View>
        );
      })}
    </View>
  );
}
