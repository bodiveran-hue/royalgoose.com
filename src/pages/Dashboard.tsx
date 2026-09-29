import { Link } from "react-router-dom";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import { useApp } from "../context/AppContext";
import { Badge, Card, PageHeader, Stat } from "../components/ui";
import { fatigueTone, formatXaf } from "../lib/utils";

export function Dashboard() {
  const { state, setState, user, locale } = useApp();
  const fr = locale === "fr";
  const clubId = user?.role === "super_admin" ? null : user?.clubId;
  const players = state.players.filter((p) => !clubId || p.clubId === clubId);
  const mine = user?.role === "player" ? players.filter((p) => p.id === user.playerId) : players;
  const alerts = state.alerts.filter((a) => !clubId || a.clubId === clubId);
  const fatigued = mine.filter((p) => p.fatigue >= 75);
  const matches = state.matches.filter((m) => !clubId || m.clubId === clubId);
  const analyzed = matches.filter((m) => m.analyzed).length;
  const value = mine.reduce((s, p) => s + p.marketValue, 0);
  const avgFatigue = Math.round(mine.reduce((s, p) => s + p.fatigue, 0) / Math.max(mine.length, 1));
  const chart = ["GB", "DC", "DG", "DD", "MDC", "MC", "MOC", "AG", "AD", "BU"].map((pos) => ({
    pos,
    n: mine.filter((p) => p.position === pos).length,
  }));

  if (user?.role === "player") {
    const me = mine[0];
    return (
      <div>
        <PageHeader title={fr ? `Bonjour ${user.name}` : `Hello ${user.name}`} subtitle={fr ? "Votre espace joueur" : "Your player space"} />
        {me && (
          <div className="grid gap-4 md:grid-cols-4">
            <Stat label="Fatigue" value={`${me.fatigue}`} tone={me.fatigue >= 75 ? "text-red-600" : "text-emerald-700"} />
            <Stat label={fr ? "Forme" : "Form"} value={me.form} />
            <Stat label="Buts" value={me.stats.goals} />
            <Stat label={fr ? "Valeur" : "Value"} value={formatXaf(me.marketValue)} />
          </div>
        )}
        <Card className="mt-4 p-4">
          <p className="font-semibold">{fr ? "Prochaines actions" : "Next up"}</p>
          <ul className="mt-2 list-disc pl-5 text-sm text-slate-600">
            <li>
              <Link className="text-emerald-700" to="/app/calendar">
                {fr ? "Calendrier d'entraînement" : "Training calendar"}
              </Link>
            </li>
            <li>
              <Link className="text-emerald-700" to="/app/messages">
                Goosiste
              </Link>
            </li>
            <li>
              <Link className="text-emerald-700" to={`/app/players/${user.playerId}`}>
                {fr ? "Passeport numérique" : "Digital passport"}
              </Link>
            </li>
          </ul>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title={fr ? "Dashboard Royal Goose" : "Royal Goose dashboard"}
        subtitle={
          user?.role === "super_admin"
            ? fr
              ? "Super Admin Bodi Awono — KPIs globaux, isolation clubs, audit."
              : "Super Admin Bodi Awono — global KPIs, club isolation, audit."
            : fr
              ? "KPIs temps réel, alertes fatigue et vision globale du club."
              : "Live KPIs, fatigue alerts and club overview."
        }
      />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label={fr ? "Joueurs suivis" : "Players"} value={mine.length} />
        <Stat label={fr ? "Matchs analysés" : "Analyzed matches"} value={analyzed} />
        <Stat label={fr ? "Fatigue moyenne" : "Avg fatigue"} value={avgFatigue} tone={avgFatigue >= 60 ? "text-amber-600" : undefined} />
        <Stat label={fr ? "Valeur effectif" : "Squad value"} value={formatXaf(value)} />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <Card className="p-4 lg:col-span-2">
          <p className="mb-3 font-semibold">{fr ? "Effectif par poste" : "Squad by position"}</p>
          <div className="h-56">
            <ResponsiveContainer>
              <BarChart data={chart}>
                <XAxis dataKey="pos" />
                <Tooltip />
                <Bar dataKey="n" fill="#16a34a" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card className="p-4">
          <div className="mb-3 flex items-center justify-between">
            <p className="font-semibold">{fr ? "Alertes" : "Alerts"}</p>
            {alerts.some((a) => !a.read) && (
              <button
                className="text-xs text-emerald-700"
                onClick={() =>
                  setState((s) => ({
                    ...s,
                    alerts: s.alerts.map((a) => (!clubId || a.clubId === clubId ? { ...a, read: true } : a)),
                  }))
                }
              >
                {fr ? "Tout marquer lu" : "Mark all read"}
              </button>
            )}
          </div>
          <div className="space-y-2">
            {alerts.slice(0, 5).map((a) => (
              <div key={a.id} className="rounded-xl bg-slate-50 p-3 text-sm">
                <Badge tone={a.severity === "critical" ? "red" : a.severity === "warn" ? "gold" : "blue"}>{a.type}</Badge>
                <p className="mt-1 font-medium">{a.title}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card className="mt-4 p-4">
        <p className="mb-3 font-semibold">{fr ? "Fatigue critique (≥75)" : "Critical fatigue (≥75)"}</p>
        {fatigued.length === 0 ? (
          <p className="text-sm text-slate-500">{fr ? "Aucun joueur au-dessus du seuil." : "No player above threshold."}</p>
        ) : (
          <div className="grid gap-2 md:grid-cols-2">
            {fatigued.map((p) => (
              <Link key={p.id} to={`/app/players/${p.id}`} className="flex items-center justify-between rounded-xl border border-red-100 bg-red-50 px-3 py-2">
                <span>
                  <b>{p.name}</b>
                  <span className="ml-2 text-xs text-slate-500">{p.position}</span>
                </span>
                <Badge tone={fatigueTone(p.fatigue) === "critical" ? "red" : "gold"}>{p.fatigue}</Badge>
              </Link>
            ))}
          </div>
        )}
      </Card>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <Card className="p-4">
          <p className="mb-2 font-semibold">{fr ? "Prochains matchs" : "Upcoming matches"}</p>
          {matches
            .filter((m) => m.scoreHome === null)
            .map((m) => (
              <div key={m.id} className="flex justify-between border-b border-slate-100 py-2 text-sm">
                <span>
                  vs {m.opponent} · {m.competition}
                </span>
                <span className="text-slate-500">{m.date}</span>
              </div>
            ))}
        </Card>
        <Card className="p-4">
          <p className="mb-2 font-semibold">{fr ? "Agents IA" : "AI agents"}</p>
          {state.agents.map((a) => (
            <div key={a.id} className="flex items-center justify-between py-1 text-sm">
              <span>{a.name}</span>
              <Badge tone={a.status === "online" ? "green" : a.status === "busy" ? "gold" : "neutral"}>{a.status}</Badge>
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
}
