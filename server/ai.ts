import { integrationStatus } from "./integrations";
import { chatbotaiEndpoint, openaiModel, providerChain, type EnvLike } from "./ai-provider";

type FetchLike = typeof fetch;
type AiOk = { text: string; provider: "chatbotai" | "openai" | "anthropic" | "deepseek" };
type AiMiss = { text: ""; provider: "local" };

export type CompleteResult = AiOk | AiMiss;

type CompleteOpts = {
  fetch?: FetchLike;
  env?: EnvLike;
};

async function readJson(res: Response): Promise<Record<string, unknown>> {
  try {
    return (await res.json()) as Record<string, unknown>;
  } catch {
    return {};
  }
}

async function tryChatBotAI(prompt: string, fetchImpl: FetchLike, env: EnvLike): Promise<string | null> {
  const key = env.CHATBOTAI_API_KEY?.trim();
  if (!key) return null;
  const res = await fetchImpl(chatbotaiEndpoint(env), {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: env.CHATBOTAI_MODEL?.trim() || openaiModel(env),
      messages: [{ role: "user", content: prompt }],
      max_tokens: 700,
    }),
  });
  const json = await readJson(res);
  const choices = json.choices as { message?: { content?: string } }[] | undefined;
  const text = choices?.[0]?.message?.content?.trim();
  if (text) return text;
  const content = json.content as { text?: string }[] | undefined;
  return content?.[0]?.text?.trim() || (typeof json.reply === "string" ? json.reply.trim() : null) || (typeof json.text === "string" ? json.text.trim() : null);
}

async function tryOpenAI(prompt: string, fetchImpl: FetchLike, env: EnvLike): Promise<string | null> {
  const key = env.OPENAI_API_KEY?.trim();
  if (!key) return null;
  const res = await fetchImpl("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: openaiModel(env),
      messages: [{ role: "user", content: prompt }],
      max_tokens: 700,
    }),
  });
  const json = await readJson(res);
  const choices = json.choices as { message?: { content?: string } }[] | undefined;
  const text = choices?.[0]?.message?.content?.trim();
  return text || null;
}

async function tryAnthropic(prompt: string, fetchImpl: FetchLike, env: EnvLike): Promise<string | null> {
  const key = env.ANTHROPIC_API_KEY?.trim();
  if (!key) return null;
  const res = await fetchImpl("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": key,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: env.ANTHROPIC_MODEL || "claude-3-5-haiku-latest",
      max_tokens: 700,
      messages: [{ role: "user", content: prompt }],
    }),
  });
  const json = await readJson(res);
  const content = json.content as { text?: string }[] | undefined;
  const text = content?.[0]?.text?.trim();
  return text || null;
}

async function tryDeepSeek(prompt: string, fetchImpl: FetchLike, env: EnvLike): Promise<string | null> {
  const key = env.DEEPSEEK_API_KEY?.trim();
  if (!key) return null;
  const res = await fetchImpl("https://api.deepseek.com/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: env.DEEPSEEK_MODEL || "deepseek-chat",
      messages: [{ role: "user", content: prompt }],
    }),
  });
  const json = await readJson(res);
  const choices = json.choices as { message?: { content?: string } }[] | undefined;
  const text = choices?.[0]?.message?.content?.trim();
  return text || null;
}

/** ChatBotAI → OpenAI → Anthropic → DeepSeek → local. A failed live call falls through. */
export async function complete(prompt: string, opts: CompleteOpts = {}): Promise<CompleteResult> {
  const fetchImpl = opts.fetch ?? fetch;
  const env = opts.env ?? process.env;
  for (const provider of providerChain(env)) {
    try {
      if (provider === "chatbotai") {
        const text = await tryChatBotAI(prompt, fetchImpl, env);
        if (text) return { text, provider: "chatbotai" };
      } else if (provider === "openai") {
        const text = await tryOpenAI(prompt, fetchImpl, env);
        if (text) return { text, provider: "openai" };
      } else if (provider === "anthropic") {
        const text = await tryAnthropic(prompt, fetchImpl, env);
        if (text) return { text, provider: "anthropic" };
      } else if (provider === "deepseek") {
        const text = await tryDeepSeek(prompt, fetchImpl, env);
        if (text) return { text, provider: "deepseek" };
      }
    } catch {
      /* try the next provider */
    }
  }
  return { text: "", provider: "local" };
}

