import { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { Send } from "lucide-react-native";
import { Input } from "../src/components/ui/Input";
import { Button } from "../src/components/ui/Button";
import { useUserStore } from "../src/store/useUserStore";
import * as aiService from "../src/services/ai";

type ChatMessage = {
  id: string;
  role: "user" | "ai";
  content: string;
  isError?: boolean;
};

type RecipeStep = {
  id: string;
  text: string;
  completed: boolean;
};

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: "chef-ai-1",
    role: "ai",
    content: "Welcome to Chef AI. Ask for a quick recipe or follow your cooking steps below.",
  },
];

const INITIAL_STEPS: RecipeStep[] = [
  { id: "step-1", text: "Crack eggs into a bowl", completed: false },
  { id: "step-2", text: "Whisk with salt and pepper", completed: false },
  { id: "step-3", text: "Heat pan with a little butter", completed: false },
  { id: "step-4", text: "Cook gently and fold until set", completed: false },
];

export default function ChefScreen() {
  const groqApiKey = useUserStore((state) => state.groqApiKey);
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [inputText, setInputText] = useState("");
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [steps, setSteps] = useState<RecipeStep[]>(INITIAL_STEPS);
  const [pendingEncouragementCount, setPendingEncouragementCount] = useState(0);

  const hasApiKey = Boolean(groqApiKey?.trim());
  const isComposerDisabled = !hasApiKey || isChatLoading;
  const placeholder = hasApiKey
    ? "Ask Chef AI..."
    : "Enter API Key in Settings";

  const handleSend = async () => {
    if (isComposerDisabled) {
      return;
    }

    const prompt = inputText.trim();
    if (!prompt) {
      return;
    }

    setMessages((prev) => [
      ...prev,
      { id: `chef-user-${Date.now()}`, role: "user", content: prompt },
    ]);
    setInputText("");
    setIsChatLoading(true);

    try {
      const response = await aiService.sendPrompt(
        prompt,
        "Respond in JSON format with a 'message' string field."
      );
      const message = extractAiMessage(response);
      setMessages((prev) => [
        ...prev,
        { id: `chef-ai-${Date.now()}`, role: "ai", content: message },
      ]);
    } catch (error) {
      console.error("Chef chat request failed:", error);
      setMessages((prev) => [
        ...prev,
        {
          id: `chef-ai-error-${Date.now()}`,
          role: "ai",
          content: "Could not fetch Chef AI response. Please try again.",
          isError: true,
        },
      ]);
    } finally {
      setIsChatLoading(false);
    }
  };

  const handleStepToggle = (stepId: string) => {
    const step = steps.find((item) => item.id === stepId);
    if (!step) {
      return;
    }

    const nextCompleted = !step.completed;
    setSteps((prev) =>
      prev.map((item) =>
        item.id === stepId ? { ...item, completed: nextCompleted } : item
      )
    );

    if (nextCompleted) {
      void triggerCompletionEncouragement(step.text);
    }
  };

  const triggerCompletionEncouragement = async (stepName: string) => {
    setPendingEncouragementCount((count) => count + 1);
    try {
      const response = await aiService.sendPrompt(
        `The user just completed step: ${stepName}. Give a very short, 1-sentence encouraging response.`,
        "Respond in JSON format with a 'message' string field."
      );
      const message = extractAiMessage(response);
      setMessages((prev) => [
        ...prev,
        { id: `chef-ai-step-${Date.now()}`, role: "ai", content: message },
      ]);
    } catch (error) {
      console.error("Chef encouragement request failed:", error);
      setMessages((prev) => [
        ...prev,
        {
          id: `chef-ai-step-fallback-${Date.now()}`,
          role: "ai",
          content: "Great job staying consistent—keep it going!",
          isError: true,
        },
      ]);
    } finally {
      setPendingEncouragementCount((count) => Math.max(0, count - 1));
    }
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-dark"
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View className="flex-1 bg-dark px-4 pt-4">
        <Text className="text-3xl font-bold text-white">Chef AI</Text>
        <Text className="mt-2 text-white/70">
          Chat while you cook, then check off each recipe step.
        </Text>

        <View className="mt-4 flex-[3] overflow-hidden rounded-2xl bg-card">
          <ScrollView className="flex-1 px-4 pt-4">
            <View className="gap-3 pb-4">
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
                          : "rounded-2xl rounded-bl-none bg-dark"
                      }`}
                    >
                      <Text className="text-base text-white">{message.content}</Text>
                    </View>
                  </View>
                );
              })}
            </View>
          </ScrollView>

          <View className="border-t border-white/10 bg-card px-4 py-3">
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
                label="Send chef prompt"
                accessibilityLabel="Send chef prompt"
                icon={<Send size={18} color="white" />}
                size="icon"
                isLoading={isChatLoading}
                disabled={isComposerDisabled || !inputText.trim()}
              />
            </View>
          </View>
        </View>

        <View className="mt-4 flex-[2] rounded-2xl bg-card p-4">
          <View className="flex-row items-center justify-between">
            <Text className="text-lg font-semibold text-white">Interactive Recipe</Text>
            {pendingEncouragementCount > 0 ? (
              <ActivityIndicator size="small" color="#FF7A00" />
            ) : null}
          </View>
          <ScrollView className="mt-3">
            <View className="gap-3 pb-2">
              {steps.map((step) => (
                <Pressable
                  key={step.id}
                  className={`flex-row items-center gap-3 rounded-2xl px-3 py-3 ${
                    step.completed ? "bg-dark/60 opacity-70" : "bg-dark"
                  }`}
                  onPress={() => handleStepToggle(step.id)}
                >
                  <View
                    className={`h-5 w-5 rounded-full border-2 ${
                      step.completed ? "border-brand bg-brand" : "border-white/40"
                    }`}
                  />
                  <Text
                    className={`flex-1 text-sm text-white ${
                      step.completed ? "line-through" : ""
                    }`}
                  >
                    {step.text}
                  </Text>
                </Pressable>
              ))}
            </View>
          </ScrollView>
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
