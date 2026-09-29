import { Link, useNavigate } from "react-router-dom";
import {
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  Activity,
  Bell,
  Brain,
  CalendarDays,
  Cpu,
  Flag,
  HeartPulse,
  LayoutDashboard,
  MessageSquare,
  Palette,
  Radar as RadarIcon,
  Shield,
  Smartphone,
  Sparkles,
  Users,
  Video,
  Zap,
} from "lucide-react";
import { motion } from "framer-motion";
import { useApp } from "../context/AppContext";
import { Wordmark } from "../components/Logo";
import { Button } from "../components/ui";
import { HeroOrb } from "../components/HeroOrb";

const radar = [
  { k: "Tactique", v: 92 },
  { k: "Scouting", v: 88 },
  { k: "Performance", v: 86 },
  { k: "Médical", v: 84 },
  { k: "Vidéo IA", v: 90 },
  { k: "Transferts", v: 80 },
];

const growth = [
  { m: "Jan", clubs: 18, joueurs: 210 },
  { m: "Fév", clubs: 28, joueurs: 320 },
  { m: "Mar", clubs: 36, joueurs: 410 },
  { m: "Avr", clubs: 48, joueurs: 560 },
  { m: "Mai", clubs: 60, joueurs: 780 },
  { m: "Jun", clubs: 71, joueurs: 1050 },
];

const matches = [
  { m: "Jan", n: 42 },
  { m: "Fév", n: 68 },
  { m: "Mar", n: 96 },
  { m: "Avr", n: 132 },
  { m: "Mai", n: 188 },
  { m: "Jun", n: 264 },
];

const mods = [
  { name: "Dashboard & Analytics", v: 22, c: "#8b5cf6" },
  { name: "IA & Tactique", v: 20, c: "#22c55e" },
  { name: "Scouting & Réseau", v: 18, c: "#f97316" },
  { name: "Vidéo & Performance", v: 17, c: "#ef4444" },
  { name: "Transferts & Contrats", v: 13, c: "#3b82f6" },
  { name: "Medical & Wellbeing", v: 10, c: "#14b8a6" },
];