export async function tacticalBriefing(input: { formation: string; prompt: string; locale: string; opponent?: string }) {
  const system = `Tu es Expert Tactique Football Royal Goose. Formation ${input.formation}. Adversaire: ${input.opponent || "n/a"}. Consigne: ${input.prompt}. Réponds en ${input.locale === "en" ? "anglais" : "français"} avec 4-6 phrases concrètes (pressing, largeur, set pieces, risque).`;
  const ai = await complete(system);
  if (ai.text) return { ...ai, mode: ai.provider };
  const fr = input.locale !== "en";
  const text = fr
    ? `Moteur local Royal Goose — ${input.formation} vs ${input.opponent || "adversaire"}. ${input.prompt} Plan: largeur sur les ailes, 3e homme au milieu, protection du latéral faible. Pressing déclenché sur la passe vers le 6 adverse (succès estimé 64%). Corners: 1er poteau. Transitions: ne pas laisser le dos du DG/DD exposé.`
    : `Royal Goose local engine — ${input.formation} vs ${input.opponent || "opponent"}. ${input.prompt} Plan: width, 3rd-man midfield, protect the weak full-back. Press on passes into their 6 (est. 64%).`;
  return { text, provider: "local" as const, mode: "local" };
}

export async function negotiateDeal(input: { playerName: string; value: number; status: string; locale: string }) {
  const prompt = `Négocie le transfert de ${input.playerName} valeur ${input.value}€ statut ${input.status}. 2 phrases, ${input.locale === "en" ? "English" : "français"}.`;
  const ai = await complete(prompt);
  if (ai.text) return { ...ai, mode: ai.provider };
  const fr = input.locale !== "en";
  const next =
    input.status === "veille" ? "negociation" : input.status === "negociation" ? "offre" : input.status === "offre" ? "accord" : "clos";
  const text = fr
    ? `Moteur local Transfergoose: contre-proposition ${(input.value * 1.15).toFixed(0)} € + clause de revente 15%. Statut → ${next}.`
    : `Local Transfergoose: counter ${(input.value * 1.15).toFixed(0)} € + 15% sell-on. Status → ${next}.`;
  return { text, provider: "local" as const, mode: "local", nextStatus: next };
}

export async function monthlyNarrative(input: { locale: string; fatigueAvg: number; players: number; alerts: number }) {
  const prompt = `Rapport mensuel club: ${input.players} joueurs, fatigue moy ${input.fatigueAvg}, ${input.alerts} alertes. 3 phrases.`;
  const ai = await complete(prompt);
  if (ai.text) return { ...ai, mode: ai.provider };
  const fr = input.locale !== "en";
  const text = fr
    ? `Rapport local: effectif ${input.players} joueurs, fatigue moyenne ${input.fatigueAvg}. ${input.alerts} alertes actives. Recommandation: micro-cycle de décharge avant le prochain match et traitement des contrats J-30.`
    : `Local report: ${input.players} players, avg fatigue ${input.fatigueAvg}, ${input.alerts} alerts. Recommendation: unload before the next match and handle J-30 contracts.`;
  return { text, provider: "local" as const, mode: "local" };
}

