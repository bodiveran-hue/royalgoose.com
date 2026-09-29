import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { Badge, Button, Card, PageHeader } from "../components/ui";
import { billingCheckout, fetchOutbox, fetchState } from "../lib/api";

const PLANS = [
  { id: "starter" as const, name: "Starter", price: "49 000 XAF / mois", seats: 12, perks: ["Dashboard", "Joueurs", "Calendrier"] },
  { id: "elite" as const, name: "Elite", price: "149 000 XAF / mois", seats: 48, perks: ["IA tactique", "Vidéo", "Médical", "Goosiste"] },
  { id: "continent" as const, name: "Continent", price: "390 000 XAF / mois", seats: 80, perks: ["Scout 150+", "Transfergoose", "8 agents 24/7"] },
];

export function Billing() {
  const { state, setState, user, log, locale, integrations } = useApp();
  const fr = locale === "fr";
  const sub = state.subscriptions.find((s) => s.clubId === user?.clubId) ?? state.subscriptions[0];
  const [paid, setPaid] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function checkout(plan: typeof PLANS[number]["id"]) {
    if (!user?.clubId && user?.role !== "super_admin") return;
    setBusy(true);
    setNotice(null);
    try {
      const out = await billingCheckout(plan);
      if (out.mode === "stripe" && out.url) {
        window.location.href = out.url;
        return;
      }
      const clubId = user.clubId ?? state.clubs[0].id;
      setState((s) => ({
        ...s,
        subscriptions: s.subscriptions.map((x) =>
          x.clubId === clubId ? { ...x, plan, status: "active", renews: "2027-09-29" } : x,
        ),
      }));
      setPaid(true);
      setNotice(out.label || (fr ? "Checkout local — STRIPE_SECRET_KEY absente." : "Local checkout — STRIPE_SECRET_KEY missing."));
      log("Paiement Stripe", plan);
      const fresh = await fetchState();
      setState(() => fresh.state);
    } catch (e) {
      setNotice(String(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <PageHeader
        title={fr ? "Abonnement Stripe" : "Stripe billing"}
        subtitle={integrations?.stripe.label || (fr ? "Checkout Stripe ou local selon les clés." : "Stripe or local checkout depending on keys.")}
      />
      <Card className="mb-4 p-4">
        <p>
          {fr ? "Plan actuel" : "Current plan"}: <b>{sub.plan}</b> · {sub.status} · {fr ? "renouvellement" : "renews"} {sub.renews} · {sub.seats} sièges
        </p>
        {paid && <Badge className="mt-2" tone="green">{fr ? "Paiement enregistré" : "Payment recorded"}</Badge>}
        {notice && <p className="mt-2 text-sm text-amber-800">{notice}</p>}
      </Card>
      <div className="grid gap-4 md:grid-cols-3">
        {PLANS.map((p) => (
          <Card key={p.id} className="p-5">
            <h3 className="text-xl font-bold">{p.name}</h3>
            <p className="text-emerald-700">{p.price}</p>
            <ul className="mt-3 list-disc pl-5 text-sm text-slate-600">
              {p.perks.map((x) => (
                <li key={x}>{x}</li>
              ))}
            </ul>
            <Button className="mt-4" disabled={busy} onClick={() => void checkout(p.id)}>
              {fr ? "Payer avec Stripe" : "Pay with Stripe"}
            </Button>
          </Card>
        ))}
      </div>
    </div>
  );
}

export function Settings() {
  const { user, locale, setLocale, reset, t, integrations, apiOnline } = useApp();
  const nav = useNavigate();
  const fr = locale === "fr";
  const [offline] = useState(() => "serviceWorker" in navigator);
  const [outbox, setOutbox] = useState<{ id: string; at: string; to: string[]; subject: string; mode: string }[]>([]);
  const [outErr, setOutErr] = useState<string | null>(null);

  async function loadOutbox() {
    try {
      setOutErr(null);
      setOutbox(await fetchOutbox());
    } catch {
      setOutErr(fr ? "Boîte mail réservée admin / club admin." : "Outbox is admin / club admin only.");
    }
  }

  return (
    <div>
      <PageHeader title={t.nav.settings} subtitle={fr ? "Langue, PWA, session JWT, intégrations, reset." : "Language, PWA, JWT session, integrations, reset."} />
      <Card className="space-y-4 p-4">
        <p>
          {user?.name} · {user?.email} · {t.roles[user!.role]}
        </p>
        <p className={`text-sm ${apiOnline ? "text-emerald-700" : "text-red-600"}`}>
          {apiOnline ? (fr ? "API locale en ligne (JWT)." : "Local API online (JWT).") : fr ? "API hors ligne — lancez npm run dev." : "API offline — start npm run dev."}
        </p>
        <div className="flex gap-2">
          <Button variant={locale === "fr" ? "primary" : "outline"} onClick={() => setLocale("fr")}>
            Français
          </Button>
          <Button variant={locale === "en" ? "primary" : "outline"} onClick={() => setLocale("en")}>
            English
          </Button>
        </div>
        <p className="text-sm text-slate-500">
          PWA: {offline ? (fr ? "installable (manifest + service worker)" : "installable") : "n/a"}
        </p>
        {integrations && (
          <div className="rounded-xl bg-slate-50 p-3 text-sm">
            <p className="font-semibold">{fr ? "Intégrations (clés .env)" : "Integrations (.env keys)"}</p>
            <ul className="mt-2 space-y-1 text-slate-600">
              <li>IA: {integrations.ai.label}</li>
              <li>Stripe: {integrations.stripe.label}</li>
              <li>Google: {integrations.google.label}</li>
              <li>Calendar: {integrations.calendar.label}</li>
              <li>Email: {integrations.email.label}</li>
              <li>Vision: {integrations.vision.label}</li>
            </ul>
          </div>
        )}
        {(user?.role === "super_admin" || user?.role === "club_admin") && (
          <div>
            <Button variant="outline" onClick={() => void loadOutbox()}>
              {fr ? "Voir la boîte mail locale" : "View local mail outbox"}
            </Button>
            {outErr && <p className="mt-2 text-sm text-red-600">{outErr}</p>}
            {outbox.slice(0, 8).map((m) => (
              <p key={m.id} className="mt-2 text-xs text-slate-500">
                {m.at.slice(0, 16)} · {m.mode} · {m.subject} → {m.to.join(", ")}
              </p>
            ))}
          </div>
        )}
        <Button
          variant="danger"
          onClick={() => {
            if (confirm(fr ? "Réinitialiser les données démo ?" : "Reset demo data?")) {
              void reset().then(() => nav("/"));
            }
          }}
        >
          {fr ? "Réinitialiser la démo" : "Reset demo"}
        </Button>
      </Card>
    </div>
  );
}
