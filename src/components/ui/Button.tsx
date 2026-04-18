import { ReactNode } from "react";
import { Pressable, Text, ActivityIndicator, ViewStyle } from "react-native";

export interface ButtonProps {
  onPress: () => void;
  label?: string;
  variant?: "primary" | "secondary";
  size?: "default" | "icon";
  icon?: ReactNode;
  isLoading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  accessibilityLabel?: string;
}

export function Button({
  onPress,
  label,
  variant = "primary",
  size = "default",
  icon,
  isLoading = false,
  disabled = false,
  style,
  accessibilityLabel,
}: ButtonProps) {
  const isDisabled = disabled || isLoading;
  const baseClasses =
    size === "icon"
      ? "h-11 w-11 rounded-full items-center justify-center"
      : "rounded-full px-6 py-3 items-center justify-center";
  const variantClasses = variant === "primary" ? "bg-brand" : "bg-card";
  const opacityClass = isDisabled ? "opacity-60" : "opacity-100";
  const computedA11yLabel = accessibilityLabel ?? label ?? "Button";

  return (
    <Pressable
      onPress={isDisabled ? undefined : onPress}
      disabled={isDisabled}
      style={style}
      className={`${baseClasses} ${variantClasses} ${opacityClass}`}
      accessibilityRole="button"
      accessibilityLabel={
        isLoading ? `${computedA11yLabel}, loading` : computedA11yLabel
      }
      accessibilityState={{ disabled: isDisabled }}
    >
      {isLoading ? (
        <ActivityIndicator color="white" size="small" />
      ) : icon ? (
        icon
      ) : (
        <Text className="text-white font-semibold">{label ?? "Button"}</Text>
      )}
    </Pressable>
  );
}
