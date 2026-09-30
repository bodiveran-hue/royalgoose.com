import { useState } from "react";
import { useApp } from "../context/AppContext";
import { Badge, Button, Card, PageHeader } from "../components/ui";
import { AgentStatusChip, ChatTranscript } from "./Chatbot";

export function DesignAI() {
  const { state, setState, user, log, locale } = useApp();
  const fr = locale === "fr";
  const [busy, setBusy] = useState(false);

  async function propose() {
    setBusy(true);
    const res = await fetch("/api/ai/design", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("rg_jwt") || ""}` },
      body: JSON.stringify({ locale }),
    });
    const json = (await res.json()) as { title?: string; summary?: string };
    setBusy(false);
    const p = {
      id: `ds_${Date.now()}`,
      clubId: user?.clubId || "c1",
      title: json.title || (fr ? "Contraste alertes dashboard" : "Dashboard alert contrast"),
      summary: json.summary || "",
      applied: false,
      createdAt: new Date().toISOString(),
    };
    setState((s) => ({ ...s, designs: [p, ...s.designs] }));
    log("Proposition design IA", p.id);
  }

  function apply(id: string) {
    setState((s) => ({ ...s, designs: s.designs.map((d) => (d.id === id ? { ...d, applied: true } : d)) }));
    log("Design appliqué", id);
    document.documentElement.style.setProperty("--color-rg-gold", "#fbbf24");
  }

  return (
    <div>
      <PageHeader
        title={fr ? "Design visuel IA" : "Visual design AI"}
        subtitle={fr ? "Propositions, aperçu temps réel, application après approbation." : "Proposals, live preview, apply after approval."}
        actions={<Button onClick={() => void propose()} disabled={busy}>{busy ? "…" : fr ? "Générer proposition" : "Generate proposal"}</Button>}
      />
      <div className="grid gap-4 md:grid-cols-2">
        {state.designs.map((d) => (
          <Card key={d.id} className="p-4">
            <div className="flex justify-between">
              <b>{d.title}</b>
              <Badge tone={d.applied ? "green" : "gold"}>{d.applied ? (fr ? "Appliqué" : "Applied") : fr ? "En revue" : "Review"}</Badge>
            </div>
            <p className="mt-2 text-sm text-slate-600">{d.summary}</p>
            <div className="mt-4 rounded-xl border border-dashed border-slate-200 bg-linear-to-r from-red-50 to-white p-3 text-sm">
              {fr ? "Aperçu : Alerte fatigue 82 — Repos 48h" : "Preview: Fatigue 82 — 48h rest"}
            </div>
            {!d.applied && (
              <Button className="mt-3" onClick={() => apply(d.id)}>
                {fr ? "Approuver & appliquer" : "Approve & apply"}
              </Button>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}

export function ControlCenter() {
  const { state, setState, log, locale } = useApp();
  const fr = locale === "fr";

  function intervene(id: string) {
    const entry = {
      id: `lg_${Date.now()}`,
      agentId: id,
      action: fr ? "Intervention manuelle Super Agent — tâche relancée" : "Manual Super Agent intervention",
      at: new Date().toISOString(),
      level: "success" as const,
    };
    setState((s) => ({
      ...s,
      agentLogs: [entry, ...s.agentLogs],
      agents: s.agents.map((a) => (a.id === id ? { ...a, status: "busy", lastAction: "Intervention manuelle" } : a)),
    }));
    log("Intervention agent", id);
  }

  return (
    <div>
      <PageHeader
        title={fr ? "Centre de contrôle IA 24/7" : "AI control center 24/7"}
        subtitle={fr ? "8 agents autonomes, monitoring, logs, interventions." : "8 agents, monitoring, logs, interventions."}
      />
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
        {state.agents.map((a) => (
          <Card key={a.id} className="p-4">
            <div className="flex items-center justify-between">
              <b className="text-sm">{a.name}</b>
              <span className={`h-2 w-2 rounded-full ${a.status === "online" ? "bg-emerald-500" : a.status === "busy" ? "bg-amber-500" : "bg-slate-300"}`} />
            </div>
            <p className="mt-1 text-xs text-slate-500">{a.tag}</p>
            <p className="mt-2 text-sm">{a.lastAction}</p>
            <Button size="sm" variant="outline" className="mt-3" onClick={() => intervene(a.id)}>
              {fr ? "Intervenir" : "Intervene"}
            </Button>
          </Card>
        ))}
      </div>
      <Card className="mt-4 p-4">
        <p className="mb-2 font-semibold">{fr ? "Logs d'activité" : "Activity logs"}</p>
        <div className="max-h-80 space-y-2 overflow-y-auto text-sm">
          {state.agentLogs.map((l) => (
            <div key={l.id} className="flex justify-between gap-3 rounded-lg bg-slate-50 px-3 py-2">
              <span>
                <Badge tone={l.level === "warn" ? "gold" : l.level === "success" ? "green" : "blue"}>{l.level}</Badge> {l.action}
              </span>
              <span className="shrink-0 text-xs text-slate-400">{l.at.replace("T", " ").slice(0, 16)}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

export function AgentsPage() {
  const { state, locale } = useApp();
  const fr = locale !== "en";
  return (
    <div>
      <PageHeader
        title={fr ? "Agents IA" : "AI agents"}
        subtitle={
          fr
            ? "Parlez à l'agent dans l'app (ChatBotAI / ChatGPT via le serveur). Les 8 agents du club restent ci-dessous."
            : "Talk to the in-app agent (ChatBotAI / ChatGPT via the server). The 8 club agents stay below."
        }
        actions={<AgentStatusChip />}
      />
      <div className="mb-6">
        <p className="mb-2 text-sm font-semibold text-slate-700">{fr ? "Parler à l'agent" : "Talk to the agent"}</p>
        <ChatTranscript locale={locale} tall />
      </div>
      <p className="mb-3 text-sm font-semibold text-slate-700">{fr ? "8 agents du club" : "8 club agents"}</p>
      <div className="grid gap-4 md:grid-cols-2">
        {state.agents.map((a) => (
          <Card key={a.id} className="p-5">
            <Badge tone="purple">{a.tag}</Badge>
            <h3 className="mt-2 text-lg font-bold">{a.name}</h3>
            <p className="mt-1 text-sm text-slate-600">{a.description}</p>
            <p className="mt-3 text-xs text-slate-500">
              {a.status} · {a.lastAction}
            </p>
          </Card>
        ))}
      </div>
    </div>
  );
}
