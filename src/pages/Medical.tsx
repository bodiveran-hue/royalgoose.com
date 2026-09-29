import { useState } from "react";
import { useApp } from "../context/AppContext";
import { Badge, Button, Card, Field, Input, Modal, PageHeader, Select, Textarea } from "../components/ui";
import type { MedicalRecord } from "../lib/types";

export function Medical() {
  const { state, setState, user, log, locale } = useApp();
  const fr = locale === "fr";
  const players = state.players.filter((p) => user?.role === "super_admin" || p.clubId === user?.clubId);
  const records = state.medical.filter((m) => players.some((p) => p.id === m.playerId));
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ playerId: players[0]?.id ?? "", type: "visite" as MedicalRecord["type"], diagnosis: "", protocol: "", injuryRisk: 40 });

  function add() {
    if (!form.diagnosis.trim() || !form.playerId) return;
    const rec: MedicalRecord = {
      id: `md_${Date.now()}`,
      playerId: form.playerId,
      date: new Date().toISOString().slice(0, 10),
      type: form.type,
      diagnosis: form.diagnosis,
      protocol: form.protocol,
      status: "ouvert",
      injuryRisk: Number(form.injuryRisk),
    };
    setState((s) => ({ ...s, medical: [rec, ...s.medical] }));
    log("Dossier médical", rec.id);
    setOpen(false);
  }

  return (
    <div>
      <PageHeader
        title={fr ? "Médical & Prévention" : "Medical & prevention"}
        subtitle={fr ? "Prédiction blessures IA, dossiers, protocoles, visites." : "Injury prediction, files, protocols, visits."}
        actions={<Button onClick={() => setOpen(true)}>{fr ? "Nouvelle visite" : "New visit"}</Button>}
      />
      <div className="mb-4 grid gap-3 md:grid-cols-3">
        {players
          .slice()
          .sort((a, b) => b.fatigue - a.fatigue)
          .slice(0, 6)
          .map((p) => {
            const risk = records.find((m) => m.playerId === p.id)?.injuryRisk ?? Math.min(95, p.fatigue + 5);
            return (
              <Card key={p.id} className="p-4">
                <div className="flex justify-between">
                  <b>{p.name}</b>
                  <Badge tone={risk >= 70 ? "red" : risk >= 50 ? "gold" : "green"}>{risk}% risque</Badge>
                </div>
                <p className="text-xs text-slate-500">Fatigue {p.fatigue}</p>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                  <div className={`h-full ${risk >= 70 ? "bg-red-500" : "bg-emerald-500"}`} style={{ width: `${risk}%` }} />
                </div>
              </Card>
            );
          })}
      </div>
      <Card className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="p-3">Date</th>
              <th>Joueur</th>
              <th>Type</th>
              <th>Diagnostic</th>
              <th>Protocole</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {records.map((m) => {
              const p = players.find((x) => x.id === m.playerId);
              return (
                <tr key={m.id} className="border-t">
                  <td className="p-3">{m.date}</td>
                  <td>{p?.name}</td>
                  <td>{m.type}</td>
                  <td>{m.diagnosis}</td>
                  <td>{m.protocol}</td>
                  <td>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        setState((s) => ({
                          ...s,
                          medical: s.medical.map((x) => (x.id === m.id ? { ...x, status: "clos" } : x)),
                        }))
                      }
                    >
                      {m.status === "clos" ? "clos" : fr ? "Clôturer" : "Close"}
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>
      <Modal open={open} title={fr ? "Visite médicale" : "Medical visit"} onClose={() => setOpen(false)}>
        <div className="grid gap-3">
          <Field label="Joueur">
            <Select value={form.playerId} onChange={(e) => setForm({ ...form, playerId: e.target.value })}>
              {players.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Type">
            <Select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as MedicalRecord["type"] })}>
              <option value="visite">visite</option>
              <option value="blessure">blessure</option>
              <option value="recup">récup</option>
              <option value="prevention">prévention</option>
            </Select>
          </Field>
          <Field label="Diagnostic">
            <Input value={form.diagnosis} onChange={(e) => setForm({ ...form, diagnosis: e.target.value })} />
          </Field>
          <Field label="Protocole">
            <Textarea value={form.protocol} onChange={(e) => setForm({ ...form, protocol: e.target.value })} />
          </Field>
          <Button onClick={add} disabled={!form.diagnosis.trim()}>
            {fr ? "Enregistrer" : "Save"}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
