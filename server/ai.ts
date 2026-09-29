import { integrationStatus } from "./integrations";

async function complete(prompt: string) {
  const status = integrationStatus();
  if (status.ai.mode === "anthropic" && process.env.ANTHROPIC_API_KEY) {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.ANTHROPIC_MODEL || "claude-3-5-haiku-latest",
        max_tokens: 700,
        messages: [{ role: "user", content: prompt }],
      }),
    });
    const json = (await res.json()) as { content?: { text?: string }[] };
    const text = json.content?.[0]?.text;
    if (text) return { text, provider: "anthropic" as const };
  }
  if (status.ai.mode === "deepseek" && process.env.DEEPSEEK_API_KEY) {
    const res = await fetch("https://api.deepseek.com/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.DEEPSEEK_MODEL || "deepseek-chat",
        messages: [{ role: "user", content: prompt }],
      }),
    });
    const json = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    const text = json.choices?.[0]?.message?.content;
    if (text) return { text, provider: "deepseek" as const };
  }
  return { text: "", provider: "local" as const };
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
