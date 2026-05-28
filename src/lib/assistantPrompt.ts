const ASSISTANT_PROMPT_KEY = "aetherlms.assistantPrompt";

export function queueAssistantPrompt(prompt: string) {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(ASSISTANT_PROMPT_KEY, prompt);
}

export function consumeAssistantPrompt() {
  if (typeof window === "undefined") return "";

  const prompt = window.sessionStorage.getItem(ASSISTANT_PROMPT_KEY) ?? "";
  window.sessionStorage.removeItem(ASSISTANT_PROMPT_KEY);
  return prompt;
}