import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { Wordmark } from "../components/Logo";
import { Button, Card, Field, Input } from "../components/ui";

export function Login() {
  const { login, loginAs, loginGoogle, t, locale, user, demoUsers, integrations, apiOnline, ready } = useApp();
  const navigate = useNavigate();
  const [email, setEmail] = useState("emma.t@example.net");
  const [password, setPassword] = useState("Super123!");
  const [err, setErr] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [go, setGo] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem("rg_go")) {
      sessionStorage.removeItem("rg_go");
      setGo(true);
    }
  }, [user, ready]);

  useEffect(() => {
    if (user && go) navigate("/app", { replace: true });
  }, [user, go, navigate]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const msg = await login(email, password);
    setBusy(false);
    if (msg) setErr(msg);
    else setGo(true);
  }

  async function pick(id: string) {
    setBusy(true);
    const ok = await loginAs(id);
    setBusy(false);
    if (!ok) {
      setErr(locale === "fr" ? "Compte inactif ou suspendu" : "Inactive or suspended account");
      return;
    }
    setGo(true);
  }

  async function google() {
    setBusy(true);
    const res = await loginGoogle();
    setBusy(false);
    if (typeof res === "string" && res.startsWith("http")) return;
    if (res && typeof res === "object") {
      setNotice(res.notice || null);
      setGo(true);
      return;
    }
    if (typeof res === "string") setErr(res);
  }

  const accounts = demoUsers.length ? demoUsers : [];

  return (
    <div className="grid min-h-screen md:grid-cols-2">
      <div className="hidden flex-col justify-between bg-linear-to-b from-[#052e16] to-[#14532d] p-10 text-white md:flex">
        <Wordmark light />
        <div>
          <h1 className="text-4xl font-extrabold">{t.heroLead}</h1>
          <p className="mt-3 text-emerald-100">{t.heroSub}</p>
        </div>
        <p className="text-sm text-emerald-200/80">
          {locale === "fr" ? "Super Admin BODI AWONO" : "Super Admin BODI AWONO"} · JWT · isolation club_id · {integrations?.google.label ?? "OAuth Google"}
        </p>
      </div>
      <div className="grid place-items-center p-6">
        <Card className="w-full max-w-md p-6">
          <h2 className="text-2xl font-bold">{t.login}</h2>
          <p className="mb-6 text-sm text-slate-500">
            {locale === "fr"
              ? "Super Admin : Bodi Awono — session JWT, mots de passe scrypt, isolation par club."
              : "Super Admin: Bodi Awono — JWT session, scrypt hashes, club isolation."}
          </p>
          {!ready && <p className="mb-3 text-sm text-slate-500">{locale === "fr" ? "Connexion à l'API…" : "Connecting to API…"}</p>}
          {ready && !apiOnline && (
            <p className="mb-3 text-sm text-red-600">
              {locale === "fr" ? "API hors ligne. Lancez npm run dev (frontend + backend)." : "API offline. Start npm run dev (frontend + backend)."}
            </p>
          )}
          <form className="grid gap-3" onSubmit={(e) => void submit(e)}>
            <Field label={t.email}>
              <Input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required />
            </Field>
            <Field label={t.password}>
              <Input value={password} onChange={(e) => setPassword(e.target.value)} type="password" required />
            </Field>
            {err && <p className="text-sm text-red-600">{err}</p>}
            {notice && <p className="text-sm text-amber-700">{notice}</p>}
            <Button type="submit" disabled={busy}>
              {t.login}
            </Button>
            <Button type="button" variant="outline" disabled={busy} onClick={() => void google()}>
              {t.google}
            </Button>
          </form>
          <p className="mt-6 text-xs font-semibold uppercase text-slate-400">{t.demoAccounts}</p>
          <div className="mt-2 grid gap-2">
            {accounts.map((u) => (
              <button
                key={u.id}
                className="flex items-center justify-between rounded-xl border border-slate-200 px-3 py-2 text-left text-sm hover:bg-slate-50"
                onClick={() => void pick(u.id)}
              >
                <span>
                  <b>{u.name}</b>
                  <span className="block text-xs text-slate-500">{u.email}</span>
                </span>
                <span className="text-xs text-emerald-700">{t.roles[u.role]}</span>
              </button>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