export function Landing() {
  const { t, locale, setLocale, user } = useApp();
  const navigate = useNavigate();
  const fr = locale === "fr";

  return (
    <div className="bg-white text-slate-900">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#052e16]/90 text-white backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <Wordmark light />
          <div className="flex items-center gap-2">
            <button className="rounded-full px-3 py-1 text-xs font-semibold" onClick={() => setLocale(fr ? "en" : "fr")}>
              {fr ? "EN" : "FR"}
            </button>
            <Button variant="gold" size="sm" onClick={() => navigate(user ? "/app" : "/login")}>
              {t.ctaPlatform}
            </Button>
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden bg-linear-to-b from-[#064e3b] via-[#14532d] to-[#166534] px-4 pb-16 pt-12 text-white">
        <div className="mx-auto max-w-6xl">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-amber-500/20 px-3 py-1 text-xs font-semibold text-amber-200">
            ✦ {t.tag}
          </div>
          <div className="flex flex-wrap items-center justify-between gap-6">
            <div className="max-w-2xl">
              <Wordmark light />
              <p className="mt-6 text-xl text-emerald-50 md:text-2xl">{t.heroLead}</p>
              <p className="mt-2 text-emerald-100/80">— {t.heroSub}</p>
              <div className="mt-6 flex flex-wrap gap-2 text-xs">
                <span className="rounded-full bg-black/20 px-3 py-1">🏆 Elite One & Two</span>
                <span className="rounded-full bg-black/20 px-3 py-1">8 Agents IA 24/7</span>
                <span className="rounded-full bg-black/20 px-3 py-1">50+ Modules</span>
                <span className="rounded-full bg-black/20 px-3 py-1">150+ Pays</span>
              </div>
            </div>
            <HeroOrb />
          </div>

          <div className="mt-10 rounded-3xl border border-white/15 bg-white/5 p-6">
            <p className="mb-2 text-center text-xs font-semibold tracking-widest text-amber-300">
              {fr ? "COUVERTURE FONCTIONNELLE (%)" : "FEATURE COVERAGE (%)"}
            </p>
            <div className="h-72">
              <ResponsiveContainer>
                <RadarChart data={radar}>
                  <PolarGrid stroke="rgba(255,255,255,0.25)" />
                  <PolarAngleAxis dataKey="k" tick={{ fill: "#ecfdf5", fontSize: 12 }} />
                  <Radar dataKey="v" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.35} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-6">
            {[
              ["50+", fr ? "Modules actifs" : "Active modules"],
              ["8", fr ? "Agents IA 24/7" : "AI agents 24/7"],
              ["1050+", fr ? "Joueurs suivis" : "Tracked players"],
              ["71", fr ? "Clubs connectés" : "Connected clubs"],
              ["264", fr ? "Matchs analysés" : "Matches analyzed"],
              ["24/7", fr ? "Surveillance auto" : "Auto monitoring"],
            ].map(([n, l]) => (
              <div key={l} className="rounded-2xl border border-white/15 bg-white/10 p-4 text-center">
                <div className="text-2xl font-bold">{n}</div>
                <div className="text-xs text-emerald-100/80">{l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16">
        <p className="text-center text-xs font-semibold tracking-widest text-emerald-700">CROISSANCE & IMPACT</p>
        <h2 className="mb-8 text-center text-3xl font-extrabold">{fr ? "Données de Croissance" : "Growth data"}</h2>
        <div className="rounded-3xl border border-slate-200 p-6">
          <p className="font-semibold">{fr ? "Clubs & Joueurs — 6 mois" : "Clubs & players — 6 months"}</p>
          <p className="text-sm text-slate-500">{fr ? "Croissance mensuelle de la base utilisateurs" : "Monthly user-base growth"}</p>
          <div className="mt-4 h-64">
            <ResponsiveContainer>
              <LineChart data={growth}>
                <XAxis dataKey="m" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="joueurs" stroke="#7c3aed" strokeWidth={3} dot={false} />
                <Line type="monotone" dataKey="clubs" stroke="#16a34a" strokeWidth={3} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <div className="rounded-3xl border border-slate-200 p-6">
            <p className="font-semibold">{fr ? "Répartition des Modules" : "Module mix"}</p>
            <div className="h-56">
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={mods} dataKey="v" innerRadius={50} outerRadius={80}>
                    {mods.map((m) => (
                      <Cell key={m.name} fill={m.c} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <ul className="space-y-1 text-sm">
              {mods.map((m) => (
                <li key={m.name} className="flex justify-between">
                  <span className="flex items-center gap-2">
                    <i className="h-2 w-2 rounded-full" style={{ background: m.c }} />
                    {m.name}
                  </span>
                  <b>{m.v}%</b>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-3xl border border-slate-200 p-6">
            <p className="font-semibold">{fr ? "Matchs analysés par IA — 6 mois" : "AI-analyzed matches"}</p>
            <div className="mt-4 h-64">
              <ResponsiveContainer>
                <BarChart data={matches}>
                  <XAxis dataKey="m" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="n" fill="#22c55e" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-16">
        <p className="text-center text-xs font-semibold tracking-widest text-emerald-700">50+ FONCTIONNALITÉS</p>
        <h2 className="mb-8 text-center text-3xl font-extrabold">{fr ? "Modules de la Plateforme" : "Platform modules"}</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {[
            [LayoutDashboard, "Dashboard Royal Goose", fr ? "Tableau de bord unifié avec KPIs temps réel, alertes fatigue critiques, et rapports automatisés." : "Unified live KPIs, critical fatigue alerts and automated reports."],
            [Brain, "Expert Tactique Football", fr ? "Agent IA spécialisé en analyse tactique. Briefings, simulations et recommandations Claude AI." : "Tactical AI: briefings, simulations and Claude-powered recs."],
            [Video, "VideoMaster AI", fr ? "Analyse vidéo automatique, highlights, annotations tactiques et comparaisons de performances." : "Auto video analysis, highlights, annotations and comparisons."],
            [RadarIcon, "Scout Réseau Mondial", fr ? "Réseau de scouting dans 150+ pays, base joueurs et connexions clubs/agents." : "Scouting in 150+ countries, player DB and club/agent links."],
            [Users, "Gestion Complète Joueurs", fr ? "Profils 360°, passeports numériques exportables, statistiques et historique de carrière." : "360° profiles, exportable digital passports, stats and career."],
            [Flag, "Transfergoose & Contrats", fr ? "Données marché temps réel, estimation de valeur, négociation IA et gestion contractuelle." : "Live market data, valuation, AI negotiation and contracts."],
            [HeartPulse, "Médical & Prévention", fr ? "Prédiction des blessures par IA, dossiers médicaux, protocoles de récupération." : "Injury prediction, medical files and recovery protocols."],
            [Activity, "Performance & Charge", fr ? "Charge d'entraînement (UA), ratio aigu/chronique (ACR), GPS et heatmaps." : "Training load, ACR, GPS wearables and heatmaps."],
            [CalendarDays, "Calendrier Intelligent", fr ? "Planification multi-équipes, Google Calendar, rappels et événements du club." : "Multi-team planning, Google Calendar, reminders and events."],
            [MessageSquare, "Goosiste — Messagerie", fr ? "Chat temps réel, statuts éphémères, annonces officielles et groupes." : "Realtime chat, ephemeral statuses, announcements and groups."],
            [Palette, "Design Visuel IA", fr ? "Propositions d'améliorations visuelles, aperçu et application après approbation." : "UI proposals, live preview and apply after approval."],
            [Cpu, "Centre de Contrôle IA 24/7", fr ? "Supervision de 8 agents autonomes, logs d'activité et interventions automatisées." : "Supervise 8 agents, activity logs and automated interventions."],
          ].map(([Icon, title, desc], i) => {
            const hrefs = [
              "/app",
              "/app/tactics",
              "/app/video",
              "/app/scouting",
              "/app/players",
              "/app/transfers",
              "/app/medical",
              "/app/performance",
              "/app/calendar",
              "/app/messages",
              "/app/design",
              "/app/control",
            ];
            return (
              <motion.button
                type="button"
                key={String(title)}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="rounded-2xl border border-slate-100 bg-linear-to-br from-emerald-50 to-white p-5 text-left hover:border-emerald-300"
                onClick={() => navigate(user ? hrefs[i] : "/login")}
              >
                <Icon className="mb-2 h-5 w-5 text-emerald-700" />
                <h3 className="font-bold">{title as string}</h3>
                <p className="mt-1 text-sm text-slate-600">{desc as string}</p>
              </motion.button>
            );
          })}
        </div>
      </section>

      <section className="bg-[#0b1220] px-4 py-16 text-white">
        <div className="mx-auto max-w-6xl">
          <p className="text-center text-xs font-semibold tracking-widest text-violet-300">INTELLIGENCE ARTIFICIELLE</p>
          <h2 className="mb-2 text-center text-3xl font-extrabold">{fr ? "8 Agents IA Autonomes 24/7" : "8 autonomous AI agents 24/7"}</h2>
          <p className="mb-10 text-center text-slate-300">
            {fr ? "Des intelligences déployées en permanence pour surveiller, analyser et agir pour votre club." : "Always-on intelligence to monitor, analyse and act for your club."}
          </p>
          <div className="grid gap-4 md:grid-cols-2">
            {[
              ["Expert Tactique Football", "Analyse & Briefings"],
              ["Scout Réseau Mondial", "150+ Pays"],
              ["Analyste Performance", "Temps Réel"],
              ["VideoMaster AI", "Highlights Auto"],
              ["Coach Développement", "Plans Personnalisés"],
              ["Super Agent Royal Goose", "Contrôle Total"],
              ["Agent Design Visuel", "Application IA"],
              ["Coordinateur Planning", "Optimisation Auto"],
            ].map(([n, tag]) => (
              <button
                key={n}
                className="rounded-2xl border border-white/10 bg-white/5 p-5 text-left hover:border-amber-400/50"
                onClick={() => navigate(user ? "/app/agents" : "/login")}
              >
                <div className="mb-2 flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-amber-400" />
                  <b>{n}</b>
                </div>
                <span className="rounded-full bg-violet-500/20 px-2 py-0.5 text-xs text-violet-200">{tag}</span>
              </button>
            ))}
          </div>
          <div className="mt-6 grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm">
              ⚡ <b>Alerte Fatigue LIVE</b> — email auto dès 75+ de fatigue
            </div>
            <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm">
              📋 <b>Tâche Urgente LIVE</b> — notification instantanée staff
            </div>
            <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm">
              📊 <b>Rapport Mensuel AUTO</b> — génération et envoi
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16">
        <p className="text-center text-xs font-semibold tracking-widest text-emerald-700">POURQUOI ROYAL GOOSE ?</p>
        <h2 className="mb-8 text-center text-3xl font-extrabold">{fr ? "Avantages Compétitifs" : "Competitive advantages"}</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {[
            [Brain, fr ? "Intelligence Artificielle Native" : "Native AI", fr ? "Claude AI et DeepSeek intégrés. Une IA opérationnelle 24/24 — pas un simple chatbot." : "Claude and DeepSeek in every module. Operational AI, not a chatbot."],
            [Flag, fr ? "Expertise Football Africain" : "African football expertise", fr ? "Elite One et Two du Cameroun, scouts locaux, partenaires continentaux." : "Cameroon Elite One & Two, local scouts, continental partners."],
            [Shield, fr ? "Sécurité & Isolation Totale" : "Security & isolation", fr ? "Isolation des données, rôles Super Admin / Club Admin / Coach / Staff / Joueur, logs d'audit." : "Data isolation, granular roles, full audit logs."],
            [Smartphone, fr ? "Expérience Mobile Complète" : "Full mobile experience", fr ? "PWA iOS/Android, offline, sync auto, notifications, responsive." : "Installable PWA, offline, sync, push, responsive."],
            [Bell, fr ? "Automatisation & Alertes" : "Automation & alerts", fr ? "Fatigue ≥75, tâches urgentes, renouvellements J-30, rapports mensuels." : "Fatigue ≥75, urgent tasks, 30-day renewals, monthly reports."],
            [Zap, fr ? "Performance & Scalabilité" : "Performance & scale", fr ? "99.9% uptime, serverless, milliers de joueurs et clubs." : "99.9% uptime, serverless, thousands of players and clubs."],
          ].map(([Icon, title, body]) => (
            <div key={String(title)} className="rounded-2xl border border-slate-200 p-5">
              <Icon className="mb-2 h-5 w-5 text-emerald-700" />
              <h3 className="font-bold">{title as string}</h3>
              <p className="mt-1 text-sm text-slate-600">{body as string}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-16">
        <div className="rounded-3xl bg-slate-950 p-6 text-white">
          <p className="text-xs font-semibold tracking-widest text-amber-400">ARCHITECTURE TECHNIQUE</p>
          <h3 className="mb-6 text-xl font-bold">Stack Technologique Royal Goose</h3>
          <div className="grid gap-6 md:grid-cols-3 text-sm">
            <div>
              <b className="text-sky-300">Frontend</b>
              <ul className="mt-2 space-y-1 text-slate-300">
                <li>React 18 + Vite</li>
                <li>Tailwind CSS + shadcn/ui</li>
                <li>Framer Motion</li>
                <li>React Query</li>
                <li>PWA Installable</li>
                <li>Recharts + Three.js</li>
              </ul>
            </div>
            <div>
              <b className="text-violet-300">Backend & IA</b>
              <ul className="mt-2 space-y-1 text-slate-300">
                <li>Express + JSON persisté (data/db.json)</li>
                <li>JWT HMAC + mots de passe scrypt</li>
                <li>Claude / DeepSeek si clés, sinon moteur local</li>
                <li>Stripe si STRIPE_SECRET_KEY, sinon checkout local</li>
                <li>YOLO Vision si YOLO_VISION_URL, sinon index local</li>
              </ul>
            </div>
            <div>
              <b className="text-emerald-300">Sécurité & Data</b>
              <ul className="mt-2 space-y-1 text-slate-300">
                <li>Row Level Security</li>
                <li>Isolation team_id</li>
                <li>OAuth Google + JWT Sessions</li>
                <li>Webhooks signés</li>
                <li>Logs d'audit</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-16">
        <p className="text-center text-xs font-semibold tracking-widest text-emerald-700">VISION & ÉVOLUTION</p>
        <h2 className="mb-8 text-center text-3xl font-extrabold">Roadmap de Développement</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {[
            ["PHASE 1", "Socle Plateforme", "Livré", ["Gestion joueurs & équipes", "Dashboard analytics", "Messagerie & calendrier", "Système de rôles"]],
            ["PHASE 2", "IA & Performance", "Livré", ["Analyse vidéo IA", "Prédiction blessures", "GPS & wearables", "8 Agents IA autonomes"]],
            ["PHASE 3", "Réseau & Transferts", "Livré", ["Scouting 150+ pays", "Données Transfermarkt", "Négociation IA", "Réseau clubs africains"]],
            ["PHASE 4", "Automatisation Totale", "En cours", ["Notifications email auto", "Agents 24/7 renforcés", "Design IA auto-apply", "Rapports IA mensuels"]],
          ].map(([phase, title, status, items]) => (
            <div key={String(phase)} className="rounded-2xl border border-slate-200 p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-700">{phase as string}</span>
                <span className={`text-xs font-semibold ${status === "Livré" ? "text-emerald-600" : "text-red-600"}`}>
                  {status as string}
                </span>
              </div>
              <h3 className="mt-1 font-bold">{title as string}</h3>
              <ul className="mt-2 list-disc pl-5 text-sm text-slate-600">
                {(items as string[]).map((i) => (
                  <li key={i}>{i}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section className="px-4 pb-16">
        <div className="mx-auto max-w-6xl rounded-3xl bg-linear-to-r from-[#14532d] to-[#166534] px-6 py-12 text-center text-white">
          <Wordmark light />
          <h2 className="mt-6 text-3xl font-extrabold">{fr ? "Conçue pour les clubs gagnants." : "Built for winning clubs."}</h2>
          <p className="mt-2 text-emerald-100">
            {fr
              ? "La plateforme tout-en-un qui transforme la gestion de votre club avec l'intelligence artificielle."
              : "The all-in-one platform that transforms club operations with AI."}
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button variant="gold" size="lg" onClick={() => navigate("/login")}>
              {t.ctaPlatform}
            </Button>
            <a href="/Royal-Goose-Presentation.pdf" download>
              <Button variant="outline" size="lg" className="border-white/30 bg-transparent text-white hover:bg-white/10">
                {t.ctaPdf}
              </Button>
            </a>
          </div>
        </div>
      </section>

      <footer className="bg-[#052e16] py-6 text-center text-sm text-emerald-200">
        © 2026 Royal Goose Elite Platform — {fr ? "Super Admin : Bodi Awono" : "Super Admin: Bodi Awono"} ·{" "}
        {fr ? "Tous droits réservés" : "All rights reserved"} ·{" "}
        <Link className="underline" to="/login">
          {t.login}
        </Link>
      </footer>
    </div>
  );
}