export async function designIdea(input: { locale: string }) {
  const ai = await complete(`Propose une amélioration UI dashboard football fatigue. Ligne 1 = titre court. Ligne 2 = une phrase. Langue ${input.locale}`);
  const fr = input.locale !== "en";
  const fallbackTitle = fr ? "Contraste alertes dashboard" : "Dashboard alert contrast";
  const fallbackSummary = fr
    ? "Bandeau fatigue plus lisible et CTA repos en un clic."
    : "Clearer fatigue banner and one-click rest CTA.";
  if (ai.text) {
    const lines = ai.text.split("\n").map((l) => l.trim()).filter(Boolean);
    return {
      ...ai,
      mode: ai.provider,
      title: lines[0]?.slice(0, 80) || fallbackTitle,
      summary: lines.slice(1).join(" ") || ai.text,
    };
  }
  return {
    text: `${fallbackTitle} — ${fallbackSummary}`,
    title: fallbackTitle,
    summary: fallbackSummary,
    provider: "local" as const,
    mode: "local",
  };
}

export async function videoNote(input: { opponent: string; locale: string }) {
  const status = integrationStatus();
  const ai = await complete(`Clip highlight vs ${input.opponent}. 1 phrase annotation tactique.`);
  const prefix = status.vision.mode === "yolo" ? "YOLO Vision" : "Indexation locale";
  if (ai.text) return { text: `${prefix}: ${ai.text}`, mode: status.vision.mode, provider: ai.provider };
  const fr = input.locale !== "en";
  const text = fr
    ? `${prefix}: sprint + frappe vs ${input.opponent}. Annotation: bascule côté faible après récupération haute.`
    : `${prefix}: sprint + shot vs ${input.opponent}. Note: switch to the weak side after high recoveries.`;
  return { text, mode: status.vision.mode, provider: "local" as const };
}

export async function scoutRecommendation(input: {
  targetName: string;
  club?: string;
  country?: string;
  position?: string;
  age?: number;
  notes?: string;
  locale: string;
}) {
  const prompt = `Scout football Royal Goose. Cible: ${input.targetName}, poste ${input.position || "n/a"}, ${input.age ?? "?"} ans, club ${input.club || "n/a"}, pays ${input.country || "n/a"}. Notes: ${input.notes || "aucune"}. 3 phrases (forces, risques, décision watch/recommend). ${input.locale === "en" ? "English" : "français"}.`;
  const ai = await complete(prompt);
  if (ai.text) return { ...ai, mode: ai.provider };
  const fr = input.locale !== "en";
  const text = fr
    ? `Moteur local Scout: ${input.targetName} (${input.position || "n/a"}, ${input.country || "n/a"}). Profil à suivre — timing, duels, adaptation Elite One. Décision: watch.`
    : `Local scout engine: ${input.targetName} (${input.position || "n/a"}, ${input.country || "n/a"}). Watch profile — timing, duels, Elite One fit. Decision: watch.`;
  return { text, provider: "local" as const, mode: "local" };
}

export async function chatReply(input: {
  message: string;
  locale: string;
  history?: { role: "user" | "assistant"; content: string }[];
}) {
  const history = (input.history || []).slice(-8);
  const transcript = history.map((m) => `${m.role}: ${m.content}`).join("\n");
  const prompt = `Tu es l'assistant ChatBotAI intégré à Royal Goose (clubs de football africains). Réponds en ${input.locale === "en" ? "anglais" : "français"}, 2-6 phrases concrètes.\n${transcript}\nuser: ${input.message}`;
  const ai = await complete(prompt);
  if (ai.text) return { ...ai, mode: ai.provider };
  const fr = input.locale !== "en";
  const snippet = input.message.slice(0, 120);
  const text = fr
    ? `Moteur local ChatBotAI: message reçu (« ${snippet} »). Réglez CHATBOTAI_API_KEY ou OPENAI_API_KEY sur Railway pour des réponses ChatGPT.`
    : `Local ChatBotAI engine: got “${snippet}”. Set CHATBOTAI_API_KEY or OPENAI_API_KEY on Railway for ChatGPT replies.`;
  return { text, provider: "local" as const, mode: "local" };
}
