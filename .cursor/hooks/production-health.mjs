import { stdin } from "node:process";

let raw = "";
stdin.setEncoding("utf8");
for await (const chunk of stdin) raw += chunk;

const url = process.env.RG_HEALTH_URL || "https://web-production-f35371.up.railway.app/api/health";

try {
  const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
  const json = await res.json().catch(() => ({}));
  const ai = json?.integrations?.ai?.label || "unknown";
  const bot = json?.integrations?.chatbot?.label || "";
  const extra = bot ? ` ChatBotAI: ${bot}.` : "";
  process.stdout.write(
    JSON.stringify({
      additional_context: `Production health ${url}: HTTP ${res.status}, ok=${Boolean(json.ok)}. IA: ${ai}.${extra}`,
    }),
  );
} catch (err) {
  process.stdout.write(
    JSON.stringify({
      additional_context: `Production health check failed for ${url}: ${err instanceof Error ? err.message : String(err)}`,
    }),
  );
}
