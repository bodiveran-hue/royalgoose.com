import { useMemo, useState } from "react";
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useApp } from "../context/AppContext";
import { Card, PageHeader, Select } from "../components/ui";
import { acr } from "../lib/utils";

export function Performance() {
  const { state, user, locale } = useApp();
  const fr = locale === "fr";
  const players = state.players.filter((p) => {
    if (user?.role === "player") return p.id === user.playerId;
    return user?.role === "super_admin" || p.clubId === user?.clubId;
  });
  const [pid, setPid] = useState(players[0]?.id ?? "");
  const loads = state.loads.filter((l) => l.playerId === pid);
  const player = players.find((p) => p.id === pid);
  const latest = loads[loads.length - 1];
  const ratio = latest ? acr(latest.acute, latest.chronic) : 0;

  const heat = useMemo(() => {
    return Array.from({ length: 8 }, (_, y) =>
      Array.from({ length: 12 }, (_, x) => {
        const v = ((x * 7 + y * 13 + (player?.number ?? 1) * 3) % 10) / 10;
        return v > 0.35 ? v : 0.08;
      }),
    );
  }, [player]);

  return (
    <div>
      <PageHeader
        title={fr ? "Performance & Charge" : "Performance & load"}
        subtitle={fr ? "UA, ratio aigu/chronique, GPS wearables, heatmaps." : "Training load, ACR, GPS, heatmaps."}
      />
      <Select value={pid} onChange={(e) => setPid(e.target.value)} className="mb-4 max-w-sm">
        {players.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
          </option>
        ))}
      </Select>
      <div className="grid gap-3 md:grid-cols-4">
        <Card className="p-4">
          <p className="text-xs text-slate-500">ACR</p>
          <p className={`text-3xl font-bold ${ratio > 1.3 ? "text-red-600" : "text-emerald-700"}`}>{ratio}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-slate-500">GPS km</p>
          <p className="text-3xl font-bold">{latest?.gpsKm.toFixed(1) ?? "—"}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-slate-500">Sprints</p>
          <p className="text-3xl font-bold">{latest?.sprints ?? "—"}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-slate-500">Top speed</p>
          <p className="text-3xl font-bold">{latest?.topSpeed ?? "—"} km/h</p>
        </Card>
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card className="p-4">
          <p className="mb-2 font-semibold">{fr ? "Charge aiguë vs chronique" : "Acute vs chronic load"}</p>
          <div className="h-56">
            <ResponsiveContainer>
              <LineChart data={loads}>
                <XAxis dataKey="date" hide />
                <YAxis />
                <Tooltip />
                <Line dataKey="acute" stroke="#f59e0b" dot={false} />
                <Line dataKey="chronic" stroke="#16a34a" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card className="p-4">
          <p className="mb-2 font-semibold">{fr ? "Heatmap GPS (session)" : "GPS heatmap"}</p>
          <div className="grid aspect-video grid-cols-12 overflow-hidden rounded-xl bg-emerald-900">
            {heat.flatMap((row, y) =>
              row.map((v, x) => (
                <div key={`${x}-${y}`} style={{ background: `rgba(251, 191, 36, ${v})` }} />
              )),
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
