import { useState } from "react";
import { useApp } from "../context/AppContext";
import { Badge, Button, Card, Field, Input, Modal, PageHeader } from "../components/ui";
import { formatXaf } from "../lib/utils";
import type { Contract, TransferDeal } from "../lib/types";

export function Transfers() {
  const { state, setState, user, log, locale } = useApp();
  const fr = locale === "fr";
  const clubId = user?.role === "super_admin" ? null : user?.clubId;
  const contracts = state.contracts.filter((c) => !clubId || c.clubId === clubId);
  const [tab, setTab] = useState<"deals" | "contracts">("deals");
  const [open, setOpen] = useState(false);

  async function negotiate(id: string) {
    const t = state.transfers.find((x) => x.id === id);
    const res = await fetch("/api/ai/negotiate", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("rg_jwt") || ""}` },
      body: JSON.stringify({ playerName: t?.playerName, value: t?.value, locale }),
    });
    const json = (await res.json()) as { text?: string };
    setState((s) => ({
      ...s,
      transfers: s.transfers.map((x) =>
        x.id === id
          ? {
              ...x,
              status: x.status === "veille" ? "negociation" : x.status === "negociation" ? "offre" : x.status === "offre" ? "accord" : "clos",
              aiNote: json.text || x.aiNote,
              updated: new Date().toISOString().slice(0, 10),
            }
          : x,
      ),
    }));
    log("Négociation IA", id);
  }

  function renew(c: Contract) {
    setState((s) => ({
      ...s,
      contracts: s.contracts.map((x) =>
        x.id === c.id ? { ...x, end: "2028-06-30", status: "renewal" } : x,
      ),
      players: s.players.map((p) => (p.id === c.playerId ? { ...p, contractEnd: "2028-06-30" } : p)),
    }));
    log("Renouvellement contrat", c.id);
  }

  return (
    <div>
      <PageHeader
        title={fr ? "Transfergoose & Contrats" : "Transfergoose & contracts"}
        subtitle={fr ? "Valeur marché, négociation IA, gestion contractuelle." : "Market values, AI negotiation, contracts."}
        actions={<Button onClick={() => setOpen(true)}>{fr ? "Nouvelle piste" : "New deal"}</Button>}
      />
      <div className="mb-4 flex gap-2">
        <Button variant={tab === "deals" ? "primary" : "outline"} onClick={() => setTab("deals")}>
          Mercato
        </Button>
        <Button variant={tab === "contracts" ? "primary" : "outline"} onClick={() => setTab("contracts")}>
          {fr ? "Contrats" : "Contracts"}
        </Button>
      </div>
      {tab === "deals" ? (
        <div className="grid gap-3">
          {state.transfers.map((t) => (
            <Card key={t.id} className="p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <b>{t.playerName}</b>
                  <p className="text-sm text-slate-500">
                    {t.fromClub} → {t.toClub} · {formatXaf(t.value)}
                  </p>
                  <p className="mt-2 text-sm">{t.aiNote}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge tone={t.status === "accord" || t.status === "clos" ? "green" : "gold"}>{t.status}</Badge>
                  <Button size="sm" onClick={() => void negotiate(t.id)}>
                    {fr ? "Négocier IA" : "AI negotiate"}
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="p-3">Joueur</th>
                <th>Fin</th>
                <th>Salaire</th>
                <th>Clause</th>
                <th>Statut</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {contracts.map((c) => {
                const p = state.players.find((x) => x.id === c.playerId);
                const days = Math.round((new Date(c.end).getTime() - Date.now()) / 86400000);
                return (
                  <tr key={c.id} className="border-t">
                    <td className="p-3 font-medium">{p?.name}</td>
                    <td>
                      {c.end} {days < 30 && <Badge tone="red">J-{Math.max(days, 0)}</Badge>}
                    </td>
                    <td>{formatXaf(c.salary)}</td>
                    <td>{formatXaf(c.releaseClause)}</td>
                    <td>{c.status}</td>
                    <td>
                      <Button size="sm" variant="outline" onClick={() => renew(c)}>
                        {fr ? "Renouveler" : "Renew"}
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      <NewDeal open={open} onClose={() => setOpen(false)} />
    </div>
  );
}

function NewDeal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { setState, log, locale, user } = useApp();
  const [playerName, setPlayerName] = useState("");
  return (
    <Modal open={open} title="Piste mercato" onClose={onClose}>
      <Field label="Joueur">
        <Input className="h-10 w-full" value={playerName} onChange={(e) => setPlayerName(e.target.value)} />
      </Field>
      <Button
        className="mt-3"
        disabled={!playerName}
        onClick={() => {
          const deal: TransferDeal = {
            id: `tr_${Date.now()}`,
            clubId: user?.clubId || "c1",
            playerName,
            fromClub: "Marché libre",
            toClub: "Coton Sport",
            value: 250000,
            status: "veille",
            aiNote: locale === "fr" ? "Veille ouverte. Estimation IA à affiner." : "Watchlist opened.",
            updated: new Date().toISOString().slice(0, 10),
          };
          setState((s) => ({ ...s, transfers: [deal, ...s.transfers] }));
          log("Nouvelle piste", deal.id);
          onClose();
        }}
      >
        {locale === "fr" ? "Créer" : "Create"}
      </Button>
    </Modal>
  );
}
