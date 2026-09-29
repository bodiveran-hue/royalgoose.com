import { useState } from "react";
import { useApp } from "../context/AppContext";
import { Badge, Button, Card, Empty, Field, Input, Modal, PageHeader, Select } from "../components/ui";
import type { Role, User } from "../lib/types";

export function Admin() {
  const { state, setState, user, log, locale } = useApp();
  const fr = locale === "fr";
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", role: "coach" as Role, clubId: state.clubs[0].id });

  if (user?.role !== "super_admin") return <Empty text={fr ? "Réservé Super Admin." : "Super Admin only."} />;

  function add() {
    if (!form.name.trim() || !form.email.trim()) return;
    const u: User = {
      id: `u_${Date.now()}`,
      email: form.email,
      password: "Temp123!",
      name: form.name,
      role: form.role,
      clubId: form.role === "super_admin" ? null : form.clubId,
      avatar: form.name.slice(0, 2).toUpperCase(),
      status: "invited",
      lastLogin: "",
    };
    setState((s) => ({ ...s, users: [...s.users, u] }));
    log("Invitation utilisateur", u.id);
    setOpen(false);
  }

  return (
    <div>
      <PageHeader
        title={fr ? "Administration multi-clubs" : "Multi-club admin"}
        subtitle={fr ? "Isolation team_id, rôles, invitations." : "team_id isolation, roles, invites."}
        actions={<Button onClick={() => setOpen(true)}>{fr ? "Inviter" : "Invite"}</Button>}
      />
      <div className="grid gap-4 md:grid-cols-3">
        {state.clubs.map((c) => (
          <Card key={c.id} className="p-4">
            <div className="grid h-12 w-12 place-items-center rounded-xl bg-emerald-700 font-bold text-white">{c.logoLetter}</div>
            <h3 className="mt-2 font-bold">{c.name}</h3>
            <p className="text-sm text-slate-500">
              {c.league} · {c.city}
            </p>
            <p className="mt-2 text-xs">
              {state.users.filter((u) => u.clubId === c.id).length} users · {state.players.filter((p) => p.clubId === c.id).length} joueurs
            </p>
          </Card>
        ))}
      </div>
      <Card className="mt-4 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="p-3">User</th>
              <th>Rôle</th>
              <th>Club</th>
              <th>Statut</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {state.users.map((u) => (
              <tr key={u.id} className="border-t">
                <td className="p-3">
                  {u.name}
                  <div className="text-xs text-slate-500">{u.email}</div>
                </td>
                <td>{u.role}</td>
                <td>{state.clubs.find((c) => c.id === u.clubId)?.shortName ?? "—"}</td>
                <td>
                  <Badge tone={u.status === "active" ? "green" : "gold"}>{u.status}</Badge>
                </td>
                <td>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      setState((s) => ({
                        ...s,
                        users: s.users.map((x) =>
                          x.id === u.id ? { ...x, status: x.status === "suspended" ? "active" : "suspended" } : x,
                        ),
                      }))
                    }
                  >
                    {u.status === "suspended" ? "activer" : "suspendre"}
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
      <Modal open={open} title={fr ? "Inviter" : "Invite"} onClose={() => setOpen(false)}>
        <div className="grid gap-3">
          <Field label="Nom">
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </Field>
          <Field label="Email">
            <Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </Field>
          <Field label="Rôle">
            <Select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as Role })}>
              <option value="club_admin">club_admin</option>
              <option value="coach">coach</option>
              <option value="staff">staff</option>
              <option value="player">player</option>
              <option value="super_admin">super_admin</option>
            </Select>
          </Field>
          <Field label="Club">
            <Select value={form.clubId} onChange={(e) => setForm({ ...form, clubId: e.target.value })}>
              {state.clubs.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.shortName}
                </option>
              ))}
            </Select>
          </Field>
          <Button onClick={add} disabled={!form.name.trim() || !form.email.trim()}>
            {fr ? "Inviter" : "Invite"}
          </Button>
        </div>
      </Modal>
    </div>
  );
}

export function Audit() {
  const { state, user, locale } = useApp();
  const fr = locale === "fr";
  if (user?.role !== "super_admin" && user?.role !== "club_admin") {
    return <Empty text={fr ? "Réservé Super Admin / Club Admin." : "Super Admin / Club Admin only."} />;
  }
  return (
    <div>
      <PageHeader title={fr ? "Logs d'audit" : "Audit logs"} subtitle={fr ? "Traçabilité complète." : "Full traceability."} />
      <Card className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="p-3">Date</th>
              <th>User</th>
              <th>Action</th>
              <th>Entité</th>
            </tr>
          </thead>
          <tbody>
            {state.audit.map((a) => (
              <tr key={a.id} className="border-t">
                <td className="p-3 whitespace-nowrap">{a.at.replace("T", " ").slice(0, 19)}</td>
                <td>{a.user}</td>
                <td>{a.action}</td>
                <td>{a.entity}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
