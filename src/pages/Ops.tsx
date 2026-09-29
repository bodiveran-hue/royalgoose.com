import { useState } from "react";
import { useApp } from "../context/AppContext";
import { Badge, Button, Card, Field, Input, Modal, PageHeader, Select } from "../components/ui";
import { aiPost, sendReport } from "../lib/api";
import type { Task } from "../lib/types";

export function Tasks() {
  const { state, setState, user, log, locale } = useApp();
  const fr = locale === "fr";
  const tasks = state.tasks.filter((t) => user?.role === "super_admin" || t.clubId === user?.clubId);
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [urgent, setUrgent] = useState(true);

  function add() {
    const t: Task = {
      id: `tk_${Date.now()}`,
      clubId: user?.clubId ?? state.clubs[0].id,
      title,
      assignee: user?.name ?? "Staff",
      role: user?.role ?? "staff",
      urgent,
      status: "open",
      due: new Date().toISOString().slice(0, 10),
    };
    setState((s) => ({
      ...s,
      tasks: [t, ...s.tasks],
      alerts: [
        {
          id: `al_${Date.now()}`,
          clubId: t.clubId,
          type: "tache",
          severity: urgent ? "warn" : "info",
          title: fr ? "Tâche urgente assignée" : "Urgent task assigned",
          body: title,
          at: new Date().toISOString(),
          read: false,
        },
        ...s.alerts,
      ],
    }));
    log("Tâche créée", t.id);
    setOpen(false);
  }

  function cycle(id: string) {
    setState((s) => ({
      ...s,
      tasks: s.tasks.map((t) =>
        t.id === id ? { ...t, status: t.status === "open" ? "doing" : t.status === "doing" ? "done" : "open" } : t,
      ),
    }));
  }

  return (
    <div>
      <PageHeader
        title={fr ? "Tâches & alertes" : "Tasks & alerts"}
        subtitle={fr ? "Notifications instantanées pour le staff technique." : "Instant notifications for technical staff."}
        actions={<Button onClick={() => setOpen(true)}>{fr ? "Nouvelle tâche" : "New task"}</Button>}
      />
      <div className="grid gap-3">
        {tasks.map((t) => (
          <Card key={t.id} className="flex items-center justify-between p-4">
            <div>
              <div className="flex gap-2">
                {t.urgent && <Badge tone="red">LIVE</Badge>}
                <Badge tone={t.status === "done" ? "green" : "gold"}>{t.status}</Badge>
              </div>
              <p className="mt-1 font-semibold">{t.title}</p>
              <p className="text-xs text-slate-500">
                {t.assignee} · {t.due}
              </p>
            </div>
            <Button size="sm" variant="outline" onClick={() => cycle(t.id)}>
              {fr ? "Avancer" : "Advance"}
            </Button>
          </Card>
        ))}
      </div>
      <Modal open={open} title={fr ? "Tâche" : "Task"} onClose={() => setOpen(false)}>
        <Field label="Titre">
          <Input value={title} onChange={(e) => setTitle(e.target.value)} />
        </Field>
        <Field label="Urgent">
          <Select value={urgent ? "yes" : "no"} onChange={(e) => setUrgent(e.target.value === "yes")}>
            <option value="yes">oui</option>
            <option value="no">non</option>
          </Select>
        </Field>
        <Button className="mt-3" onClick={add} disabled={!title}>
          {fr ? "Créer" : "Create"}
        </Button>
      </Modal>
    </div>
  );
}

export function Reports() {
  const { state, setState, user, log, locale } = useApp();
  const fr = locale === "fr";
  const reports = state.reports.filter((r) => user?.role === "super_admin" || r.clubId === user?.clubId);
  const [busy, setBusy] = useState(false);

  async function generate() {
    setBusy(true);
    try {
      const json = await aiPost<{ text?: string; kpis?: { label: string; value: string }[] }>("/api/ai/report", { locale });
      const r = {
        id: `rp_${Date.now()}`,
        clubId: user?.clubId ?? state.clubs[0].id,
        month: new Date().toISOString().slice(0, 7),
        sent: false,
        kpis: json.kpis || [
          { label: fr ? "Fatigue moy." : "Avg fatigue", value: "—" },
        ],
        narrative: json.text || (fr ? "Rapport généré." : "Report generated."),
      };
      setState((s) => ({ ...s, reports: [r, ...s.reports] }));
      log("Rapport mensuel", r.id);
    } finally {
      setBusy(false);
    }
  }

  async function send(id: string) {
    await sendReport(id);
    setState((s) => ({ ...s, reports: s.reports.map((x) => (x.id === id ? { ...x, sent: true } : x)) }));
    log("Envoi rapport", id);
  }

  return (
    <div>
      <PageHeader
        title={fr ? "Rapports mensuels IA" : "Monthly AI reports"}
        subtitle={fr ? "Génération et envoi automatique au staff." : "Auto generation and staff delivery."}
        actions={<Button onClick={() => void generate()} disabled={busy}>{busy ? "…" : fr ? "Générer" : "Generate"}</Button>}
      />
      {reports.map((r) => (
        <Card key={r.id} className="mb-3 p-4">
          <div className="flex justify-between">
            <b>{r.month}</b>
            <Badge tone={r.sent ? "green" : "gold"}>{r.sent ? (fr ? "Envoyé" : "Sent") : fr ? "Brouillon" : "Draft"}</Badge>
          </div>
          <div className="mt-3 flex gap-3">
            {r.kpis.map((k) => (
              <div key={k.label} className="rounded-xl bg-slate-50 px-3 py-2 text-sm">
                <div className="text-xs text-slate-500">{k.label}</div>
                <b>{k.value}</b>
              </div>
            ))}
          </div>
          <p className="mt-3 text-sm text-slate-600">{r.narrative}</p>
          {!r.sent && (
            <Button
              className="mt-3"
              size="sm"
              onClick={() => void send(r.id)}
            >
              {fr ? "Envoyer au staff" : "Send to staff"}
            </Button>
          )}
        </Card>
      ))}
    </div>
  );
}
