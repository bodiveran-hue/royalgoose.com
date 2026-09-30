import { useEffect, useRef, useState } from "react";
import { Bot, Send } from "lucide-react";
import { useApp } from "../context/AppContext";
import { Badge, Button, Card, PageHeader } from "../components/ui";
import { sendChat, type ChatReply } from "../lib/api";
import type { IntegrationsStatus } from "../lib/types";

type Turn = { role: "user" | "assistant"; content: string; mode?: string };

export function providerDisplayName(mode?: string) {
  if (mode === "openai") return "ChatGPT";
  if (mode === "chatbotai") return "ChatBotAI";
  if (mode === "anthropic") return "Claude";
  if (mode === "deepseek") return "DeepSeek";
  if (mode === "local") return "local";
  return mode || "";
}

export function agentIsOn(integrations: IntegrationsStatus | null, last?: Pick<ChatReply, "connected" | "provider">) {
  if (last && typeof last.connected === "boolean") return last.connected;
  if (!integrations?.ai) return false;
  if (typeof integrations.ai.connected === "boolean") return integrations.ai.connected;
  return integrations.ai.mode !== "local";
}

export function AgentStatusChip({ last }: { last?: Pick<ChatReply, "connected" | "provider" | "error"> }) {
  const { locale, integrations } = useApp();
  const fr = locale !== "en";
  const on = agentIsOn(integrations, last);
  const mode = last?.connected ? last.provider : last && last.connected === false ? "local" : integrations?.ai.mode;
  const name = providerDisplayName(mode) || "ChatGPT";
  const rawError = last?.error && last.error !== "no_live_provider" ? last.error : undefined;
  const label = on
    ? fr
      ? `Agent IA activé · ${name}`
      : `AI agent on · ${name}`
    : rawError
      ? fr
        ? `Agent IA déconnecté · ${rawError}`
        : `AI agent disconnected · ${rawError}`
      : fr
        ? "Agent IA hors ligne · local"
        : "AI agent offline · local";
  return (
    <Badge tone={on ? "green" : "gold"}>
      <span className={`h-1.5 w-1.5 rounded-full ${on ? "bg-emerald-600" : "bg-amber-500"}`} />
      {label}
    </Badge>
  );
}

export function ChatbotPage() {
  const { locale, integrations } = useApp();
  const fr = locale !== "en";
  const [embedUrl, setEmbedUrl] = useState("");
  const [site, setSite] = useState("https://chatbotai.com");

  useEffect(() => {
    void fetch("/api/chatbot/config")
      .then((r) => r.json())
      .then((c: { embedUrl?: string; site?: string }) => {
        if (c.embedUrl) setEmbedUrl(c.embedUrl);
        if (c.site) setSite(c.site);
      })
      .catch(() => undefined);
  }, []);

  return (
    <div>
      <PageHeader
        title={fr ? "Agent IA" : "AI Agent"}
        subtitle={
          fr
            ? "ChatBotAI dans l'app — les messages passent par le serveur Node (clés jamais dans le navigateur)."
            : "ChatBotAI in the app — messages go through the Node server (keys never in the browser)."
        }
        actions={<AgentStatusChip />}
      />
      <p className="mb-4 text-sm text-slate-600">
        {fr ? "Source : " : "Source: "}
        <a className="text-emerald-800 underline" href={site} target="_blank" rel="noreferrer">
          {site}
        </a>
        {" · "}
        {integrations?.chatbot?.label || integrations?.ai.label}
      </p>
      <ChatTranscript locale={locale} tall />
      {embedUrl ? (
        <Card className="mt-4 overflow-hidden p-0">
          <div className="border-b border-slate-200 bg-slate-50 px-4 py-2 text-xs text-slate-500">
            {fr ? "Embed étiqueté (CHATBOTAI_EMBED / CHATBOTAI_EMBED_URL)" : "Labeled embed (CHATBOTAI_EMBED / CHATBOTAI_EMBED_URL)"}
          </div>
          <iframe
            title="ChatBotAI embed"
            src={embedUrl}
            className="h-[420px] w-full border-0"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
            referrerPolicy="no-referrer"
          />
        </Card>
      ) : null}
    </div>
  );
}

