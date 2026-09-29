import { useState } from "react";
import { useApp } from "../context/AppContext";
import { Badge, Button, Card, Field, PageHeader, Select, Textarea } from "../components/ui";

const SPOTS: Record<string, { x: number; y: number; label: string }[]> = {
  "4-3-3": [
    { x: 50, y: 88, label: "GB" },
    { x: 20, y: 70, label: "DG" },
    { x: 38, y: 72, label: "DC" },
    { x: 62, y: 72, label: "DC" },
    { x: 80, y: 70, label: "DD" },
    { x: 30, y: 50, label: "MC" },
    { x: 50, y: 48, label: "MDC" },
    { x: 70, y: 50, label: "MC" },
    { x: 22, y: 22, label: "AG" },
    { x: 50, y: 16, label: "BU" },
    { x: 78, y: 22, label: "AD" },
  ],
  "4-2-3-1": [
    { x: 50, y: 88, label: "GB" },
    { x: 20, y: 70, label: "DG" },
    { x: 38, y: 72, label: "DC" },
    { x: 62, y: 72, label: "DC" },
    { x: 80, y: 70, label: "DD" },
    { x: 35, y: 55, label: "MDC" },
    { x: 65, y: 55, label: "MDC" },
    { x: 22, y: 32, label: "AG" },
    { x: 50, y: 34, label: "MOC" },
    { x: 78, y: 32, label: "AD" },
    { x: 50, y: 14, label: "BU" },
  ],
  "3-5-2": [
    { x: 50, y: 88, label: "GB" },
    { x: 28, y: 70, label: "DC" },
    { x: 50, y: 74, label: "DC" },
    { x: 72, y: 70, label: "DC" },
    { x: 14, y: 48, label: "DG" },
    { x: 35, y: 50, label: "MC" },
    { x: 50, y: 46, label: "MDC" },
    { x: 65, y: 50, label: "MC" },
    { x: 86, y: 48, label: "DD" },
    { x: 40, y: 18, label: "BU" },
    { x: 60, y: 18, label: "BU" },
  ],
};

export function Tactics() {
  const { state, setState, user, log, locale } = useApp();
  const fr = locale === "fr";
  const [formation, setFormation] = useState("4-3-3");
  const [prompt, setPrompt] = useState(
    fr ? "Simule PWD en 5-4-1 bas, pressing déclenché sur leur 6." : "Simulate PWD in a low 5-4-1.",
  );
  const [busy, setBusy] = useState(false);
  const matches = state.matches.filter((m) => user?.role === "super_admin" || m.clubId === user?.clubId);

  async function generate() {
    const match = matches.find((m) => m.scoreHome === null) ?? matches[0];
    setBusy(true);
    const res = await fetch("/api/ai/briefing", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("rg_jwt") || ""}` },
      body: JSON.stringify({ formation, prompt, locale, opponent: match?.opponent }),
    });
    const json = (await res.json()) as { text?: string; mode?: string };
    setBusy(false);
    const briefing = {
      id: `br_${Date.now()}`,
      clubId: user?.clubId || state.clubs[0].id,
      matchId: match?.id ?? "m3",
      title: fr ? `Briefing ${formation}` : `Briefing ${formation}`,
      formation,
      content: json.text || prompt,
      createdAt: new Date().toISOString(),
    };
    setState((s) => ({ ...s, briefings: [briefing, ...s.briefings] }));
    log(`Briefing tactique (${json.mode || "local"})`, briefing.id);
  }

  return (
    <div>
      <PageHeader
        title={fr ? "Expert Tactique Football" : "Football tactical expert"}
        subtitle={fr ? "Briefings, simulations et recommandations Claude AI." : "Briefings, simulations and Claude AI recs."}
      />
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="overflow-hidden p-4">
          <div className="mb-3 flex items-center justify-between">
            <b>{fr ? "Tableau d'animation" : "Pitch board"}</b>
            <Select value={formation} onChange={(e) => setFormation(e.target.value)} className="w-32">
              {Object.keys(SPOTS).map((f) => (
                <option key={f}>{f}</option>
              ))}
            </Select>
          </div>
          <div className="relative mx-auto aspect-3/4 max-w-md rounded-xl bg-emerald-800 pitch-grid">
            <div className="absolute inset-x-8 top-1/2 h-px bg-white/30" />
            <div className="absolute left-1/2 top-1/2 h-20 w-20 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/30" />
            {SPOTS[formation].map((s, i) => (
              <div
                key={i}
                className="absolute grid h-9 w-9 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-amber-400 text-[10px] font-bold text-slate-900"
                style={{ left: `${s.x}%`, top: `${s.y}%` }}
              >
                {s.label}
              </div>
            ))}
          </div>
        </Card>
        <div className="grid gap-4">
          <Card className="p-4">
            <Field label={fr ? "Consigne de simulation" : "Simulation prompt"}>
              <Textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} />
            </Field>
            <Button className="mt-3" onClick={() => void generate()} disabled={busy}>
              {busy ? "…" : fr ? "Générer briefing IA" : "Generate AI briefing"}
            </Button>
          </Card>
          <Card className="p-4">
            <p className="mb-2 font-semibold">{fr ? "Briefings" : "Briefings"}</p>
            <div className="max-h-80 space-y-3 overflow-y-auto">
              {state.briefings.map((b) => (
                <div key={b.id} className="rounded-xl bg-slate-50 p-3 text-sm">
                  <div className="flex items-center gap-2">
                    <b>{b.title}</b>
                    <Badge tone="purple">{b.formation}</Badge>
                  </div>
                  <p className="mt-1 text-slate-600">{b.content}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
