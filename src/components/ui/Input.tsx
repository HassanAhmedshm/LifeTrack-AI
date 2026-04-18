import { TextInput, View, TextInputProps } from "react-native";
import { useState } from "react";

export interface CustomInputProps extends TextInputProps {
  placeholder?: string;
  onChangeText?: (text: string) => void;
  value?: string;
}

export function Input({
  placeholder,
  onChangeText,
  value,
  ...rest
}: CustomInputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const focusRingClass = isFocused ? "border-2 border-brand" : "border-0";

  const { onFocus, onBlur, ...filteredRest } = rest;

  return (
    <View className={`rounded-full bg-card px-4 py-3 ${focusRingClass}`}>
      <TextInput
        placeholder={placeholder}
        placeholderTextColor="#999999"
        onChangeText={onChangeText}
        value={value}
        onFocus={(e) => {
          setIsFocused(true);
          onFocus?.(e);
        }}
        onBlur={(e) => {
          setIsFocused(false);
          onBlur?.(e);
        }}
        accessibilityLabel={placeholder}
        accessibilityRole="search"
        className="text-white text-base"
        {...filteredRest}
      />
    </View>
  );
}
