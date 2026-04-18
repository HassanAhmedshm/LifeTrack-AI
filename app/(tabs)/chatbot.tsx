import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  View,
} from "react-native";
import { Send } from "lucide-react-native";
import { Input } from "../../src/components/ui/Input";
import { Button } from "../../src/components/ui/Button";
import { useUserStore } from "../../src/store/useUserStore";
import * as aiService from "../../src/services/ai";

type ChatMessage = {
  id: string;
  role: "user" | "ai";
  content: string;
  isError?: boolean;
};

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: "ai-1",
    role: "ai",
    content: "Hey! I can help plan workouts, nutrition habits, and weekly goals.",
  },
];

export default function ChatbotScreen() {
  const groqApiKey = useUserStore((state) => state.groqApiKey);
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const hasApiKey = Boolean(groqApiKey?.trim());
  const isComposerDisabled = !hasApiKey || isLoading;
  const placeholder = hasApiKey
    ? "Type your message..."
    : "Enter API Key in Settings";

  const handleSend = async () => {
    if (isComposerDisabled) {
      return;
    }

    const prompt = inputText.trim();
    if (!prompt) {
      return;
    }

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: prompt,
    };

    setMessages((currentMessages) => [...currentMessages, userMessage]);
    setInputText("");
    setIsLoading(true);

    try {
      const response = await aiService.sendPrompt(
        prompt,
        "Respond in JSON format with a 'message' string field."
      );
      const message = extractAiMessage(response);
      setMessages((currentMessages) => [
        ...currentMessages,
        {
          id: `ai-${Date.now()}`,
          role: "ai",
          content: message,
        },
      ]);
    } catch (error) {
      console.error("Chat request failed:", error);
      setMessages((currentMessages) => [
        ...currentMessages,
        {
          id: `ai-error-${Date.now()}`,
          role: "ai",
          content: "Network error or invalid key. Please try again.",
          isError: true,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-dark"
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View className="flex-1 bg-dark">
        <ScrollView className="flex-1 px-4 pt-4">
          <View className="gap-3 pb-6">
            {messages.map((message) => {
              const isUser = message.role === "user";
              return (
                <View
                  key={message.id}
                  className={isUser ? "items-end" : "items-start"}
                >
                  <View
                    className={`max-w-[85%] px-4 py-3 ${
                      isUser
                        ? "rounded-2xl rounded-br-none bg-brand"
                        : message.isError
                        ? "rounded-2xl rounded-bl-none border border-red-500 bg-red-500/20"
                        : "rounded-2xl rounded-bl-none bg-card"
                    }`}
                  >
                    <Text className="text-base text-white">{message.content}</Text>
                  </View>
                </View>
              );
            })}
          </View>
        </ScrollView>

        <View className="bg-card px-4 py-3">
          <View className="flex-row items-center gap-2">
            <View className="flex-1">
              <Input
                placeholder={placeholder}
                value={inputText}
                onChangeText={setInputText}
                returnKeyType="send"
                onSubmitEditing={handleSend}
                editable={!isComposerDisabled}
              />
            </View>
            <Button
              onPress={handleSend}
              label="Send message"
              accessibilityLabel="Send message"
              icon={<Send size={18} color="white" />}
              size="icon"
              isLoading={isLoading}
              disabled={isComposerDisabled || !inputText.trim()}
            />
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

function extractAiMessage(response: unknown): string {
  if (!response || typeof response !== "object") {
    throw new Error("Invalid AI response");
  }

  const record = response as Record<string, unknown>;
  const message = record.message;
  if (typeof message !== "string" || !message.trim()) {
    throw new Error("Missing AI message field");
  }

  return message.trim();
}
