import assert from "node:assert/strict";
import test from "node:test";
import { chatbotaiEndpoint, DEFAULT_OPENAI_MODEL, providerChain, selectAiProvider } from "./ai-provider.ts";
import { complete } from "./ai.ts";

test("no keys: ChatGPT labeled local fallback", () => {
  const ai = selectAiProvider({});
  assert.equal(ai.mode, "local");
  assert.equal(ai.fallback, true);
  assert.match(ai.label, /ChatGPT/);
  assert.deepEqual(providerChain({}), ["local"]);
});

test("OPENAI_API_KEY selects ChatGPT as production LLM", () => {
  const ai = selectAiProvider({ OPENAI_API_KEY: "sk-test" });
  assert.equal(ai.mode, "openai");
  assert.equal(ai.fallback, false);
  assert.match(ai.label, /gpt-4o-mini|OpenAI/);
  assert.equal(DEFAULT_OPENAI_MODEL, "gpt-4o-mini");
});

test("ChatBotAI key wins over OpenAI in the chain", () => {
  const env = { CHATBOTAI_API_KEY: "cb-test", OPENAI_API_KEY: "sk-test" };
  assert.equal(selectAiProvider(env).mode, "chatbotai");
  assert.deepEqual(providerChain(env).slice(0, 2), ["chatbotai", "openai"]);
});

test("without ChatBotAI, OpenAI beats Anthropic", () => {
  const env = { OPENAI_API_KEY: "sk-test", ANTHROPIC_API_KEY: "ant" };
  assert.equal(selectAiProvider(env).mode, "openai");
  assert.deepEqual(providerChain(env).slice(0, 2), ["openai", "anthropic"]);
});

test("chatbotaiEndpoint defaults to chatbotai.com completions", () => {
  assert.equal(chatbotaiEndpoint({}), "https://chatbotai.com/v1/chat/completions");
  assert.equal(
    chatbotaiEndpoint({ CHATBOTAI_URL: "https://chatbotai.com/v1/chat/completions" }),
    "https://chatbotai.com/v1/chat/completions",
  );
});

test("complete uses ChatBotAI when key present (stubbed fetch)", async () => {
  const urls: string[] = [];
  const fakeFetch = (async (url: string | URL) => {
    urls.push(String(url));
    return {
      json: async () => ({ choices: [{ message: { content: "from chatbotai" } }] }),
    };
  }) as typeof fetch;
  const out = await complete("hello", {
    fetch: fakeFetch,
    env: { CHATBOTAI_API_KEY: "cb", OPENAI_API_KEY: "sk" },
  });
  assert.equal(out.provider, "chatbotai");
  assert.equal(out.text, "from chatbotai");
  assert.match(urls[0], /chatbotai\.com/);
});

test("complete uses OpenAI when ChatBotAI key absent (stubbed fetch)", async () => {
  const urls: string[] = [];
  const fakeFetch = (async (url: string | URL) => {
    urls.push(String(url));
    return {
      json: async () => ({ choices: [{ message: { content: "from openai" } }] }),
    };
  }) as typeof fetch;
  const out = await complete("hello", { fetch: fakeFetch, env: { OPENAI_API_KEY: "sk" } });
  assert.equal(out.provider, "openai");
  assert.equal(out.text, "from openai");
  assert.match(urls[0], /api\.openai\.com/);
});

test("complete stays local without any keys and without fetch", async () => {
  const out = await complete("hello", { env: {} });
  assert.equal(out.provider, "local");
  assert.equal(out.text, "");
});
