import fs from "node:fs";
import path from "node:path";
import type { IntegrationsStatus } from "../src/lib/types";

const DATA = path.resolve("data");
export const OUTBOX = path.join(DATA, "outbox.json");

export function integrationStatus(): IntegrationsStatus {
  const anthropic = Boolean(process.env.ANTHROPIC_API_KEY);
  const deepseek = Boolean(process.env.DEEPSEEK_API_KEY);
  const stripe = Boolean(process.env.STRIPE_SECRET_KEY);
  const google = Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
  const gcal = Boolean(process.env.GOOGLE_CALENDAR_ACCESS_TOKEN);
  const resend = Boolean(process.env.RESEND_API_KEY);
  const smtp = Boolean(process.env.SMTP_URL);
  const yolo = Boolean(process.env.YOLO_VISION_URL);
  return {
    ai: anthropic
      ? { mode: "anthropic", label: "Claude (Anthropic)" }
      : deepseek
        ? { mode: "deepseek", label: "DeepSeek" }
        : { mode: "local", label: "Moteur local (pas de clé AI)" },
    stripe: stripe
      ? { mode: "stripe", label: "Stripe live checkout" }
      : { mode: "local", label: "Checkout local (STRIPE_SECRET_KEY absent)" },
    google: google
      ? { mode: "oauth", label: "OAuth Google" }
      : { mode: "local", label: "OAuth local (GOOGLE_CLIENT_ID absent)" },
    calendar: gcal
      ? { mode: "google", label: "Google Calendar API" }
      : { mode: "local", label: "Sync locale (GOOGLE_CALENDAR_ACCESS_TOKEN absent)" },
    email: resend
      ? { mode: "resend", label: "Resend" }
      : smtp
        ? { mode: "smtp", label: "SMTP" }
        : { mode: "outbox", label: "Boîte locale data/outbox.json" },
    vision: yolo
      ? { mode: "yolo", label: "YOLO Vision endpoint" }
      : { mode: "local", label: "Indexation locale (YOLO_VISION_URL absent)" },
  };
}

export type OutboxMail = {
  id: string;
  at: string;
  to: string[];
  subject: string;
  body: string;
  mode: string;
};

export async function sendEmail(to: string[], subject: string, body: string): Promise<OutboxMail> {
  const status = integrationStatus();
  const mail: OutboxMail = {
    id: `em_${Date.now()}`,
    at: new Date().toISOString(),
    to,
    subject,
    body,
    mode: status.email.mode,
  };
  if (status.email.mode === "resend" && process.env.RESEND_API_KEY) {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.MAIL_FROM || "Royal Goose <noreply@royalgoose.local>",
        to,
        subject,
        text: body,
      }),
    });
  }
  fs.mkdirSync(DATA, { recursive: true });
  const prev: OutboxMail[] = fs.existsSync(OUTBOX) ? JSON.parse(fs.readFileSync(OUTBOX, "utf8")) : [];
  fs.writeFileSync(OUTBOX, JSON.stringify([mail, ...prev].slice(0, 200), null, 2));
  return mail;
}

export async function stripeCheckout(plan: string, clubId: string) {
  const status = integrationStatus();
  if (status.stripe.mode === "stripe" && process.env.STRIPE_SECRET_KEY) {
    const params = new URLSearchParams();
    params.set("mode", "subscription");
    params.set("success_url", process.env.STRIPE_SUCCESS_URL || "http://localhost:5173/app/billing?ok=1");
    params.set("cancel_url", process.env.STRIPE_CANCEL_URL || "http://localhost:5173/app/billing?cancel=1");
    params.set("line_items[0][price]", process.env[`STRIPE_PRICE_${plan.toUpperCase()}`] || process.env.STRIPE_PRICE_ID || "");
    params.set("line_items[0][quantity]", "1");
    params.set("metadata[clubId]", clubId);
    params.set("metadata[plan]", plan);
    const res = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params,
    });
    const json = (await res.json()) as { url?: string; error?: { message: string } };
    if (!res.ok) throw new Error(json.error?.message || "Stripe error");
    return { mode: "stripe" as const, url: json.url, clubId, plan };
  }
  return { mode: "local" as const, url: null as string | null, clubId, plan, label: status.stripe.label };
}

export async function googleCalendarSync(events: { title: string; start: string }[]) {
  const status = integrationStatus();
  if (status.calendar.mode === "google" && process.env.GOOGLE_CALENDAR_ACCESS_TOKEN) {
    for (const ev of events.slice(0, 10)) {
      await fetch("https://www.googleapis.com/calendar/v3/calendars/primary/events", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.GOOGLE_CALENDAR_ACCESS_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          summary: `[Royal Goose] ${ev.title}`,
          start: { dateTime: ev.start },
          end: { dateTime: ev.start },
        }),
      });
    }
  }
  return { mode: status.calendar.mode, synced: events.length, label: status.calendar.label };
}

export function googleOAuthUrl() {
  const id = process.env.GOOGLE_CLIENT_ID;
  const redirect = process.env.GOOGLE_REDIRECT_URI || "http://localhost:8787/api/auth/google/callback";
  if (!id) return null;
  const q = new URLSearchParams({
    client_id: id,
    redirect_uri: redirect,
    response_type: "code",
    scope: "openid email profile",
    access_type: "online",
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${q}`;
}
