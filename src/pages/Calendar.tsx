import { useMemo, useState } from "react";
import { addDays, format, startOfWeek } from "date-fns";
import { fr as frLoc } from "date-fns/locale";
import { useApp } from "../context/AppContext";
import { Badge, Button, Card, Field, Input, Modal, PageHeader, Select } from "../components/ui";
import { calendarSync, fetchState } from "../lib/api";
import type { CalendarEvent } from "../lib/types";

const TYPES: CalendarEvent["type"][] = ["match", "entrainement", "medical", "reunion", "deplacement"];

export function CalendarPage() {
  const { state, setState, user, log, locale } = useApp();
  const fr = locale === "fr";
  const [open, setOpen] = useState(false);
  const [synced, setSynced] = useState(0);
  const [syncNote, setSyncNote] = useState<string | null>(null);
  const weekStart = startOfWeek(new Date("2026-09-29"), { weekStartsOn: 1 });
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const events = state.events.filter((e) => user?.role === "super_admin" || e.clubId === user?.clubId);

  const [form, setForm] = useState({
    title: "",
    type: "entrainement" as CalendarEvent["type"],
    start: "2026-09-30T09:00",
    location: "Centre d'entraînement",
    team: "A",
  });

  const byDay = useMemo(() => {
    return days.map((d) => ({
      d,
      items: events.filter((e) => e.start.slice(0, 10) === format(d, "yyyy-MM-dd")),
    }));
  }, [days, events]);

  function add() {
    const ev: CalendarEvent = {
      id: `e_${Date.now()}`,
      clubId: user?.clubId ?? state.clubs[0].id,
      title: form.title,
      type: form.type,
      start: form.start,
      end: form.start,
      location: form.location,
      team: form.team,
      notes: "",
      googleSynced: false,
    };
    setState((s) => ({ ...s, events: [...s.events, ev] }));
    log("Événement calendrier", ev.id);
    setOpen(false);
  }

  return (
    <div>
      <PageHeader
        title={fr ? "Calendrier intelligent" : "Smart calendar"}
        subtitle={fr ? "Multi-équipes, Google Calendar, rappels automatiques." : "Multi-team, Google Calendar, reminders."}
        actions={
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                void (async () => {
                  const out = await calendarSync();
                  setSynced(out.synced);
                  setSyncNote(out.label);
                  setState((s) => ({ ...s, events: s.events.map((e) => ({ ...e, googleSynced: true })) }));
                  const fresh = await fetchState();
                  setState(() => fresh.state);
                  log("Sync Google Calendar", "calendar");
                })();
              }}
            >
              Google Calendar ({synced || events.filter((e) => e.googleSynced).length})
            </Button>
            {user?.role !== "player" && <Button onClick={() => setOpen(true)}>{fr ? "Ajouter" : "Add"}</Button>}
          </div>
        }
      />
      {syncNote && <p className="mb-3 text-sm text-amber-800">{syncNote}</p>}
      <div className="grid gap-3 md:grid-cols-7">
        {byDay.map(({ d, items }) => (
          <Card key={d.toISOString()} className="min-h-48 p-3">
            <p className="text-xs font-semibold uppercase text-slate-500">
              {format(d, "EEE d MMM", { locale: fr ? frLoc : undefined })}
            </p>
            <div className="mt-2 space-y-2">
              {items.map((e) => (
                <div key={e.id} className="rounded-lg bg-emerald-50 p-2 text-xs">
                  <Badge tone="green">{e.type}</Badge>
                  <p className="mt-1 font-medium">{e.title}</p>
                  <p className="text-slate-500">
                    {e.team} · {e.location}
                  </p>
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>
      <Modal open={open} title={fr ? "Événement" : "Event"} onClose={() => setOpen(false)}>
        <div className="grid gap-3">
          <Field label="Titre">
            <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </Field>
          <Field label="Type">
            <Select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as CalendarEvent["type"] })}>
              {TYPES.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </Select>
          </Field>
          <Field label="Début">
            <Input type="datetime-local" value={form.start} onChange={(e) => setForm({ ...form, start: e.target.value })} />
          </Field>
          <Field label={fr ? "Lieu" : "Location"}>
            <Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
          </Field>
          <Button onClick={add} disabled={!form.title}>
            {fr ? "Créer" : "Create"}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
