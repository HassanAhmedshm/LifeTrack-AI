import { useState } from "react";
import { KeyboardAvoidingView, Platform, Text, View } from "react-native";
import { Input } from "../src/components/ui/Input";
import { Button } from "../src/components/ui/Button";
import { useUserStore } from "../src/store/useUserStore";

export default function SettingsScreen() {
  const currentApiKey = useUserStore((state) => state.groqApiKey);
  const setApiKey = useUserStore((state) => state.setApiKey);

  const [apiKeyInput, setApiKeyInput] = useState(currentApiKey ?? "");
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");

  const handleSave = async () => {
    setIsSaving(true);
    setMessage("");
    try {
      await setApiKey(apiKeyInput);
      setMessage("API key saved.");
    } catch (error) {
      console.error("Failed to save API key:", error);
      setMessage("Could not save API key. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-dark"
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View className="flex-1 bg-dark px-4 pt-4">
        <Text className="text-3xl font-bold text-white">Settings</Text>
        <Text className="mt-2 text-white/70">
          Manage your Groq API key for AI features.
        </Text>

        <View className="mt-6 rounded-2xl bg-card p-4">
          <Text className="text-sm font-semibold text-white/80">Groq API Key</Text>
          <View className="mt-2">
            <Input
              placeholder="Enter your Groq API key"
              value={apiKeyInput}
              onChangeText={setApiKeyInput}
              autoCapitalize="none"
              autoCorrect={false}
              editable={!isSaving}
            />
          </View>
          {message ? <Text className="mt-3 text-sm text-white/80">{message}</Text> : null}
          <View className="mt-4">
            <Button
              label="Save Key"
              onPress={handleSave}
              isLoading={isSaving}
              disabled={isSaving}
            />
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
