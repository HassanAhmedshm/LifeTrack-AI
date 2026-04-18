import { useUserStore } from "../store/useUserStore";

const GROQ_CHAT_COMPLETIONS_URL =
  "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = "openai/gpt-oss-120b";
const AI_REQUEST_TIMEOUT_MS = 20000;

type ChatMessage = {
  role: "system" | "user";
  content: string;
};

function readObjectValue(
  input: unknown,
  key: string
): unknown {
  if (!input || typeof input !== "object") {
    return undefined;
  }

  const record = input as Record<string, unknown>;
  return record[key];
}

function extractErrorMessage(payload: unknown): string | null {
  const error = readObjectValue(payload, "error");
  const message = readObjectValue(error, "message");
  return typeof message === "string" && message.trim() ? message : null;
}

function extractMessageContent(payload: unknown): string | null {
  const choices = readObjectValue(payload, "choices");
  if (!Array.isArray(choices) || choices.length === 0) {
    return null;
  }

  const firstChoice = choices[0];
  const message = readObjectValue(firstChoice, "message");
  const content = readObjectValue(message, "content");
  return typeof content === "string" && content.trim() ? content : null;
}

function parseJsonPayload(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

export async function sendPrompt(
  prompt: string,
  schemaInstruction?: string
): Promise<unknown> {
  const apiKey = useUserStore.getState().groqApiKey?.trim();
  if (!apiKey) {
    throw new Error("API Key missing");
  }

  const normalizedPrompt = prompt.trim();
  if (!normalizedPrompt) {
    throw new Error("Prompt is required");
  }

  const normalizedSchemaInstruction = schemaInstruction?.trim();
  const messages: ChatMessage[] = normalizedSchemaInstruction
    ? [
        {
          role: "system",
          content: `Respond with a valid JSON object only. ${normalizedSchemaInstruction}`,
        },
        { role: "user", content: normalizedPrompt },
      ]
    : [{ role: "user", content: normalizedPrompt }];

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), AI_REQUEST_TIMEOUT_MS);
  let response: Response;
  try {
    response = await fetch(GROQ_CHAT_COMPLETIONS_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      signal: controller.signal,
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages,
        response_format: { type: "json_object" },
      }),
    });
  } catch (error) {
    if (isTimeoutOrNetworkError(error)) {
      return createSafeFallbackResponse(schemaInstruction);
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }

  const rawResponse = await response.text();
  const payload = parseJsonPayload(rawResponse);

  if (!response.ok) {
    const apiMessage = extractErrorMessage(payload);
    const fallbackMessage = rawResponse.trim() || `HTTP ${response.status}`;
    throw new Error(apiMessage ?? fallbackMessage);
  }

  if (!payload) {
    throw new Error("Invalid Groq response payload");
  }

  const content = extractMessageContent(payload);
  if (!content) {
    throw new Error("Invalid Groq response: missing message content");
  }

  const parsedContent = parseJsonPayload(content);
  if (!parsedContent || typeof parsedContent !== "object") {
    throw new Error("Invalid JSON content in model response");
  }

  return parsedContent;
}

function isTimeoutOrNetworkError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }

  const message = error.message.toLowerCase();
  return (
    error.name === "AbortError" ||
    message.includes("timed out") ||
    message.includes("timeout") ||
    message.includes("network request failed") ||
    message.includes("network error")
  );
}

function createSafeFallbackResponse(schemaInstruction?: string): unknown {
  const message =
    "I couldn't reach the AI service right now. Please try again in a moment.";
  const normalizedSchema = schemaInstruction?.toUpperCase() ?? "";

  if (normalizedSchema.includes("ADD_EXERCISE")) {
    return { action: "MESSAGE", message };
  }

  return { message };
}
