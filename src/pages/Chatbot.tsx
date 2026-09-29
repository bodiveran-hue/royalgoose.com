import { useEffect, useRef, useState } from "react";
import { Bot, Send } from "lucide-react";
import { useApp } from "../context/AppContext";
import { Badge, Button, Card, PageHeader } from "../components/ui";
import { sendChat } from "../lib/api";

type Turn = { role: "user" | "assistant"; content: string; mode?: string };

export function ChatbotPage() {
  const { locale, integrations } = useApp();
  const fr = locale === "fr";
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
        title="ChatBotAI"
        subtitle={
          fr
            ? "Assistant club — messages via le serveur Node (clés jamais dans le navigateur)."
            : "Club assistant — messages go through the Node server (keys never in the browser)."
        }
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
  const [turns, setTurns] = useState<Turn[]>([
    {
      role: "assistant",
      content: fr
        ? "ChatBotAI Royal Goose prêt. Posez une question tactique, scout, fatigue ou transfert."
        : "Royal Goose ChatBotAI ready. Ask about tactics, scouting, fatigue or transfers.",
      mode: "intro",
    },
  ]);
  const bottom = useRef<HTMLDivElement>(null);

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
      setTurns([...nextTurns, { role: "assistant", content: out.text, mode: out.mode }]);
    } catch {
      setTurns([
        ...nextTurns,
        {
          role: "assistant",
          content: fr ? "Le serveur chat n'a pas répondu. Vérifiez npm start / l'API." : "Chat server did not respond. Check npm start / the API.",
          mode: "error",
        },
      ]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className="flex flex-col overflow-hidden">
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
                <p className={`mt-1 text-[10px] ${t.role === "user" ? "text-emerald-100" : "text-slate-400"}`}>{t.mode}</p>
              ) : null}
            </div>
          </div>
        ))}
        {busy ? <p className="text-xs text-slate-400">{fr ? "Rédaction…" : "Writing…"}</p> : null}
        <div ref={bottom} />
      </div>
      <form
        className="flex gap-2 border-t border-slate-200 p-3"
        onSubmit={(e) => {
          e.preventDefault();
          void send();
        }}
      >
        <input
          className="h-10 flex-1 rounded-full border border-slate-200 px-4 text-sm"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={fr ? "Votre message…" : "Your message…"}
        />
        <Button type="submit" disabled={busy || !input.trim()} size="sm">
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </Card>
  );
}

export function ChatbotDock() {
  const { locale } = useApp();
  const fr = locale === "fr";
  const [open, setOpen] = useState(false);
  const [widgetId, setWidgetId] = useState("");

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
        <div className="fixed bottom-24 right-4 z-50 w-[min(100vw-2rem,22rem)] rounded-2xl border border-slate-200 bg-white shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-200 px-3 py-2">
            <span className="flex items-center gap-2 text-sm font-semibold">
              <Bot className="h-4 w-4 text-emerald-700" />
              ChatBotAI
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
        className="fixed bottom-5 right-4 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-700 text-white shadow-lg hover:bg-emerald-800"
        onClick={() => setOpen((v) => !v)}
        aria-label="ChatBotAI"
      >
        <Bot className="h-6 w-6" />
      </button>
      {widgetId ? (
        <Badge tone="green" className="sr-only">
          ChatBot.com widget {widgetId}
        </Badge>
      ) : null}
    </>
  );
}
