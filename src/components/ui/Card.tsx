import { View, ViewProps } from "react-native";

export interface CardProps extends ViewProps {
  children: React.ReactNode;
}

export function Card({ children, ...rest }: CardProps) {
  return (
    <View className="rounded-2xl bg-card p-4" {...rest}>
      {children}
    </View>
  );
}
