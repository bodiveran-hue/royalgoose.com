#!/usr/bin/env node
/**
 * Parallel PR coding/review agent — audits the checkout and prints markdown.
 * Runs in GitHub Actions on pull_request; does not edit the human working tree.
 */
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const findings = [];

function read(rel) {
  const p = path.join(root, rel);
  return fs.existsSync(p) ? fs.readFileSync(p, "utf8") : "";
}

const pkg = read("package.json");
const envEx = read(".env.example");
const ai = read("server/ai.ts") + read("server/ai-provider.ts");
const workflows = fs.existsSync(".github/workflows")
  ? fs.readdirSync(".github/workflows").join(" ")
  : "";

if (!pkg.includes('"start"')) findings.push("package.json missing start script");
if (!pkg.includes("tsx server/index.ts")) findings.push("start script is not Express/tsx");
if (workflows.includes("pages") || read(".github/workflows/ci.yml").includes("peaceiris/actions-gh-pages")) {
  findings.push("GitHub Pages deploy detected — this app must stay Node/Railway");
}
if (!envEx.includes("OPENAI_API_KEY")) findings.push(".env.example missing OPENAI_API_KEY");
if (!envEx.includes("CHATBOTAI_URL")) findings.push(".env.example missing CHATBOTAI_URL");
if (!ai.includes("chatbotai") || !ai.includes("openai")) findings.push("AI chain missing ChatBotAI/OpenAI");
if (!read("src/pages/Chatbot.tsx")) findings.push("Chatbot UI page missing");

const ok = findings.length === 0;
const body = [
  "<!-- rg-pr-agent -->",
  "## Royal Goose parallel agent",
  "",
  ok ? "Audit passed. Node production + ChatBotAI proxy + ChatGPT fallback look intact." : "Audit found issues:",
  ...findings.map((f) => `- ${f}`),
  "",
  "- Production: Express `npm start` (not GitHub Pages).",
  "- Chat: `/app/chat` + floating widget → `POST /api/chat` (keys stay on the server).",
  "- LLM order: ChatBotAI → OpenAI → Anthropic → DeepSeek → local.",
  "",
  "Copilot coding agent: enable in repo **Settings → Copilot → Coding agent** (org may need to allow it).",
  "Setup hook: `.github/workflows/copilot-setup-steps.yml`.",
].join("\n");

if (process.env.GITHUB_STEP_SUMMARY) fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, body);
if (process.env.GITHUB_OUTPUT) fs.appendFileSync(process.env.GITHUB_OUTPUT, `ok=${ok}\n`);
fs.writeFileSync(path.join(root, "pr-agent-report.md"), body);
process.stdout.write(body + "\n");
if (!ok) process.exit(1);