export function ChatTranscript({ locale, tall = false }: { locale: string; tall?: boolean }) {
  const fr = locale !== "en";
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [last, setLast] = useState<Pick<ChatReply, "connected" | "provider" | "error">>();
  const [turns, setTurns] = useState<Turn[]>([
    {
      role: "assistant",
      content: fr
        ? "Agent IA Royal Goose prêt. Posez une question tactique, scout, fatigue ou transfert."
        : "Royal Goose AI agent ready. Ask about tactics, scouting, fatigue or transfers.",
      mode: "intro",
    },
  ]);
  const bottom = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setTurns((prev) => {
      if (prev.length === 1 && prev[0].mode === "intro") {
        return [
          {
            role: "assistant",
            content: fr
              ? "Agent IA Royal Goose prêt. Posez une question tactique, scout, fatigue ou transfert."
              : "Royal Goose AI agent ready. Ask about tactics, scouting, fatigue or transfers.",
            mode: "intro",
          },
        ];
      }
      return prev;
    });
  }, [fr]);

  useEffect(() => {
    bottom.current?.scrollIntoView({ behavior: "smooth" });
  }, [turns, busy]);

  async function send() {
    const message = input.trim();
    if (!message || busy) return;
    setInput("");
    const nextTurns: Turn[] = [...turns, { role: "user", content: message }];
    setTurns(nextTurns);
    setBusy(true);
    try {
      const history = nextTurns
        .filter((t) => t.mode !== "intro")
        .map((t) => ({ role: t.role, content: t.content }));
      const out = await sendChat(message, locale, history.slice(0, -1));
      setLast({ connected: out.connected, provider: out.provider, error: out.error });
      setTurns([...nextTurns, { role: "assistant", content: out.text, mode: out.mode || out.provider }]);
    } catch {
      setLast({ connected: false, provider: "local", error: "server_unreachable" });
      setTurns([
        ...nextTurns,
        {
          role: "assistant",
          content: fr
            ? "Agent IA déconnecté — le serveur chat n'a pas répondu. Vérifiez npm start / l'API."
            : "AI agent disconnected — chat server did not respond. Check npm start / the API.",
          mode: "error",
        },
      ]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className="flex flex-col overflow-hidden">
      <div className="flex items-center justify-between border-b border-slate-200 px-4 py-2">
        <AgentStatusChip last={last} />
      </div>
      <div className={`space-y-3 overflow-y-auto p-4 ${tall ? "min-h-[360px] max-h-[560px]" : "h-72"}`}>
        {turns.map((t, i) => (
          <div key={`${t.role}-${i}`} className={`flex ${t.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${
                t.role === "user" ? "bg-emerald-700 text-white" : "bg-slate-100 text-slate-800"
              }`}
            >
              <p>{t.content}</p>
              {t.mode && t.mode !== "intro" ? (
                <p className={`mt-1 text-[10px] ${t.role === "user" ? "text-emerald-100" : "text-slate-400"}`}>
                  {t.mode === "local"
                    ? fr
                      ? "moteur local — agent déconnecté"
                      : "local engine — agent disconnected"
                    : t.mode === "openai"
                      ? "ChatGPT"
                      : t.mode === "chatbotai"
                        ? "ChatBotAI"
                        : t.mode}
                </p>
              ) : null}
            </div>
          </div>
        ))}
        {busy ? <p className="text-xs text-slate-400">{fr ? "Rédaction…" : "Writing…"}</p> : null}
        <div ref={bottom} />
      </div>
      <form
        className="border-t border-slate-200 p-3"
        onSubmit={(e) => {
          e.preventDefault();
          void send();
        }}
      >
        <div className="flex items-center rounded-xl border border-slate-200 bg-white ring-emerald-600/30 focus-within:ring-4">
          <input
            className="h-10 min-w-0 flex-1 bg-transparent px-3 text-sm outline-none"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={fr ? "Votre message…" : "Your message…"}
          />
          <Button type="submit" disabled={busy || !input.trim()} size="sm" className="mr-1 shrink-0">
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </form>
    </Card>
  );
}

export function ChatbotDock() {
  const { locale, integrations } = useApp();
  const fr = locale !== "en";
  const [open, setOpen] = useState(false);
  const [widgetId, setWidgetId] = useState("");
  const on = agentIsOn(integrations);

  useEffect(() => {
    void fetch("/api/chatbot/config")
      .then((r) => r.json())
      .then((c: { widgetId?: string }) => {
        if (c.widgetId) setWidgetId(c.widgetId);
      })
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    if (!widgetId) return;
    const w = window as Window & { __be?: { id: string } };
    w.__be = { id: widgetId };
    const script = document.createElement("script");
    script.async = true;
    script.src = "https://cdn.chatbot.com/widget/plugin.js";
    document.body.appendChild(script);
    return () => {
      script.remove();
    };
  }, [widgetId]);

  return (
    <>
      {open ? (
        <div className="fixed bottom-24 right-6 z-50 w-[min(100vw-2rem,22rem)] rounded-2xl border border-slate-200 bg-white shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-200 px-3 py-2">
            <span className="flex items-center gap-2 text-sm font-semibold">
              <Bot className="h-4 w-4 text-emerald-700" />
              {fr ? "Agent IA" : "AI Agent"}
            </span>
            <button className="text-xs text-slate-500" onClick={() => setOpen(false)}>
              {fr ? "Fermer" : "Close"}
            </button>
          </div>
          <div className="p-2">
            <ChatTranscript locale={locale} />
          </div>
        </div>
      ) : null}
      <button
        type="button"
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-700 text-white shadow-lg hover:bg-emerald-800"
        onClick={() => setOpen((v) => !v)}
        aria-label={fr ? "Agent IA" : "AI Agent"}
      >
        <Bot className="h-6 w-6" />
        <span
          className={`absolute right-1 top-1 h-3 w-3 rounded-full border-2 border-white ${on ? "bg-emerald-400" : "bg-amber-400"}`}
        />
      </button>
      {widgetId ? (
        <Badge tone="green" className="sr-only">
          ChatBot.com widget {widgetId}
        </Badge>
      ) : null}
    </>
  );
}
