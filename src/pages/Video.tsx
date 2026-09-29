import { useState } from "react";
import { useApp } from "../context/AppContext";
import { Badge, Button, Card, Empty, PageHeader } from "../components/ui";

export function VideoPage() {
  const { state, setState, user, log, locale } = useApp();
  const fr = locale === "fr";
  const matches = state.matches.filter((m) => user?.role === "super_admin" || m.clubId === user?.clubId);
  const [active, setActive] = useState(matches[0]?.id ?? "");
  const clips = state.videos.filter((v) => v.matchId === active);
  const match = state.matches.find((m) => m.id === active);

  const [busy, setBusy] = useState(false);

  async function generate() {
    if (!active) return;
    setBusy(true);
    try {
      const m = state.matches.find((x) => x.id === active);
      const res = await fetch("/api/ai/video", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("rg_jwt") || ""}` },
        body: JSON.stringify({ opponent: m?.opponent || "adversaire", locale }),
      });
      const json = (await res.json()) as { text?: string; mode?: string };
      const clip = {
        id: `v_${Date.now()}`,
        matchId: active,
        clubId: user?.clubId || m?.clubId,
        title: json.mode === "yolo" ? "Highlight YOLO" : fr ? "Highlight indexé local" : "Local indexed highlight",
        minute: 54,
        type: "highlight" as const,
        notes: json.text || "",
      };
      setState((s) => ({
        ...s,
        videos: [clip, ...s.videos],
        matches: s.matches.map((x) => (x.id === active ? { ...x, analyzed: true } : x)),
      }));
      log("Highlights générés", clip.id);
    } finally {
      setBusy(false);
    }
  }

  if (matches.length === 0) return <Empty text={fr ? "Aucun match analysé." : "No analyzed matches."} />;

  return (
    <div>
      <PageHeader
        title="VideoMaster AI"
        subtitle={fr ? "Highlights, annotations tactiques, comparaisons YOLO Vision." : "Highlights, tactical annotations, YOLO vision."}
        actions={<Button onClick={() => void generate()} disabled={busy}>{busy ? "…" : fr ? "Générer highlights" : "Generate highlights"}</Button>}
      />
      <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
        <Card className="p-3">
          {matches.map((m) => (
            <button
              key={m.id}
              onClick={() => setActive(m.id)}
              className={`mb-2 block w-full rounded-xl px-3 py-2 text-left text-sm ${active === m.id ? "bg-emerald-700 text-white" : "hover:bg-slate-50"}`}
            >
              vs {m.opponent}
              <span className="block text-xs opacity-80">
                {m.date} · {m.scoreHome}-{m.scoreAway}
              </span>
            </button>
          ))}
        </Card>
        <div>
          <Card className="overflow-hidden">
            <div className="grid aspect-video place-items-center bg-slate-950 text-white">
              <div className="text-center">
                <p className="text-sm text-slate-400">YOLO Vision AI</p>
                <p className="text-2xl font-bold">
                  {match ? `vs ${match.opponent}` : ""}
                </p>
                <p className="mt-2 text-emerald-300">{fr ? "Lecteur local · annotations overlay" : "Local player · overlay notes"}</p>
              </div>
            </div>
          </Card>
          <div className="mt-3 grid gap-2">
            {clips.map((c) => (
              <Card key={c.id} className="flex items-start justify-between p-3">
                <div>
                  <b>{c.title}</b>
                  <p className="text-sm text-slate-500">{c.notes}</p>
                </div>
                <Badge tone={c.type === "tactical" ? "purple" : c.type === "individual" ? "blue" : "green"}>
                  {c.minute}' · {c.type}
                </Badge>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
