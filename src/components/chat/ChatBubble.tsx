import { Text, View } from "react-native";

type ChatBubbleProps = {
  role: "user" | "ai";
  content: string;
  isError?: boolean;
};

export function ChatBubble({ role, content, isError }: ChatBubbleProps) {
  const isUser = role === "user";
  const bubbleClass = isUser
    ? "rounded-3xl rounded-br-md border border-brand/40 bg-brand/95 shadow-lg shadow-brand/40"
    : isError
    ? "rounded-3xl rounded-bl-md border border-red-500/50 bg-red-500/20"
    : "rounded-3xl rounded-bl-md border border-white/10 bg-white/10";
  const textClass = isUser ? "text-white" : isError ? "text-red-100" : "text-white";

  return (
    <View className={`max-w-[86%] px-4 py-3 ${bubbleClass}`}>
      <Text className={`text-base leading-6 ${textClass}`}>{content}</Text>
    </View>
  );
}
