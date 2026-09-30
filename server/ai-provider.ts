export type AiProvider = "chatbotai" | "openai" | "anthropic" | "deepseek" | "local";

/** Production OpenAI default: cheaper ops. Override with OPENAI_MODEL=gpt-4.1. */
export const DEFAULT_OPENAI_MODEL = "gpt-4o-mini";

/** Resolved from the incomplete https://chatbotai URL — consumer multi-model chat site. */
export const DEFAULT_CHATBOTAI_URL = "https://chatbotai.com";
export const DEFAULT_CHATBOTAI_EMBED = "https://chatbotai.com/ai-chat";

export type EnvLike = Record<string, string | undefined>;

export function openaiModel(env: EnvLike = process.env): string {
  const named = env.OPENAI_MODEL?.trim();
  return named || DEFAULT_OPENAI_MODEL;
}

export function hasKey(value: string | undefined): boolean {
  return Boolean(value?.trim());
}

/** OpenAI-compatible chat completions URL. Full path in CHATBOTAI_URL wins. */
export function chatbotaiEndpoint(env: EnvLike = process.env): string {
  const raw = (env.CHATBOTAI_URL || DEFAULT_CHATBOTAI_URL).trim().replace(/\/$/, "");
  if (/\/(v1\/)?chat\/completions$/i.test(raw) || /\/messages$/i.test(raw)) return raw;
  return `${raw}/v1/chat/completions`;
}

export function chatbotPublicConfig(env: EnvLike = process.env): {
  site: string;
  hasKey: boolean;
  widgetId: string;
  embedUrl: string;
  label: string;
} {
  const widgetId = env.CHATBOTAI_WIDGET_ID?.trim() || "";
  const explicitEmbed = env.CHATBOTAI_EMBED_URL?.trim() || "";
  const embedOn = env.CHATBOTAI_EMBED === "true";
  const embedUrl = explicitEmbed || (embedOn ? DEFAULT_CHATBOTAI_EMBED : "");
  const keyed = hasKey(env.CHATBOTAI_API_KEY);
  return {
    site: DEFAULT_CHATBOTAI_URL,
    hasKey: keyed,
    widgetId,
    embedUrl,
    label: keyed
      ? "ChatBotAI (proxy serveur)"
      : widgetId || embedUrl
        ? "ChatBotAI widget / embed"
        : "ChatBotAI — clé absente, fallback ChatGPT",
  };
}

/** Fallback order: ChatBotAI → OpenAI → Anthropic → DeepSeek → labeled local engine. */
export function selectAiProvider(env: EnvLike = process.env): {
  mode: AiProvider;
  label: string;
  fallback: boolean;
  intended: "openai";
  connected: boolean;
} {
  if (hasKey(env.CHATBOTAI_API_KEY)) {
    return {
      mode: "chatbotai",
      label: "ChatBotAI (proxy) · ChatGPT fallback prêt",
      fallback: false,
      intended: "openai",
      connected: true,
    };
  }
  if (hasKey(env.OPENAI_API_KEY)) {
    return {
      mode: "openai",
      label: `ChatGPT (OpenAI) · ${openaiModel(env)}`,
      fallback: false,
      intended: "openai",
      connected: true,
    };
  }
  if (hasKey(env.ANTHROPIC_API_KEY)) {
    return {
      mode: "anthropic",
      label: "Claude (Anthropic) — fallback (OPENAI_API_KEY absente)",
      fallback: true,
      intended: "openai",
      connected: true,
    };
  }
  if (hasKey(env.DEEPSEEK_API_KEY)) {
    return {
      mode: "deepseek",
      label: "DeepSeek — fallback (OPENAI_API_KEY absente)",
      fallback: true,
      intended: "openai",
      connected: true,
    };
  }
  return {
    mode: "local",
    label: "ChatGPT (OpenAI) — clé absente, moteur local",
    fallback: true,
    intended: "openai",
    connected: false,
  };
}

export function providerChain(env: EnvLike = process.env): AiProvider[] {
  const chain: AiProvider[] = [];
  if (hasKey(env.CHATBOTAI_API_KEY)) chain.push("chatbotai");
  if (hasKey(env.OPENAI_API_KEY)) chain.push("openai");
  if (hasKey(env.ANTHROPIC_API_KEY)) chain.push("anthropic");
  if (hasKey(env.DEEPSEEK_API_KEY)) chain.push("deepseek");
  chain.push("local");
  return chain;
}
