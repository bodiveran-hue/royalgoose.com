import { useMemo, useState } from "react";
import { useApp } from "../context/AppContext";
import { Badge, Button, Card, Input, PageHeader } from "../components/ui";

export function Messages() {
  const { state, setState, user, log, locale } = useApp();
  const fr = locale === "fr";
  const channels = state.channels.filter((c) => !user?.clubId || c.clubId === user.clubId).filter((c) => c.members.includes(user!.id) || user?.role === "super_admin" || user?.role === "club_admin");
  const [cid, setCid] = useState(channels[0]?.id ?? "");
  const [text, setText] = useState("");
  const [status, setStatus] = useState("");
  const [msgErr, setMsgErr] = useState("");
  const msgs = state.messages.filter((m) => m.channelId === cid);
  const channel = channels.find((c) => c.id === cid);

  const liveStatuses = useMemo(
    () => state.statuses.filter((s) => new Date(s.expiresAt).getTime() > Date.now() - 86400000 * 400),
    [state.statuses],
  );

  function send() {
    if (!text.trim() || !user) {
      setMsgErr(fr ? "Saisissez un message." : "Enter a message.");
      return;
    }
    setMsgErr("");
    const msg = {
      id: `msg_${Date.now()}`,
      channelId: cid,
      fromId: user.id,
      content: text.trim(),
      at: new Date().toISOString(),
      ephemeral: channel?.kind === "announce" ? false : undefined,
    };
    setState((s) => ({ ...s, messages: [...s.messages, msg] }));
    log("Message Goosiste", cid);
    setText("");
  }

  function postStatus() {
    if (!status.trim() || !user) {
      setMsgErr(fr ? "Saisissez un statut." : "Enter a status.");
      return;
    }
    setMsgErr("");
    const st = {
      id: `st_${Date.now()}`,
      userId: user.id,
      text: status.trim(),
      at: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 86400000).toISOString(),
    };
    setState((s) => ({ ...s, statuses: [st, ...s.statuses] }));
    setStatus("");
  }

  return (
    <div>
      <PageHeader
        title={fr ? "Goosiste — Messagerie" : "Goosiste — Messaging"}
        subtitle={fr ? "Chat temps réel, statuts éphémères, annonces officielles." : "Realtime chat, ephemeral statuses, announcements."}
      />
      <div className="mb-4 flex flex-wrap gap-2">
        {liveStatuses.map((s) => {
          const u = state.users.find((x) => x.id === s.userId);
          return (
            <Badge key={s.id} tone="purple">
              {u?.name}: {s.text}
            </Badge>
          );
        })}
      </div>
      <div className="mb-4 flex gap-2">
        <Input placeholder={fr ? "Statut éphémère 24h…" : "24h status…"} value={status} onChange={(e) => setStatus(e.target.value)} />
        <Button onClick={postStatus}>{fr ? "Publier" : "Post"}</Button>
      </div>
      <div className="grid gap-4 lg:grid-cols-[240px_1fr]">
        <Card className="p-2">
          {channels.map((c) => (
            <button
              key={c.id}
              onClick={() => setCid(c.id)}
              className={`mb-1 block w-full rounded-xl px-3 py-2 text-left text-sm ${cid === c.id ? "bg-emerald-700 text-white" : "hover:bg-slate-50"}`}
            >
              {c.name}
              <span className="block text-[11px] opacity-70">{c.kind}</span>
            </button>
          ))}
        </Card>
        <Card className="flex min-h-96 flex-col p-4">
          <div className="flex-1 space-y-2 overflow-y-auto">
            {msgs.map((m) => {
              const from = state.users.find((u) => u.id === m.fromId);
              return (
                <div key={m.id} className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${m.fromId === user?.id ? "ml-auto bg-emerald-700 text-white" : "bg-slate-100"}`}>
                  <p className="text-[11px] opacity-70">{from?.name}</p>
                  {m.content}
                </div>
              );
            })}
          </div>
          <div className="mt-3 flex gap-2">
            <Input
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
              placeholder={channel?.kind === "announce" && user?.role === "player" ? (fr ? "Lecture seule" : "Read only") : fr ? "Message…" : "Message…"}
              disabled={channel?.kind === "announce" && user?.role === "player"}
            />
            <Button onClick={send}>{fr ? "Envoyer" : "Send"}</Button>
          </div>
          {msgErr && <p className="mt-2 text-sm text-red-600">{msgErr}</p>}
        </Card>
      </div>
    </div>
  );
}
