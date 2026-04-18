import { useMemo, useRef, useState } from "react";
import {
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  View,
} from "react-native";
import { Camera, Mic, Send } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { Input } from "../../src/components/ui/Input";
import { Button } from "../../src/components/ui/Button";
import { useUserStore } from "../../src/store/useUserStore";
import { runAssistantPrompt } from "../../src/services/assistant";
import { SuggestionChips } from "../../src/components/chat/SuggestionChips";
import { ChatBubble } from "../../src/components/chat/ChatBubble";
import { WaveformPlayer } from "../../src/components/chat/WaveformPlayer";

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
  const scrollViewRef = useRef<ScrollView | null>(null);
  const hasApiKey = Boolean(groqApiKey?.trim());
  const isComposerDisabled = !hasApiKey || isLoading;
  const placeholder = hasApiKey
    ? "Type your message..."
    : "Enter API Key in Settings";
  const suggestionChips = useMemo(
    () => [
      "Build a sustainable fat-loss routine",
      "Add a morning run to my week",
      "Plan macros for recovery day",
      "Create a 4-day strength split",
    ],
    []
  );

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
      const result = await runAssistantPrompt(prompt, "chat");
      const actionSuffix =
        result.performedActions.length > 0
          ? ` (${result.performedActions.length} action${
              result.performedActions.length > 1 ? "s" : ""
            } applied)`
          : "";
      setMessages((currentMessages) => [
        ...currentMessages,
        {
          id: `ai-${Date.now()}`,
          role: "ai",
          content: `${result.message}${actionSuffix}`,
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

  const handleSuggestionPress = (chip: string) => {
    if (isComposerDisabled) {
      return;
    }
    setInputText(chip);
  };

  const handleToolLongPress = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-[#0f0f0f]"
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View className="flex-1 bg-[#0f0f0f]">
        <ScrollView
          ref={scrollViewRef}
          className="flex-1 px-4 pt-4"
          onContentSizeChange={() =>
            scrollViewRef.current?.scrollToEnd({ animated: true })
          }
        >
          <View className="gap-3 pb-6">
            <SuggestionChips
              chips={suggestionChips}
              disabled={isComposerDisabled}
              onSelect={handleSuggestionPress}
            />
            <WaveformPlayer sourceUrl="https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3" />

            {messages.map((message) => {
              const isUser = message.role === "user";
              return (
                <View
                  key={message.id}
                  className={isUser ? "items-end" : "items-start"}
                >
                  <ChatBubble
                    role={message.role}
                    content={message.content}
                    isError={message.isError}
                  />
                </View>
              );
            })}
          </View>
        </ScrollView>

        <View className="border-t border-white/10 bg-black/70 px-4 py-3">
          <View className="flex-row items-center gap-2">
            <Pressable
              onLongPress={handleToolLongPress}
              className="h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-white/10"
              accessibilityRole="button"
              accessibilityLabel="Open camera tools"
            >
              <Camera size={18} color="white" />
            </Pressable>
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
            <Pressable
              onLongPress={handleToolLongPress}
              className="h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-white/10"
              accessibilityRole="button"
              accessibilityLabel="Open microphone tools"
            >
              <Mic size={18} color="white" />
            </Pressable>
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
