import { useState } from "react";
import { useApp } from "../context/AppContext";
import { Badge, Button, Card, Empty, Field, Input, Modal, PageHeader, Select, Textarea } from "../components/ui";
import { formatXaf } from "../lib/utils";
import type { ScoutReport } from "../lib/types";

export function Scouting() {
  const { state, setState, user, log, locale } = useApp();
  const fr = locale === "fr";
  const [country, setCountry] = useState("all");
  const [open, setOpen] = useState(false);
  const countries = Array.from(new Set(state.scouts.map((s) => s.country)));
  const list = state.scouts.filter((s) => country === "all" || s.country === country);

  const [form, setForm] = useState({ targetName: "", club: "", country: "Cameroun", position: "BU", age: 20, notes: "" });

  function add() {
    const report: ScoutReport = {
      id: `sc_${Date.now()}`,
      clubId: user?.clubId || "c1",
      targetName: form.targetName,
      club: form.club,
      country: form.country,
      position: form.position,
      age: Number(form.age),
      rating: 75,
      marketValue: 150000,
      notes: form.notes,
      scout: "Scout Réseau Mondial",
      date: new Date().toISOString().slice(0, 10),
      status: "watch",
    };
    setState((s) => ({ ...s, scouts: [report, ...s.scouts] }));
    log("Rapport scout", report.id);
    setOpen(false);
  }

  function cycle(id: string) {
    const order: ScoutReport["status"][] = ["watch", "recommend", "contacted", "signed"];
    setState((s) => ({
      ...s,
      scouts: s.scouts.map((r) => {
        if (r.id !== id) return r;
        const i = (order.indexOf(r.status) + 1) % order.length;
        return { ...r, status: order[i] };
      }),
    }));
  }

  return (
    <div>
      <PageHeader
        title={fr ? "Scout Réseau Mondial" : "World scout network"}
        subtitle={fr ? "150+ pays, recommandations IA, connexions clubs et agents." : "150+ countries, AI recs, club and agent links."}
        actions={<Button onClick={() => setOpen(true)}>{fr ? "Nouveau rapport" : "New report"}</Button>}
      />
      <div className="mb-4 flex flex-wrap gap-2">
        <Select value={country} onChange={(e) => setCountry(e.target.value)} className="max-w-xs">
          <option value="all">{fr ? "Tous pays" : "All countries"}</option>
          {countries.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </Select>
        <Badge tone="green">{list.length} {fr ? "cibles" : "targets"}</Badge>
      </div>
      <div className="mb-6 overflow-hidden rounded-2xl bg-emerald-950 p-6 text-emerald-50">
        <p className="text-sm text-emerald-200">{fr ? "Couverture réseau (échantillon)" : "Network coverage"}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {["Cameroun", "Ghana", "Mali", "Maroc", "RD Congo", "Sénégal", "Nigeria", "Côte d'Ivoire", "France", "Belgique"].map((c) => (
            <span key={c} className="rounded-full bg-white/10 px-3 py-1 text-xs">
              {c}
            </span>
          ))}
        </div>
      </div>
      {list.length === 0 ? (
        <Empty text={fr ? "Aucune cible." : "No targets."} />
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {list.map((s) => (
            <Card key={s.id} className="p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <b>{s.targetName}</b>
                  <p className="text-sm text-slate-500">
                    {s.club} · {s.country} · {s.position} · {s.age} ans
                  </p>
                </div>
                <button onClick={() => cycle(s.id)}>
                  <Badge tone={s.status === "recommend" ? "green" : s.status === "contacted" ? "blue" : s.status === "signed" ? "gold" : "neutral"}>
                    {s.status}
                  </Badge>
                </button>
              </div>
              <p className="mt-2 text-sm">{s.notes}</p>
              <p className="mt-2 text-xs text-slate-500">
                {s.scout} · {formatXaf(s.marketValue)} · rating {s.rating}
              </p>
            </Card>
          ))}
        </div>
      )}
      <Modal open={open} title={fr ? "Rapport scout" : "Scout report"} onClose={() => setOpen(false)}>
        <div className="grid gap-3">
          <Field label="Nom">
            <Input value={form.targetName} onChange={(e) => setForm({ ...form, targetName: e.target.value })} />
          </Field>
          <Field label="Club">
            <Input value={form.club} onChange={(e) => setForm({ ...form, club: e.target.value })} />
          </Field>
          <Field label="Pays">
            <Input value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} />
          </Field>
          <Field label="Notes">
            <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </Field>
          <Button onClick={add} disabled={!form.targetName}>
            {fr ? "Enregistrer" : "Save"}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
