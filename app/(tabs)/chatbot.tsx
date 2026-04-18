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

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

const SAMPLE_MESSAGES: ChatMessage[] = [
  {
    id: "assistant-1",
    role: "assistant",
    content: "Hey! I can help plan workouts, nutrition habits, and weekly goals.",
  },
  {
    id: "user-1",
    role: "user",
    content: "Create a 3-day strength split for this week.",
  },
  {
    id: "assistant-2",
    role: "assistant",
    content: "Great choice. I'll start with Push, Pull, and Legs and keep sessions under 60 minutes.",
  },
];

export default function ChatbotScreen() {
  const [draft, setDraft] = useState("");

  const handleSend = () => {
    setDraft("");
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-dark"
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View className="flex-1 bg-dark">
        <ScrollView className="flex-1 px-4 pt-4">
          <View className="gap-3 pb-6">
            {SAMPLE_MESSAGES.map((message) => {
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
                placeholder="Type your message..."
                value={draft}
                onChangeText={setDraft}
                returnKeyType="send"
                onSubmitEditing={handleSend}
              />
            </View>
            <Button
              onPress={handleSend}
              label="Send message"
              accessibilityLabel="Send message"
              icon={<Send size={18} color="white" />}
              size="icon"
              disabled={!draft.trim()}
            />
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
