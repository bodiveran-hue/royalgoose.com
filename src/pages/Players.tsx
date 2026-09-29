import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { Badge, Button, Card, Empty, Field, Input, Modal, PageHeader, Select } from "../components/ui";
import { formatXaf, fatigueTone } from "../lib/utils";
import { POSITIONS, type Player } from "../lib/types";

export function Players() {
  const { state, setState, user, log, locale } = useApp();
  const fr = locale === "fr";
  const nav = useNavigate();
  const [q, setQ] = useState("");
  const [pos, setPos] = useState("all");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", position: "BU" as Player["position"], number: 99, age: 20, nationality: "Cameroun" });

  const list = useMemo(() => {
    return state.players
      .filter((p) => user?.role === "super_admin" || p.clubId === user?.clubId)
      .filter((p) => (user?.role === "player" ? p.id === user.playerId : true))
      .filter((p) => (pos === "all" ? true : p.position === pos))
      .filter((p) => p.name.toLowerCase().includes(q.toLowerCase()));
  }, [state.players, user, q, pos]);

  function create() {
    if (!user?.clubId && user?.role !== "super_admin") return;
    const clubId = user.clubId ?? state.clubs[0].id;
    const id = `pl_${Date.now()}`;
    const player: Player = {
      id,
      clubId,
      name: form.name,
      position: form.position,
      number: Number(form.number),
      age: Number(form.age),
      nationality: form.nationality,
      height: 180,
      weight: 75,
      foot: "Droit",
      marketValue: 100000,
      fatigue: 20,
      form: 70,
      contractEnd: "2028-06-30",
      salary: 300000,
      photo: "",
      listed: false,
      stats: { matches: 0, goals: 0, assists: 0, minutes: 0, yellow: 0, red: 0, passPct: 0, duelsWon: 0, distanceKm: 0, sprintTop: 0 },
      career: [],
    };
    setState((s) => ({
      ...s,
      players: [player, ...s.players],
      contracts: [
        {
          id: `ct_${id}`,
          playerId: id,
          clubId,
          start: new Date().toISOString().slice(0, 10),
          end: player.contractEnd,
          salary: player.salary,
          bonus: 0,
          releaseClause: player.marketValue * 2,
          status: "active",
          clauses: ["Standard"],
        },
        ...s.contracts,
      ],
    }));
    log("Création joueur", id);
    setOpen(false);
    nav(`/app/players/${id}`);
  }

  return (
    <div>
      <PageHeader
        title={fr ? "Gestion complète joueurs" : "Full player management"}
        subtitle={fr ? "Profils 360°, passeports numériques, stats et carrière." : "360° profiles, digital passports, stats and career."}
        actions={
          user?.role !== "player" ? (
            <Button onClick={() => setOpen(true)}>{fr ? "Nouveau joueur" : "New player"}</Button>
          ) : null
        }
      />
      <div className="mb-4 flex flex-wrap gap-2">
        <Input placeholder={fr ? "Nom…" : "Name…"} value={q} onChange={(e) => setQ(e.target.value)} className="max-w-xs" />
        <Select value={pos} onChange={(e) => setPos(e.target.value)}>
          <option value="all">{fr ? "Tous postes" : "All positions"}</option>
          {POSITIONS.map((p) => (
            <option key={p}>{p}</option>
          ))}
        </Select>
      </div>
      {list.length === 0 ? (
        <Empty text={fr ? "Aucun joueur." : "No players."} />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="p-3">#</th>
                <th>Nom</th>
                <th>Pos</th>
                <th>Âge</th>
                <th>Fatigue</th>
                <th>{fr ? "Valeur" : "Value"}</th>
                <th>Contrat</th>
              </tr>
            </thead>
            <tbody>
              {list.map((p) => (
                <tr key={p.id} className="border-t border-slate-100 hover:bg-emerald-50/40">
                  <td className="p-3">{p.number}</td>
                  <td>
                    <Link className="font-semibold text-emerald-800" to={`/app/players/${p.id}`}>
                      {p.name}
                    </Link>
                    {p.listed && (
                      <Badge tone="gold" className="ml-2">
                        mercato
                      </Badge>
                    )}
                  </td>
                  <td>{p.position}</td>
                  <td>{p.age}</td>
                  <td>
                    <Badge tone={fatigueTone(p.fatigue) === "critical" ? "red" : fatigueTone(p.fatigue) === "warn" ? "gold" : "green"}>
                      {p.fatigue}
                    </Badge>
                  </td>
                  <td>{formatXaf(p.marketValue)}</td>
                  <td>{p.contractEnd}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Modal open={open} title={fr ? "Nouveau joueur" : "New player"} onClose={() => setOpen(false)}>
        <div className="grid gap-3">
          <Field label="Nom">
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </Field>
          <Field label="Poste">
            <Select value={form.position} onChange={(e) => setForm({ ...form, position: e.target.value as Player["position"] })}>
              {POSITIONS.map((p) => (
                <option key={p}>{p}</option>
              ))}
            </Select>
          </Field>
          <Field label="Numéro">
            <Input type="number" value={form.number} onChange={(e) => setForm({ ...form, number: Number(e.target.value) })} />
          </Field>
          <Field label="Âge">
            <Input type="number" value={form.age} onChange={(e) => setForm({ ...form, age: Number(e.target.value) })} />
          </Field>
          <Button onClick={create} disabled={!form.name}>
            {fr ? "Créer" : "Create"}
          </Button>
        </div>
      </Modal>
    </div>
  );
}

export function PlayerProfile() {
  const { id } = useParams();
  return <PlayerInner id={id ?? ""} />;
}

function PlayerInner({ id }: { id: string }) {
  const { state, setState, user, log, locale } = useApp();
  const fr = locale === "fr";
  const nav = useNavigate();
  const p = state.players.find((x) => x.id === id);
  const contract = state.contracts.find((c) => c.playerId === id);
  const med = state.medical.filter((m) => m.playerId === id);
  const [edit, setEdit] = useState(false);

  if (!p) return <Empty text={fr ? "Joueur introuvable" : "Player not found"} />;
  if (user?.role === "player" && user.playerId !== p.id) return <Empty text="Accès refusé" />;

  function exportPassport() {
    const blob = new Blob(
      [
        `Royal Goose — Passeport ${p!.name}\nPoste: ${p!.position}\nNationalité: ${p!.nationality}\nValeur: ${p!.marketValue}\nFatigue: ${p!.fatigue}\nContrat: ${p!.contractEnd}\n`,
      ],
      { type: "text/plain" },
    );
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `passeport-${p!.name}.txt`;
    a.click();
    log("Export passeport", p!.id);
  }

  return (
    <div>
      <PageHeader
        title={p.name}
        subtitle={`${p.position} · #${p.number} · ${p.nationality} · ${p.age} ans`}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={exportPassport}>
              {fr ? "Exporter passeport" : "Export passport"}
            </Button>
            {user?.role !== "player" && (
              <>
                <Button onClick={() => setEdit(true)}>{fr ? "Éditer" : "Edit"}</Button>
                <Button
                  variant="danger"
                  onClick={() => {
                    if (!confirm(fr ? "Supprimer ce joueur ?" : "Delete this player?")) return;
                    setState((s) => ({
                      ...s,
                      players: s.players.filter((x) => x.id !== p.id),
                      contracts: s.contracts.filter((c) => c.playerId !== p.id),
                      medical: s.medical.filter((m) => m.playerId !== p.id),
                    }));
                    log("Suppression joueur", p.id);
                    nav("/app/players");
                  }}
                >
                  {fr ? "Supprimer" : "Delete"}
                </Button>
              </>
            )}
          </div>
        }
      />
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="p-4">
          <p className="text-xs text-slate-500">Fatigue</p>
          <p className="text-3xl font-bold">{p.fatigue}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-slate-500">{fr ? "Valeur" : "Value"}</p>
          <p className="text-3xl font-bold">{formatXaf(p.marketValue)}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-slate-500">Forme</p>
          <p className="text-3xl font-bold">{p.form}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-slate-500">Contrat</p>
          <p className="text-lg font-bold">{p.contractEnd}</p>
          <p className="text-xs text-slate-500">{contract?.status}</p>
        </Card>
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card className="p-4">
          <p className="mb-2 font-semibold">{fr ? "Statistiques" : "Stats"}</p>
          <dl className="grid grid-cols-2 gap-2 text-sm">
            {Object.entries(p.stats).map(([k, v]) => (
              <div key={k} className="flex justify-between rounded-lg bg-slate-50 px-3 py-2">
                <span className="text-slate-500">{k}</span>
                <b>{v}</b>
              </div>
            ))}
          </dl>
        </Card>
        <Card className="p-4">
          <p className="mb-2 font-semibold">{fr ? "Carrière" : "Career"}</p>
          {p.career.length === 0 && <p className="text-sm text-slate-500">—</p>}
          {p.career.map((c) => (
            <div key={c.season} className="flex justify-between border-b border-slate-100 py-2 text-sm">
              <span>
                {c.season} · {c.club}
              </span>
              <span>
                {c.matches} j. / {c.goals} b.
              </span>
            </div>
          ))}
        </Card>
      </div>
      <Card className="mt-4 p-4">
        <p className="mb-2 font-semibold">{fr ? "Dossier médical" : "Medical file"}</p>
        {med.length === 0 && <p className="text-sm text-slate-500">{fr ? "Aucune visite." : "No visits."}</p>}
        {med.map((m) => (
          <div key={m.id} className="border-b border-slate-100 py-2 text-sm">
            <b>{m.date}</b> · {m.type} · {m.diagnosis} · risque {m.injuryRisk}%
          </div>
        ))}
      </Card>
      <Modal open={edit} title={fr ? "Éditer" : "Edit"} onClose={() => setEdit(false)}>
        <div className="grid gap-3">
          <Field label="Fatigue">
            <Input
              type="number"
              defaultValue={p.fatigue}
              onBlur={(e) => {
                const fatigue = Number(e.target.value);
                setState((s) => {
                  const nextPlayers = s.players.map((x) => (x.id === p.id ? { ...x, fatigue } : x));
                  if (fatigue < 75) return { ...s, players: nextPlayers };
                  return {
                    ...s,
                    players: nextPlayers,
                    alerts: [
                      {
                        id: `al_${Date.now()}`,
                        clubId: p.clubId,
                        type: "fatigue" as const,
                        severity: "critical" as const,
                        title: `Alerte fatigue — ${p.name} ${fatigue}`,
                        body: "Email auto envoyé au staff. Seuil 75 dépassé.",
                        at: new Date().toISOString(),
                        read: false,
                        playerId: p.id,
                      },
                      ...s.alerts,
                    ],
                  };
                });
                log("MAJ fatigue", p.id);
              }}
            />
          </Field>
          <Field label={fr ? "Valeur marché" : "Market value"}>
            <Input
              type="number"
              defaultValue={p.marketValue}
              onBlur={(e) => {
                const marketValue = Number(e.target.value);
                setState((s) => ({ ...s, players: s.players.map((x) => (x.id === p.id ? { ...x, marketValue } : x)) }));
              }}
            />
          </Field>
          <Button onClick={() => setEdit(false)}>{fr ? "Fermer" : "Close"}</Button>
        </div>
      </Modal>
    </div>
  );
}
